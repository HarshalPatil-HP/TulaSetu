'use strict';
import { sendError } from '../utils/apiResponse.util.js';

/**
 * Validates request body against a Zod schema.
 * Sends a 400 response with detailed errors if validation fails.
 */
export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    // Transform Zod errors into a readable format
    const errorMessages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return sendError(res, `Validation failed: ${errorMessages}`, 400, 'VALIDATION_ERROR');
  }
};
