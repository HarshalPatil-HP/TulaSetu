/**
 * tests/setup.js — Jest global setup for backend tests
 *
 * Loads environment variables from .env before any test runs.
 * Uses a test-specific DB URI if TEST_MONGODB_URI is set (recommended
 * to avoid running tests against the real Atlas cluster).
 */

// Jest runs this before tests — we use dynamic import since the module is ESM.
// dotenv/config is loaded here so all tests have access to env vars.
import 'dotenv/config';

// Silence console output during tests unless TEST_VERBOSE=true is set.
if (process.env.TEST_VERBOSE !== 'true') {
  global.console = {
    ...console,
    log: () => {},
    info: () => {},
    warn: () => {},
    // Keep error visible — tests should not silently fail
    error: console.error,
  };
}
