import { useState } from "react";
import { mutate } from "./api";
import { OrderContents } from "./Orders";
import type { OrderData } from "./Orders";
import { useResource } from "./useResource";

const nextStatus = { received: "preparing", preparing: "ready", ready: "completed", completed: null } as const;

export default function Staff() {
  const [offset, setOffset] = useState(0);
  const { data, error, loading, reload } = useResource<OrderData[]>(`/staff/orders?offset=${offset}`, 10000);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [message, setMessage] = useState("");
  async function advance(order: OrderData) {
    setBusy(true); setFailure(""); setMessage("");
    try {
      await mutate(`/staff/orders/${order.id}`, "PATCH", { status: nextStatus[order.status], version: order.version });
      setMessage(`Order ${order.number} is now ${nextStatus[order.status]}.`);
    } catch (error: unknown) { setFailure(error instanceof Error ? error.message : "Unable to update order."); }
    finally { setBusy(false); reload(); }
  }
  return <section><h1>Staff order queue</h1>
    <p>Oldest orders first. Refreshes every 10 seconds while visible; background refresh does not extend your session.</p>
    <button onClick={reload} disabled={loading || busy}>Refresh queue</button>
    {loading && <p role="status">Loading orders...</p>}
    {(error || failure) && <p role="alert">{error || failure}</p>}
    {message && <p role="status">{message}</p>}
    {!loading && data?.length === 0 && <p>No active orders on this page.</p>}
    {data?.map(order => <article className="card" key={order.id}>
      <h2>{order.number}</h2><OrderContents order={order} />
      <p>Contact: {order.fulfillment.name} &middot; {order.fulfillment.phone} &middot; {order.fulfillment.email}</p>
      <button disabled={busy || !nextStatus[order.status]} onClick={() => advance(order)}>Mark {nextStatus[order.status]}</button>
    </article>)}
    <div className="actions">
      <button disabled={loading || offset === 0} onClick={() => setOffset(value => Math.max(0, value - 100))}>Earlier orders</button>
      <button disabled={loading || data?.length !== 100} onClick={() => setOffset(value => value + 100)}>Later orders</button>
    </div>
  </section>;
}
