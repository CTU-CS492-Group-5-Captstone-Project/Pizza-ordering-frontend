import { useState } from "react";
import type { FormEvent } from "react";
import { mutate } from "./api";
import type { MenuItem, MenuOption } from "./Menu";
import { money } from "./money";
import { useResource } from "./useResource";

interface ManagedItem extends MenuItem { archived: boolean; option_ids: number[]; combinations: [number, number][] }
interface ManagedPromotion {
  id: number; title: string; conditions: string; kind: "percent" | "fixed";
  amount: string; minimum_subtotal: string; enabled: boolean; starts_at: string; ends_at: string;
}
interface Catalog {
  items: ManagedItem[]; options: MenuOption[]; categories: { id: number; name: string; sort_order: number }[];
  promotions: ManagedPromotion[];
}
type Save = (path: string, method: string, body?: unknown) => Promise<boolean>;

function ItemEditor({ item, catalog, save, busy }: { item?: ManagedItem; catalog: Catalog; save: Save; busy: boolean }) {
  const [kind, setKind] = useState<"pizza" | "other">(item?.kind || "other");
  const [options, setOptions] = useState(item?.option_ids || []);
  const [pairs, setPairs] = useState<[number, number][]>(item?.combinations || []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const ok = await save(item ? `/admin/items/${item.id}` : "/admin/items", item ? "PUT" : "POST", {
      name: data.get("name"), description: data.get("description"), photo_url: data.get("photo_url"),
      category_id: Number(data.get("category_id")), base_price: data.get("base_price"), kind,
      available: data.get("available") === "on", option_ids: kind === "pizza" ? options : [],
      combinations: kind === "pizza" ? pairs : [],
    });
    if (ok && !item) { form.reset(); setKind("other"); setOptions([]); setPairs([]); }
  }
  const prefix = `item-${item?.id || "new"}`;
  const sizes = catalog.options.filter(option => option.kind === "size" && options.includes(option.id));
  const crusts = catalog.options.filter(option => option.kind === "crust" && options.includes(option.id));
  return <form onSubmit={submit}>
    <label htmlFor={`${prefix}-name`}>Name</label>
    <input id={`${prefix}-name`} name="name" required maxLength={100} defaultValue={item?.name} />
    <label htmlFor={`${prefix}-description`}>Description (plain text)</label>
    <textarea id={`${prefix}-description`} name="description" required maxLength={1000} defaultValue={item?.description} />
    <label htmlFor={`${prefix}-category`}>Category</label>
    <select id={`${prefix}-category`} name="category_id" required defaultValue={item?.category_id}>
      {catalog.categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
    </select>
    <label htmlFor={`${prefix}-photo`}>Photo URL (HTTPS, licensed for your use)</label>
    <input id={`${prefix}-photo`} name="photo_url" type="url" required maxLength={1000} defaultValue={item?.photo_url} />
    <label htmlFor={`${prefix}-price`}>Base price (USD)</label>
    <input id={`${prefix}-price`} name="base_price" type="number" required min={0} max={9999} step=".01" defaultValue={item?.base_price} />
    <label htmlFor={`${prefix}-kind`}>Item type</label>
    <select id={`${prefix}-kind`} value={kind} onChange={event => setKind(event.target.value === "pizza" ? "pizza" : "other")}>
      <option value="other">Side / drink / other</option><option value="pizza">Pizza</option>
    </select>
    <label><input name="available" type="checkbox" defaultChecked={item?.available ?? true} />Available to order</label>
    {kind === "pizza" && <>
      <fieldset><legend>Allowed customization options</legend>
        {catalog.options.map(option => <label className="choice" key={option.id}>
          <input type="checkbox" checked={options.includes(option.id)} onChange={event => {
            setOptions(event.target.checked ? [...options, option.id] : options.filter(id => id !== option.id));
            if (!event.target.checked) setPairs(pairs.filter(pair => !pair.includes(option.id)));
          }} />{option.name} ({option.kind}, {money(option.price)}{option.available ? "" : ", unavailable"})
        </label>)}
      </fieldset>
      <fieldset><legend>Allowed size / crust combinations</legend>
        {sizes.length === 0 || crusts.length === 0 ? <p>Select at least one size and crust above.</p> :
          sizes.flatMap(size => crusts.map(crust => <label className="choice" key={`${size.id}-${crust.id}`}>
            <input type="checkbox" checked={pairs.some(pair => pair[0] === size.id && pair[1] === crust.id)}
              onChange={event => setPairs(event.target.checked ? [...pairs, [size.id, crust.id]] :
                pairs.filter(pair => pair[0] !== size.id || pair[1] !== crust.id))} />{size.name} / {crust.name}
          </label>))}
      </fieldset>
    </>}
    <button disabled={busy || !catalog.categories.length}>{item ? "Save item" : "Create item"}</button>
  </form>;
}

function OptionEditor({ option, save, busy }: { option?: MenuOption; save: Save; busy: boolean }) {
  const prefix = `option-${option?.id || "new"}`;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const ok = await save(option ? `/admin/options/${option.id}` : "/admin/options", option ? "PUT" : "POST", {
      name: data.get("name"), kind: option?.kind || data.get("kind"), price: data.get("price"), available: data.get("available") === "on",
    });
    if (ok && !option) form.reset();
  }
  return <form onSubmit={submit}>
    <label htmlFor={`${prefix}-name`}>Option name</label>
    <input id={`${prefix}-name`} name="name" required maxLength={80} defaultValue={option?.name} />
    <label htmlFor={`${prefix}-kind`}>Option type</label>
    <select id={`${prefix}-kind`} name="kind" defaultValue={option?.kind || "topping"} disabled={!!option}>
      <option value="size">Size</option><option value="crust">Crust</option><option value="topping">Topping</option>
    </select>
    <label htmlFor={`${prefix}-price`}>Additional price (USD)</label>
    <input id={`${prefix}-price`} name="price" type="number" min={0} max={9999} step=".01" required defaultValue={option?.price} />
    <label><input type="checkbox" name="available" defaultChecked={option?.available ?? true} />Available</label>
    <button disabled={busy}>{option ? "Save option" : "Create option"}</button>
  </form>;
}

function localDate(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function PromotionEditor({ promotion, save, busy }: { promotion?: ManagedPromotion; save: Save; busy: boolean }) {
  const prefix = `promotion-${promotion?.id || "new"}`;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const ok = await save(promotion ? `/admin/promotions/${promotion.id}` : "/admin/promotions", promotion ? "PUT" : "POST", {
      title: data.get("title"), conditions: data.get("conditions"), kind: data.get("kind"),
      amount: data.get("amount"), minimum_subtotal: data.get("minimum_subtotal"),
      enabled: data.get("enabled") === "on",
      starts_at: new Date(String(data.get("starts_at"))).toISOString(),
      ends_at: new Date(String(data.get("ends_at"))).toISOString(),
    });
    if (ok && !promotion) form.reset();
  }
  return <form onSubmit={submit}>
    <label htmlFor={`${prefix}-title`}>Offer title</label>
    <input id={`${prefix}-title`} name="title" required maxLength={100} defaultValue={promotion?.title} />
    <label htmlFor={`${prefix}-conditions`}>Description of these rules (plain text)</label>
    <textarea id={`${prefix}-conditions`} name="conditions" required maxLength={500} defaultValue={promotion?.conditions} />
    <label htmlFor={`${prefix}-kind`}>Discount type</label>
    <select id={`${prefix}-kind`} name="kind" defaultValue={promotion?.kind || "percent"}>
      <option value="percent">Percent (up to 100)</option><option value="fixed">Fixed USD amount</option>
    </select>
    <label htmlFor={`${prefix}-amount`}>Discount value</label>
    <input id={`${prefix}-amount`} name="amount" type="number" required min=".01" max={999999} step=".01" defaultValue={promotion?.amount} />
    <label htmlFor={`${prefix}-minimum`}>Minimum eligible subtotal (USD)</label>
    <input id={`${prefix}-minimum`} name="minimum_subtotal" type="number" required min={0} max={999999} step=".01" defaultValue={promotion?.minimum_subtotal || "0"} />
    <p>Dates use this device's local timezone and are stored as UTC. Start inclusive; expiry exclusive. Best eligible offer only.</p>
    <label htmlFor={`${prefix}-start`}>Starts at</label>
    <input id={`${prefix}-start`} name="starts_at" type="datetime-local" required defaultValue={promotion ? localDate(promotion.starts_at) : undefined} />
    <label htmlFor={`${prefix}-end`}>Expires at</label>
    <input id={`${prefix}-end`} name="ends_at" type="datetime-local" required defaultValue={promotion ? localDate(promotion.ends_at) : undefined} />
    <label><input name="enabled" type="checkbox" defaultChecked={promotion?.enabled ?? true} />Enabled</label>
    <button disabled={busy}>{promotion ? "Save promotion" : "Create promotion"}</button>
  </form>;
}

interface Audit { id: number; actor_id: string; entity: string; record_id: string; before: unknown; after: unknown; created_at: string }

function AuditHistory() {
  const [offset, setOffset] = useState(0);
  const { data, error, loading, reload } = useResource<Audit[]>(`/admin/audit?offset=${offset}`);
  return <section><h2>Audit history</h2>
    <button onClick={reload}>Refresh audit</button>
    {loading && <p role="status">Loading changes...</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && data?.length === 0 && <p>No changes on this page.</p>}
    {data?.map(row => <details key={row.id}><summary>{new Date(row.created_at).toLocaleString()} &mdash; {row.entity} {row.record_id}</summary>
      <p>Actor: {row.actor_id}</p><h3>Before</h3><pre>{JSON.stringify(row.before, null, 2)}</pre><h3>After</h3><pre>{JSON.stringify(row.after, null, 2)}</pre>
    </details>)}
    <div className="actions"><button disabled={offset === 0 || loading} onClick={() => setOffset(value => value - 50)}>Newer changes</button>
      <button disabled={data?.length !== 50 || loading} onClick={() => setOffset(value => value + 50)}>Older changes</button></div>
  </section>;
}

export default function Admin() {
  const { data, error, loading, reload } = useResource<Catalog>("/admin/catalog");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [message, setMessage] = useState("");
  const [showAudit, setShowAudit] = useState(false);
  const [archiveId, setArchiveId] = useState<number | null>(null);
  const save: Save = async (path, method, body) => {
    setBusy(true); setFailure(""); setMessage("");
    try {
      await mutate(path, method, body);
      setMessage("Saved. Customer requests now use the published changes."); reload(); return true;
    } catch (error: unknown) {
      setFailure(error instanceof Error ? error.message : "Unable to save changes."); return false;
    } finally { setBusy(false); }
  };
  async function category(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    if (await save("/admin/categories", "POST", { name: fields.get("name"), sort_order: Number(fields.get("sort_order")) })) form.reset();
  }
  return <>
    <section><h1>Manager administration</h1>
      <p>Saved changes publish immediately. Archiving preserves purchased item snapshots. Plain text only; no HTML is interpreted.</p>
      {loading && <p role="status">Loading management data...</p>}
      {(error || failure) && <p role="alert">{error || failure} <button onClick={reload}>Reload catalog</button></p>}
      {message && <p role="status">{message}</p>}
      <button onClick={() => setShowAudit(value => !value)}>{showAudit ? "Hide" : "View"} audit history</button>
    </section>
    {showAudit && <AuditHistory />}
    {data && <>
      <section><h2>Menu items</h2>
        <details><summary>Create menu item</summary><ItemEditor catalog={data} save={save} busy={busy} /></details>
        {data.items.filter(item => !item.archived).map(item => <details key={item.id}>
          <summary>{item.name} &mdash; {money(item.base_price)}{item.available ? "" : " (unavailable)"}</summary>
          <ItemEditor item={item} catalog={data} save={save} busy={busy} />
          {archiveId === item.id ? <div className="actions">
            <p>Archive {item.name}? Existing carts will mark it unavailable; historical orders remain unchanged.</p>
            <button disabled={busy} onClick={async () => { if (await save(`/admin/items/${item.id}`, "DELETE")) setArchiveId(null); }}>Confirm archive</button>
            <button disabled={busy} onClick={() => setArchiveId(null)}>Keep item</button>
          </div> : <p><button disabled={busy} onClick={() => setArchiveId(item.id)}>Archive item</button></p>}
        </details>)}
        <p>Archived items: {data.items.filter(item => item.archived).map(item => item.name).join(", ") || "None"}</p>
      </section>
      <section><h2>Categories &amp; customization options</h2>
        <p>Categories: {data.categories.map(category => category.name).join(", ") || "None"}</p>
        <details><summary>Create category</summary><form onSubmit={category}>
          <label htmlFor="category-name">Category name</label><input id="category-name" name="name" required maxLength={80} />
          <label htmlFor="category-sort">Display order</label><input id="category-sort" name="sort_order" type="number" min={0} max={999} required defaultValue={0} />
          <button disabled={busy}>Create category</button>
        </form></details>
        <details><summary>Create customization option</summary><OptionEditor save={save} busy={busy} /></details>
        {data.options.map(option => <details key={option.id}><summary>{option.name} ({option.kind})</summary><OptionEditor option={option} save={save} busy={busy} /></details>)}
      </section>
      <section><h2>Promotions</h2>
        <p>Eligibility is the pre-tax subtotal minimum; no coupon codes, stacking or customer-specific eligibility. Expired and disabled offers never apply.</p>
        <details><summary>Create promotion</summary><PromotionEditor save={save} busy={busy} /></details>
        {data.promotions.map(promotion => <details key={promotion.id}>
          <summary>{promotion.title} &mdash; {!promotion.enabled ? "disabled" : Date.parse(promotion.ends_at) <= Date.now() ? "expired" : Date.parse(promotion.starts_at) > Date.now() ? "scheduled" : "active"}</summary>
          <PromotionEditor promotion={promotion} save={save} busy={busy} />
        </details>)}
      </section>
    </>}
  </>;
}
