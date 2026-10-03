'use strict';
/**
 * health.route.js — System health check endpoint
 *
 * GET /api/v1/health
 *
 * Returns the server and database status. Unauthenticated — used by:
 * - Frontend to confirm API is reachable before making auth calls
 * - Deployment platform (Render) as the health check URL
 * - Phase 0 verification to confirm MongoDB is connected
 *
 * Does NOT expose any sensitive information (no DB details, no env vars).
 */

import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;

  // Mongoose readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbStatus = dbStatusMap[dbState] || 'unknown';
  const isHealthy = dbState === 1;

  return res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    data: {
      service: 'VerifyChain API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      database: dbStatus,
    },
  });
});

export default router;
