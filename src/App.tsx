import { useEffect, useState } from "react";
import { checkHealth } from "./api";
import Account from "./Account";
import Workspace from "./Workspace";
import CustomerForm from "./CustomerForm";
import Home from "./Home";
import Menu from "./Menu";
import { restaurant } from "./restaurant";
import type { User } from "./api";

export default function App() {
  const [status, setStatus] = useState("Checking API connection...");
  const [attempt, setAttempt] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState(location.hash.slice(1));
  useEffect(() => {
    const change = () => {
      setPage(location.hash.slice(1));
      document.getElementById("main")?.focus();
    };
    addEventListener("hashchange", change);
    return () => removeEventListener("hashchange", change);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), 10000);
    let active = true;

    setStatus("Checking API connection...");
    checkHealth(controller.signal)
      .then(() => {
        if (active) setStatus("API connected. Project setup is ready.");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setStatus(
          controller.signal.aborted
            ? "API connection timed out. Check that the backend is running."
            : error instanceof Error
              ? `API unavailable: ${error.message}`
              : "API unavailable. Check that the backend is running.",
        );
      })
      .finally(() => globalThis.clearTimeout(timeout));

    return () => {
      active = false;
      globalThis.clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);

  return (
    <>
      <header>
        <a href="#main" className="skip-link">Skip to content</a>
        <span>{restaurant.name}</span>
        <nav aria-label="Main navigation">
          <a href="#home">Home</a>{" "}
          <a href="#menu">Menu &amp; order</a>
          <a href="#account">Account</a>{" "}
          {!user && <a href="#register">Register</a>}
          {user?.role_name === "customer" && <a href="#customer">Customer workspace</a>}
          {user?.role_name === "customer" && <a href="#profile">Profile</a>}
          {user && ["staff", "administrator"].includes(user.role_name) && <a href="#staff">Staff workspace</a>}
          {user?.role_name === "administrator" && <a href="#admin">Administrator workspace</a>}
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        {(page === "" || page === "home") && <Home />}
        {page === "account" && <section aria-labelledby="connection-heading">
          <h2 id="connection-heading">Service connection</h2>
          <p role="status">{status}</p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>
            Check connection again
          </button>
        </section>}
        <div hidden={page !== "account"}>
          <Account onUserChange={setUser} />
        </div>
        {["customer", "staff", "admin"].includes(page) && <Workspace user={user} page={page} />}
        {page === "register" && <CustomerForm />}
        {page === "menu" && <Menu />}
        {page === "profile" && (user?.role_name === "customer"
          ? <CustomerForm key={user.id} profile={user} />
          : <p role="alert">Sign in as a customer to edit your profile.</p>)}
      </main>
      <footer>Pizza Restaurant Online Ordering &middot; Capstone demo</footer>
    </>
  );
}
