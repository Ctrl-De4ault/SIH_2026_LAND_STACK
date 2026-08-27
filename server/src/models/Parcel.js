"use strict";

const { Schema, model } = require("mongoose");
const { PointSchema, PolygonSchema } = require("./geojson");

/**
 * Parcel — the canonical Land Stack record (PRD §12.3).
 *
 * The parcel is keyed by its ULPIN (the 14-char "Bhu-Aadhaar") and carries the
 * three-layer spatial model as embedded sub-documents:
 *   - Base layer      : cadastral geometry + ULPIN (this document's core)
 *   - Essential layer : layers.ror / registration / zoning / encumbrance
 *   - Use-case layer  : layers.tax / utilities
 *
 * Layer data is embedded (not normalized into separate collections) to mirror
 * the canonical schema in the PRD and to keep a single-read parcel view fast
 * for FR-03 ("all layers in one response").
 */

// --- Base attributes -------------------------------------------------------
const OwnerSchema = new Schema(
  { name: { type: String, required: true }, share: { type: String, default: "1/1" } },
  { _id: false }
);

const LegacyIdSchema = new Schema(
  {
    type: { type: String, required: true }, // e.g. "khasra", "khata", "old_survey"
    value: { type: String, required: true },
  },
  { _id: false }
);

const AreaSchema = new Schema(
  {
    value: { type: Number, required: true }, // canonical value
    unit: { type: String, default: "sqm" }, // canonical unit
    local: String, // human/local measure e.g. "1.8 kanal", "10 marla"
  },
  { _id: false }
);

const LineageSchema = new Schema(
  {
    parents: { type: [String], default: [] }, // parent ULPINs on subdivision/merge
    event: { type: String, default: "original" }, // original | subdivision | amalgamation
    date: Date,
  },
  { _id: false }
);

// --- Essential layer -------------------------------------------------------
const RoRSchema = new Schema(
  {
    khataNo: String,
    khasraNo: String,
    mutationDate: String, // ISO date OR the literal "pending"
    mutationStatus: {
      type: String,
      enum: ["recorded", "pending", "disputed"],
      default: "recorded",
    },
    tenancy: String,
  },
  { _id: false }
);

const RegistrationSchema = new Schema(
  {
    type: String, // Sale Deed / Gift Deed / Lease Deed / Partition ...
    docNo: String,
    date: String,
    subRegistrarOffice: String,
  },
  { _id: false }
);

const ZoningSchema = new Schema(
  {
    code: String, // C-1, R-2, I-1 ...
    description: String, // Commercial, Residential, Institutional ...
    masterPlan: String,
  },
  { _id: false }
);

const EncumbranceSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["clear", "charged", "attached", "disputed"],
      default: "clear",
    },
    detail: String,
  },
  { _id: false }
);

// --- Use-case layer --------------------------------------------------------
const TaxSchema = new Schema(
  {
    status: { type: String, enum: ["paid", "due", "exempt"], default: "paid" },
    paidTill: String,
    due: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
  },
  { _id: false }
);

const LayersSchema = new Schema(
  {
    ror: RoRSchema,
    registration: RegistrationSchema,
    zoning: ZoningSchema,
    encumbrance: EncumbranceSchema,
    tax: TaxSchema,
    utilities: { type: [String], default: [] },
  },
  { _id: false }
);

// --- Parcel ----------------------------------------------------------------
const ParcelSchema = new Schema(
  {
    ulpin: { type: String, required: true, unique: true, index: true },

    // Administrative context
    state: { type: String, default: "Chandigarh (UT)" },
    district: String,
    revenueUnit: String, // village / revenue estate
    village: String,
    sector: String,

    landUse: { type: String, index: true },

    // Geometry (stored in EPSG:4326; see GIS standard in PRD)
    geometry: { type: PolygonSchema, required: true },
    centroid: PointSchema,
    crs: { type: String, default: "EPSG:4326" },
    area: AreaSchema,

    owners: { type: [OwnerSchema], default: [] },
    legacyIds: { type: [LegacyIdSchema], default: [] },
    lineage: { type: LineageSchema, default: () => ({}) },

    layers: { type: LayersSchema, default: () => ({}) },

    status: {
      type: String,
      enum: ["active", "under_mutation", "disputed", "frozen"],
      default: "active",
    },
    disputeRisk: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
  },
  { timestamps: true }
);

// Spatial indexes for bbox / point-in-polygon queries.
ParcelSchema.index({ geometry: "2dsphere" });
ParcelSchema.index({ centroid: "2dsphere" });
// Text-ish lookups
ParcelSchema.index({ "owners.name": 1 });
ParcelSchema.index({ sector: 1 });

module.exports = model("Parcel", ParcelSchema);
