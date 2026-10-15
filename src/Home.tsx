import { restaurant } from "./restaurant";

export default function Home() {
  return <>
    <section>
      <h1>Welcome to {restaurant.name}</h1>
      <p>{restaurant.description}</p>
      <p><a className="button" href="#menu">Explore the menu &amp; start your order</a></p>
      <p className="muted">College capstone demonstration. No real orders or payments are accepted.</p>
      <div className="grid">
        {restaurant.photos.map(photo => <img key={photo.src} src={photo.src} alt={photo.alt} loading="lazy" />)}
      </div>
    </section>
    <section className="grid">
      <div><h2>Operating hours</h2><ul>{restaurant.hours.map(hours => <li key={hours}>{hours}</li>)}</ul><p>Hours are local restaurant time.</p></div>
      <div><h2>Visit or contact us</h2><address>
        {restaurant.address}<br />
        <a href={`tel:${restaurant.phone.replaceAll(" ", "")}`}>{restaurant.phone}</a><br />
        <a href={`mailto:${restaurant.email}`}>{restaurant.email}</a>
      </address><p>Sample contact information for the demo.</p></div>
    </section>
  </>;
}
