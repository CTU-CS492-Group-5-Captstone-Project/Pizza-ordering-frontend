import { useState } from "react";
import type { FormEvent } from "react";
import { mutate } from "./api";
import { money } from "./Menu";
import { useResource } from "./useResource";

interface CartLine {
  id: string; name: string; quantity: number; customizations: string[];
  unit_price: string; line_total: string; available: boolean; issue: string | null;
}
export interface CartData { lines: CartLine[]; subtotal: string }

export default function Cart() {
  const { data, loading, error, reload } = useResource<CartData>("/cart");
  const [failure, setFailure] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function change(id: string, quantity?: number) {
    setBusy(true); setFailure(""); setMessage("");
    try {
      await mutate(`/cart/lines/${id}`, quantity === undefined ? "DELETE" : "PATCH",
        quantity === undefined ? undefined : { quantity });
      setMessage(quantity === undefined ? "Item removed." : "Quantity updated.");
      reload();
    } catch (error: unknown) { setFailure(error instanceof Error ? error.message : "Unable to update cart."); }
    finally { setBusy(false); }
  }
  function quantity(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    void change(id, Number(new FormData(event.currentTarget).get("quantity")));
  }
  return <section>
    <h1>Your cart</h1>
    {loading ? <p role="status">Loading your cart...</p> : error ?
      <p role="alert">{error} <button onClick={reload}>Retry cart</button></p> :
      !data?.lines.length ? <p>Your cart is empty. <a href="#menu">Browse the menu</a>.</p> :
      <>
        {data.lines.map(line => <article className="card" key={`${line.id}-${line.quantity}`}>
          <h2>{line.name}</h2>
          <p>{line.customizations.join(", ") || "No customizations"}</p>
          <p>{money(line.unit_price)} each &times; {line.quantity} = {money(line.line_total)}</p>
          {line.issue && <p role="alert">{line.issue} This line is excluded from totals. Remove it to continue.</p>}
          <form onSubmit={event => quantity(event, line.id)}>
            <label htmlFor={`quantity-${line.id}`}>Quantity for {line.name}</label>
            <input id={`quantity-${line.id}`} name="quantity" type="number" required min={1} max={99} step={1} defaultValue={line.quantity} disabled={busy || !line.available} />
            <button disabled={busy || !line.available}>Update quantity</button>
          </form>
          <p><button type="button" onClick={() => change(line.id)} disabled={busy}>Remove {line.name}</button></p>
        </article>)}
        <h2>Summary</h2><p>Subtotal: {money(data.subtotal)}</p>
        <p>No payment or checkout is available in this Sprint.</p>
      </>}
    {failure && <p role="alert">{failure}</p>}<p role="status">{message}</p>
    <a href="#menu">Continue browsing</a>
  </section>;
}
