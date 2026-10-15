import { useEffect, useState } from "react";
import { checkHealth } from "./api";

export default function App() {
  const [status, setStatus] = useState("Checking API connection...");
  const [attempt, setAttempt] = useState(0);

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
        <span>Pizza Restaurant</span>
      </header>
      <main id="main">
        <h1>Online ordering project</h1>
        <p>
          The project foundation is ready. Menu browsing, customer accounts,
          and the cart will be added in the following Sprint 1 steps.
        </p>
        <section aria-labelledby="connection-heading">
          <h2 id="connection-heading">Service connection</h2>
          <p role="status">{status}</p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>
            Check connection again
          </button>
        </section>
      </main>
    </>
  );
}
