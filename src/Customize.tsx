import { useState } from "react";
import type { FormEvent } from "react";
import { mutate } from "./api";
import type { User } from "./api";
import { money } from "./money";
import type { MenuData } from "./Menu";
import { useResource } from "./useResource";

export default function Customize({ id, user }: { id: number; user: User | null }) {
  const { data, error, loading, reload } = useResource<MenuData>("/menu");
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const [size, setSize] = useState("");
  const [crust, setCrust] = useState("");
  if (loading) return <p role="status">Loading item options...</p>;
  if (error) return <p role="alert">{error} <button onClick={reload}>Retry</button></p>;
  const item = data?.items.find(item => item.id === id);
  if (!item || !data) return <p role="alert">Menu item not found.</p>;
  if (!item.available) return <p role="alert">This item is currently unavailable.</p>;
  const options = data.options.filter(option => data.allowed_options[id]?.includes(option.id));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setFailure(""); setMessage("");
    try {
      await mutate("/cart/lines", "POST", {
        item_id: id, quantity: Number(form.get("quantity")),
        size_id: size ? Number(size) : null, crust_id: crust ? Number(crust) : null,
        topping_ids: form.getAll("topping").map(Number),
      });
      setMessage("Added to your cart.");
    } catch (error: unknown) { setFailure(error instanceof Error ? error.message : "Unable to add item."); }
    finally { setBusy(false); }
  }
  return <section>
    <h1>Customize {item.name}</h1><p>{item.description}</p>
    <p>Base price {money(item.base_price)}. Extras shown below are added per item.</p>
    {user?.role_name !== "customer" ? <p><a href="#account">Sign in as a customer</a> or <a href="#register">register</a> to add to your cart.</p> :
    <form onSubmit={submit}>
      {item.kind === "pizza" && <>
        <label htmlFor="pizza-size">Size</label>
        <select id="pizza-size" required value={size} onChange={e => { setSize(e.target.value); setCrust(""); }} disabled={busy}>
          <option value="">Choose a size</option>
          {options.filter(o => o.kind === "size").map(o => <option key={o.id} value={o.id} disabled={!o.available}>{o.name} (+{money(o.price)}){!o.available && " - unavailable"}</option>)}
        </select>
        <label htmlFor="pizza-crust">Crust</label>
        <select id="pizza-crust" required value={crust} onChange={e => setCrust(e.target.value)} disabled={busy || !size}>
          <option value="">Choose a crust</option>
          {options.filter(o => o.kind === "crust" && data.combinations[id]?.some(pair => pair[0] === Number(size) && pair[1] === o.id)).map(o =>
            <option key={o.id} value={o.id} disabled={!o.available}>{o.name} (+{money(o.price)}){!o.available && " - unavailable"}</option>)}
        </select>
        <fieldset disabled={busy}><legend>Extra toppings (optional)</legend>
          {options.filter(o => o.kind === "topping").map(o => <label key={o.id} style={{ display: "block" }}>
            <input name="topping" type="checkbox" value={o.id} disabled={!o.available} />{o.name} (+{money(o.price)}){!o.available && " - unavailable"}
          </label>)}
        </fieldset>
      </>}
      <label htmlFor="item-quantity">Quantity (1-99)</label>
      <input id="item-quantity" name="quantity" type="number" required min={1} max={99} step={1} defaultValue={1} disabled={busy} />
      <button disabled={busy}>{busy ? "Adding..." : "Add to cart"}</button>
    </form>}
    {failure && <p role="alert">{failure}</p>}
    <p role="status">{message}</p>
    {message && <a href="#cart">View cart</a>}
    <p><a href="#menu">Back to menu</a></p>
  </section>;
}
