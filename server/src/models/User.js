"use strict";

const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");
const { ALL_ROLES, ROLES } = require("../constants");

/**
 * User — an authenticated principal (citizen, staff persona, or institution).
 * Passwords are stored only as bcrypt hashes. In a production deployment this
 * would federate to an OIDC identity provider (PRD security model); for the
 * prototype we issue our own JWTs after a local password check.
 */
const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ALL_ROLES, default: ROLES.CITIZEN, index: true },

    // Optional org label for institution / staff principals.
    orgName: String,
    // API consumers may hold a static key in addition to interactive login.
    apiKey: { type: String, index: true },

    active: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

UserSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, 10);
};

UserSchema.methods.verifyPassword = function verifyPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Never leak the hash when serializing.
UserSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    email: this.email,
    name: this.name,
    role: this.role,
    orgName: this.orgName,
    active: this.active,
  };
};

module.exports = model("User", UserSchema);
