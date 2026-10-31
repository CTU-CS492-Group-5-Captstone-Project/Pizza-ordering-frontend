import { writeFile } from "node:fs/promises";

const target = process.env.API_PROXY_TARGET;
if (process.env.NETLIFY && !target) {
  throw new Error("Set API_PROXY_TARGET to the deployed HTTPS API origin before building on Netlify.");
}
let proxy = "";
if (target) {
  const url = new URL(target);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("API_PROXY_TARGET must be an HTTPS origin without a path, query, or credentials.");
  }
  proxy = `/api/* ${url.origin}/api/:splat 200!\n`;
}
await writeFile(new URL("../dist/_redirects", import.meta.url), `${proxy}/* /index.html 200\n`);
await writeFile(new URL("../dist/_headers", import.meta.url), `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' https://js.stripe.com https://*.js.stripe.com; frame-src https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com https://link.com https://*.link.com; connect-src 'self' https://api.stripe.com https://r.stripe.com https://link.com https://*.link.com; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'
  Cache-Control: no-cache
/api/*
  Cache-Control: no-store
`);
