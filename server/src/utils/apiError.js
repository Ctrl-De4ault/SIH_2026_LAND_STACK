"use strict";

/**
 * Lightweight HTTP error with a status code. `expose: true` means the message
 * is safe to return to the client (the error handler hides 500 messages).
 */
class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.expose = status < 500;
  }

  static badRequest(msg = "Bad request", details) {
    return new ApiError(400, msg, details);
  }
  static unauthorized(msg = "Authentication required") {
    return new ApiError(401, msg);
  }
  static forbidden(msg = "Not permitted") {
    return new ApiError(403, msg);
  }
  static notFound(msg = "Not found") {
    return new ApiError(404, msg);
  }
  static conflict(msg = "Conflict", details) {
    return new ApiError(409, msg, details);
  }
}

module.exports = ApiError;
