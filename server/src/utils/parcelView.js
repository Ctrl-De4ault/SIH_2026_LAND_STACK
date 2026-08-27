"use strict";

const { STAFF_ROLES } = require("../constants");

/**
 * Parcel projection & consent gating.
 *
 * The base layer (geometry, ULPIN, area, sector, land use, zoning, owner
 * summary, lineage, status) is public — this is what powers the open map
 * explorer. The essential/use-case layers are protected and only revealed to:
 *   - staff / official roles (they always see everything), OR
 *   - a caller presenting a valid consent token whose scope includes the layer.
 *
 * This is the core differentiator from a read-only viewer: data is federated
 * and access is consent-governed, not blanket-open.
 */

const PRIVILEGED_ROLES = STAFF_ROLES; // patwari, sub_registrar, planner, tax_officer, admin, national_steward

// Protected layer → declared access class (for UI labelling).
const LAYER_ACCESS = Object.freeze({
  ror: "consent",
  registration: "consent",
  encumbrance: "consent",
  tax: "restricted",
  utilities: "restricted",
});
const PROTECTED_LAYERS = Object.keys(LAYER_ACCESS);

function isPrivileged(req) {
  return Boolean(req.user && PRIVILEGED_ROLES.includes(req.user.role));
}

/** Can the current request see a specific protected layer of this parcel? */
function canSeeLayer(req, ulpin, layerKey) {
  if (isPrivileged(req)) return true;
  const c = req.consent;
  return Boolean(c && c.ulpin === ulpin && Array.isArray(c.scope) && c.scope.includes(layerKey));
}

/** Public GeoJSON Feature (safe for the open map/search layer). */
function toFeature(p) {
  const zoning = p.layers && p.layers.zoning ? p.layers.zoning.code : undefined;
  return {
    type: "Feature",
    id: p.ulpin,
    geometry: p.geometry,
    properties: {
      ulpin: p.ulpin,
      sector: p.sector,
      address: `${p.sector}, ${p.state}`,
      landUse: p.landUse,
      zoning,
      area: p.area,
      status: p.status,
      disputeRisk: p.disputeRisk,
      ownerNames: (p.owners || []).map((o) => o.name).join(", "),
      centroid: p.centroid,
    },
  };
}

function toFeatureCollection(parcels) {
  return { type: "FeatureCollection", features: parcels.map(toFeature) };
}

/** Full parcel view with protected layers gated by role/consent. */
function projectParcel(p, req) {
  const unlocked = [];
  const redacted = [];
  const layers = {
    // Zoning is part of the open essential layer (master-plan designation).
    zoning: p.layers ? p.layers.zoning : undefined,
  };

  for (const key of PROTECTED_LAYERS) {
    if (canSeeLayer(req, p.ulpin, key)) {
      layers[key] = p.layers ? p.layers[key] : undefined;
      unlocked.push(key);
    } else {
      layers[key] = { protected: true, access: LAYER_ACCESS[key] };
      redacted.push(key);
    }
  }

  return {
    ulpin: p.ulpin,
    state: p.state,
    district: p.district,
    revenueUnit: p.revenueUnit,
    village: p.village,
    sector: p.sector,
    landUse: p.landUse,
    crs: p.crs,
    area: p.area,
    geometry: p.geometry,
    centroid: p.centroid,
    owners: p.owners, // ownership summary is public (as in existing RoR viewers)
    legacyIds: p.legacyIds,
    lineage: p.lineage,
    status: p.status,
    disputeRisk: p.disputeRisk,
    updatedAt: p.updatedAt,
    layers,
    access: {
      role: (req.user && req.user.role) || "anonymous",
      consent: (req.consent && req.consent.token) || null,
      unlocked,
      protected: redacted,
    },
  };
}

module.exports = {
  PRIVILEGED_ROLES,
  PROTECTED_LAYERS,
  LAYER_ACCESS,
  isPrivileged,
  canSeeLayer,
  toFeature,
  toFeatureCollection,
  projectParcel,
};
