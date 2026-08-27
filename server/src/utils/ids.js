"use strict";

const crypto = require("crypto");

/** First 8 hex chars (uppercase) of a SHA-256 digest — matches the prototype. */
function hash8(str) {
  return crypto.createHash("sha256").update(String(str)).digest("hex").slice(0, 8).toUpperCase();
}

/** Full integrity hash (first 32 hex chars) for certificate snapshots. */
function integrityHash(obj) {
  return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex").slice(0, 32);
}

function randomHex(len) {
  return crypto.randomBytes(Math.ceil(len / 2)).toString("hex").slice(0, len).toUpperCase();
}

/** Verifiable certificate record id, e.g. "LS-VER-7F3A9C2E". */
function certificateId(ulpin, issuedAt) {
  return "LS-VER-" + hash8(`${ulpin}|${issuedAt}|${randomHex(6)}`);
}

/** Consent token, e.g. "LS-CONSENT-9F2C1A0B". */
function consentToken() {
  return "LS-CONSENT-" + randomHex(8);
}

/** Service request id, e.g. "LS-SR-3D7A9C2E". */
function serviceRequestId() {
  return "LS-SR-" + randomHex(8);
}

module.exports = { hash8, integrityHash, randomHex, certificateId, consentToken, serviceRequestId };
