# VerifyChain — Assumptions Log
### Every ambiguous decision is documented here with a reason.
### Judges or reviewers asking "why did you do X?" get an answer here.

---

## A1 — Monorepo structure
**Decision:** Two-folder monorepo (`/backend`, `/frontend`) in the same git repository, with one root `.gitignore`.
**Reason:** Simplest for a small team; no separate repo management; matches the team's prior project pattern. The folders are independently deployable (Render for backend, Vercel for frontend).

---

## A2 — Fee rules scope
**Decision:** The `fee_rules` collection is built with a full schema and seeded with placeholder values based on Legal Metrology (General) Rules 2011. The system displays the applicable fee to the owner. No payment gateway is integrated.
**Reason:** The PS does not explicitly require payment processing. Building the data-driven `fee_rules` structure demonstrates the "rules-in-DB, not code" architecture. Deferring payment avoids half-building a critical financial flow under time pressure.
**Judge note:** "Fee display is implemented. Payment gateway integration is documented future scope — it requires RBI-compliant payment handling which is out of scope for a prototype."

---

## A3 — Certificate validity period
**Decision:** Seeded with **12 months** as a clearly-labeled placeholder for all instrument types.
**Reason:** The Legal Metrology (General) Rules 2011 specify validity periods per instrument class in the schedule. The exact class-wise values have not been verified against the official schedule in time for this prototype. 12 months is used as a safe conservative placeholder.
**Action required before production:** Replace placeholder values in `fee_rules` seed with the actual schedule from Legal Metrology (General) Rules 2011, Schedule IV or the relevant schedule for each instrument class.
**Judge note:** "We are using a 12-month placeholder. The actual period is defined in the Rules schedule and would be seeded correctly before production deployment — the architecture supports this as a DB-only change, no code change."

---

## A4 — LMO vs GATC permissions
**Decision:** LMO (Legal Metrology Officer) and GATC (Government Approved Test Centre) are treated identically in the system's permission model for MVP. They share the same routes, middleware role check (`['lmo','gatc']`), and UI flows. Differentiated only by the `centreType` display field.
**Reason:** The PS does not define distinct permission boundaries between LMO and GATC for the purposes of this digital workflow system. If the actual regulations require different approval authorities or fee scales, this can be separated at the model/route level without restructuring the codebase (the `centreType` field is already stored).

---

## A5 — F2 pass-rate anomaly detection method
**Decision:** An officer's pass rate is considered anomalous if it exceeds **mean + 2 standard deviations** of the pass rates of all officers in the same state over a rolling 90-day window.
**Reason:** 2σ above the mean is a widely-used threshold for statistical outlier detection in regulatory contexts (covers ~97.7% of a normal distribution). A rolling 90-day window provides enough data for meaningful statistics while being sensitive to recent pattern changes. The threshold (2σ) and window (90 days) are both stored as parameters in the `fraud_rules` collection (F2 params: `{ stdDevThreshold: 2, windowDays: 90 }`) — they can be adjusted without a code change.
**Honest note:** This is basic statistics, not ML. There is no trained model. The term "AI-powered anomaly detection" must never be used to describe this system.

---

## A6 — F1 GPS mismatch radius
**Decision:** Default radius = **500 meters** (stored in `fraud_rules.params.maxDistanceMeters`).
**Reason:** Specified as the "default suggestion" in the handoff document (Section 3.2). Stored in DB, not hardcoded. Admin can change it via the Admin UI without a code change.

---

## A7 — F3 minimum inspection duration
**Decision:** Default minimum = **180 seconds (3 minutes)** (stored in `fraud_rules.params.minDurationSeconds`).
**Reason:** A physical instrument inspection that takes less than 3 minutes is likely superficial or fraudulent. The value is configurable from the Admin UI. Stored in DB.

---

## A8 — F4 maximum inspections per day per officer
**Decision:** Default maximum = **15 inspections per day** (stored in `fraud_rules.params.maxPerDay`).
**Reason:** Based on the assumption that a thorough physical inspection takes at least 20-30 minutes including travel between sites. 15 represents an upper bound of a realistic working day. Configurable from Admin UI.

---

## A9 — Auto-assignment algorithm
**Decision:** Applications are auto-assigned to the nearest approved, active officer (LMO or GATC) whose jurisdiction matches the instrument's state, sorted by haversine distance from the instrument's registered GeoJSON coordinates to the officer's jurisdiction center coordinates.
**Reason:** Simple, correct, deterministic, and honest. This is a sorted distance query — not ML, not "smart routing." The handoff document explicitly says "sort by distance, not ML" and this matches that requirement.
**Limitation documented:** For a production system, workload balancing (not just proximity) would also factor in. This is noted as future scope. For the prototype, nearest-available is sufficient and honest.

---

## A10 — Certificate expiry check method
**Decision:** A `node-cron` job runs **every hour** on the backend server. It queries for `certificates` where `expiresAt <= now AND status:'valid'` and updates them to `status:'expired'`, also updating the corresponding `instruments.status` to `'expired'` in a Mongo transaction.
**Reason:** The PRD (Edge Case E5) explicitly prohibits "lazy check on read" — the state must be correct even if nobody opens the record at the exact expiry moment. An hourly cron is a simple, correct solution that does not rely on user interaction.

---

## A11 — Geocoding service for instrument address registration
**Decision:** OpenStreetMap Nominatim API (`https://nominatim.openstreetmap.org/search`) is used server-side to convert the registered instrument address string to lat/lng coordinates when an instrument is registered.
**Reason:** Free, no API key required, accurate for Indian addresses. Rate limit (1 req/sec) is not an issue for a form-submit use case. The alternative (requiring owners to manually input lat/lng) is poor UX for a government-facing system.
**Fallback:** If Nominatim returns no result for an address, the system returns a clear validation error asking the owner to provide a more specific address. It never silently sets coordinates to (0,0) or any default.

---

## A12 — No real government ID verification for LMO/GATC registration
**Decision:** LMO/GATC license numbers are accepted as self-declared inputs and are verified manually by the Admin (outside the system) before approving the account. There is no integration with a government license registry API.
**Reason:** No such API exists that is accessible to a student project without formal government credentials. The manual approval queue is the honest, practical substitute. This limitation is disclosed openly.
**Judge note:** "The system provides a manual approval queue where admin can see the submitted license number and manually verify it against the real register before approving. Integration with an actual government registry would require official API access from the department — this would be the production upgrade path."

---

## A13 — `passwordHash` exclusion
**Decision:** All Mongoose model queries use `.select('-passwordHash')` by default, and the `user.model.js` defines a `toJSON()` transform that removes `passwordHash` from serialized output.
**Reason:** Defense-in-depth: even if a controller accidentally omits the field exclusion, the model transform prevents the hash from leaking in any JSON response.

---

*This file is append-only from application code. Every new assumption made during development must be added here, never removed.*
