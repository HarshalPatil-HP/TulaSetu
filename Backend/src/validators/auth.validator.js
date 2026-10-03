'use strict';
import { z } from 'zod';

// Base schema for common fields
const baseRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Owner registration schema
const ownerRegisterSchema = baseRegisterSchema.extend({
  role: z.literal('owner'),
  businessName: z.string().min(1, 'Business name is required'),
  address: z.object({
    line1: z.string().min(1, 'Address line 1 is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  }),
});

// Officer (LMO/GATC) registration schema
const officerRegisterSchema = baseRegisterSchema.extend({
  role: z.enum(['lmo', 'gatc']),
  licenseNumber: z.string().min(1, 'License/Notification ID is required'),
  jurisdiction: z.object({
    state: z.string().min(1, 'Jurisdiction state is required'),
    district: z.string().min(1, 'Jurisdiction district is required'),
  }),
  centreType: z.enum(['LMO', 'GATC']),
});

// Combined registration schema
export const registerSchema = z.discriminatedUnion('role', [
  ownerRegisterSchema,
  officerRegisterSchema,
]);

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});
