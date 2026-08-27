"use strict";

/**
 * Central runtime configuration, sourced from environment variables with
 * sensible development defaults so the app boots with zero configuration.
 */
module.exports = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 8080,

  // Empty => the DB layer starts an in-memory MongoDB (see src/db.js).
  mongoUri: process.env.MONGODB_URI || "",
  dbName: process.env.DB_NAME || "landstack",

  jwtSecret: process.env.JWT_SECRET || "landstack-dev-secret-change-me",
  jwtExpiry: process.env.JWT_EXPIRY || "12h",

  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",

  // Auto-seed demo data when the database is empty (always true for in-memory).
  autoSeed: String(process.env.AUTO_SEED || "true").toLowerCase() !== "false",
};
