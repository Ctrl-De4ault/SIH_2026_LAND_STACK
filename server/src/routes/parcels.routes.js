"use strict";

const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { audit } = require("../middleware/audit");
const { attachConsent } = require("../middleware/consent");
const {
  toFeature,
  toFeatureCollection,
  projectParcel,
  canSeeLayer,
  LAYER_ACCESS,
} = require("../utils/parcelView");
const { Parcel } = require("../models");

const router = express.Router();

const MAX_LIMIT = 1000;

function parseBbox(str) {
  const nums = String(str).split(",").map(Number);
  if (nums.length !== 4 || nums.some((n) => Number.isNaN(n))) return null;
  const [minLng, minLat, maxLng, maxLat] = nums;
  return {
    type: "Polygon",
    coordinates: [
      [
        [minLng, minLat],
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat],
      ],
    ],
  };
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /v1/parcels
 * Open map explorer + search (M1 / FR-02). Returns a GeoJSON FeatureCollection.
 * Filters: ?bbox=minLng,minLat,maxLng,maxLat  ?q=<text>  ?landUse=<use>  ?limit=
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { bbox, q, landUse } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 500, MAX_LIMIT);
    const query = {};

    if (bbox) {
      const poly = parseBbox(bbox);
      if (!poly) throw ApiError.badRequest("bbox must be 'minLng,minLat,maxLng,maxLat'");
      query.geometry = { $geoIntersects: { $geometry: poly } };
    }

    if (landUse) query.landUse = landUse;

    if (q && String(q).trim()) {
      const rx = new RegExp(escapeRegex(String(q).trim()), "i");
      query.$or = [
        { ulpin: rx },
        { "owners.name": rx },
        { sector: rx },
        { "legacyIds.value": rx },
      ];
    }

    const parcels = await Parcel.find(query).limit(limit).lean();
    const fc = toFeatureCollection(parcels);
    fc.meta = { count: parcels.length, limit, filtered: Boolean(bbox || q || landUse) };
    res.json(fc);
  })
);

/**
 * GET /v1/parcels/:ulpin
 * Full record with all three layers (FR-03), protected layers gated by
 * role/consent. Present ?consent=<token> to unlock scoped layers.
 */
router.get(
  "/:ulpin",
  attachConsent,
  audit("parcel.read", (req) => ({ type: "parcel", id: req.params.ulpin })),
  asyncHandler(async (req, res) => {
    const p = await Parcel.findOne({ ulpin: req.params.ulpin }).lean();
    if (!p) throw ApiError.notFound(`No parcel with ULPIN ${req.params.ulpin}`);
    res.json(projectParcel(p, req));
  })
);

/** GET /v1/parcels/:ulpin/geojson — single public Feature (for map focus). */
router.get(
  "/:ulpin/geojson",
  asyncHandler(async (req, res) => {
    const p = await Parcel.findOne({ ulpin: req.params.ulpin }).lean();
    if (!p) throw ApiError.notFound(`No parcel with ULPIN ${req.params.ulpin}`);
    res.json(toFeature(p));
  })
);

// Helper for the single-layer protected endpoints.
function protectedLayer(layerKey, action, pick) {
  return [
    attachConsent,
    audit(action, (req) => ({ type: "parcel", id: req.params.ulpin })),
    asyncHandler(async (req, res) => {
      const p = await Parcel.findOne({ ulpin: req.params.ulpin }).lean();
      if (!p) throw ApiError.notFound(`No parcel with ULPIN ${req.params.ulpin}`);
      if (!canSeeLayer(req, p.ulpin, layerKey)) {
        throw ApiError.forbidden(`The ${layerKey} layer is protected`, {
          access: LAYER_ACCESS[layerKey],
          unlockWith: "official login or a consent token scoped to this layer",
        });
      }
      res.json({ ulpin: p.ulpin, ...pick(p) });
    }),
  ];
}

/** GET /v1/parcels/:ulpin/ror — Record of Rights (consent-gated). */
router.get(
  "/:ulpin/ror",
  ...protectedLayer("ror", "ror.read", (p) => ({
    owners: p.owners,
    ror: p.layers.ror,
    registration: p.layers.registration,
  }))
);

/** GET /v1/parcels/:ulpin/encumbrance — charges/mortgages (consent-gated). */
router.get(
  "/:ulpin/encumbrance",
  ...protectedLayer("encumbrance", "encumbrance.read", (p) => ({
    encumbrance: p.layers.encumbrance,
  }))
);

module.exports = router;
