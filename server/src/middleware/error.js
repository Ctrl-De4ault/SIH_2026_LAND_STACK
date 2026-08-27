"use strict";

const ApiError = require("../utils/apiError");

/** 404 handler for unmatched routes. */
function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/** Centralized error handler. Must keep 4 args so Express treats it as one. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  // Mongoose validation / cast errors → 400.
  let message = err.message;
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: { message: "Validation failed", details: err.errors },
    });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ error: { message: `Invalid ${err.path}` } });
  }
  if (err.code === 11000) {
    return res.status(409).json({
      error: { message: "Duplicate key", details: err.keyValue },
    });
  }

  if (status >= 500) {
    console.error("[error]", err);
    if (!err.expose) message = "Internal server error";
  }

  const body = { error: { message } };
  if (err.details) body.error.details = err.details;
  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
