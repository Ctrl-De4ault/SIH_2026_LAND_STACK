"use strict";

const express = require("express");
const { authenticate } = require("../middleware/auth");

const authRoutes = require("./auth.routes");
const parcelRoutes = require("./parcels.routes");
const ulpinRoutes = require("./ulpin.routes");
const layerRoutes = require("./layers.routes");
const mappingRoutes = require("./mapping.routes");
const openapiRoutes = require("./openapi.routes");
const ogcRoutes = require("./ogc.routes");
const consentRoutes = require("./consent.routes");
const certificateRoutes = require("./certificates.routes");
const serviceRoutes = require("./service.routes");
const geoIntelRoutes = require("./geointel.routes");
const auditRoutes = require("./audit.routes");

const router = express.Router();

// Best-effort authentication on every API request (attaches req.user if valid).
router.use(authenticate);

// API meta
router.get("/v1/health", (req, res) => {
  res.json({ status: "ok", api: "v1", authenticated: Boolean(req.user) });
});

// --- Feature routers (mounted incrementally as modules are built) ----------
router.use("/v1/auth", authRoutes); // M-auth: login / me / demo-users
router.use("/v1/parcels", parcelRoutes); // M1 explorer + FR-02/03 + consent-gated layers
router.use("/v1/ulpin", ulpinRoutes); // M2 ULPIN registry (validate/resolve/lineage/mint/legacy-map)
router.use("/v1/layers", layerRoutes); // M3 layer catalogue
router.use("/v1/mapping", mappingRoutes); // M6 schema mapping engine (FR-06)
router.use("/v1/service-requests", serviceRoutes); // M7/M8 workflow (FR-08/09/11)
router.use("/v1/geo-intel", geoIntelRoutes); // M9 geo-intelligence (FR-13/14) + dashboard KPIs
router.use("/v1/consent", consentRoutes); // M5 consent & data-exchange (FR-12)
router.use("/v1/certificates", certificateRoutes); // FR-07 verifiable certificates
router.use("/v1/audit", auditRoutes); // FR-10 audit trail
router.use("/v1", openapiRoutes); // M4 OpenAPI spec + /v1/docs
router.use("/geoserver", ogcRoutes); // M4 OGC: WFS (GeoJSON) + WMS/WMTS capabilities

module.exports = router;
