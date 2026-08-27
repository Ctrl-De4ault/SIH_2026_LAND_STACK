"use strict";

const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { requireRole } = require("../middleware/auth");
const { audit } = require("../middleware/audit");
const { validate, mint } = require("../utils/ulpin");
const { ROLES } = require("../constants");
const { Parcel } = require("../models");

const router = express.Router();

const MINT_ROLES = [ROLES.PATWARI, ROLES.SUB_REGISTRAR, ROLES.ADMIN, ROLES.NATIONAL_STEWARD];

/**
 * GET /v1/ulpin/:ulpin/validate
 * Offline format + check-block validation (no DB lookup) — FR-04.
 */
router.get("/:ulpin/validate", (req, res) => {
  res.json({ ulpin: req.params.ulpin, ...validate(req.params.ulpin) });
});

/**
 * GET /v1/ulpin/:ulpin/resolve
 * Resolve a ULPIN to a public parcel summary + existence + lineage.
 */
router.get(
  "/:ulpin/resolve",
  asyncHandler(async (req, res) => {
    const check = validate(req.params.ulpin);
    const p = await Parcel.findOne({ ulpin: req.params.ulpin }).lean();
    res.json({
      ulpin: req.params.ulpin,
      valid: check.valid,
      exists: Boolean(p),
      summary: p
        ? {
            sector: p.sector,
            state: p.state,
            landUse: p.landUse,
            area: p.area,
            status: p.status,
            disputeRisk: p.disputeRisk,
            ownerNames: (p.owners || []).map((o) => o.name).join(", "),
            centroid: p.centroid,
          }
        : null,
      lineage: p ? p.lineage : null,
    });
  })
);

/**
 * GET /v1/ulpin/:ulpin/lineage
 * Parent lineage + any child parcels (subdivision/amalgamation graph) — FR-04.
 */
router.get(
  "/:ulpin/lineage",
  asyncHandler(async (req, res) => {
    const p = await Parcel.findOne({ ulpin: req.params.ulpin }, "ulpin lineage").lean();
    if (!p) throw ApiError.notFound(`No parcel with ULPIN ${req.params.ulpin}`);
    const children = await Parcel.find(
      { "lineage.parents": req.params.ulpin },
      "ulpin lineage.event"
    ).lean();
    res.json({
      ulpin: p.ulpin,
      event: p.lineage ? p.lineage.event : "original",
      parents: p.lineage ? p.lineage.parents : [],
      children: children.map((c) => ({ ulpin: c.ulpin, event: c.lineage && c.lineage.event })),
    });
  })
);

/**
 * POST /v1/ulpin/mint   { village, parcel, stateCode?, district? }
 * Mint a new self-checking ULPIN (staff only) and confirm it is unused — FR-04.
 */
router.post(
  "/mint",
  requireRole(...MINT_ROLES),
  audit("ulpin.mint"),
  asyncHandler(async (req, res) => {
    const { village, parcel, stateCode, district } = req.body || {};
    if (village === undefined || parcel === undefined) {
      throw ApiError.badRequest("village and parcel are required");
    }
    const ulpin = mint({ village, parcel, stateCode, district });
    const existing = await Parcel.exists({ ulpin });
    res.status(201).json({
      ulpin,
      available: !existing,
      validation: validate(ulpin),
    });
  })
);

/**
 * POST /v1/ulpin/legacy-map   { value, type? }
 * Resolve a legacy identifier (e.g. a khasra number) to its ULPIN — FR-04,
 * the "old record → new identifier" bridge.
 */
router.post(
  "/legacy-map",
  audit("ulpin.legacy_map"),
  asyncHandler(async (req, res) => {
    const { value, type } = req.body || {};
    if (!value) throw ApiError.badRequest("value (legacy identifier) is required");
    const elem = type ? { type, value } : { value };
    const matches = await Parcel.find(
      { legacyIds: { $elemMatch: elem } },
      "ulpin sector legacyIds"
    ).lean();
    res.json({
      query: { value, type: type || null },
      count: matches.length,
      results: matches.map((m) => ({
        ulpin: m.ulpin,
        sector: m.sector,
        legacyIds: m.legacyIds,
      })),
    });
  })
);

module.exports = router;
