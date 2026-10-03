# Phase 0 Report — Project Setup
Date: 2026-10-03

## What was built

### Root-level files
- `.gitignore` — covers node_modules, .env files, dist/, logs/, editor/OS files for both /backend and /frontend
- `README.md` — setup instructions, tech stack table, "not an ML project" statement
- `PROJECT_PROGRESS.md` — living progress tracker initialized
- `docs/ASSUMPTIONS.md` — 13 assumptions documented (A1–A13), all with reasons and judge-facing notes

### Backend (`/backend`)
- `package.json` — all production + dev dependencies defined; ES module type; nodemon dev script; Jest with ESM support
- `.env.example` — complete reference for all required env variables (MONGODB_URI, JWT secrets, Cloudinary, admin seed values, CORS)
- `.prettierrc` — consistent formatting config
- `eslint.config.js` — ESLint v9 flat config; no-empty-catch enforced, no-var, prefer-const, eqeqeq
- `src/config/db.js` — MongoDB Atlas connection; throws on missing URI; logs connected DB name
- `src/routes/health.route.js` — `GET /api/v1/health`; returns `{ service, version, environment, timestamp, database }` with 503 when DB disconnected
- `src/utils/apiResponse.util.js` — `sendSuccess`, `sendError`, `sendPaginated` — consistent envelope for all routes
- `src/utils/geoDistance.util.js` — Haversine distance formula + GeoJSON Point converter; pure JS, no DB dependency (testable in isolation)
- `src/utils/hashEvidence.util.js` — SHA-256 evidence bundle hash; deterministic, order-normalized, timezone-normalized
- `src/utils/qrToken.util.js` — `crypto.randomBytes(24).toString('hex')` — 192-bit entropy token
- `server.js` — Express entry point: helmet, cors, body limits, morgan (dev only), 404 handler, global error handler (no stack trace in production), startup sequence
- `scripts/seedAdmin.js` — idempotent admin seed; reads ADMIN_EMAIL + ADMIN_PASSWORD from .env; bcrypt 12 rounds; checks for existing admin before creating
- `tests/setup.js` — Jest setup: dotenv load, optional console silencing

### Frontend (`/frontend`)
- `package.json` — React 18, Tailwind CSS v3, Zustand, Dexie, react-hook-form, vite-plugin-pwa, react-router-dom v7, axios, react-hot-toast
- `.env.example` — VITE_API_BASE_URL placeholder
- `vite.config.js` — @vitejs/plugin-react + vite-plugin-pwa (manifest + Workbox); dev proxy to backend on :5000
- `tailwind.config.js` — VerifyChain design tokens: primary blue (#1A56DB), three status colors (valid/pending/rejected), Inter font, card border-radius + shadow
- `postcss.config.js` — Tailwind + autoprefixer
- `index.html` — SEO meta tags, PWA manifest link, Inter from Google Fonts, mobile viewport
- `src/index.css` — Tailwind directives + reusable component classes (card, badge-valid/pending/rejected, btn-primary/secondary/danger, form-input/label/error, skeleton, no-scrollbar)
- `src/main.jsx` — React root mount with StrictMode
- `src/App.jsx` — BrowserRouter, Toaster (bottom-center), Phase 0 health placeholder page demonstrating design system

## Definition of Done — checklist

- [x] Express server code written and health route defined
- [x] MongoDB Atlas connection module written (requires .env to actually run)
- [x] React app written (requires npm install to run)
- [x] Frontend can call the health endpoint (dev proxy configured in vite.config.js)
- [ ] **Express server verified running on localhost:5000** — BLOCKED: requires .env with MONGODB_URI
- [ ] **MongoDB Atlas connection confirmed live** — BLOCKED: requires .env with MONGODB_URI
- [ ] **React dev server verified on localhost:5173** — BLOCKED: requires npm install to complete
- [x] No secrets in any committed file — .env is in .gitignore
- [x] .env.example exists for both backend and frontend with clear placeholder values

**Status: 🔶 Partially complete — code and configuration are written correctly; runtime verification requires credentials.**

## Decisions & assumptions made

All 13 assumptions documented in `/docs/ASSUMPTIONS.md`. Key decisions affecting Phase 0:
- **A1:** Two-folder monorepo (/backend + /frontend in same repo)
- **A10:** node-cron for certificate expiry (implementation in Phase 5)
- **A11:** OpenStreetMap Nominatim for geocoding (confirmed by user)
- Fee rules: schema + seed + display, no payment gateway (confirmed by user)
- Certificate validity: 12-month placeholder (confirmed by user)
- LMO/GATC: identical permissions (confirmed by user)

## Known issues / not yet done

1. **`.env` file not created** — the user must copy `backend/.env.example` to `backend/.env` and fill in:
   - `MONGODB_URI` (Atlas connection string)
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`
2. **`frontend/.env`** — copy `frontend/.env.example` to `frontend/.env`. In Phase 0 the only value needed is `VITE_API_BASE_URL=http://localhost:5000/api/v1`.
3. **npm audit vulnerabilities** — backend has 32 (from pdfkit's transitive deps), frontend has 5 (from vite-plugin-pwa chain). None are in our application code. `npm audit fix` can be run on both; `--force` is NOT recommended as it may break package APIs.
4. **Phase 0 runtime verification** — cannot be fully completed until credentials are in .env. Phase 1 does not start until the following verification steps pass.

## How to verify this phase yourself

1. Copy `backend/.env.example` to `backend/.env`
2. Fill in your MongoDB Atlas URI, Cloudinary credentials, JWT secrets, and admin email/password
3. Open a terminal in `e:\OneDrive\Desktop\TulaSetu\backend` and run: `npm run dev`
4. You should see:
   ```
   [DB] Connected to MongoDB Atlas — database: verifychain
   [SERVER] VerifyChain API running on port 5000 (development)
   [SERVER] Health check: http://localhost:5000/api/v1/health
   ```
5. Open a browser and go to `http://localhost:5000/api/v1/health`
6. You should see: `{ "success": true, "data": { "service": "VerifyChain API", ..., "database": "connected" } }`
7. Open a second terminal in `e:\OneDrive\Desktop\TulaSetu\frontend` and run: `npm run dev`
8. Go to `http://localhost:5173` — you should see the VerifyChain Phase 0 landing card with the blue "V" logo
9. Run `node scripts/seedAdmin.js` from the backend folder — you should see "✅ Admin account created successfully"
10. Running it a second time should show "An admin account already exists. No changes made." (idempotency confirmed)

## What the next phase depends on from this one

- All utility functions (`hashEvidence.util.js`, `qrToken.util.js`, `geoDistance.util.js`, `apiResponse.util.js`) — Phase 1+ controllers and services import these
- `server.js` structure — Phase 1 auth routes are uncommented in server.js when ready
- `scripts/seedAdmin.js` — must be run once before Phase 1 login can be tested with the admin account
- `tailwind.config.js` design tokens — all Phase 1+ UI components use these token names (e.g. `text-primary-600`, `badge-valid`, `btn-primary`)
- `src/index.css` component classes — `card`, `form-input`, `badge-*`, `btn-*` are available to all Phase 1+ components
