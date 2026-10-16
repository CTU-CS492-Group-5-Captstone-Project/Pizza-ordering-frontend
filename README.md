# Pizza Ordering Frontend

React + strict TypeScript + Vite. Sprint 1 includes the restaurant home,
database-driven menu/promotions, registration, login/logout, customer profile,
role workspaces, pizza customization, and customer cart updates with server
pricing. Payment and checkout/order submission are out of scope.
The Account page checks API connectivity and restores sessions on reload.
Passwords are cleared after each login attempt; session cookies are HttpOnly
and are never stored in JavaScript storage.

## Development on Windows

Install Node.js **24 LTS** (includes npm). Open a new PowerShell after installing.
From this repository:

```powershell
npm.cmd ci
Copy-Item .env.example .env
npm.cmd run dev
```

Open `http://localhost:5173`. Start the backend separately at
`http://127.0.0.1:8000` using its README instructions.
Vite forwards `/api` to that backend; requests do not need a separate browser
API origin. The dev server fails explicitly if port 5173 is already in use.
If PowerShell blocks `npm.ps1`, use `npm.cmd` in these commands instead.
The root workspace also provides Ctrl+Shift+B and F5 startup shortcuts.

The backend needs a configured PostgreSQL database and migrations.
Run its explicit menu seed for sample pizzas/offers, then use Register to
create a customer and Account to sign in. No accounts/passwords are seeded.
Set `COOKIE_SECURE=false` only in the local
backend development environment. Without database configuration, account
requests show an explicit error while the health connection can still succeed.

## Configuration

`VITE_API_BASE_URL` defaults to `/api/v1`. Keep it relative for the intended
same-origin development and staging setup. All `VITE_*` settings are public
and compiled into the bundle; **never put credentials or secrets in them**.
Restart Vite after changing local settings, and rebuild after changing staging
settings. `.env.example` contains only a non-secret example.
Authentication uses same-origin credentials, an HttpOnly session cookie,
and CSRF tokens obtained from `/auth/csrf` before state-changing requests.
Keep the API base relative; cross-origin authentication is not supported by
this client setup. Do not put account credentials in frontend configuration.

## Build and verify

```powershell
npm.cmd run build
npm.cmd run preview
```

The build first runs strict TypeScript checks, then writes static assets to
`dist/`. Commit `package-lock.json`; do not commit `node_modules` or `dist`.
Preview serves the build at `http://localhost:4173` but does not proxy the API;
use the dev server for local API integration or a staging reverse proxy.

## Staging

On Netlify (or an equivalent static host), use Node.js 24 LTS, `npm ci` followed
by `npm run build`, and publish `dist/`. Set `VITE_API_BASE_URL=/api/v1`.
Configure a status-200 reverse proxy for `/api/*` to the separately hosted
backend's `https://<your-api-host>/api/:splat`, followed by the SPA fallback
`/* -> /index.html`. These require the actual staging hostname, not literal
placeholder values. Verify the health check over the public HTTPS frontend
origin. The host must preserve session cookie headers, Origin, and
X-CSRF-Token, and must not cache auth or private profile/cart responses. Set backend
`COOKIE_SECURE=true` and `TRUSTED_ORIGINS` to the public Netlify HTTPS origin.
Verify login, restored sessions, and logout on the actual deployment; local
HTTP browser checks cannot certify hosted Secure-cookie/proxy behavior.

## Structure and conventions

S1-T12: restaurant content is maintained in `src/restaurant.ts` (description,
hours, contact details and photo URLs). All contact details are demo placeholders.
Photos are externally hosted on Unsplash; visitors' browsers contact that service.
Replace demo information and confirm image rights before using for a real business.
The Home page links directly to menu/order navigation and does not accept payments.

S1-T15/T16: shared responsive layout/styles apply across account, registration,
profile and role workspaces. Navigation wraps on narrow screens, controls have
44px targets, focus is visible, forms have labels and live error/status
summaries, and a skip link and focusable main landmark support keyboard use.
Images use descriptive alt text when added; reduced-motion preferences are
respected. Do not convey availability or errors by color alone.

- `src/App.tsx`: shared layout, role-aware navigation, and hash routes.
- `src/Account.tsx`: accessible login/logout and session restoration.
- `src/CustomerForm.tsx`: registration and own-profile validation feedback.
- `src/Home.tsx`, `src/restaurant.ts`: editable demo restaurant information.
- `src/Menu.tsx`, `src/Promotions.tsx`: database menu/offers and resource states.
- `src/Customize.tsx`, `src/Cart.tsx`: selections, add/update/remove, totals.
- `src/Workspace.tsx`: role-gated access confirmation, not staff operations.
- `src/api.ts`, `src/useResource.ts`: typed API/CSRF, timeouts, loading/retry.
- `src/money.ts`: shared display formatting; server owns price calculations.
- `src/styles.css`: shared responsive accessible layout.
- `vite.config.ts`: React plugin and local API proxy.

Use strict TypeScript, semantic HTML, visible keyboard focus, and accessible
status messages. Follow the parent project's `CONTRIBUTING.md`. This folder
is a separate Git repository: branch, review, commit, and push here before
updating the parent project's frontend reference.

## Demo checks

Register, sign in, reload, and update Profile. Choose pizza options, add two
different configurations, change quantities across the $20 promotion threshold,
remove lines, and confirm the empty-cart message. Prices and totals always
come from the backend; the default tax is a configurable demo 8.25%.
Unavailable items/options cannot be selected. Menu and promotion sections
show loading, empty, and error/retry states rather than fake data.

Check keyboard focus, labels, skip link, validation summaries, narrow screens,
sign-out, and forbidden role routes. Server inactivity expiry is 15 minutes;
public menu browsing does not renew it. Frontend guards supplement, never
replace, backend permission/ownership checks.
