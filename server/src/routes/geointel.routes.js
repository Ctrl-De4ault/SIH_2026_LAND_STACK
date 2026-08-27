"use strict";

const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { audit } = require("../middleware/audit");
const { requireRole } = require("../middleware/auth");
const { STAFF_ROLES } = require("../constants");
const { GeoIntel, Parcel, ServiceRequest, Certificate, Consent } = require("../models");
const { computeDisputeRisk, computeChangeDetection } = require("../utils/geoIntel");

const router = express.Router();

/**
 * GET /v1/geo-intel — geo-intelligence flags (M9). Staff only.
 * Filters: ?ulpin= ?kind= ?status= ?severity=
 */
router.get(
  "/",
  requireRole(...STAFF_ROLES),
  asyncHandler(async (req, res) => {
    const q = {};
    for (const key of ["ulpin", "kind", "status", "severity"]) {
      if (req.query[key]) q[key] = req.query[key];
    }
    const flags = await GeoIntel.find(q).sort({ detectedAt: -1 }).lean();
    res.json({ count: flags.length, flags });
  })
);

/** GET /v1/geo-intel/dashboard — aggregate KPIs for the admin console. Staff only. */
router.get(
  "/dashboard",
  requireRole(...STAFF_ROLES),
  asyncHandler(async (req, res) => {
    const toMap = (arr) => arr.reduce((acc, x) => ((acc[x._id == null ? "unknown" : x._id] = x.n), acc), {});

    const [
      parcelTotal,
      byDisputeRisk,
      byLandUse,
      byParcelStatus,
      taxAgg,
      geoByKind,
      geoBySeverity,
      geoOpen,
      srByStatus,
      certTotal,
      consentActive,
    ] = await Promise.all([
      Parcel.estimatedDocumentCount(),
      Parcel.aggregate([{ $group: { _id: "$disputeRisk", n: { $sum: 1 } } }]),
      Parcel.aggregate([{ $group: { _id: "$landUse", n: { $sum: 1 } } }]),
      Parcel.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
      Parcel.aggregate([
        { $match: { "layers.tax.status": "due" } },
        { $group: { _id: null, due: { $sum: "$layers.tax.due" }, n: { $sum: 1 } } },
      ]),
      GeoIntel.aggregate([{ $group: { _id: "$kind", n: { $sum: 1 } } }]),
      GeoIntel.aggregate([{ $group: { _id: "$severity", n: { $sum: 1 } } }]),
      GeoIntel.countDocuments({ status: "open" }),
      ServiceRequest.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
      Certificate.estimatedDocumentCount(),
      Consent.countDocuments({ revoked: false, expiresAt: { $gt: new Date() } }),
    ]);

    res.json({
      generatedAt: new Date().toISOString(),
      parcels: {
        total: parcelTotal,
        byDisputeRisk: toMap(byDisputeRisk),
        byLandUse: toMap(byLandUse),
        byStatus: toMap(byParcelStatus),
      },
      tax: {
        arrearsParcels: taxAgg[0] ? taxAgg[0].n : 0,
        arrearsTotal: taxAgg[0] ? taxAgg[0].due : 0,
        currency: "INR",
      },
      geoIntel: {
        byKind: toMap(geoByKind),
        bySeverity: toMap(geoBySeverity),
        open: geoOpen,
      },
      serviceRequests: { byStatus: toMap(srByStatus) },
      certificates: { total: certTotal },
      consents: { active: consentActive },
    });
  })
);

/** GET /v1/geo-intel/parcel/:ulpin — all flags for one parcel. Staff only. */
router.get(
  "/parcel/:ulpin",
  requireRole(...STAFF_ROLES),
  asyncHandler(async (req, res) => {
    const flags = await GeoIntel.find({ ulpin: req.params.ulpin }).sort({ detectedAt: -1 }).lean();
    res.json({ ulpin: req.params.ulpin, count: flags.length, flags });
  })
);

/**
 * POST /v1/geo-intel/dispute-risk/:ulpin — score a parcel's dispute risk (FR-14).
 * Transparent, factor-by-factor. Persists/updates an open dispute_risk flag.
 */
router.post(
  "/dispute-risk/:ulpin",
  requireRole(...STAFF_ROLES),
  audit("geo_intel.dispute_risk", (req) => ({ type: "parcel", id: req.params.ulpin })),
  asyncHandler(async (req, res) => {
    const parcel = await Parcel.findOne({ ulpin: req.params.ulpin }).lean();
    if (!parcel) throw ApiError.notFound(`No parcel with ULPIN ${req.params.ulpin}`);

    const { score, severity, factors } = computeDisputeRisk(parcel);
    const summary =
      factors.length === 0
        ? "No dispute indicators detected."
        : `Dispute risk ${severity} (${score}). ${factors.map((f) => f.reason).join("; ")}.`;

    const flag = await GeoIntel.findOneAndUpdate(
      { ulpin: parcel.ulpin, kind: "dispute_risk", status: "open" },
      {
        $set: {
          score,
          severity,
          summary,
          detectedAt: new Date(),
          evidence: { factors },
        },
        $setOnInsert: { ulpin: parcel.ulpin, kind: "dispute_risk", status: "open" },
      },
      { new: true, upsert: true }
    ).lean();

    res.json({ ulpin: parcel.ulpin, score, severity, factors, flagId: flag._id });
  })
);

/**
 * POST /v1/geo-intel/scan/change-detection — mock imagery-diff scan (FR-13).
 * Deterministic per ULPIN; raises change_detection flags where the built-up
 * delta exceeds threshold. Idempotent (upserts open flags). Staff only.
 */
router.post(
  "/scan/change-detection",
  requireRole(...STAFF_ROLES),
  audit("geo_intel.change_scan", () => ({ type: "system", id: "change-detection" })),
  asyncHandler(async (req, res) => {
    const parcels = await Parcel.find({}, "ulpin").lean();
    let raised = 0;
    const flagged = [];

    for (const p of parcels) {
      const cd = computeChangeDetection(p);
      if (!cd.flagged) continue;
      raised += 1;
      flagged.push({ ulpin: p.ulpin, deltaPct: cd.deltaPct, severity: cd.severity });
      await GeoIntel.findOneAndUpdate(
        { ulpin: p.ulpin, kind: "change_detection", status: "open" },
        {
          $set: {
            score: Math.min(1, cd.deltaPct / 13),
            severity: cd.severity,
            summary: cd.summary,
            detectedAt: new Date(),
            evidence: { deltaPct: cd.deltaPct },
          },
          $setOnInsert: { ulpin: p.ulpin, kind: "change_detection", status: "open" },
        },
        { upsert: true }
      );
    }

    res.json({ scanned: parcels.length, flagged: raised, results: flagged });
  })
);

/** POST /v1/geo-intel/:id/status   { status } — triage a flag. Staff only. */
router.post(
  "/:id/status",
  requireRole(...STAFF_ROLES),
  audit("geo_intel.status", (req) => ({ type: "geo_intel", id: req.params.id })),
  asyncHandler(async (req, res) => {
    const { status } = req.body || {};
    const allowed = ["open", "reviewing", "dismissed", "confirmed"];
    if (!allowed.includes(status)) {
      throw ApiError.badRequest(`status must be one of: ${allowed.join(", ")}`);
    }
    const flag = await GeoIntel.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    ).lean();
    if (!flag) throw ApiError.notFound("Unknown flag id");
    res.json({ id: flag._id, kind: flag.kind, status: flag.status });
  })
);

module.exports = router;
