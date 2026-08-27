"use strict";

const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { sign } = require("../utils/jwt");
const { requireAuth } = require("../middleware/auth");
const { audit } = require("../middleware/audit");
const { User } = require("../models");
const { DEMO_PASSWORD } = require("../seed/seedData");

const router = express.Router();

/**
 * POST /v1/auth/login  { email, password } → { token, user }
 * In production this step would be delegated to an OIDC provider; the prototype
 * performs a local bcrypt check and issues its own JWT.
 */
router.post(
  "/login",
  audit("auth.login", (req) => ({ type: "user", id: req.body && req.body.email })),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      throw ApiError.badRequest("email and password are required");
    }
    const user = await User.findOne({ email: String(email).toLowerCase(), active: true });
    if (!user || !(await user.verifyPassword(password))) {
      throw ApiError.unauthorized("Invalid credentials");
    }
    user.lastLoginAt = new Date();
    await user.save();

    res.json({ token: sign(user), user: user.toSafeJSON() });
  })
);

/** GET /v1/auth/me → the current principal (requires a valid token). */
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) throw ApiError.unauthorized();
    res.json({ user: user.toSafeJSON() });
  })
);

/**
 * GET /v1/auth/demo-users → the seeded demo accounts and the shared demo
 * password, so the login screen can offer one-click sign-in for each persona.
 * DEMO ONLY — a real deployment would never expose credentials like this.
 */
router.get(
  "/demo-users",
  asyncHandler(async (req, res) => {
    const users = await User.find({}, "email name role orgName").sort({ role: 1 }).lean();
    res.json({
      password: DEMO_PASSWORD,
      note: "Demonstration accounts with fictional data. Do not use in production.",
      users: users.map((u) => ({
        email: u.email,
        name: u.name,
        role: u.role,
        orgName: u.orgName,
      })),
    });
  })
);

module.exports = router;
