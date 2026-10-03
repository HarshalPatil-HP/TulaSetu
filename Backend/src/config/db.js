'use strict';
/**
 * db.js — MongoDB Atlas connection
 *
 * Why: Centralises all connection logic and options in one place.
 * All Mongoose options are explicit to avoid deprecation warnings
 * and to make behaviour predictable across environments.
 */

import mongoose from 'mongoose';

/**
 * Connects to MongoDB Atlas using MONGODB_URI from the environment.
 * Throws on failure so the process exits instead of running without a DB.
 *
 * @returns {Promise<void>}
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Copy backend/.env.example to backend/.env and fill in your Atlas connection string.'
    );
  }

  try {
    await mongoose.connect(uri);
    console.log(`[DB] Connected to MongoDB Atlas — database: ${mongoose.connection.name}`);
  } catch (err) {
    // Re-throw with context so the startup log shows exactly what failed.
    throw new Error(`[DB] Failed to connect to MongoDB Atlas: ${err.message}`);
  }
}

// Graceful shutdown — close the connection when the process exits cleanly.
// This prevents "connection leaked" warnings in test environments.
mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB connection lost. Reconnecting automatically...');
});
