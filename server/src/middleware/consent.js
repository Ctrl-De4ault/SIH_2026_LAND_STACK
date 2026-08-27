"use strict";

const { Consent } = require("../models");

/**
 * Consent resolution (FR-12 / M5). Reads a consent token from `?consent=` or
 * the `x-consent-token` header and, if valid, attaches the Consent document to
 * req.consent. Invalid/expired tokens set req.consentError instead of failing,
 * so the route can decide how much data to reveal.
 */
async function attachConsent(req, res, next) {
  try {
    const token = req.query.consent || req.headers["x-consent-token"];
    if (!token) return next();

    const c = await Consent.findOne({ token });
    if (c && c.isValid()) {
      req.consent = c;
    } else {
      req.consentError = c ? "expired_or_revoked" : "not_found";
    }
  } catch (_err) {
    req.consentError = "lookup_failed";
  }
  next();
}

/**
 * Given a resolved consent (or none) plus the requesting principal's role,
 * decide whether a specific protected layer may be revealed for a ULPIN.
 * Owners/staff always see everything; third parties need a consent whose scope
 * includes the layer and whose ulpin matches.
 */
function consentAllowsLayer(req, ulpin, layerKey, privilegedRoles = []) {
  if (req.user && privilegedRoles.includes(req.user.role)) return true;
  const c = req.consent;
  if (!c) return false;
  return c.ulpin === ulpin && Array.isArray(c.scope) && c.scope.includes(layerKey);
}

module.exports = { attachConsent, consentAllowsLayer };
