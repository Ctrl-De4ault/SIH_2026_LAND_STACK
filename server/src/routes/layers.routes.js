"use strict";

const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { LayerCatalogue } = require("../models");

const router = express.Router();

/**
 * GET /v1/layers — the layer catalogue (M3). Lists every publishable layer with
 * its tier, steward, formats and access policy, grouped by the three-layer model.
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const layers = await LayerCatalogue.find({}).sort({ order: 1 }).lean();
    const tiers = { base: [], essential: [], usecase: [] };
    for (const l of layers) (tiers[l.tier] || (tiers[l.tier] = [])).push(l);
    res.json({ count: layers.length, tiers, layers });
  })
);

/** GET /v1/layers/:key — a single catalogue entry. */
router.get(
  "/:key",
  asyncHandler(async (req, res) => {
    const layer = await LayerCatalogue.findOne({ key: req.params.key }).lean();
    if (!layer) throw ApiError.notFound(`No catalogue layer '${req.params.key}'`);
    res.json(layer);
  })
);

module.exports = router;
