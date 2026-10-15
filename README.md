# Pizza Ordering Frontend

React + TypeScript + Vite. The initial setup page checks the existing FastAPI
health endpoint and reports loading, connection success, errors, and timeouts.
Ordering features will arrive in later Sprint 1 steps.

## Development on Windows

Install Node.js **24 LTS** (includes npm). Open a new PowerShell after installing.
From this repository:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:5173`. Start the backend separately at
`http://127.0.0.1:8000` using its README instructions.
Vite forwards `/api` to that backend; requests do not need a separate browser
API origin. The dev server fails explicitly if port 5173 is already in use.

## Configuration

`VITE_API_BASE_URL` defaults to `/api/v1`. Keep it relative for the intended
same-origin development and staging setup. All `VITE_*` settings are public
and compiled into the bundle; **never put credentials or secrets in them**.
Restart Vite after changing local settings, and rebuild after changing staging
settings. `.env.example` contains only a non-secret example.

## Build and verify

```powershell
npm run build
npm run preview
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
origin. The host must preserve session cookie headers for later Sprint steps.

## Structure and conventions

- `src/App.tsx`: setup screen (not the Sprint restaurant home page).
- `src/api.ts`: typed API integration.
- `src/styles.css`: initial global styles; the full shared layout is Step 10.
- `vite.config.ts`: React plugin and local API proxy.

Use strict TypeScript, semantic HTML, visible keyboard focus, and accessible
status messages. Follow the parent project's `CONTRIBUTING.md`. This folder
is a separate Git repository: branch, review, commit, and push here before
updating the parent project's frontend reference.
