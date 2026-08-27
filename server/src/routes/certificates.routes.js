"use strict";

const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { audit } = require("../middleware/audit");
const { requireRole } = require("../middleware/auth");
const { certificateId, integrityHash } = require("../utils/ids");
const { ROLES } = require("../constants");
const { Certificate, Parcel } = require("../models");

const router = express.Router();

const ISSUE_ROLES = [ROLES.SUB_REGISTRAR, ROLES.PATWARI, ROLES.ADMIN, ROLES.NATIONAL_STEWARD];

function buildSnapshot(parcel, issuedAt) {
  return {
    ulpin: parcel.ulpin,
    ownerNames: (parcel.owners || []).map((o) => o.name).join(", "),
    landUse: parcel.landUse,
    sector: parcel.sector,
    area: parcel.area,
    encumbranceStatus: parcel.layers && parcel.layers.encumbrance ? parcel.layers.encumbrance.status : undefined,
    issuedAt,
  };
}

/**
 * POST /v1/certificates   { ulpin, kind, issuedTo }
 * Issue a verifiable certificate (FR-07). Freezes a parcel snapshot and stores
 * an integrity hash so it can later be verified/tamper-checked by record id.
 */
router.post(
  "/",
  requireRole(...ISSUE_ROLES),
  audit("certificate.issue", (req) => ({ type: "parcel", id: req.body && req.body.ulpin })),
  asyncHandler(async (req, res) => {
    const { ulpin, kind, issuedTo } = req.body || {};
    if (!ulpin) throw ApiError.badRequest("ulpin is required");

    const parcel = await Parcel.findOne({ ulpin }).lean();
    if (!parcel) throw ApiError.notFound(`No parcel with ULPIN ${ulpin}`);

    const issuedAt = new Date().toISOString();
    const snapshot = buildSnapshot(parcel, issuedAt);
    const cert = await Certificate.create({
      recordId: certificateId(ulpin, issuedAt),
      ulpin,
      kind: kind || "ror_extract",
      issuedAt,
      issuedTo: issuedTo || snapshot.ownerNames,
      issuedByRole: req.user.role,
      snapshot,
      hash: integrityHash(snapshot),
    });

    res.status(201).json({
      recordId: cert.recordId,
      ulpin: cert.ulpin,
      kind: cert.kind,
      issuedAt: cert.issuedAt,
      issuedTo: cert.issuedTo,
      hash: cert.hash,
    });
  })
);

/**
 * GET /v1/certificates/:recordId/verify
 * Public verification (FR-07). Confirms authenticity and detects tampering by
 * recomputing the snapshot hash.
 */
router.get(
  "/:recordId/verify",
  audit("certificate.verify", (req) => ({ type: "certificate", id: req.params.recordId })),
  asyncHandler(async (req, res) => {
    const cert = await Certificate.findOne({ recordId: req.params.recordId }).lean();
    if (!cert) {
      return res.status(404).json({ recordId: req.params.recordId, found: false, valid: false });
    }
    const recomputed = integrityHash(cert.snapshot);
    const intact = recomputed === cert.hash;
    res.json({
      recordId: cert.recordId,
      found: true,
      valid: intact && !cert.revoked,
      revoked: cert.revoked,
      tamperEvident: !intact,
      ulpin: cert.ulpin,
      kind: cert.kind,
      issuedAt: cert.issuedAt,
      issuedTo: cert.issuedTo,
      snapshot: cert.snapshot,
    });
  })
);

/** GET /v1/certificates/:recordId — fetch a certificate. */
router.get(
  "/:recordId",
  asyncHandler(async (req, res) => {
    const cert = await Certificate.findOne({ recordId: req.params.recordId }).lean();
    if (!cert) throw ApiError.notFound("Unknown certificate");
    res.json(cert);
  })
);

/** GET /v1/certificates?ulpin= — list certificates for a parcel (staff). */
router.get(
  "/",
  requireRole(...ISSUE_ROLES),
  asyncHandler(async (req, res) => {
    const q = {};
    if (req.query.ulpin) q.ulpin = req.query.ulpin;
    const list = await Certificate.find(q).sort({ createdAt: -1 }).lean();
    res.json({ count: list.length, certificates: list });
  })
);

module.exports = router;
