"use strict";

/**
 * OpenAPI 3.1 description of the Land Stack API (M4 / FR-05). Served at
 * /v1/openapi.json and rendered at /v1/docs. Documents the full surface,
 * including endpoints implemented across all modules.
 */
function buildSpec(baseUrl) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Land Stack API",
      version: "1.0.0",
      description:
        "Open API gateway for the Land Stack land-governance DPI. Parcels are keyed by ULPIN and organized in a three-layer model (base / essential / use-case). Protected layers are consent-governed. All data is fictional demonstration data.",
      license: { name: "Prototype — demonstration only" },
    },
    servers: [{ url: baseUrl || "http://localhost:8080" }],
    tags: [
      { name: "Auth" },
      { name: "Parcels", description: "M1 explorer + FR-02/03" },
      { name: "ULPIN", description: "M2 registry + FR-04" },
      { name: "Layers", description: "M3 catalogue" },
      { name: "Mapping", description: "M6 schema mapping / FR-06" },
      { name: "Service Requests", description: "M7/M8 + FR-08/09" },
      { name: "Consent", description: "M5 + FR-12" },
      { name: "Certificates", description: "FR-07 verify" },
      { name: "Geo-Intelligence", description: "M9 + FR-13/14" },
      { name: "OGC", description: "WFS/WMS/WMTS" },
      { name: "Audit", description: "FR-10" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        apiKey: { type: "apiKey", in: "header", name: "x-api-key" },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: { message: { type: "string" }, details: {} },
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: { email: { type: "string" }, password: { type: "string" } },
        },
        Parcel: {
          type: "object",
          properties: {
            ulpin: { type: "string", example: "CH-01-0007-0400-2854" },
            state: { type: "string" },
            sector: { type: "string" },
            landUse: { type: "string" },
            crs: { type: "string", example: "EPSG:4326" },
            area: { type: "object" },
            geometry: { type: "object", description: "GeoJSON Polygon" },
            owners: { type: "array", items: { type: "object" } },
            layers: { type: "object" },
            access: { type: "object", description: "Which layers are unlocked/redacted" },
          },
        },
        FeatureCollection: {
          type: "object",
          properties: {
            type: { type: "string", example: "FeatureCollection" },
            features: { type: "array", items: { type: "object" } },
          },
        },
      },
    },
    paths: {
      "/v1/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Exchange credentials for a JWT",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
          },
          responses: { 200: { description: "Token + user" }, 401: { description: "Invalid credentials" } },
        },
      },
      "/v1/auth/me": {
        get: { tags: ["Auth"], summary: "Current principal", security: [{ bearerAuth: [] }], responses: { 200: { description: "User" } } },
      },
      "/v1/parcels": {
        get: {
          tags: ["Parcels"],
          summary: "Search / bbox query (GeoJSON)",
          parameters: [
            { name: "bbox", in: "query", schema: { type: "string" }, description: "minLng,minLat,maxLng,maxLat" },
            { name: "q", in: "query", schema: { type: "string" } },
            { name: "landUse", in: "query", schema: { type: "string" } },
          ],
          responses: { 200: { description: "FeatureCollection", content: { "application/json": { schema: { $ref: "#/components/schemas/FeatureCollection" } } } } },
        },
      },
      "/v1/parcels/{ulpin}": {
        get: {
          tags: ["Parcels"],
          summary: "Full record (all layers; protected layers gated)",
          parameters: [
            { name: "ulpin", in: "path", required: true, schema: { type: "string" } },
            { name: "consent", in: "query", schema: { type: "string" }, description: "Consent token to unlock scoped layers" },
          ],
          responses: {
            200: { description: "Parcel", content: { "application/json": { schema: { $ref: "#/components/schemas/Parcel" } } } },
            404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/v1/parcels/{ulpin}/ror": {
        get: { tags: ["Parcels"], summary: "Record of Rights (consent-gated)", parameters: [{ name: "ulpin", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "RoR" }, 403: { description: "Protected" } } },
      },
      "/v1/parcels/{ulpin}/encumbrance": {
        get: { tags: ["Parcels"], summary: "Encumbrance (consent-gated)", parameters: [{ name: "ulpin", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Encumbrance" }, 403: { description: "Protected" } } },
      },
      "/v1/ulpin/{ulpin}/validate": {
        get: { tags: ["ULPIN"], summary: "Validate format + check block", parameters: [{ name: "ulpin", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Validation result" } } },
      },
      "/v1/ulpin/{ulpin}/resolve": {
        get: { tags: ["ULPIN"], summary: "Resolve to parcel summary + lineage", parameters: [{ name: "ulpin", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Resolution" } } },
      },
      "/v1/ulpin/mint": {
        post: { tags: ["ULPIN"], summary: "Mint a new ULPIN (staff)", security: [{ bearerAuth: [] }], responses: { 201: { description: "Minted" }, 403: { description: "Forbidden" } } },
      },
      "/v1/ulpin/legacy-map": {
        post: { tags: ["ULPIN"], summary: "Resolve a legacy id (khasra) to a ULPIN", responses: { 200: { description: "Matches" } } },
      },
      "/v1/layers": {
        get: { tags: ["Layers"], summary: "Layer catalogue", responses: { 200: { description: "Catalogue" } } },
      },
      "/v1/mapping": {
        get: { tags: ["Mapping"], summary: "List schema-mapping profiles", responses: { 200: { description: "Profiles" } } },
      },
      "/v1/mapping/{key}/apply": {
        post: { tags: ["Mapping"], summary: "Transform a legacy record to canonical (staff)", security: [{ bearerAuth: [] }], parameters: [{ name: "key", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Canonical fragment + trace" } } },
      },
      "/v1/service-requests": {
        get: { tags: ["Service Requests"], summary: "List/queue service requests (staff)", security: [{ bearerAuth: [] }], responses: { 200: { description: "Requests" } } },
        post: { tags: ["Service Requests"], summary: "File a service request (citizen portal)", responses: { 201: { description: "Created" } } },
      },
      "/v1/service-requests/{id}": {
        get: { tags: ["Service Requests"], summary: "Track a request", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Request" } } },
      },
      "/v1/service-requests/{id}/transition": {
        post: { tags: ["Service Requests"], summary: "Advance workflow state (staff)", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Updated" } } },
      },
      "/v1/consent": {
        post: { tags: ["Consent"], summary: "Issue a scoped, time-boxed consent token", responses: { 201: { description: "Consent token" } } },
      },
      "/v1/consent/{token}/revoke": {
        post: { tags: ["Consent"], summary: "Revoke a consent token", parameters: [{ name: "token", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Revoked" } } },
      },
      "/v1/certificates": {
        post: { tags: ["Certificates"], summary: "Issue a verifiable certificate (staff)", security: [{ bearerAuth: [] }], responses: { 201: { description: "Certificate" } } },
      },
      "/v1/certificates/{recordId}/verify": {
        get: { tags: ["Certificates"], summary: "Verify a certificate by record id (FR-07)", parameters: [{ name: "recordId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Verification result" } } },
      },
      "/v1/geo-intel": {
        get: { tags: ["Geo-Intelligence"], summary: "List geo-intelligence flags (staff)", security: [{ bearerAuth: [] }], responses: { 200: { description: "Flags" } } },
      },
      "/v1/geo-intel/dashboard": {
        get: { tags: ["Geo-Intelligence"], summary: "KPI dashboard (staff)", security: [{ bearerAuth: [] }], responses: { 200: { description: "KPIs" } } },
      },
      "/v1/audit": {
        get: { tags: ["Audit"], summary: "Audit trail (admin)", security: [{ bearerAuth: [] }], responses: { 200: { description: "Entries" } } },
      },
      "/geoserver/wfs": {
        get: { tags: ["OGC"], summary: "WFS GetFeature/GetCapabilities (GeoJSON)", parameters: [{ name: "request", in: "query", schema: { type: "string" } }, { name: "bbox", in: "query", schema: { type: "string" } }], responses: { 200: { description: "GeoJSON or capabilities" } } },
      },
    },
  };
}

module.exports = { buildSpec };
