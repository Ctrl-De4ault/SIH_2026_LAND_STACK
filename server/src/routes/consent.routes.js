"use strict";

const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { audit } = require("../middleware/audit");
const { requireRole } = require("../middleware/auth");
const { consentToken } = require("../utils/ids");
const { STAFF_ROLES } = require("../constants");
const { Consent, Parcel } = require("../models");

const router = express.Router();

function view(c) {
  return {
    token: c.token,
    ulpin: c.ulpin,
    scope: c.scope,
    purpose: c.purpose,
    grantedBy: c.grantedBy,
    grantedTo: c.grantedTo,
    expiresAt: c.expiresAt,
    revoked: c.revoked,
    valid: !c.revoked && new Date(c.expiresAt).getTime() > Date.now(),
  };
}

/**
 * POST /v1/consent   { ulpin, grantedTo, scope[], purpose, ttlDays }
 * Issue a scoped, time-boxed consent token (M5 / FR-12). The token unlocks the
 * listed layers on the consent-gated parcel read for its lifetime.
 */
router.post(
  "/",
  audit("consent.issue", (req) => ({ type: "parcel", id: req.body && req.body.ulpin })),
  asyncHandler(async (req, res) => {
    const { ulpin, grantedTo, scope, purpose, ttlDays } = req.body || {};
    if (!ulpin || !grantedTo) throw ApiError.badRequest("ulpin and grantedTo are required");

    const parcel = await Parcel.findOne({ ulpin }, "ulpin owners").lean();
    if (!parcel) throw ApiError.notFound(`No parcel with ULPIN ${ulpin}`);

    const days = Number(ttlDays) > 0 ? Number(ttlDays) : 30;
    const consent = await Consent.create({
      token: consentToken(),
      ulpin,
      grantedBy:
        (req.user && req.user.name) ||
        (req.body && req.body.grantedBy) ||
        (parcel.owners[0] && parcel.owners[0].name) ||
        "Owner",
      grantedByUser: req.user ? req.user.id : undefined,
      grantedTo,
      scope: Array.isArray(scope) && scope.length ? scope : ["ror"],
      purpose: purpose || "Verification",
      expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    });

    res.status(201).json(view(consent));
  })
);

/** GET /v1/consent — active/known consents (staff oversight). ?ulpin= filters. */
router.get(
  "/",
  requireRole(...STAFF_ROLES),
  asyncHandler(async (req, res) => {
    const q = {};
    if (req.query.ulpin) q.ulpin = req.query.ulpin;
    const list = await Consent.find(q).sort({ createdAt: -1 }).lean();
    res.json({ count: list.length, consents: list.map(view) });
  })
);

/** GET /v1/consent/:token — inspect a token's status. */
router.get(
  "/:token",
  asyncHandler(async (req, res) => {
    const c = await Consent.findOne({ token: req.params.token });
    if (!c) throw ApiError.notFound("Unknown consent token");
    res.json(view(c));
  })
);

/** POST /v1/consent/:token/revoke — revoke a consent token. */
router.post(
  "/:token/revoke",
  audit("consent.revoke", (req) => ({ type: "consent", id: req.params.token })),
  asyncHandler(async (req, res) => {
    const c = await Consent.findOne({ token: req.params.token });
    if (!c) throw ApiError.notFound("Unknown consent token");
    c.revoked = true;
    c.revokedAt = new Date();
    await c.save();
    res.json(view(c));
  })
);

module.exports = router;
