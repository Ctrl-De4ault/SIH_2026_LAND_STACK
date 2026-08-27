"use strict";

const { Schema, model } = require("mongoose");

/**
 * GeoIntel — outputs of the geo-intelligence engine (M9). Stores change
 * detections (FR-13), dispute-risk assessments (FR-14) and other spatial
 * anomalies as reviewable flags keyed by parcel.
 */
const GeoIntelSchema = new Schema(
  {
    ulpin: { type: String, required: true, index: true },
    kind: {
      type: String,
      enum: ["change_detection", "dispute_risk", "encroachment", "anomaly"],
      required: true,
      index: true,
    },
    score: { type: Number, min: 0, max: 1, default: 0 }, // risk / confidence
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    summary: String,
    detectedAt: { type: Date, default: Date.now },
    evidence: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["open", "reviewing", "dismissed", "confirmed"],
      default: "open",
    },
  },
  { timestamps: true }
);

module.exports = model("GeoIntel", GeoIntelSchema);
