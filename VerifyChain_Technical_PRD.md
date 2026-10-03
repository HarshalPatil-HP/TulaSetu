# VERIFYCHAIN — TECHNICAL PRD (v2, detailed)
### SIH26036 · Team _Build2Solve
### This file supplements VerifyChain_SIH26036_HANDOFF.md. Read both before coding.
### This file exists specifically to remove ambiguity — every decision an
### agent would otherwise have to guess is answered here.

---

## 0. IS THIS AN ML PROJECT? — answer this honestly, always

**No. This PS does not need ML, and the system must not pretend otherwise.**

SIH26036 is a **digital workflow and verification system** — application →
assignment → inspection → certificate → public QR check. There is no
image-classification or language-understanding task here (unlike the
team's other submission, SIH26031 onion grading, which genuinely needs a
computer-vision model).

Everything that might look "AI-ish" in this project is actually
**deterministic rule-based logic**, not ML:
- Fraud detection (F1–F6) = if/else threshold checks on stored numbers (GPS
  distance, time duration, counts) — **not a trained model.**
- Officer auto-assignment = sort by distance — **not a trained model.**
- Pass-rate anomaly (F2) = basic statistics (mean + standard deviation
  comparison against a configured threshold) — **not ML, do not call it
  "AI-powered anomaly detection."**

**If a judge asks "are you using ML/AI?":** the honest answer is "No — this
is a rule-based verification and workflow system. The rules are
configurable from a database so the department can tune them without a
code change, but there's no trained model here; that would be dishonest to
claim and SIH26036 doesn't call for one." Say this plainly. Claiming ML
where there is none is exactly the kind of fake-confidence this team has
explicitly rejected on the other project — do not contradict that here.

**If the team later wants to ADD a genuine ML component** (optional,
Phase 9+, only after everything else is solid): the only honestly-justifiable
one is an anomaly-detection model (e.g., isolation forest) trained on
officer inspection patterns (time-of-day, duration, pass-rate, GPS spread)
to flag suspicious officers automatically instead of fixed thresholds. This
is optional polish, not core — do not let it delay or replace the
rule-based system, which must work completely on its own first.

---

## 1. FULL DATABASE SCHEMA — every field, every collection

### 1.1 `users`
```
{
  _id: ObjectId,
  role: enum['owner','lmo','gatc','admin'],      // required
  name: String,                                   // required, 2-100 chars
  email: String,                                   // required, unique, validated format
  phone: String,                                   // required, unique, 10-digit India format
  passwordHash: String,                            // required, bcrypt, never returned by any API
  status: enum['pending','approved','suspended','rejected'], // see 3.2
  // role-specific fields — only populated for the relevant role:
  businessName: String,                            // owner only
  address: { line1, city, state, pincode },         // owner only
  licenseNumber: String,                            // lmo/gatc only — their official LM license/notification ID
  jurisdiction: { state, district },                // lmo/gatc only — used for auto-assignment
  centreType: enum['LMO','GATC'],                   // lmo/gatc only
  approvedBy: ObjectId (ref: users),                // set when admin approves; null until then
  approvedAt: Date,
  rejectionReason: String,                          // set if status = rejected
  createdAt: Date, updatedAt: Date
}
Indexes: { email: 1 } unique, { phone: 1 } unique, { role: 1, status: 1 }
```

### 1.2 `instruments`
```
{
  _id, ownerId: ObjectId (ref: users),               // required
  type: enum['weighing_scale','weighbridge','fuel_dispenser','other'], // required
  makeModel: String, serialNumber: String,            // required
  // uniqueness is per-owner, not global: two different owners CAN register
  // the same serial number from different manufacturers' batches — do not
  // make serialNumber globally unique, see Edge Case E3 in Section 4.
  address: { line1, city, state, pincode },
  location: { type:'Point', coordinates:[lng,lat] },  // GeoJSON, required — used for F1 GPS check
  currentCertificateId: ObjectId (ref: certificates), // null until first cert issued
  status: enum['unverified','pending','verified','expired','rejected'],
  createdAt, updatedAt
}
Indexes: { ownerId:1 }, { location:'2dsphere' }, { status:1 }
Compound unique index: { ownerId:1, serialNumber:1 } — prevents one owner
double-registering the same instrument, but allows the same serial under
different owners (see E3).
```

### 1.3 `applications`
```
{
  _id, instrumentId, ownerId,                         // required
  type: enum['new_verification','re_verification'],
  status: enum['submitted','assigned','scheduled','inspected','certified','rejected','cancelled'],
  assignedOfficerId: ObjectId (ref: users),            // null until assigned
  assignedAt: Date, scheduledDate: Date,
  priority: enum['normal','overdue'],                  // 'overdue' auto-set if instrument.status=expired
  createdAt, updatedAt
}
Indexes: { ownerId:1 }, { assignedOfficerId:1, status:1 }, { status:1, createdAt:1 }
```

### 1.4 `inspections`
```
{
  _id, applicationId, instrumentId, officerId,          // required
  startedAt: Date, submittedAt: Date,                    // both required — submittedAt - startedAt feeds F3
  gps: { type:'Point', coordinates:[lng,lat] } | null,   // null allowed ONLY if gpsMissing=true
  gpsMissing: Boolean,                                    // true if device couldn't get a GPS fix
  photos: [String],                                       // Cloudinary URLs, min 1 required unless offline-queued+failed (see E7)
  readings: { declaredValue, measuredValue, unit, withinTolerance: Boolean },
  result: enum['pass','fail'],
  evidenceHash: String,                                    // SHA-256 of {gps, photos[], readings, submittedAt} — computed server-side, never trust client-sent hash
  locked: Boolean,                                         // true immediately after submit
  addendumOf: ObjectId (ref: inspections) | null,          // set only on correction records
  offlineQueuedAt: Date | null,                            // set if this came from the offline sync queue
  syncIdempotencyKey: String | null,                       // client-generated UUID, unique index prevents duplicate sync
  createdAt
}
Indexes: { applicationId:1 }, { officerId:1, submittedAt:1 },
{ syncIdempotencyKey:1 } unique sparse
```

### 1.5 `certificates`
```
{
  _id, instrumentId, inspectionId,                        // required
  qrToken: String,                                         // required, unique, crypto.randomBytes(24).toString('hex') — NOT an incrementing ID, NOT derived from instrumentId
  status: enum['valid','expired','revoked'],
  issuedAt: Date, expiresAt: Date,                          // expiresAt = issuedAt + validity period from fee_rules/instrument type
  revokedAt: Date | null, revokedBy: ObjectId | null, revokeReason: String | null,
  pdfUrl: String                                            // Cloudinary URL of generated certificate PDF
}
Indexes: { qrToken:1 } unique, { instrumentId:1, status:1 }
```

### 1.6 `fraud_rules`
```
{
  _id, code: enum['F1','F2','F3','F4','F5','F6'],
  description: String,
  enabled: Boolean,
  params: Mixed,            // e.g. F1: { maxDistanceMeters: 500 }, F3: { minDurationSeconds: 180 }, F4: { maxPerDay: 15 }
  effectiveFrom: Date, effectiveTo: Date | null,
  updatedBy: ObjectId (ref: users)
}
Seed script creates all 6 with the defaults from the handoff doc Section 3.2.
Only one row per code may have effectiveTo:null at a time (the "active" one)
— enforce this in the update-rule controller, not just by convention.
```

### 1.7 `fraud_flags`
```
{
  _id, inspectionId, triggeredRules: [String],              // e.g. ['F1','F3']
  status: enum['pending','cleared','confirmed'],
  reviewedBy: ObjectId | null, reviewedAt: Date | null, reviewReason: String | null,
  createdAt
}
Indexes: { status:1, createdAt:1 }
```

### 1.8 `audit_log`
```
{
  _id, actorId: ObjectId (ref: users) | null,               // null for system-generated actions
  action: String,                                            // e.g. 'certificate.revoke', 'user.approve'
  targetCollection: String, targetId: ObjectId,
  reason: String | null,
  metadata: Mixed,                                            // free-form snapshot of relevant before/after values
  createdAt: Date
}
Indexes: { targetCollection:1, targetId:1 }, { createdAt:1 }
Append-only — no controller may ever call updateOne/deleteOne on this collection.
```

### 1.9 `fee_rules` (confirm against actual PS scope before building — see Section 5 open question)
```
{ _id, instrumentType, newVerificationFee, reVerificationFee, validityMonths, effectiveFrom, effectiveTo }
```

---

## 2. AUTH & PERMISSION FLOWS — every role, exact steps

### 2.1 General principle (applies to every role below)
**This is a government-adjacent system — nobody self-grants access to a
privileged role.** Every non-public role either requires admin approval or
is seeded. This must be true for every flow below, no exceptions, no
"approve automatically for the demo" shortcuts anywhere in the code.

### 2.2 Admin
- **Never self-registered.** There is no public "sign up as Admin" form
  anywhere in the UI — if one exists, that's a bug.
- Created by a **one-time seed script** (`scripts/seedAdmin.js`), run once
  at deployment setup. Reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` from
  environment variables (never hardcoded in source), creates exactly one
  `users` document with `role:'admin', status:'approved'`.
- The seed script must be **idempotent**: running it twice must not create
  a duplicate admin — check `role:'admin'` existence first, exit with a
  clear message if one already exists.
- Admin can later promote/create additional admins from within the Admin
  UI itself (not via public signup) — this is a Phase 5+ nice-to-have, not
  required for MVP; document if skipped.

### 2.3 Owner/Trader
- **Public self-registration**, no approval needed — anyone can register as
  an instrument owner immediately, since this role has no regulatory
  authority, only submits applications for their own instruments.
- Signup form fields: name, email, phone, password, businessName, address.
- On success: `status:'approved'` immediately, can log in and use the
  dashboard right away.

### 2.4 LMO / GATC (Officer)
This is the one that needs the full approval chain — get this exactly right:
1. **Signup form** (same `/register` page, role selector chooses this):
   name, email, phone, password, **licenseNumber** (their official Legal
   Metrology license/notification ID — required, this is the honest
   substitute for a real government ID-verification API, which doesn't
   exist for a student project), centreType (LMO or GATC), jurisdiction
   (state + district).
2. On submit: `users` document created with **`status:'pending'`**.
   **The account exists in the database but cannot log in yet.**
3. **Login attempt while pending:** the login endpoint must check status
   explicitly and return a clear, specific error — not a generic "invalid
   credentials." Exact response:
   `{ success:false, error:{ code:'ACCOUNT_PENDING', message:'Your officer account is awaiting admin approval. You will be notified once approved.' } }`
   The frontend shows this message plainly on the login page, not a dead
   end — tell them what's happening and that it's expected.
4. **Admin side:** a "Pending Officer Approvals" queue in the Admin
   dashboard lists every `role in [lmo,gatc], status:'pending'` user, with
   their submitted licenseNumber/jurisdiction visible for the admin to
   (manually, outside the system — this is a prototype, not integrated with
   a real license-verification registry) sanity-check. Admin clicks
   Approve or Reject (reject requires a reason, stored in
   `rejectionReason`).
5. **On approve:** `status:'approved'`, `approvedBy`, `approvedAt` set. An
   `audit_log` entry is written. The officer can now log in normally.
6. **On reject:** `status:'rejected'`, `rejectionReason` set. Login attempt
   returns `{ code:'ACCOUNT_REJECTED', message: rejectionReason }`. The
   officer is **not silently deleted** — the record and the reason persist
   for audit purposes.
7. **Suspension (post-approval misconduct):** Admin can later set
   `status:'suspended'` on an already-approved officer (e.g., after
   repeated confirmed fraud flags). Login returns
   `{ code:'ACCOUNT_SUSPENDED', message:'...' }`. This must also be logged.

### 2.5 JWT & session handling (all roles)
- On successful login: short-lived access JWT (15 min) containing
  `{ userId, role }` only — no PII in the token payload. Long-lived refresh
  token (7 days) in an httpOnly, secure cookie.
- Every protected route: `requireAuth` middleware verifies the access JWT,
  then `requireRole([...])` middleware checks the role claim against the
  route's allowed roles. **Both checks happen server-side on every request
  — the frontend route guard is UX only, never the real security boundary.**
- Access token expired mid-action (e.g., officer mid-inspection in the
  field with patchy connectivity) → frontend silently attempts refresh via
  the refresh cookie before showing any error; only shows a re-login prompt
  if refresh also fails. This matters specifically for the offline/field
  use case — do not force a re-login that loses in-progress inspection data.

---

## 3. FRONTEND — THEME & UX SPEC

### 3.1 Visual direction
**"Clean Google Material feel, not a government-grey form dump."** Specifics:
- **Palette:** a single confident primary (deep blue, e.g. `#1A56DB`),
  neutral grays for structure (`#F8F9FA` background, `#1F2937` text), and
  exactly three status colors used consistently everywhere: green = valid/
  pass, amber = pending/review, red = rejected/revoked. Never use color
  alone for status — always pair with a text label (accessibility, and
  matches the team's existing principle from the other project).
- **Typography:** one clean sans-serif (Inter or Google's own "Roboto" /
  "Google Sans"-style stack — free, Google-font-adjacent, fits the "Google
  theme" ask without using an actual Google trademark/font that requires
  attribution issues). Generous whitespace over dense tables.
- **Components:** rounded cards (8-12px radius), soft shadows, not hard
  borders everywhere. Buttons: filled for primary actions, outlined for
  secondary — standard Material pattern.

### 3.2 Information density — this is a specific, important instruction
**Never show everything at once.** Every dashboard is **section-wise,
progressive disclosure**, not one giant table:
- Landing view of any dashboard (Owner/Officer/Admin) = a small number of
  **summary cards** (e.g., "3 Pending Applications," "1 Certificate Expiring
  Soon") — glanceable, not a wall of data.
- Clicking a summary card expands into **that one section's detail list**,
  paginated, with filters — not all data pre-loaded and scrollable.
- Detail views (a single application, a single inspection, a single
  certificate) open in a focused panel/page showing only that record's
  information, not surrounded by unrelated data.
- This is both a UX decision and a performance one: it naturally forces
  paginated, on-demand API calls instead of "fetch everything and render,"
  which matters for the scalability requirement in Section 5 of the main
  handoff.

### 3.3 Role-specific home screens
- **Owner:** "My Instruments" cards → each shows current status badge; "+
  Register Instrument" prominent button; a slim "Applications" section below.
- **Officer:** "Assigned to me today" as the default, loudest section (field
  use, phone-first) — history/past inspections tucked in a secondary tab.
- **Admin:** top-level summary tiles (pending approvals count, pending
  fraud-flag count, overdue re-verifications count) — each tile is a
  doorway into that one section, never all three sections open together.

---

## 4. EXPANDED EDGE CASES — handle every one of these explicitly

| # | Scenario | Required behavior |
|---|---|---|
| E1 | Officer tries to submit inspection for an application not assigned to them | 403, reject — server checks `applicationId.assignedOfficerId === req.user.id` |
| E2 | Two admins approve the same pending officer at nearly the same time | Use a findOneAndUpdate with a status:'pending' filter as the update condition — second request finds no matching doc (already approved) and returns a clear "already processed" response, not a duplicate approval |
| E3 | Same serial number registered by two different owners | Allowed (compound unique index is per-owner, see 1.2) — but flag for admin visibility if it happens often; do not hard-block, since duplicate serials across different manufacturers/regions are realistic |
| E4 | Application assigned to an officer who is later suspended before inspecting | On suspension, any of that officer's `assigned`/`scheduled` applications are automatically reset to `submitted`/unassigned and re-enter the assignment queue — never left silently orphaned |
| E5 | Certificate reaches its expiry date | A scheduled check (cron/agenda job, not reliant on someone opening the record) flips `certificates.status` to `expired` and `instruments.status` to `expired` at expiry — do not rely on lazy "check on read," since a QR scan or dashboard view must show the correct state even if nobody touched the record at the exact expiry moment |
| E6 | Owner submits a re-verification application while a previous one is still `submitted`/`assigned` for the same instrument | Reject with a clear error — one instrument may have at most one open (non-terminal-status) application at a time |
| E7 | Officer's photo upload to Cloudinary fails mid-submit (bad connectivity) | Do not submit a partial inspection. Queue the whole inspection (photos included, stored as local blobs in IndexedDB) for retry; only call it "submitted" once photos have actually uploaded and URLs are confirmed. Never create an `inspections` document with missing required photo URLs |
| E8 | Two officers' devices both try to sync the same offline-queued inspection (rare, e.g. device cloned/app reinstalled with old queue) | `syncIdempotencyKey` unique index rejects the second insert; sync logic treats a duplicate-key error as "already synced, success" from the client's point of view, not a failure |
| E9 | QR token guessed/brute-forced | Token is 24 random bytes (192 bits) — not feasible to brute force; rate-limit the public `/verify/:token` endpoint regardless, to prevent enumeration attempts from being used for anything else (e.g. timing attacks) |
| E10 | Admin revokes a certificate, then owner immediately re-applies for verification | Allowed — a fresh `application` can be submitted; the revoked certificate record itself is untouched/locked, only `instruments.status` moves to reflect the new open application |
| E11 | GPS permission denied by officer's browser/device entirely (not just a bad fix) | Same as `gpsMissing:true` path — inspection proceeds but is flagged; this must not block the officer from completing field work, it must route to review instead |
| E12 | Fee calculation requested for an instrument type with no matching `fee_rules` row | Explicit error surfaced to the owner ("fee schedule not yet configured for this instrument type, contact support") — never silently charge ₹0 or guess a fee |
| E13 | Admin edits a `fraud_rules` parameter (e.g., changes F1 radius from 500m to 300m) | Must not retroactively re-flag already-decided past inspections — only applies to inspections submitted after the change (`effectiveFrom` on the new rule version) |

---

## 5. OPEN QUESTIONS — confirm before Phase 2, do not silently assume

1. **Does fee calculation belong in this prototype's scope at all?** The PS
   text doesn't explicitly ask for it. If time-constrained, it's safe to
   defer `fee_rules`/payment entirely and note it as a documented future
   scope item rather than build it half-correctly.
2. **Exact certificate validity period** (how many months/years before
   re-verification is due) — this is a real regulatory number that should
   come from the actual Legal Metrology Rules, not be invented. Verify
   before seeding `fee_rules`/`instruments` validity logic; if not verified
   in time, use a clearly-labeled placeholder and say so openly in
   `ASSUMPTIONS.md` and in the judge pitch.
3. **GATC vs LMO — do they have different permission scopes**, or are they
   functionally identical in this system (same actions, different
   organizational type)? Current spec treats them identically except for
   the `centreType` field. Confirm this is acceptable or needs to differ.

---

## 6. BACKEND ROBUSTNESS CHECKLIST (explicit, testable)

- [ ] Every mutating endpoint validates input with a schema before touching the DB
- [ ] Every list endpoint is paginated and its filter fields are indexed
- [ ] Every multi-document write that must be atomic uses a Mongo transaction (e.g. certificate issue + instrument status update)
- [ ] Every role-restricted route has server-side role enforcement, tested explicitly with a wrong-role token
- [ ] No endpoint returns `passwordHash` in any response, ever (explicit field-exclusion at the query/serialization level, not just "frontend doesn't show it")
- [ ] Rate limiting active on: login, register, public verify endpoint
- [ ] All timestamps stored in UTC, converted for display only
- [ ] Idempotency key enforced on offline-sync endpoint specifically (E8)
- [ ] Scheduled job (not lazy-check) handles certificate expiry (E5)
- [ ] `audit_log` writes cannot be bypassed — route through one shared service function, not ad-hoc inserts scattered across controllers

---

*This PRD removes the ambiguity flagged in the review of v1. Read alongside
the main handoff's phase plan — this file answers "exactly how," the main
handoff defines "in what order."*
