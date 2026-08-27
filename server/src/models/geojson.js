"use strict";

const { Schema } = require("mongoose");

/**
 * Reusable GeoJSON sub-schemas (RFC 7946). Coordinates are stored as
 * [longitude, latitude] in EPSG:4326 (WGS84), per the Land Stack GIS standard.
 * Attach a "2dsphere" index on the owning model to enable spatial queries.
 */

const PointSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 2,
        message: "Point coordinates must be [lng, lat]",
      },
    },
  },
  { _id: false }
);

const PolygonSchema = new Schema(
  {
    type: { type: String, enum: ["Polygon"], default: "Polygon" },
    // Array of linear rings; each ring is an array of [lng, lat] positions.
    coordinates: {
      type: [[[Number]]],
      required: true,
    },
  },
  { _id: false }
);

module.exports = { PointSchema, PolygonSchema };
