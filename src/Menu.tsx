import { useResource } from "./useResource";
import Promotions from "./Promotions";
import { money } from "./money";

export interface MenuItem {
  id: number; category_id: number; name: string; description: string;
  photo_url: string; base_price: string; kind: "pizza" | "other"; available: boolean;
}
export interface MenuOption { id: number; name: string; kind: "size" | "crust" | "topping"; price: string; available: boolean }
export interface MenuData {
  categories: { id: number; name: string }[];
  items: MenuItem[];
  options: MenuOption[];
  allowed_options: Record<string, number[]>;
  combinations: Record<string, [number, number][]>;
}

export default function Menu() {
  const { data, error, loading, reload } = useResource<MenuData>("/menu");
  if (loading) return <p role="status">Loading menu...</p>;
  if (error) return <div role="alert">{error} <button onClick={reload}>Retry menu</button></div>;
  if (!data || !data.items.length) return <p>No menu items are currently listed. Please check back soon.</p>;
  return <>
    <h1>Our menu</h1>
    <Promotions />
    <p>Prices are in USD before tax. Pizza sizes and extras may add charges. Ask us about allergens.</p>
    {data.categories.map(category => <section key={category.id}>
      <h2>{category.name}</h2>
      <div className="grid">{data.items.filter(item => item.category_id === category.id).map(item =>
        <article className="card" key={item.id}>
          <img src={item.photo_url} alt={item.name} loading="lazy" />
          <h3>{item.name}</h3><p>{item.description}</p>
          <p>{item.kind === "pizza" ? "From " : ""}{money(item.base_price)}</p>
          {!item.available ? <p className="badge">Currently unavailable</p> :
            <a href={`#customize/${item.id}`}>Choose options</a>}
        </article>)}</div>
    </section>)}
  </>;
}
