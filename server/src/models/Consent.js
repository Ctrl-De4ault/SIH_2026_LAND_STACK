"use strict";

const { Schema, model } = require("mongoose");

/**
 * Consent — an owner-granted, scoped, time-boxed authorization that lets a
 * third party (bank, utility, planner) read otherwise-protected layers of a
 * parcel (FR-12 / M5). Presenting a valid, unexpired, unrevoked token unlocks
 * the layers listed in `scope` on the consent-gated parcel read.
 */
const ConsentSchema = new Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    ulpin: { type: String, required: true, index: true },

    grantedBy: String, // owner name / principal that authorized sharing
    grantedByUser: { type: Schema.Types.ObjectId, ref: "User" },
    grantedTo: String, // consuming institution / purpose holder

    scope: { type: [String], default: [] }, // e.g. ["ror","encumbrance","tax"]
    purpose: String, // e.g. "home loan verification"

    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
    revokedAt: Date,
  },
  { timestamps: true }
);

ConsentSchema.methods.isValid = function isValid() {
  return !this.revoked && this.expiresAt.getTime() > Date.now();
};

module.exports = model("Consent", ConsentSchema);
