"use strict";

const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireRole } = require("../middleware/auth");
const { ROLES } = require("../constants");
const { AuditLog } = require("../models");

const router = express.Router();

const AUDIT_ROLES = [ROLES.ADMIN, ROLES.NATIONAL_STEWARD];

/**
 * GET /v1/audit — the immutable audit trail (FR-10). Admin/steward only.
 * Filters: ?action= ?actorRole= ?targetId= ?limit=
 */
router.get(
  "/",
  requireRole(...AUDIT_ROLES),
  asyncHandler(async (req, res) => {
    const q = {};
    if (req.query.action) q.action = req.query.action;
    if (req.query.actorRole) q["actor.role"] = req.query.actorRole;
    if (req.query.targetId) q["target.id"] = req.query.targetId;

    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 1000);
    const entries = await AuditLog.find(q).sort({ at: -1 }).limit(limit).lean();
    res.json({ count: entries.length, entries });
  })
);

module.exports = router;
