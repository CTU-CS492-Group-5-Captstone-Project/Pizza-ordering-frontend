import { useEffect, useState } from "react";
import { checkHealth } from "./api";
import Account from "./Account";
import Checkout from "./Checkout";
import Orders, { OrderDetail } from "./Orders";
import Staff from "./Staff";
import Admin from "./Admin";
import CustomerForm from "./CustomerForm";
import Home from "./Home";
import Menu from "./Menu";
import Customize from "./Customize";
import Cart from "./Cart";
import { restaurant } from "./restaurant";
import type { User } from "./api";

export default function App() {
  const [status, setStatus] = useState("Checking API connection...");
  const [attempt, setAttempt] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState(location.hash.slice(1));
  const [sessionMessage, setSessionMessage] = useState("");
  useEffect(() => {
    const expired = () => {
      setUser(null);
      setSessionMessage("Your session expired or is no longer valid. Sign in again to continue.");
    };
    const renewed = () => setSessionMessage("");
    addEventListener("session-expired", expired);
    addEventListener("session-activity", renewed);
    return () => {
      removeEventListener("session-expired", expired);
      removeEventListener("session-activity", renewed);
    };
  }, []);
  useEffect(() => {
    const change = () => {
      if (location.hash !== "#main") setPage(location.hash.slice(1));
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
          {user?.role_name === "customer" && <a href="#cart">Cart</a>}
          <a href="#account">Account</a>{" "}
          {!user && <a href="#register">Register</a>}
          {user?.role_name === "customer" && <a href="#orders">Order history</a>}
          {user?.role_name === "customer" && <a href="#checkout">Checkout</a>}
          {user?.role_name === "customer" && <a href="#profile">Profile</a>}
          {user && ["staff", "administrator"].includes(user.role_name) && <a href="#staff">Staff queue</a>}
          {user?.role_name === "administrator" && <a href="#admin">Manage restaurant</a>}
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        {sessionMessage && <p role="alert">{sessionMessage} <a href="#account">Sign in</a></p>}
        {(page === "" || page === "home" || page === "main") && <Home />}
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
        {["customer", "orders", "checkout"].includes(page) || page.startsWith("order/") ?
          user?.role_name === "customer" ?
            page === "checkout" ? <Checkout key={user.id} user={user} /> :
            page.startsWith("order/") ? <OrderDetail key={`${user.id}-${page}`} id={page.split("/")[1]} /> :
            <Orders key={user.id} /> :
            <p role="alert"><a href="#account">Sign in as a customer</a> to access your orders.</p> : null}
        {page === "staff" && (user && ["staff", "administrator"].includes(user.role_name) ? <Staff key={user.id} /> :
          <p role="alert">Sign in with a staff or administrator account.</p>)}
        {page === "admin" && (user?.role_name === "administrator" ? <Admin key={user.id} /> :
          <p role="alert">Sign in with an administrator account.</p>)}
        {page === "register" && <CustomerForm />}
        {page === "menu" && <Menu />}
        {page.startsWith("customize/") && <Customize key={page} id={Number(page.split("/")[1])} user={user} />}
        {page === "cart" && (user?.role_name === "customer" ? <Cart key={user.id} /> :
          <p role="alert"><a href="#account">Sign in as a customer</a> to view your cart.</p>)}
        {page === "profile" && (user?.role_name === "customer"
          ? <CustomerForm key={user.id} profile={user} />
          : <p role="alert">Sign in as a customer to edit your profile.</p>)}
        {!["", "home", "main", "account", "register", "menu", "cart", "profile", "customer", "staff", "admin", "orders", "checkout"].includes(page) &&
          !page.startsWith("customize/") && !page.startsWith("order/") && <p role="alert">Page not found. <a href="#home">Return home</a>.</p>}
      </main>
      <footer>Pizza Restaurant Online Ordering &middot; Capstone demo</footer>
    </>
  );
}
