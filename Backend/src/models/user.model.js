'use strict';
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['owner', 'lmo', 'gatc', 'admin'],
      required: true,
    },
    name: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'suspended', 'rejected'],
      default: 'pending', // Overridden by controller logic (e.g., owner is approved immediately)
    },
    
    // ── Role-specific fields ──
    businessName: { type: String }, // owner
    address: { // owner
      line1: String,
      city: String,
      state: String,
      pincode: String,
    },
    
    licenseNumber: { type: String }, // lmo/gatc
    jurisdiction: { // lmo/gatc
      state: String,
      district: String,
    },
    centreType: { 
      type: String, 
      enum: ['LMO', 'GATC'] 
    }, // lmo/gatc
    
    // ── Admin approval fields ──
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        // Defense-in-depth: Never return the password hash in JSON responses
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

// Indexes
UserSchema.index({ role: 1, status: 1 });

const User = mongoose.model('User', UserSchema);
export default User;
