'use strict';
/**
 * hashEvidence.util.js — SHA-256 evidence bundle integrity hash
 *
 * Why: The Evidence-Locked Inspection Record (Section 3.1 of the handoff)
 * requires that each inspection record include a hash of its critical fields
 * at the time of creation. This hash lets anyone later verify that the
 * evidence bundle has not been altered after the fact.
 *
 * The hash is computed SERVER-SIDE from the fields as they are stored —
 * the client never sends a hash (it would have no value if the client
 * could forge it).
 *
 * What goes into the hash:
 * - gps coordinates (or the string 'MISSING' if gpsMissing=true)
 * - photo URLs (sorted, to be order-independent)
 * - readings (declaredValue, measuredValue, unit, withinTolerance)
 * - result (pass/fail)
 * - submittedAt (ISO string, UTC)
 *
 * If any of these change after creation, the hash will no longer match —
 * this is the tamper-evidence property.
 */

import crypto from 'crypto';

/**
 * Computes a deterministic SHA-256 hash of the inspection evidence bundle.
 *
 * @param {object} params
 * @param {object|null} params.gps - GeoJSON Point or null
 * @param {boolean} params.gpsMissing
 * @param {string[]} params.photos - Cloudinary URLs
 * @param {object} params.readings - { declaredValue, measuredValue, unit, withinTolerance }
 * @param {string} params.result - 'pass' or 'fail'
 * @param {Date|string} params.submittedAt
 * @returns {string} Hex-encoded SHA-256 hash
 */
export function computeEvidenceHash({ gps, gpsMissing, photos, readings, result, submittedAt }) {
  // Normalise GPS to a consistent string representation.
  // We deliberately do NOT hash the full GeoJSON object structure —
  // we hash the coordinates directly so minor field ordering in the object
  // doesn't produce a different hash.
  const gpsString = gpsMissing
    ? 'GPS_MISSING'
    : `${gps.coordinates[0]},${gps.coordinates[1]}`;

  // Sort photos so that array order doesn't affect the hash.
  // Two inspections with the same photos in different order should produce
  // the same hash — the content is what matters, not the upload order.
  const sortedPhotos = [...photos].sort().join('|');

  const readingsString = JSON.stringify({
    declaredValue: readings.declaredValue,
    measuredValue: readings.measuredValue,
    unit: readings.unit,
    withinTolerance: readings.withinTolerance,
  });

  // The timestamp is stored as ISO 8601 UTC to ensure the hash is
  // reproducible across timezones and serialization formats.
  const submittedAtStr =
    submittedAt instanceof Date ? submittedAt.toISOString() : new Date(submittedAt).toISOString();

  // Concatenate all fields with a pipe separator that cannot appear
  // in any of the individual values (Cloudinary URLs use /, not |).
  const bundle = [gpsString, sortedPhotos, readingsString, result, submittedAtStr].join('||');

  return crypto.createHash('sha256').update(bundle, 'utf8').digest('hex');
}
