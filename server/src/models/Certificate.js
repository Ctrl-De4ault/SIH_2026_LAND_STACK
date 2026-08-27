"use strict";

const { Schema, model } = require("mongoose");

/**
 * Certificate — an issued, verifiable extract (FR-07). Each certificate freezes
 * a snapshot of the parcel at issue time and records an integrity hash so a
 * later /v1/verify lookup by recordId can confirm authenticity and detect
 * tampering. Mirrors the prototype's "LS-VER-XXXXXXXX" verify registry.
 */
const CertificateSchema = new Schema(
  {
    recordId: { type: String, required: true, unique: true, index: true },
    ulpin: { type: String, required: true, index: true },

    kind: {
      type: String,
      enum: ["ror_extract", "encumbrance", "ownership"],
      default: "ror_extract",
    },

    issuedAt: { type: Date, default: Date.now },
    issuedTo: String,
    issuedByRole: String,

    // Frozen copy of the record at issue time + its integrity hash.
    snapshot: { type: Schema.Types.Mixed, default: {} },
    hash: String,

    revoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model("Certificate", CertificateSchema);
