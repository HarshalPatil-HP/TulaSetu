# VerifyChain — Progress Tracker
Last updated: 2026-10-03 by Antigravity (session 2dad6bc0)

| Phase | Status | Report |
|---|---|---|
| 0 — Setup | 🔶 code complete, runtime verification pending | [/reports/PHASE_0_REPORT.md](./reports/PHASE_0_REPORT.md) |
| 1 — Auth & roles | ⬜ not started | /reports/PHASE_1_REPORT.md |
| 2 — Core data models | ⬜ not started | /reports/PHASE_2_REPORT.md |
| 3 — Assignment & inspection | ⬜ not started | /reports/PHASE_3_REPORT.md |
| 4 — Fraud engine & certificates | ⬜ not started | /reports/PHASE_4_REPORT.md |
| 5 — Admin console | ⬜ not started | /reports/PHASE_5_REPORT.md |
| 6 — Offline support | ⬜ not started | /reports/PHASE_6_REPORT.md |
| 7 — Testing & hardening | ⬜ not started | /reports/PHASE_7_REPORT.md |
| 8 — Deployment | ⬜ not started | /reports/PHASE_8_REPORT.md |
| 9 — Optional extras | ⬜ not started | /reports/PHASE_9_REPORT.md |

## Current blockers

**Phase 0 runtime verification blocked on credentials:**
1. User must copy `backend/.env.example` → `backend/.env` and fill in MongoDB Atlas URI, Cloudinary keys, JWT secrets, and admin credentials.
2. User must copy `frontend/.env.example` → `frontend/.env` (only needs `VITE_API_BASE_URL=http://localhost:5000/api/v1` for Phase 0).
3. After `.env` is in place: run `npm run dev` in `/backend`, verify the health endpoint returns `{ database: "connected" }`.
4. Then run `node scripts/seedAdmin.js` from `/backend` to create the admin account.
5. Once all verification steps in `PHASE_0_REPORT.md` pass, Phase 1 can begin.

## For the next person/session picking this up

**Phase 0 is code-complete. All files are written and all packages are installed.** The only remaining step is the user filling in their `.env` file and running the verification steps in `reports/PHASE_0_REPORT.md`. Once those pass, Phase 1 begins immediately with `user.model.js`, auth routes, and the login/register UI.

Key architectural decisions locked in (all in `/docs/ASSUMPTIONS.md`):
- Two-folder monorepo: /backend + /frontend in same git repo
- Fee rules: schema + seed + display; no payment gateway
- Certificate validity: 12-month placeholder, clearly labeled
- LMO and GATC: identical permissions for MVP (centreType field only distinguishes them)
- Geocoding: OpenStreetMap Nominatim, server-side, free
- F2 anomaly: mean + 2σ above regional average, rolling 90-day window
- All fraud rule thresholds stored in DB (fraud_rules collection), never hardcoded
- Admin: never self-registered; created by `scripts/seedAdmin.js` only
- Evidence hash: SHA-256 of {gps, sorted photos, readings, result, submittedAt} — server-side
- QR token: `crypto.randomBytes(24).toString('hex')` — 192-bit entropy

