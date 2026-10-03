'use strict';
/**
 * apiResponse.util.js — Consistent API response shaper
 *
 * Why: Every endpoint must return the same envelope shape so the frontend
 * can reliably destructure { success, data, error } without per-route
 * special-casing. Centralising this also means a format change only
 * requires touching one file.
 */

/**
 * Sends a successful response.
 * @param {import('express').Response} res
 * @param {*} data - The payload to include under the `data` key.
 * @param {number} [statusCode=200]
 */
export function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Sends an error response.
 * @param {import('express').Response} res
 * @param {string} message - Human-readable message shown to the client.
 * @param {number} [statusCode=500]
 * @param {string} [code] - Machine-readable error code for the frontend (e.g. 'ACCOUNT_PENDING').
 */
export function sendError(res, message, statusCode = 500, code = undefined) {
  const error = { message };
  if (code) {
    error.code = code;
  }
  return res.status(statusCode).json({
    success: false,
    error,
  });
}

/**
 * Sends a paginated list response.
 * @param {import('express').Response} res
 * @param {Array} items
 * @param {number} total - Total count of matching documents (for pagination UI).
 * @param {number} page - Current page number (1-indexed).
 * @param {number} limit - Items per page.
 */
export function sendPaginated(res, items, total, page, limit) {
  return res.status(200).json({
    success: true,
    data: {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  });
}
