"use strict";

const { verify } = require("../utils/jwt");
const ApiError = require("../utils/apiError");
const { User } = require("../models");

/**
 * Best-effort authentication. Accepts either a Bearer JWT (interactive login)
 * or an `x-api-key` header (institution / machine consumers). Never rejects on
 * its own — it just attaches req.user when credentials are valid. Route guards
 * (requireAuth / requireRole) enforce access.
 */
async function authenticate(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    if (hdr.startsWith("Bearer ")) {
      const decoded = verify(hdr.slice(7));
      req.user = {
        id: decoded.sub,
        role: decoded.role,
        email: decoded.email,
        name: decoded.name,
      };
      return next();
    }

    const apiKey = req.headers["x-api-key"];
    if (apiKey) {
      const u = await User.findOne({ apiKey, active: true }).lean();
      if (u) {
        req.user = {
          id: String(u._id),
          role: u.role,
          email: u.email,
          name: u.name,
          viaApiKey: true,
        };
      }
    }
  } catch (_err) {
    // Invalid/expired token → treat as unauthenticated.
  }
  next();
}

/** Require any authenticated principal. */
function requireAuth(req, res, next) {
  if (!req.user) return next(ApiError.unauthorized());
  next();
}

/** Require one of the given roles (RBAC). */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Requires role: ${roles.join(" | ")}`));
    }
    next();
  };
}

module.exports = { authenticate, requireAuth, requireRole };
