# VerifyChain

**SIH 2026 · Problem Statement SIH26036 · Team _Build2Solve**

Online verification system for weighing and measuring instruments under the Legal Metrology Act 2009.

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- MongoDB Atlas M0 cluster (free)
- Cloudinary account (free)

### 1. Clone and configure

```bash
git clone <repo-url>
cd TulaSetu
```

**Backend setup:**
```bash
cd backend
cp .env.example .env
# Edit .env — fill in MONGODB_URI, Cloudinary keys, JWT secrets, Admin email/password
npm install
```

**Frontend setup:**
```bash
cd ../frontend
cp .env.example .env
# Edit .env — set VITE_API_BASE_URL if your backend runs on a different port
npm install
```

### 2. Seed the admin account (run once)

```bash
cd backend
node scripts/seedAdmin.js
```

This creates a single admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`.
Running it twice is safe — it is idempotent.

### 3. Run in development

Terminal 1 (backend):
```bash
cd backend
npm run dev
# Express server on http://localhost:5000
# Health check: GET http://localhost:5000/api/v1/health
```

Terminal 2 (frontend):
```bash
cd frontend
npm run dev
# Vite dev server on http://localhost:5173
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS v3 (Vite, PWA) |
| Backend | Node.js + Express |
| Database | MongoDB Atlas M0 (free) |
| Auth | JWT (access 15m) + httpOnly refresh cookie (7d) |
| File storage | Cloudinary free tier (photos + PDFs) |
| Offline | IndexedDB via Dexie |
| QR | `qrcode` npm package |
| PDF | `pdfkit` npm package |

---

## Project Structure

```
TulaSetu/
├── backend/          # Express REST API
├── frontend/         # React PWA
├── docs/             # DB design, assumptions
├── reports/          # Phase completion reports
├── scripts/          # One-time setup scripts (seedAdmin.js)
├── PROJECT_PROGRESS.md
└── README.md
```

---

## Phase Progress

See [PROJECT_PROGRESS.md](./PROJECT_PROGRESS.md) for the current build status.

---

## This is not an ML project

All fraud detection (F1–F6 rules) is deterministic rule-based logic with configurable thresholds stored in the database.
Officer auto-assignment is a sorted distance query. Pass-rate anomaly is basic statistics (mean + 2σ).
No trained model is used or claimed.
