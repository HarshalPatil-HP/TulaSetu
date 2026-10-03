'use strict';
/**
 * server.js — Express application entry point
 *
 * Responsibilities:
 * 1. Load environment variables (must be first).
 * 2. Connect to MongoDB Atlas (exits process on failure — a server without a DB is useless).
 * 3. Mount all routes under /api/v1.
 * 4. Apply security middleware (helmet, cors, rate limiting).
 * 5. Register a global error handler for unhandled errors.
 * 6. Start the HTTP server.
 *
 * What this file does NOT do:
 * - Define any business logic (that lives in controllers/services).
 * - Hardcode any configuration (all from process.env).
 */

import 'dotenv/config'; // Must be first — loads .env before any other import reads process.env

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import { connectDB } from './src/config/db.js';
import { sendError } from './src/utils/apiResponse.util.js';

// ── Route imports (added as each phase builds them) ─────────────────────────
import healthRouter from './src/routes/health.route.js';
// Phase 1+:
// import authRouter from './src/routes/auth.route.js';
// import userRouter from './src/routes/user.route.js';
// Phase 2+:
// import instrumentRouter from './src/routes/instrument.route.js';
// import applicationRouter from './src/routes/application.route.js';
// Phase 3+:
// import inspectionRouter from './src/routes/inspection.route.js';
// Phase 4+:
// import certificateRouter from './src/routes/certificate.route.js';
// import fraudRuleRouter from './src/routes/fraudRule.route.js';
// Phase 5+:
// import adminRouter from './src/routes/admin.route.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
// Restrict to known frontend origin in production; open in development.
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman in dev)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true, // Required for httpOnly refresh cookie to be sent
  })
);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' })); // Inspection JSON payloads are small; limit protects against payload bombs
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Request logging (dev only — never log request bodies in production to avoid PII leaks) ──
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1', healthRouter);
// Phase 1+:
// app.use('/api/v1/auth', authRouter);
// app.use('/api/v1/users', userRouter);
// Phase 2+:
// app.use('/api/v1/instruments', instrumentRouter);
// app.use('/api/v1/applications', applicationRouter);
// Phase 3+:
// app.use('/api/v1/inspections', inspectionRouter);
// Phase 4+:
// app.use('/api/v1/certificates', certificateRouter);
// app.use('/api/v1/fraud-rules', fraudRuleRouter);
// Phase 5+:
// app.use('/api/v1/admin', adminRouter);

// ── 404 handler — catches routes that don't exist ───────────────────────────
app.use((_req, res) => {
  sendError(res, 'Route not found', 404, 'NOT_FOUND');
});

// ── Global error handler ─────────────────────────────────────────────────────
// Express calls this when next(err) is called or an async route throws.
// We intentionally do NOT leak stack traces to the client in production.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const isDev = process.env.NODE_ENV !== 'production';

  // Log the full error server-side so it's visible in logs
  console.error('[ERROR]', err.message);
  if (isDev) {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = isDev ? err.message : 'An unexpected error occurred';

  sendError(res, message, statusCode, err.code);
});

// ── Startup ──────────────────────────────────────────────────────────────────
async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`[SERVER] VerifyChain API running on port ${PORT} (${process.env.NODE_ENV})`);
      console.log(`[SERVER] Health check: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (err) {
    // DB connection failure is fatal — the server must not run without a database.
    console.error('[FATAL]', err.message);
    process.exit(1);
  }
}

startServer();

export default app; // exported for supertest in integration tests
