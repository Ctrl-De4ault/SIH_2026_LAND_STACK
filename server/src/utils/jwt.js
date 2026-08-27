"use strict";

const jwt = require("jsonwebtoken");
const config = require("../config");

/** Sign a short-lived access token for a user. */
function sign(user) {
  const payload = {
    sub: String(user.id || user._id),
    role: user.role,
    email: user.email,
    name: user.name,
  };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiry });
}

/** Verify and decode a token (throws on invalid/expired). */
function verify(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = { sign, verify };
