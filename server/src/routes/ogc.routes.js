"use strict";

/**
 * OGC web services (M4 / FR-05). In production these are served by GeoServer
 * backed by PostGIS. For the prototype, WFS GetFeature is implemented for real
 * (GeoJSON straight from MongoDB) so the standard is demonstrably supported;
 * WMS/WMTS advertise capabilities and document that raster rendering is
 * delegated to GeoServer in a full deployment.
 */

const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { toFeatureCollection } = require("../utils/parcelView");
const { Parcel } = require("../models");

const router = express.Router();

const LAYER = "landstack:parcels";

function parseBboxParam(str) {
  if (!str) return null;
  const nums = String(str).split(",").map(Number).slice(0, 4);
  if (nums.length !== 4 || nums.some(Number.isNaN)) return null;
  const [minLng, minLat, maxLng, maxLat] = nums;
  return {
    type: "Polygon",
    coordinates: [[[minLng, minLat], [maxLng, minLat], [maxLng, maxLat], [minLng, maxLat], [minLng, minLat]]],
  };
}

function getParam(query, name) {
  // OGC params are case-insensitive.
  const key = Object.keys(query).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? query[key] : undefined;
}

// --- WFS -------------------------------------------------------------------
router.get(
  "/wfs",
  asyncHandler(async (req, res) => {
    const request = (getParam(req.query, "request") || "GetFeature").toLowerCase();

    if (request === "getcapabilities") {
      res.type("application/xml").send(wfsCapabilities(req));
      return;
    }

    if (request === "describefeaturetype") {
      res.json({
        typeName: LAYER,
        geometry: "Polygon (EPSG:4326)",
        properties: {
          ulpin: "string",
          sector: "string",
          landUse: "string",
          zoning: "string",
          area: "object{value,unit,local}",
          status: "string",
          disputeRisk: "string",
          ownerNames: "string",
        },
      });
      return;
    }

    // GetFeature → GeoJSON FeatureCollection
    const bbox = parseBboxParam(getParam(req.query, "bbox"));
    const count = Math.min(parseInt(getParam(req.query, "count") || getParam(req.query, "maxFeatures"), 10) || 1000, 5000);
    const query = bbox ? { geometry: { $geoIntersects: { $geometry: bbox } } } : {};
    const parcels = await Parcel.find(query).limit(count).lean();

    const fc = toFeatureCollection(parcels);
    fc.crs = { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::4326" } };
    fc.numberReturned = parcels.length;
    res.type("application/json").json(fc);
  })
);

// --- WMS (capabilities advertised; GetMap delegated to GeoServer) ----------
router.get("/wms", (req, res) => {
  const request = (getParam(req.query, "request") || "GetCapabilities").toLowerCase();
  if (request === "getmap") {
    res.status(501).json({
      error: {
        message: "WMS GetMap (raster tiles) is served by GeoServer in a full deployment.",
        hint: "This prototype exposes the same parcels as vector GeoJSON via /geoserver/wfs?request=GetFeature and the map explorer at /v1/parcels.",
      },
    });
    return;
  }
  res.type("application/xml").send(wmsCapabilities(req));
});

// --- WMTS (capabilities stub) ---------------------------------------------
router.get("/wmts", (req, res) => {
  res.type("application/xml").send(wmtsCapabilities(req));
});

// --- Capabilities documents ------------------------------------------------
function baseUrl(req) {
  return `${req.protocol}://${req.get("host")}/geoserver`;
}

function wfsCapabilities(req) {
  const url = `${baseUrl(req)}/wfs`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<wfs:WFS_Capabilities version="2.0.0" xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:ows="http://www.opengis.net/ows/1.1">
  <ows:ServiceIdentification>
    <ows:Title>Land Stack WFS</ows:Title>
    <ows:ServiceType>WFS</ows:ServiceType>
    <ows:ServiceTypeVersion>2.0.0</ows:ServiceTypeVersion>
  </ows:ServiceIdentification>
  <wfs:FeatureTypeList>
    <wfs:FeatureType>
      <wfs:Name>${LAYER}</wfs:Name>
      <wfs:Title>Cadastral parcels</wfs:Title>
      <wfs:DefaultCRS>urn:ogc:def:crs:EPSG::4326</wfs:DefaultCRS>
      <wfs:OutputFormats><wfs:Format>application/json</wfs:Format></wfs:OutputFormats>
    </wfs:FeatureType>
  </wfs:FeatureTypeList>
  <ows:OperationsMetadata>
    <ows:Operation name="GetFeature"><ows:DCP><ows:HTTP><ows:Get xlink:href="${url}" xmlns:xlink="http://www.w3.org/1999/xlink"/></ows:HTTP></ows:DCP></ows:Operation>
  </ows:OperationsMetadata>
</wfs:WFS_Capabilities>`;
}

function wmsCapabilities(req) {
  const url = `${baseUrl(req)}/wms`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms">
  <Service><Name>WMS</Name><Title>Land Stack WMS</Title><OnlineResource>${url}</OnlineResource></Service>
  <Capability>
    <Layer>
      <Title>Land Stack</Title>
      <CRS>EPSG:4326</CRS>
      <Layer queryable="1">
        <Name>${LAYER}</Name>
        <Title>Cadastral parcels</Title>
        <CRS>EPSG:4326</CRS>
      </Layer>
    </Layer>
  </Capability>
</WMS_Capabilities>`;
}

function wmtsCapabilities(req) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Capabilities version="1.0.0" xmlns="http://www.opengis.net/wmts/1.0">
  <Contents>
    <Layer>
      <Title>Cadastral parcels</Title>
      <Identifier>${LAYER}</Identifier>
      <Format>image/png</Format>
    </Layer>
  </Contents>
</Capabilities>`;
}

module.exports = router;
