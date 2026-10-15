import { useResource } from "./useResource";
import { money } from "./Menu";

interface Promotion { id: number; title: string; conditions: string; minimum_subtotal: string }

export default function Promotions() {
  const { data, error, loading, reload } = useResource<Promotion[]>("/promotions");
  return <section aria-label="Current promotions">
    <h2>Current offers</h2>
    {loading ? <p role="status">Loading offers...</p> : error ?
      <p role="alert">{error} <button onClick={reload}>Retry offers</button></p> :
      !data?.length ? <p>No active offers right now.</p> :
      data.map(offer => <article key={offer.id}>
        <h3>{offer.title}</h3><p>{offer.conditions}</p>
        <p>Minimum subtotal: {money(offer.minimum_subtotal)}. Best eligible offer only; no stacking.</p>
      </article>)}
  </section>;
}
