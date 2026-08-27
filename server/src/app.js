"use strict";

const express = require("express");
const cors = require("cors");
const config = require("./config");

const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/error");

/**
 * Build and return the configured Express application.
 * Kept separate from index.js so it can be imported by tests.
 */
function createApp() {
  const app = express();

  app.set("x-powered-by", false);

  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Tiny request logger (method, path, status, duration).
  app.use((req, res, next) => {
    const started = Date.now();
    res.on("finish", () => {
      const ms = Date.now() - started;
      console.log(
        `[api] ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`
      );
    });
    next();
  });

  // Liveness probe.
  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "land-stack-api", time: new Date().toISOString() });
  });

  // All application routes (mounted at their own prefixes: /v1, /geoserver, ...).
  app.use(routes);

  // 404 + centralized error handler (must be last).
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
