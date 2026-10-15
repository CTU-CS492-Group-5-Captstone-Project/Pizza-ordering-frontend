import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ApiError, getUser, login, logout } from "./api";
import type { User } from "./api";

export default function Account({ onUserChange }: { onUserChange: (user: User | null) => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  useEffect(() => { onUserChange(user); }, [user, onUserChange]);
  useEffect(() => {
    const refresh = () => {
      getUser().then(setUser).catch((failure: unknown) =>
        setError(failure instanceof Error ? failure.message : "Unable to refresh profile."));
    };
    addEventListener("profile-updated", refresh);
    return () => removeEventListener("profile-updated", refresh);
  }, []);
  useEffect(() => {
    const expired = () => {
      setUser(null);
      setMessage("Your session expired or is no longer valid. Sign in again.");
    };
    addEventListener("session-expired", expired);
    return () => removeEventListener("session-expired", expired);
  }, []);
  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setUser(null);
        setMessage("Your session timed out after 15 minutes without server activity. Sign in again.");
        dispatchEvent(new CustomEvent("session-expired"));
      }, 15 * 60 * 1000);
    };
    schedule();
    addEventListener("session-activity", schedule);
    return () => {
      clearTimeout(timer);
      removeEventListener("session-activity", schedule);
    };
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();
    getUser(controller.signal)
      .then(setUser)
      .catch((failure: unknown) => {
        if (controller.signal.aborted) return;
        if (failure instanceof ApiError && failure.status === 401) {
          if (failure.message.includes("expired")) setMessage(failure.message);
          return;
        }
        setError(failure instanceof Error ? failure.message : "Unable to check your session.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      setUser(await login(email, password));
      setMessage("You are signed in.");
    } catch (failure: unknown) {
      setError(failure instanceof Error ? failure.message : "Unable to sign in.");
    } finally {
      setPassword("");
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await logout();
      setUser(null);
      setMessage("You are signed out.");
    } catch (failure: unknown) {
      if (failure instanceof ApiError && failure.status === 401) setUser(null);
      setError(failure instanceof Error ? failure.message : "Unable to sign out.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="account-heading">
      <h2 id="account-heading">Your account</h2>
      {loading ? <p role="status">Checking your session...</p> : user ? (
        <>
          <p>Signed in as {user.name} ({user.email}).</p>
          <button type="button" disabled={busy} onClick={signOut}>
            {busy ? "Signing out..." : "Sign out"}
          </button>
        </>
      ) : (
        <form onSubmit={submit} aria-describedby={error ? "account-error" : undefined}>
          <label htmlFor="login-email">Email address</label>
          <input id="login-email" name="email" type="email" autoComplete="username"
            required maxLength={254} value={email}
            onChange={(event) => setEmail(event.target.value)} disabled={busy} />
          <label htmlFor="login-password">Password</label>
          <input id="login-password" name="password" type="password"
            autoComplete="current-password" required maxLength={256} value={password}
            onChange={(event) => setPassword(event.target.value)} disabled={busy} />
          <button type="submit" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
          <a href="#register">Create a customer account</a>
        </form>
      )}
      {error && <p id="account-error" role="alert">{error}</p>}
      <p role="status">{message}</p>
    </section>
  );
}
