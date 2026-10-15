import { useState } from "react";
import type { FormEvent } from "react";
import type { User } from "./api";
import { mutate } from "./api";

export default function CustomerForm({ profile }: { profile?: User }) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await mutate(profile ? "/profile" : "/auth/register", profile ? "PUT" : "POST",
        Object.fromEntries(data.entries()));
      setMessage(profile ? "Profile updated." : "Account created. You can now sign in.");
      if (!profile) form.reset();
    } catch (failure: unknown) {
      setError(failure instanceof Error ? failure.message : "Unable to save account.");
    } finally {
      const password = form.elements.namedItem("password");
      if (password instanceof HTMLInputElement) password.value = "";
      setBusy(false);
    }
  }
  return <section aria-labelledby="customer-form-heading">
    <h2 id="customer-form-heading">{profile ? "Your profile" : "Create a customer account"}</h2>
    <form onSubmit={submit} aria-describedby={error ? "customer-form-error" : undefined}>
      <label htmlFor="customer-name">Name</label>
      <input id="customer-name" name="name" required maxLength={100} autoComplete="name" defaultValue={profile?.name} disabled={busy} />
      <label htmlFor="customer-phone">Phone number</label>
      <input id="customer-phone" name="phone" type="tel" required minLength={7} maxLength={30} autoComplete="tel" defaultValue={profile?.phone} disabled={busy} />
      <label htmlFor="customer-email">Email address</label>
      <input id="customer-email" name="email" type="email" required maxLength={254} autoComplete="email" defaultValue={profile?.email} disabled={busy} />
      <label htmlFor="customer-address">Default delivery address (optional)</label>
      <input id="customer-address" name="default_delivery_address" maxLength={500} autoComplete="street-address" defaultValue={profile?.default_delivery_address || ""} disabled={busy} />
      {!profile && <>
        <label htmlFor="customer-password">Password (12-256 characters)</label>
        <input id="customer-password" name="password" type="password" required minLength={12} maxLength={256} autoComplete="new-password" disabled={busy} />
      </>}
      <button disabled={busy}>{busy ? "Saving..." : profile ? "Save profile" : "Register"}</button>
    </form>
    {error && <p id="customer-form-error" role="alert">{error}</p>}
    <p role="status">{message}</p>
    {!profile && <a href="#account">Go to sign in</a>}
  </section>;
}
