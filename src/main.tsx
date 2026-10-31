import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// Stripe may append a client secret on an authentication return. It is not
// proof of payment; reconcile the server-owned checkout and remove the query.
if (new URLSearchParams(location.search).has("payment_intent_client_secret")) {
  history.replaceState(null, "", `${location.pathname}#checkout`);
}

const root = document.getElementById("root");
if (!root) throw new Error("Application root element is missing.");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
