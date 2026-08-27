"use strict";

const express = require("express");
const { buildSpec } = require("../openapi");

const router = express.Router();

/** GET /v1/openapi.json — the machine-readable OpenAPI 3.1 document. */
router.get("/openapi.json", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.json(buildSpec(baseUrl));
});

/** GET /v1/docs — human-readable API reference (Redoc, loaded from CDN). */
router.get("/docs", (req, res) => {
  res.type("html").send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>Land Stack API — Reference</title>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <style>body{margin:0;padding:0;font-family:system-ui,sans-serif}</style>
  </head>
  <body>
    <redoc spec-url="/v1/openapi.json"></redoc>
    <script src="https://cdn.jsdelivr.net/npm/redoc@2.1.5/bundles/redoc.standalone.js"></script>
  </body>
</html>`);
});

module.exports = router;
