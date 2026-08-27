"use strict";

const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { requireRole } = require("../middleware/auth");
const { audit } = require("../middleware/audit");
const { applyProfile } = require("../utils/mappingEngine");
const { ROLES } = require("../constants");
const { MappingProfile } = require("../models");

const router = express.Router();

const INGEST_ROLES = [ROLES.ADMIN, ROLES.NATIONAL_STEWARD, ROLES.PATWARI, ROLES.SUB_REGISTRAR];

/** GET /v1/mapping — list schema-mapping profiles (M6). */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const profiles = await MappingProfile.find({}).lean();
    res.json({
      count: profiles.length,
      profiles: profiles.map((p) => ({
        key: p.key,
        sourceName: p.sourceName,
        sourceSystem: p.sourceSystem,
        description: p.description,
        fields: (p.fieldMap || []).length,
      })),
    });
  })
);

/** GET /v1/mapping/:key — a full mapping profile (fieldMap + samples). */
router.get(
  "/:key",
  asyncHandler(async (req, res) => {
    const profile = await MappingProfile.findOne({ key: req.params.key }).lean();
    if (!profile) throw ApiError.notFound(`No mapping profile '${req.params.key}'`);
    res.json(profile);
  })
);

/**
 * POST /v1/mapping/:key/apply   { record }
 * Transform a legacy source record into a canonical parcel fragment using the
 * profile's fieldMap (FR-06). Returns the output plus a per-field trace so the
 * mapping is auditable/explainable. Restricted to ingest-capable roles.
 */
router.post(
  "/:key/apply",
  requireRole(...INGEST_ROLES),
  audit("mapping.apply", (req) => ({ type: "mapping_profile", id: req.params.key })),
  asyncHandler(async (req, res) => {
    const profile = await MappingProfile.findOne({ key: req.params.key }).lean();
    if (!profile) throw ApiError.notFound(`No mapping profile '${req.params.key}'`);

    const record = (req.body && req.body.record) || profile.sampleIn;
    if (!record || typeof record !== "object") {
      throw ApiError.badRequest("Provide a legacy 'record' object to transform");
    }

    const { output, trace } = applyProfile(profile, record);
    res.json({ profile: profile.key, input: record, output, trace });
  })
);

module.exports = router;
