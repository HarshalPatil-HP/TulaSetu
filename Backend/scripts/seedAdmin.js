'use strict';
/**
 * scripts/seedAdmin.js — Idempotent admin account creator
 *
 * Run once at deployment setup: node scripts/seedAdmin.js
 *
 * Reads ADMIN_EMAIL and ADMIN_PASSWORD from environment variables.
 * Creates exactly one admin user. Running this script twice is safe —
 * it detects an existing admin and exits without creating a duplicate.
 *
 * Why a script and not auto-create on first startup?
 * A first-startup auto-create would require hardcoding credentials
 * or leaving a wide-open admin creation window. A manual seed script
 * that reads from .env gives the operator explicit control.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../src/config/db.js';

// ── Inline minimal user schema for the seed script ──────────────────────────
// We do not import the full User model to avoid pulling in the entire model
// chain before it exists in Phase 0. This seed script defines only what it needs.
// In Phase 1, the User model will be the canonical definition.
const UserSchema = new mongoose.Schema({
  role: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  passwordHash: { type: String, required: true },
  status: { type: String, default: 'approved' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'System Administrator';
  const adminPhone = process.env.ADMIN_PHONE || '0000000000';

  // ── Validate required environment variables ──────────────────────────────
  if (!adminEmail || !adminPassword) {
    console.error(
      '[SEED] ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set in your .env file.'
    );
    console.error('[SEED] Copy backend/.env.example to backend/.env and fill in the admin fields.');
    process.exit(1);
  }

  if (adminPassword.length < 8) {
    console.error('[SEED] ERROR: ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  try {
    await connectDB();

    // Use the model if it exists already (Phase 1+), or register a temp one
    let User;
    try {
      User = mongoose.model('User');
    } catch {
      User = mongoose.model('User', UserSchema);
    }

    // ── Idempotency check: does an admin already exist? ──────────────────────
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log(
        `[SEED] An admin account already exists (${existingAdmin.email}). No changes made.`
      );
      console.log('[SEED] If you need to reset the admin password, update it directly in Atlas.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // ── Create the admin account ──────────────────────────────────────────────
    const BCRYPT_SALT_ROUNDS = 12; // 12 rounds: ~300ms per hash, strong enough for a government system
    const passwordHash = await bcrypt.hash(adminPassword, BCRYPT_SALT_ROUNDS);

    await User.create({
      role: 'admin',
      name: adminName,
      email: adminEmail.toLowerCase().trim(),
      phone: adminPhone,
      passwordHash,
      status: 'approved',
    });

    console.log(`[SEED] ✅ Admin account created successfully.`);
    console.log(`[SEED]    Email: ${adminEmail.toLowerCase().trim()}`);
    console.log(`[SEED]    Role: admin | Status: approved`);
    console.log(`[SEED] Keep your admin credentials secure. Do not share them.`);
  } catch (err) {
    console.error('[SEED] ERROR:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
