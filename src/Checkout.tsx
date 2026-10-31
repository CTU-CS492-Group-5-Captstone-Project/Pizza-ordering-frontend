import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { apiRequest, mutate } from "./api";
import type { User } from "./api";
import type { CartData } from "./Cart";
import { money } from "./money";
import OrderSummary from "./OrderSummary";

interface Details {
  name: string; email: string; phone: string;
  default_delivery_address: string | null; fulfillment: "pickup" | "delivery";
}
interface Quote { cart: CartData; quote_token: string }
interface Attempt {
  id: string; state: string; payment_status: string | null;
  client_secret: string | null; publishable_key: string | null; order_id: string | null;
  cart: CartData | null; details: Details | null; message: string;
}

function HostedPayment({ onCheck, disabled }: { onCheck: () => Promise<void>; disabled: boolean }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function pay(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true); setError("");
    try {
      const response = await stripe.confirmPayment({
        elements, confirmParams: { return_url: `${location.origin}${location.pathname}#checkout` },
        redirect: "if_required",
      });
      if (response.error) setError(response.error.message || "Payment was not approved. Try another sandbox card.");
      await onCheck();
    } catch (failure: unknown) {
      setError(failure instanceof Error ? failure.message : "Payment status is uncertain. Check status before trying again.");
    } finally { setBusy(false); }
  }
  return <form onSubmit={pay}>
    <h2>Secure sandbox payment</h2>
    <p>Card details go directly to Stripe, not to this application. Do not use a real card.</p>
    <PaymentElement onLoadError={() => setError("Secure payment fields could not load. Check your connection and reload checkout.")} />
    <button disabled={!stripe || !elements || busy || disabled}>{busy ? "Checking payment..." : "Authorize payment & place order"}</button>
    {error && <p role="alert">{error}</p>}
  </form>;
}

export default function Checkout({ user }: { user: User }) {
  const storageKey = `pizza-checkout-${user.id}`;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [details, setDetails] = useState<Details>({
    name: user.name, email: user.email, phone: user.phone,
    default_delivery_address: user.default_delivery_address || "", fulfillment: "pickup",
  });
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const stripePromise = useMemo(() => attempt?.publishable_key
    ? loadStripe(attempt.publishable_key) : null, [attempt?.publishable_key]);

  function accept(value: Attempt) {
    setAttempt(value); setMessage(value.message);
    if (value.details) setDetails(value.details);
    if (value.state === "complete" && value.order_id) {
      sessionStorage.removeItem(storageKey);
      location.hash = `order/${value.order_id}`;
    } else if (["canceled", "refunded"].includes(value.state)) {
      sessionStorage.removeItem(storageKey);
      setAttempt(null); setRequestKey(crypto.randomUUID());
      void refreshQuote();
    } else {
      sessionStorage.setItem(storageKey, value.id);
    }
  }
  async function refreshQuote() {
    try {
      setQuote(await (await apiRequest("/checkout/quote")).json());
    } catch (failure: unknown) { setError(failure instanceof Error ? failure.message : "Unable to refresh your order review."); }
  }
  async function check(id = attempt?.id) {
    if (!id) return;
    setBusy(true); setError("");
    try { accept(await (await mutate(`/checkout/${id}/complete`, "POST")).json()); }
    catch (failure: unknown) { setError(failure instanceof Error ? failure.message : "Unable to check payment status."); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const [current, review]: [Attempt | null, Quote] = await Promise.all([
          apiRequest("/checkout/active").then(response => response.json()),
          apiRequest("/checkout/quote").then(response => response.json()),
        ]);
        if (!active) return;
        setQuote(review);
        const previous = current?.id || sessionStorage.getItem(storageKey);
        if (current) { setAttempt(current); if (current.details) setDetails(current.details); }
        if (previous) await check(previous);
      } catch (failure: unknown) {
        if (active) setError(failure instanceof Error ? failure.message : "Unable to load checkout.");
      } finally { if (active) setLoading(false); }
    }
    void initialize();
    return () => { active = false; };
  }, [storageKey]);

  async function begin(event: FormEvent) {
    event.preventDefault();
    if (!quote) return;
    setBusy(true); setError(""); setMessage("");
    try {
      accept(await (await mutate("/checkout", "POST", {
        ...details, request_key: requestKey, quote_token: quote.quote_token,
      })).json());
    } catch (failure: unknown) {
      setError(failure instanceof Error ? failure.message : "Unable to start checkout. Retry uses the same checkout reference.");
      await refreshQuote();
    } finally { setBusy(false); }
  }
  async function cancel() {
    if (!attempt) return;
    setBusy(true); setError("");
    try { accept(await (await mutate(`/checkout/${attempt.id}/cancel`, "POST")).json()); }
    catch (failure: unknown) { setError(failure instanceof Error ? failure.message : "Unable to cancel. Check status before paying again."); }
    finally { setBusy(false); }
  }
  const cart = attempt?.cart || quote?.cart;
  return <section>
    <h1>Checkout</h1>
    {loading && <p role="status">Loading your order review...</p>}
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    {!loading && !cart?.lines.length && !attempt && <p>Your cart is empty. <a href="#menu">Browse the menu</a> or <a href="#orders">check order history</a>.</p>}
    {cart && cart.lines.length > 0 && <>
      <h2>Order review</h2>
      {cart.lines.map(line => <article key={line.id}>
        <h3>{line.quantity} &times; {line.name}</h3>
        <p>{line.customizations.join(", ") || "No customizations"} &mdash; {money(line.unit_price)} each; {money(line.line_total)}</p>
        {line.issue && <p role="alert">{line.issue}</p>}
      </article>)}
      <OrderSummary summary={cart} />
      <p>Prices, offers and availability are checked again before payment. Checkout expires after 30 minutes.</p>
      {!attempt && <form onSubmit={begin}>
        <h2>Contact &amp; fulfillment</h2>
        <label htmlFor="checkout-name">Name</label>
        <input id="checkout-name" required maxLength={100} autoComplete="name" value={details.name} onChange={e => setDetails({ ...details, name: e.target.value })} />
        <label htmlFor="checkout-email">Confirmation email</label>
        <input id="checkout-email" type="email" required maxLength={254} autoComplete="email" value={details.email} onChange={e => setDetails({ ...details, email: e.target.value })} />
        <label htmlFor="checkout-phone">Phone</label>
        <input id="checkout-phone" type="tel" required minLength={7} maxLength={30} autoComplete="tel" value={details.phone} onChange={e => setDetails({ ...details, phone: e.target.value })} />
        <label htmlFor="checkout-method">Fulfillment</label>
        <select id="checkout-method" value={details.fulfillment} onChange={e => setDetails({ ...details, fulfillment: e.target.value === "delivery" ? "delivery" : "pickup" })}>
          <option value="pickup">Pickup</option><option value="delivery">Delivery</option>
        </select>
        {details.fulfillment === "delivery" && <>
          <label htmlFor="checkout-address">Street number, street, city, state and postal code</label>
          <textarea id="checkout-address" required minLength={10} maxLength={500} autoComplete="street-address"
            placeholder="123 Main St, Denver, CO 80014"
            value={details.default_delivery_address || ""} onChange={e => setDetails({ ...details, default_delivery_address: e.target.value.replace(/\n/g, ", ") })} />
        </>}
        <button disabled={busy || cart.lines.some(line => !line.available)}>{busy ? "Preparing checkout..." : Number(cart.total) === 0 ? "Place free order" : "Accept total & continue to payment"}</button>
        <button type="button" disabled={busy} onClick={refreshQuote}>Refresh prices &amp; offers</button>
      </form>}
    </>}
    {attempt && <>
      <p>Checkout reference: {attempt.id}</p>
      <p>{details.name} &middot; {details.email} &middot; {details.phone}</p>
      <p>{details.fulfillment === "delivery" ? `Delivery: ${details.default_delivery_address}` : "Pickup at restaurant"}</p>
      {attempt.state === "open" && attempt.client_secret && stripePromise &&
        ["requires_payment_method", "requires_confirmation", "requires_action"].includes(attempt.payment_status || "") &&
        <Elements key={attempt.id} stripe={stripePromise} options={{ clientSecret: attempt.client_secret }}>
          <HostedPayment onCheck={() => check()} disabled={busy} />
        </Elements>}
      <div className="actions">
        <button disabled={busy} onClick={() => check()}>Check payment / order status</button>
        {attempt.state === "open" && <button disabled={busy} onClick={cancel}>Cancel checkout &amp; edit cart</button>}
      </div>
      <p>Do not start a second payment if the result is uncertain. Use the status button or your order history.</p>
    </>}
    <p><a href="#cart">Back to cart</a> &middot; <a href="#orders">Order history</a></p>
  </section>;
}
