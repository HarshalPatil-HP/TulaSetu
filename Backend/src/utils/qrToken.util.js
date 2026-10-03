'use strict';
/**
 * qrToken.util.js — Cryptographically random QR verification token generator
 *
 * Why: Certificate QR tokens must be:
 * 1. Unique across all certificates (enforced by a DB unique index on certificates.qrToken)
 * 2. Unguessable — NOT an incrementing ID, NOT derived from the instrumentId or certificateId
 * 3. Long enough to resist brute-force enumeration
 *
 * 24 random bytes = 192 bits of entropy. At the public `/verify/:token` endpoint
 * (which is rate-limited per Section 4.2 of the handoff), even a fast attacker
 * cannot enumerate a 192-bit space within any realistic timeframe.
 *
 * See Edge Case E9 in the PRD: the endpoint must also be rate-limited regardless,
 * to prevent timing attacks or any enumeration attempt.
 */

import crypto from 'crypto';

/**
 * Generates a cryptographically random QR verification token.
 * @returns {string} 48-character hex string (24 random bytes)
 */
export function generateQrToken() {
  return crypto.randomBytes(24).toString('hex');
}
