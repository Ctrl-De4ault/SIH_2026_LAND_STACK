"use strict";

const { Schema, model } = require("mongoose");

/**
 * LayerCatalogue — metadata for each publishable data layer (M3). Powers the
 * layer catalogue UI and documents each layer's tier, steward, formats and
 * access policy so consumers know what is available and how to get it.
 */
const LayerCatalogueSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true }, // "cadastre", "ror" ...
    title: { type: String, required: true },
    tier: {
      type: String,
      enum: ["base", "essential", "usecase"],
      required: true,
    },
    description: String,
    formats: { type: [String], default: [] }, // ["GeoJSON","WMS","WFS","WMTS"]
    steward: String, // owning department / custodian
    updateCadence: String, // "on transaction", "monthly" ...
    access: {
      type: String,
      enum: ["open", "consent", "restricted"],
      default: "open",
    },
    endpoint: String, // representative API/OGC endpoint
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = model("LayerCatalogue", LayerCatalogueSchema);
