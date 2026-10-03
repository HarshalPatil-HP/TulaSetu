# VERIFYCHAIN — COMPLETE ENGINEERING HANDOFF
### SIH 2026 · Problem Statement SIH26036 · Team _Build2Solve
### Read this entire document before writing a single line of code.

---

## 0. HOW TO USE THIS DOCUMENT (read this first, always)

You are an AI coding agent (Codex, Antigravity, or similar) picking up this
project. The person operating you may be **non-technical or semi-technical**.
They will paste your output back to a human lead for review periodically, but
cannot debug your code themselves. This changes how you must work:

1. **Never write code you have not reasoned about for scalability, security,
   and correctness first.** Before writing any file, think through: "Will
   this break with 10,000 records? Can two users race-condition this? What
   happens if this API call fails halfway?" If the honest answer is "this is
   a quick/temporary way to make it work," **do not write it that way.**
   Write the production-correct version the first time. There is no "we'll
   clean it up later" — later may not come.
2. **Work in checkpoints, never a full dump.** This document is split into
   numbered PHASES. Complete one phase fully, verify it against its own
   "Definition of Done" checklist, generate a phase report (format given in
   Section 11), and only then move to the next phase.
3. **After every phase, write a report** to `/reports/PHASE_<n>_REPORT.md`
   using the exact template in Section 11. This is not optional. If your
   context/token budget runs out mid-project, the next AI session (or the
   human) must be able to read the latest report and the
   `PROJECT_PROGRESS.md` tracker (Section 12) and know exactly what is done,
   what is half-done, and what is untouched — without reading your old chat
   history.
4. **If something in this document is ambiguous or you have to guess a
   business rule**, do not silently guess. Write the assumption explicitly
   into `/docs/ASSUMPTIONS.md` with a one-line reason, and proceed with the
   most defensible choice. A judge or reviewer asking "why did you do X"
   must get an answer, not a shrug.
5. **Never fabricate data, fake a passing test, or hardcode a value to make
   a demo look like it works** when the underlying logic doesn't actually
   work. If OCR/upload/anything fails or is uncertain, the system must say
   so honestly (see Section 6, Honesty Principle) — this applies to your own
   development process too. Do not mark a checkpoint "done" if it isn't.
6. **Industry-standard code, every time:** proper error handling (no bare
   `try {} catch {}` that swallows errors), input validation on every
   endpoint, no secrets in code, consistent naming, comments explaining
   *why* not *what*, and tests for anything with business logic (not just
   CRUD).

---

## 1. PROJECT CONTEXT — what this is and why

### 1.1 The official problem statement
**ID:** SIH26036
**Title:** Development of an Online Verification System for Weighing and
Measuring Instruments
**Organization:** Ministry of Consumer Affairs, Food & Public Distribution
**Department:** Department of Consumer Affairs (Legal Metrology Division)
**Category:** Software | **Theme:** Miscellaneous

**Official description:** Under the Legal Metrology Act, 2009 and the Legal
Metrology (General) Rules, 2011, every weighing and measuring instrument used
in transaction or protection must be periodically verified and stamped
before use. Verification is carried out by Legal Metrology Officers (LMOs)
of State Legal Metrology Departments and Government Approved Test Centres
(GATCs). The PS asks for a unified online verification and digital
certification platform covering: online application for verification/
re-verification, scheduling and allocation of inspections to LMOs/GATCs,
workflow management, and (implicitly, from the goal of "transparency") some
way for the result to be trustworthy and checkable.

### 1.2 The real-world problem (why this matters, in plain language)
Today, a shopkeeper's weighing scale gets a **paper certificate and a
physical lead seal** after an officer checks it. Problems with this:
- Paper certificates can be forged or altered.
- A lead seal can be faked or tampered with; a customer has no way to tell.
- A consumer being potentially cheated by a rigged scale has **no way to
  instantly verify** whether that scale is currently certified.
- The department has **no central, searchable record** of which instruments
  are overdue for re-verification, or which officers/centres show unusual
  patterns (e.g., suspiciously fast inspections, unusually high pass rates).
- The whole process is paper-heavy, slow, and has no audit trail.

### 1.3 Competitive landscape — be honest about this, always
This is a popular PS (over 270 teams have already submitted ideas on the
official portal at time of writing). Multiple public prototypes already
exist (different teams, different names) that do the "obvious" version:
instrument registration → application → LMO/GATC assignment → inspection →
QR certificate → public scan-to-verify. **That obvious version is table
stakes, not a differentiator.** Do not pitch it as unique. Our
differentiation (detailed in Section 3) is in what happens *around* that
basic flow: explicit fraud-detection rules, a locked evidence chain, and a
rules-as-data architecture. Build the basic flow solidly, then build the
differentiators solidly — do not skip the differentiators to polish the
basic flow further; they are the reason this submission stands out.

### 1.4 Team & constraints
- Team: _Build2Solve, mostly web-fundamentals skill level except the lead.
- Primary stack: **MERN** (MongoDB, Express, React, Node.js). Do not
  introduce Python, Flutter, or other stacks unless explicitly justified in
  `ASSUMPTIONS.md` — the team cannot maintain a stack they don't know.
  Non-technical team members. Code must be simple enough that someone with
  basic web knowledge can read it after you.
- Zero budget — **every service used must have a genuinely free tier**
  sufficient for a working prototype and a live demo (not a "free trial
  that expires in 7 days").
- This is a **hackathon prototype**, not a government production system —
  but it must be built with production-grade engineering discipline so it
  survives judge scrutiny and could realistically scale. "Prototype scope,
  production quality code."

---

## 2. CORE PRINCIPLES (apply these in every phase, no exceptions)

These were established on this team's prior SIH project and must carry over:

1. **Rules live in the database, not in code.** Any legal threshold, fee
   slab, or fraud-rule parameter must be a DB document with versioning
   (`effectiveFrom`/`effectiveTo`), never a hardcoded constant. A regulation
   change should mean "add a new DB row," never "redeploy code."
2. **Honesty over fake confidence.** If the system is uncertain (bad GPS
   signal, ambiguous input, low data confidence), it says so and asks for
   human review — it never silently guesses and presents a guess as fact.
3. **Evidence is locked, never silently overwritten.** Once an inspection
   record or certificate is finalized, direct edits are rejected by the API
   layer. Corrections happen via a linked "addendum" record that references
   the original — the original is never mutated or deleted.
4. **Depth over scope-creep.** Build what the PS and this document ask for,
   fully and correctly. Do not add unrelated "impressive-sounding" features
   (e.g., do not build an AI chatbot, do not build blockchain unless Phase 9
   explicitly calls for an optional blockchain-anchoring feature) at the
   cost of the core flow being incomplete or buggy.
5. **Role-based access control is enforced server-side, always.** The
   frontend hiding a button is not security. Every API route checks the
   JWT's role claim against what that route allows, server-side, before
   touching the database.

---

## 3. THE UNIQUE ANGLE — what makes this submission different

Do not build a generic "apply → inspect → certify → QR" system and stop.
Build these three layers on top, which most competing prototypes skip or
only partially implement:

### 3.1 Evidence-Locked Inspection Record
Every field inspection captures: GPS coordinates at capture time, a
timestamp, and at least one photo of the instrument and its reading. This
bundle is hashed (SHA-256) at creation time and the hash is stored alongside
the record. Once a certificate is issued from an inspection, that
inspection record becomes **immutable** — any correction creates a new
linked addendum record, never an edit. This gives a dispute a real paper
trail instead of "officer said / trader said."

### 3.2 Configurable Fraud-Detection Rule Engine
A set of explicit, human-readable rules — stored in the `fraud_rules`
collection, not hardcoded — that flag an inspection for admin review
*before* a certificate is auto-approved. Minimum rule set to implement
(exact thresholds are configurable, not fixed):
- **F1 — GPS mismatch:** inspection GPS is further than a configured radius
  (default suggestion: 500m, confirm a sensible value and document the
  assumption) from the registered business/instrument address.
- **F2 — Abnormal pass rate:** an LMO/GATC's rolling pass rate is
  significantly above the regional average (statistical outlier, not a
  fixed magic number — document the method chosen in `ASSUMPTIONS.md`).
- **F3 — Inspection too fast:** time between "inspection started" and
  "inspection submitted" is below a configured minimum duration.
- **F4 — Volume anomaly:** an officer logs more inspections in a day than a
  configured realistic maximum.
- **F5 — Backdated submission:** submitted timestamp is inconsistent with
  claimed inspection timestamp.
- **F6 — Duplicate evidence:** the same photo hash appears across more than
  one supposedly-distinct inspection.
A flagged inspection does not block certificate issuance automatically
(that would be too aggressive for a real regulatory process) — it routes to
an **Admin review queue**, and the admin's decision (approve/reject + reason)
is itself recorded, locked, and auditable.

### 3.3 Public Trust Verification (QR)
Every issued certificate has a QR code encoding a verification token. Anyone
(a consumer, a judge) scans it and lands on a public page showing: **Valid /
Expired / Revoked / Not Found** — nothing else sensitive. Editing the token
even slightly must show "Not genuine," not a server error. Admin can revoke
a certificate; revocation is itself a locked, timestamped, reasoned action.

---

## 4. SYSTEM ARCHITECTURE

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  React PWA   │────▶│  Express REST API │────▶│   MongoDB Atlas  │
│ (mobile-first│     │  (Node.js, JWT)   │     │  (rules, users,  │
│  installable)│◀────│                   │◀────│  instruments,    │
└─────────────┘     └─────────┬─────────┘     │  inspections,    │
       │                      │               │  certificates,   │
       │ offline queue        │               │  fraud flags)    │
       │ (IndexedDB)          ▼               └─────────────────┘
       │             ┌──────────────────┐
       │             │ Fraud Rule Engine │
       │             │  (DB-driven)      │
       │             └──────────────────┘
       │             ┌──────────────────┐
       └────────────▶│ Cloudinary (photo │
                      │  storage)         │
                      └──────────────────┘
                      ┌──────────────────┐
                      │ QR + PDF generator│
                      │ (qrcode, pdfkit)  │
                      └──────────────────┘
                      ┌──────────────────┐
                      │ Public verify page│
                      │ /verify/:token    │
                      └──────────────────┘
```

### 4.1 Tech stack (all free-tier)
| Layer | Technology | Notes |
|---|---|---|
| Frontend | React + Tailwind CSS, PWA (manifest + service worker) | Mobile-first — field officers primarily use phones |
| Offline support | IndexedDB (via `idb` or `dexie`) | Queue inspections when offline, sync on reconnect |
| Backend | Node.js + Express | REST API |
| Database | MongoDB Atlas (free M0 cluster) | |
| Auth | JWT + bcrypt, httpOnly refresh cookie | No third-party paid auth provider |
| File storage | Cloudinary free tier | Photos only; never store raw binaries in MongoDB |
| QR generation | `qrcode` npm package | |
| PDF certificates | `pdfkit` npm package | |
| Hosting (backend) | Render or Railway free tier | |
| Hosting (frontend) | Vercel | |
| Hashing | Node `crypto` (SHA-256) | For evidence bundle integrity |

### 4.2 Non-functional requirements (do not skip these)
- **Scalability:** all list endpoints must be paginated server-side (never
  return an unbounded array). All frequently-queried fields (role, status,
  instrumentId, officerId, date ranges) must be indexed in MongoDB.
- **Security:** passwords bcrypt-hashed (never stored plain); all input
  validated server-side (use `zod` or `joi`, not just frontend checks);
  rate-limiting on auth endpoints; no secrets committed to git (`.env` +
  `.gitignore`, and a `.env.example` with placeholder values).
- **Reliability:** every external call (Cloudinary upload, DB write) wrapped
  in proper try/catch with meaningful error responses, not silent failure.
  Use MongoDB transactions where a multi-document write must be atomic
  (e.g., issuing a certificate + updating instrument status together).
- **Auditability:** every state-changing action (approve, reject, revoke,
  override) is written to an `audit_log` collection: who, what, when, why.
- **Offline-first field use:** inspection capture must work with zero
  network and sync later without data loss or duplication (idempotency key
  per offline-queued inspection).

---

## 5. DATABASE SCHEMA (MongoDB — design before coding, do not improvise mid-build)

Design each collection with clear fields and indexes before writing any
model file. Below is the required collection list with the responsibilities
of each — the AI agent should produce a full field-by-field schema document
at `/docs/DB_DESIGN.md` as the first deliverable of Phase 2, following this:

1. **`users`** — all roles (Owner/Trader, LMO, GATC, Admin) in one
   collection with a `role` enum field, OR separate collections per role if
   you can justify it in `ASSUMPTIONS.md` (prefer one collection + role
   field for simplicity, matching this team's prior project pattern).
   Include `status` (`pending`/`approved`/`suspended`) — LMO/GATC accounts
   require admin approval before they can log in (no real government
   ID-verification API is available to a student project; this approval
   queue is the honest, practical substitute — state this explicitly if
   asked by a judge).
2. **`instruments`** — registered weighing/measuring instruments: owner
   reference, type, make/model, serial number, registered address +
   coordinates, current certificate reference, status (verified / expired /
   pending / rejected).
3. **`applications`** — a verification or re-verification request: instrument
   reference, owner reference, type (new/re-verification), status, assigned
   LMO/GATC, scheduled date.
4. **`inspections`** — the evidence-locked record described in 3.1: GPS,
   timestamp, photo URLs (Cloudinary), evidence hash, measured
   readings/result, officer reference, `locked: boolean`, `addendumOf`
   (reference to original if this is a correction record).
5. **`certificates`** — issued certificate: instrument reference, inspection
   reference, QR token (unique, unguessable — use crypto-random, not an
   incrementing ID), status (valid/expired/revoked), issued date, expiry
   date, revocation reason + timestamp if revoked.
6. **`fraud_rules`** — the configurable rule set from 3.2: rule code (F1,
   F2...), description, parameters (e.g., radius in meters), `enabled`
   boolean, `effectiveFrom`.
7. **`fraud_flags`** — a flagged inspection: inspection reference, which
   rule(s) triggered, admin decision + reason once reviewed, `status`
   (pending/cleared/confirmed).
8. **`audit_log`** — append-only: actor, action, target collection/id,
   timestamp, reason (if applicable). Never update or delete documents in
   this collection from application code.
9. **`fee_rules`** (if fee calculation is in scope per PS wording — confirm
   and document the decision in `ASSUMPTIONS.md`) — same DB-driven pattern
   as `fraud_rules`.

**Design conventions to follow (established, do not deviate without
documenting why):**
- Reference fields that are read together with their parent frequently
  (e.g., `instruments.ownerName` cached alongside `ownerId`) may be
  deliberately denormalized for dashboard read performance — document each
  instance of this in `DB_DESIGN.md`.
- File naming convention across the backend: `*.model.js`,
  `*.controller.js`, `*.route.js`, `*.middleware.js`, `*.service.js`,
  `*.validator.js`, `*.util.js`. Config files (e.g. `db.js`) stay as-is.
  Keep this consistent for every file added in every phase.

---

## 6. CORE WORKFLOWS (the actual step-by-step system behavior)

### 6.1 Owner/Trader flow
1. Register account → **no approval needed for this role** (public-facing).
2. Register an instrument (type, make, model, serial, address — address
   auto-geocoded to lat/long for later GPS-mismatch checking).
3. Submit an application for verification or re-verification.
4. Track application status on a dashboard (Pending → Scheduled →
   Inspected → Certified/Rejected).
5. View/download certificate PDF + QR once issued.

### 6.2 LMO/GATC (Officer) flow
1. Register → **status: pending until admin approval** (honesty principle:
   no real ID-verification API exists, so this manual approval queue is the
   realistic substitute — document this if asked).
2. See assigned applications (auto-assignment logic: nearest
   available officer to the instrument's registered address — simple sorted
   query by distance, not ML, is sufficient and honest for a prototype).
3. Open an assigned application, perform the inspection **even with no
   network** (camera capture + GPS capture work offline, queued locally).
4. Submit result (pass/fail with readings) → system computes evidence hash,
   locks the record, runs it through the fraud rule engine.
5. If no fraud flags: certificate auto-issues. If flagged: goes to Admin
   review queue, officer sees "Pending Admin Review" status.

### 6.3 Admin flow
1. Approve/reject pending LMO/GATC registrations.
2. View fraud-flag review queue; approve or reject a flagged inspection,
   with mandatory reason text — this decision is itself locked and logged.
3. Manage `fraud_rules` and `fee_rules` collections via an admin UI (no
   redeploy needed to change a threshold).
4. View dashboards: applications by status, inspections by officer,
   overdue re-verifications, fraud-flag trends by region.
5. Revoke a certificate (mandatory reason, locked, logged, QR immediately
   reflects "Revoked").

### 6.4 Public (unauthenticated) flow
1. Scan QR or open `/verify/:token` directly.
2. See only: instrument type/category, certificate status
   (Valid/Expired/Revoked/Not Found), issue + expiry date. **Never** expose
   owner personal details, inspection photos, or internal IDs on this public
   page — this is a privacy requirement, not optional.

### 6.5 The Honesty Principle, applied here specifically
- If GPS cannot be acquired during inspection, the system flags the record
  `gpsMissing: true` rather than faking coordinates — this itself should be
  a fraud-rule consideration (missing GPS is suspicious, not neutral).
- If an offline-queued inspection fails to sync (conflict, duplicate,
  corrupted data), the system must surface this clearly to the officer, not
  silently drop it.
- The system never auto-approves a certificate when a fraud rule is
  ambiguous or a required field (photo, GPS, reading) is missing — it holds
  for review instead.

---

## 7. BUILD PHASES — follow in order, checkpoint each one

**Do not start Phase N+1 until Phase N's Definition of Done is fully met and
its phase report is written.** If blocked, write the blocker into the phase
report and stop — do not skip ahead and leave a silent gap.

### PHASE 0 — Project setup
- Initialize monorepo or two-repo structure (`/backend`, `/frontend`) — pick
  one and document the choice.
- Set up ESLint + Prettier, `.env.example`, `.gitignore`, base folder
  structure matching the naming convention in Section 5.
- Set up MongoDB Atlas free cluster, Cloudinary account, confirm all
  credentials work via a trivial test script (do not proceed with unverified
  credentials).
- **Definition of Done:** empty Express server runs, connects to MongoDB
  Atlas successfully, empty React app runs and can call one test API route.

### PHASE 1 — Auth & roles
- `users` model, register/login endpoints, JWT issue + refresh, bcrypt
  password hashing, role-based middleware (`requireRole(['admin'])` style
  guard reusable across routes).
- LMO/GATC approval-queue logic (status: pending/approved/suspended).
- Rate-limiting on auth routes.
- Basic React auth pages (login/register) + protected route wrapper on
  frontend, role-aware redirect after login.
- **Definition of Done:** all four roles can register; LMO/GATC cannot log
  in until admin-approved; Admin can approve them from a (even minimal) UI;
  JWT correctly restricts an endpoint tagged admin-only when tested with a
  non-admin token.

### PHASE 2 — Core data models
- Write `/docs/DB_DESIGN.md` in full (Section 5) before writing model files.
- Implement `instruments`, `applications` models + CRUD endpoints with
  validation, pagination, and indexes.
- Owner dashboard: register instrument, submit application, view status.
- **Definition of Done:** an Owner can register an instrument and submit an
  application end-to-end through the UI, data persists correctly, list
  endpoints are paginated and indexed.

### PHASE 3 — Assignment & inspection (online path first)
- Auto-assignment logic (nearest available officer by distance).
- `inspections` model with evidence hash computation on submit.
- Officer UI: see assigned applications, submit inspection (photo upload to
  Cloudinary, GPS capture, reading entry) while online.
- Locking logic: once submitted, an inspection document becomes immutable at
  the API layer (reject any PUT/PATCH on a locked record; only POST a new
  addendum referencing it).
- **Definition of Done:** full online happy path works: application →
  assignment → inspection submitted → evidence hash stored → record is
  verifiably immutable (attempt to edit it via API and confirm rejection).

### PHASE 4 — Fraud rule engine + certificates
- `fraud_rules` collection + seed script with the F1–F6 rules from 3.2 (with
  documented default parameter values).
- Rule engine service: runs after inspection submit, produces 0+
  `fraud_flags`.
- Certificate auto-issue when no flags; routes to Admin review queue when
  flagged.
- QR token generation (crypto-random), certificate PDF generation, public
  `/verify/:token` page/endpoint (unauthenticated, minimal data exposure per
  6.4).
- **Definition of Done:** a clean inspection auto-issues a certificate with
  a working QR that resolves correctly on the public page; an inspection
  deliberately triggering (e.g.) the GPS-mismatch rule routes to the review
  queue instead of auto-issuing, and an Admin can approve/reject it from a
  working UI with the decision locked and logged.

### PHASE 5 — Admin console
- Fraud-flag review queue UI.
- Rule/fee management UI (edit `fraud_rules`/`fee_rules` without redeploy).
- Dashboards: applications by status, overdue re-verifications, fraud trend
  by officer/region.
- Certificate revocation flow (reason mandatory, locked, logged, QR
  reflects it immediately).
- Full `audit_log` write-through for every admin action.
- **Definition of Done:** every action listed in 6.3 works through the UI,
  and each produces a corresponding `audit_log` entry verifiable in the DB.

### PHASE 6 — Offline support (PWA)
- Service worker: cache-first for app shell, network-first for API calls.
- IndexedDB queue for inspections submitted with no network; sync-on-reconnect
  with an idempotency key so a retried sync never creates a duplicate
  inspection record.
- Manifest.json so the app is installable on a phone home screen.
- **Definition of Done:** disable network in devtools, submit an
  inspection, confirm it queues locally; re-enable network, confirm it syncs
  exactly once (test this explicitly — duplicate-on-sync is a common, easy
  bug here).

### PHASE 7 — Polish, testing, hardening
- Write tests for all business logic: fraud rule engine (each rule, with
  edge-case inputs), locking enforcement, auto-assignment, QR token
  validation (including the "edit one character → Not genuine" case).
- Error-handling audit: every API route returns a sensible status code and
  message on failure, no unhandled promise rejections, no leaked stack
  traces to the client in production mode.
- Security pass: verify no secrets in repo, verify role checks on every
  protected route (write a checklist and go through it route by route),
  verify rate-limiting is active.
- Performance check: confirm list endpoints are paginated and indexed;
  simulate a reasonably large dataset (seed script with a few thousand
  documents) and confirm dashboard queries remain fast.
- **Definition of Done:** test suite passes; security + performance
  checklists in the phase report are fully checked off, not partially.

### PHASE 8 — Deployment
- Backend → Render/Railway, Frontend → Vercel, environment variables set
  correctly in both (never committed to git).
- Smoke-test the full deployed happy path end-to-end (not just localhost).
- **Definition of Done:** a fresh browser, with no prior session, can go
  through Owner → Officer → Admin → Public-verify entirely on the deployed
  URLs.

### PHASE 9 (optional, only if time remains after Phase 8 is fully done)
- Explore blockchain-anchoring of certificate hashes for extra tamper-proof
  claims, or SMS/email notifications on status change. Do not start this
  phase with any earlier phase incomplete.

---

## 8. API DESIGN CONVENTIONS

- REST, versioned under `/api/v1/...`.
- Consistent response shape: `{ success: boolean, data?: ..., error?: {
  message, code } }`.
- Auth via `Authorization: Bearer <jwt>` header; refresh token in httpOnly
  cookie.
- Every list endpoint accepts `?page=&limit=` and returns `{ items, total,
  page, totalPages }`.
- Input validation via a schema library (`zod`/`joi`) at the route boundary,
  before any controller logic runs — reject invalid input with 400 and a
  clear message, never let bad data reach the database layer.

---

## 9. FRONTEND CONVENTIONS

- Role-aware routing: after login, redirect based on `role` claim; a
  protected-route wrapper component checks both "is logged in" and "is
  correct role" before rendering, and redirects otherwise (server-side
  enforcement from Section 4.2 is the real security boundary — this is UX,
  not security).
- Status always shown as a colored badge + text label, never color alone
  (accessibility).
- Loading and error states handled explicitly for every data-fetching
  screen — no blank screens or silent failures.
- Mobile-first layout throughout; officer-facing screens in particular must
  be usable one-handed on a phone in the field.

---

## 10. WHAT TO NEVER DO

- Never hardcode a fraud-rule threshold, fee amount, or legal limit directly
  in code — it belongs in the database (Section 2, Principle 1).
- Never allow a direct edit to a locked inspection or certificate record.
- Never expose owner PII or inspection photos on the public verify page.
- Never fake/simplify a security check "to save time" — if a shortcut is
  taken under time pressure, it must be documented in `ASSUMPTIONS.md` with
  a clear note that it needs to be fixed, not silently left in.
- Never mark a phase "done" in the progress tracker if its Definition of
  Done checklist is not fully satisfied.
- Never introduce a paid service, even a "free trial."

---

## 11. PHASE REPORT TEMPLATE (write one of these after every phase, save to
`/reports/PHASE_<n>_REPORT.md`)

```markdown
# Phase <n> Report — <phase name>
Date: <date>

## What was built
- <bullet list of concrete things implemented, file by file or feature by
  feature>

## Definition of Done — checklist
- [ ] <each item from this phase's Definition of Done, checked honestly>

## Decisions & assumptions made
- <any ambiguous call made, with a one-line reason — must also appear in
  /docs/ASSUMPTIONS.md>

## Known issues / not yet done
- <be explicit and honest — an empty list here should only happen if it's
  actually true>

## How to verify this phase yourself
- <exact steps a non-technical reviewer can follow to confirm this phase
  works — e.g. "1. Register as Owner at /register. 2. ... 3. You should
  see...">

## What the next phase depends on from this one
- <so the next session/agent doesn't have to re-derive it>
```

---

## 12. PROJECT PROGRESS TRACKER

Maintain a single living file at `/PROJECT_PROGRESS.md`, updated at the end
of every phase (not just the per-phase report — this is the single glance-
able source of truth):

```markdown
# VerifyChain — Progress Tracker
Last updated: <date> by <agent/session>

| Phase | Status | Report |
|---|---|---|
| 0 — Setup | ✅ / 🔶 in progress / ⬜ not started | /reports/PHASE_0_REPORT.md |
| 1 — Auth & roles | | |
| 2 — Core data models | | |
| 3 — Assignment & inspection | | |
| 4 — Fraud engine & certificates | | |
| 5 — Admin console | | |
| 6 — Offline support | | |
| 7 — Testing & hardening | | |
| 8 — Deployment | | |
| 9 — Optional extras | | |

## Current blockers
- <anything stopping progress right now>

## For the next person/session picking this up
- <one paragraph: where things stand, what to do next, anything urgent>
```

**Every new AI session must read `/PROJECT_PROGRESS.md` and the latest
`/reports/PHASE_<n>_REPORT.md` in full before taking any action**, exactly
as this document itself should be read in full before Phase 0 begins.

---

## 13. REFERENCE — primary sources used for this handoff

- Legal Metrology Act, 2009 and Legal Metrology (General) Rules, 2011 —
  governs the underlying verification/stamping requirement.
- Official SIH26036 problem statement text (Ministry of Consumer Affairs,
  Food & Public Distribution).
- OIML Recommendation R-76 — referenced by the related PS SIH26035 for
  weighing-instrument test reports; if this project's rule engine needs
  numeric instrument-accuracy limits, verify the exact figures against the
  Legal Metrology (General) Rules 2011 schedule before hardcoding anything
  into a seed script — do not assume a number found in an unofficial source
  is correct.

---

*End of handoff. Agent: confirm you have read this entire document, then
begin Phase 0.*
