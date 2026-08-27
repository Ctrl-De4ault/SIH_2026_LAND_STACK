"use strict";

const { Schema, model } = require("mongoose");

/**
 * AuditLog — append-only record of every consequential action (FR-10).
 *
 * Immutability is enforced by rejecting updates: existing entries can never be
 * modified. (Deletes are left available so the dev database can be re-seeded;
 * in production the collection would be write-once storage.)
 */
const AuditLogSchema = new Schema(
  {
    at: { type: Date, default: Date.now, index: true },
    actor: {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      role: String,
      email: String,
    },
    action: { type: String, required: true, index: true }, // e.g. "parcel.read"
    target: {
      type: { type: String }, // "parcel" | "service_request" | "consent" | ...
      id: String, // ulpin / requestId / token ...
    },
    ip: String,
    userAgent: String,
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: false, minimize: false }
);

function blockMutation(next) {
  next(new Error("AuditLog entries are immutable and cannot be updated"));
}
AuditLogSchema.pre("updateOne", blockMutation);
AuditLogSchema.pre("updateMany", blockMutation);
AuditLogSchema.pre("findOneAndUpdate", blockMutation);
AuditLogSchema.pre("replaceOne", blockMutation);
AuditLogSchema.pre("save", function preSave(next) {
  if (!this.isNew) return blockMutation(next);
  next();
});

module.exports = model("AuditLog", AuditLogSchema);
