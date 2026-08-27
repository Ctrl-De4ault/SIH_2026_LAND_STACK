"use strict";

const { Schema, model } = require("mongoose");

/**
 * MappingProfile — a declarative field-mapping from a legacy source schema to
 * the canonical Land Stack parcel schema (M6 / FR-06). The schema-mapping
 * engine applies `fieldMap` transforms to convert incoming legacy records
 * (e.g. a state's existing RoR export) into canonical parcels.
 */
const FieldMapSchema = new Schema(
  {
    source: { type: String, required: true }, // legacy field / dotted path
    target: { type: String, required: true }, // canonical dotted path
    transform: {
      type: String,
      enum: ["identity", "trim", "upper", "lower", "date", "number", "split", "lookup"],
      default: "identity",
    },
    // Extra args for transforms (delimiter for split, table for lookup, ...).
    args: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const MappingProfileSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    sourceName: { type: String, required: true }, // "Chandigarh legacy RoR"
    sourceSystem: String, // originating system / format
    description: String,
    fieldMap: { type: [FieldMapSchema], default: [] },
    sampleIn: { type: Schema.Types.Mixed, default: {} },
    sampleOut: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = model("MappingProfile", MappingProfileSchema);
