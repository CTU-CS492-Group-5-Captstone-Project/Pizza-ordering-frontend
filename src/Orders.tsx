import { useState } from "react";
import type { CartData } from "./Cart";
import { money } from "./money";
import OrderSummary from "./OrderSummary";
import { useResource } from "./useResource";
import { mutate } from "./api";

export interface OrderData {
  id: string; number: string; created_at: string; status: "received" | "preparing" | "ready" | "completed"; version: number;
  summary: Omit<CartData, "lines">;
  fulfillment: { name: string; phone: string; email: string; fulfillment: "pickup" | "delivery"; default_delivery_address: string | null };
  lines: { name: string; customizations: string[]; quantity: number; unit_price: string; line_total: string }[];
  reorder_available: boolean;
}

function Reorder({ order }: { order: OrderData }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function reorder() {
    setBusy(true); setError("");
    try {
      await mutate(`/orders/${encodeURIComponent(order.id)}/reorder`, "POST");
      location.hash = "#cart";
    } catch (failure: unknown) {
      setError(failure instanceof Error ? failure.message : "Unable to re-order. Please try again.");
    } finally { setBusy(false); }
  }
  return <div>
    {order.reorder_available ? <>
      <p>Add these items to your existing cart at current prices and offers. Review the cart and checkout to pay.</p>
      <button disabled={busy} onClick={reorder}>{busy ? "Adding to cart..." : "Re-order"}</button>
    </> : <p>Re-order is unavailable for this older order because item selections were not saved. <a href="#menu">Choose items from the menu</a>.</p>}
    {error && <p role="alert">{error}</p>}
  </div>;
}

export function OrderContents({ order }: { order: OrderData }) {
  return <>
    <p><strong>Status: {order.status}</strong> &middot; {new Date(order.created_at).toLocaleString()}</p>
    <ul>{order.lines.map((line, index) => <li key={index}>
      {line.quantity} &times; {line.name} ({line.customizations.join(", ") || "No customizations"}) &mdash; {money(line.unit_price)} each; {money(line.line_total)}
    </li>)}</ul>
    <OrderSummary summary={order.summary} />
    <p>{order.fulfillment.fulfillment === "delivery" ? `Delivery: ${order.fulfillment.default_delivery_address}` : "Pickup at restaurant"}</p>
  </>;
}

export function OrderDetail({ id }: { id: string }) {
  const { data, error, loading, reload } = useResource<OrderData>(`/orders/${encodeURIComponent(id)}`, 15000);
  return <section><h1>Order confirmation</h1>
    {loading && <p role="status">Loading saved order...</p>}
    {error && <p role="alert">{error} <button onClick={reload}>Retry</button></p>}
    {data && <><h2>{data.number}</h2><p>Your order has been saved. An email confirmation is queued separately; email delays do not affect your order.</p><OrderContents order={data} /><Reorder order={data} /></>}
    <a href="#orders">All your orders</a>
  </section>;
}

export default function Orders() {
  const [offset, setOffset] = useState(0);
  const { data, error, loading, reload } = useResource<OrderData[]>(`/orders?offset=${offset}`);
  return <section><h1>Your order history</h1>
    {loading && <p role="status">Loading orders...</p>}
    {error && <p role="alert">{error} <button onClick={reload}>Retry history</button></p>}
    {!loading && data?.length === 0 && <p>No orders on this page. <a href="#menu">Start an order</a>.</p>}
    {data?.map(order => <article className="card" key={order.id}>
      <h2><a href={`#order/${order.id}`}>{order.number}</a></h2>
      <OrderContents order={order} />
      <Reorder order={order} />
    </article>)}
    <div className="actions">
      <button disabled={loading || offset === 0} onClick={() => setOffset(value => Math.max(0, value - 25))}>Newer orders</button>
      <button disabled={loading || data?.length !== 25} onClick={() => setOffset(value => value + 25)}>Older orders</button>
    </div>
  </section>;
}
