"use strict";

const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { audit } = require("../middleware/audit");
const { requireRole } = require("../middleware/auth");
const { serviceRequestId, certificateId, integrityHash } = require("../utils/ids");
const {
  SERVICE_TYPES,
  SR_STATUS,
  SR_TRANSITIONS,
  STAFF_ROLES,
  ROLES,
} = require("../constants");
const { ServiceRequest, Parcel, Certificate } = require("../models");

const router = express.Router();

const VALID_TYPES = Object.values(SERVICE_TYPES);

/**
 * FR-11: when a mutation request completes, apply the transfer to the canonical
 * parcel record (ownership + registration + mutation date), resolving dispute
 * state. This is the registration→mutation auto-trigger realized in the workflow.
 */
async function applyMutation(sr) {
  const parcel = await Parcel.findOne({ ulpin: sr.ulpin });
  if (!parcel) return { applied: false };

  const payload = sr.payload || {};
  if (Array.isArray(payload.incomingOwners) && payload.incomingOwners.length) {
    parcel.owners = payload.incomingOwners;
  }
  if (payload.registration) {
    parcel.layers.registration = { ...parcel.layers.registration, ...payload.registration };
  }
  const today = new Date().toISOString().slice(0, 10);
  parcel.layers.ror.mutationDate = today;
  parcel.layers.ror.mutationStatus = "recorded";
  parcel.status = "active";
  parcel.disputeRisk = "low";
  await parcel.save();

  // Auto-issue a fresh certificate reflecting the new state.
  const issuedAt = new Date().toISOString();
  const snapshot = {
    ulpin: parcel.ulpin,
    ownerNames: parcel.owners.map((o) => o.name).join(", "),
    landUse: parcel.landUse,
    sector: parcel.sector,
    area: parcel.area,
    encumbranceStatus: parcel.layers.encumbrance && parcel.layers.encumbrance.status,
    issuedAt,
  };
  const cert = await Certificate.create({
    recordId: certificateId(parcel.ulpin, issuedAt),
    ulpin: parcel.ulpin,
    kind: "ror_extract",
    issuedAt,
    issuedTo: snapshot.ownerNames,
    issuedByRole: "system",
    snapshot,
    hash: integrityHash(snapshot),
  });

  return { applied: true, certificateId: cert.recordId };
}

/**
 * POST /v1/service-requests   { type, ulpin, applicant{}, payload{} }
 * File a citizen service request (M7 / FR-08).
 */
router.post(
  "/",
  audit("service_request.create", (req) => ({ type: "parcel", id: req.body && req.body.ulpin })),
  asyncHandler(async (req, res) => {
    const { type, ulpin, applicant, payload } = req.body || {};
    if (!type || !VALID_TYPES.includes(type)) {
      throw ApiError.badRequest(`type must be one of: ${VALID_TYPES.join(", ")}`);
    }
    if (!ulpin) throw ApiError.badRequest("ulpin is required");

    const parcel = await Parcel.findOne({ ulpin }, "ulpin").lean();
    if (!parcel) throw ApiError.notFound(`No parcel with ULPIN ${ulpin}`);

    const byRole = (req.user && req.user.role) || "citizen";
    const sr = await ServiceRequest.create({
      requestId: serviceRequestId(),
      type,
      ulpin,
      applicant: {
        userId: req.user ? req.user.id : undefined,
        name: (applicant && applicant.name) || (req.user && req.user.name),
        email: (applicant && applicant.email) || (req.user && req.user.email),
        phone: applicant && applicant.phone,
      },
      payload: payload || {},
      status: SR_STATUS.SUBMITTED,
      assignedRole: ROLES.PATWARI,
      history: [
        { from: null, to: SR_STATUS.SUBMITTED, byRole, byUser: req.user ? req.user.id : undefined, note: "Filed" },
      ],
    });

    res.status(201).json({ requestId: sr.requestId, status: sr.status, type: sr.type, ulpin: sr.ulpin });
  })
);

/**
 * GET /v1/service-requests — workflow queue (M8). Staff only.
 * Filters: ?status= ?type= ?ulpin= ?assignedRole=
 */
router.get(
  "/",
  requireRole(...STAFF_ROLES),
  asyncHandler(async (req, res) => {
    const q = {};
    for (const key of ["status", "type", "ulpin", "assignedRole"]) {
      if (req.query[key]) q[key] = req.query[key];
    }
    const list = await ServiceRequest.find(q).sort({ createdAt: -1 }).lean();
    res.json({ count: list.length, requests: list });
  })
);

/** GET /v1/service-requests/:id — track a request (public by request id). */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const sr = await ServiceRequest.findOne({ requestId: req.params.id }).lean();
    if (!sr) throw ApiError.notFound("Unknown request id");
    res.json(sr);
  })
);

/**
 * POST /v1/service-requests/:id/transition   { to, note }
 * Advance the workflow state (M8 / FR-09), enforcing legal transitions. On
 * completion of a mutation the transfer is applied to the record (FR-11).
 */
router.post(
  "/:id/transition",
  requireRole(...STAFF_ROLES),
  audit("service_request.transition", (req) => ({ type: "service_request", id: req.params.id })),
  asyncHandler(async (req, res) => {
    const { to, note } = req.body || {};
    const sr = await ServiceRequest.findOne({ requestId: req.params.id });
    if (!sr) throw ApiError.notFound("Unknown request id");

    const allowed = SR_TRANSITIONS[sr.status] || [];
    if (!allowed.includes(to)) {
      throw ApiError.badRequest(
        `Illegal transition ${sr.status} → ${to}. Allowed: ${allowed.join(", ") || "(none)"}`
      );
    }

    const from = sr.status;
    sr.status = to;
    sr.history.push({ from, to, at: new Date(), byRole: req.user.role, byUser: req.user.id, note });

    // FR-11 side effect: apply mutation on completion.
    if (to === SR_STATUS.COMPLETED && sr.type === SERVICE_TYPES.MUTATION) {
      const result = await applyMutation(sr);
      sr.result = {
        mutationApplied: result.applied,
        certificateId: result.certificateId,
        note: "Mutation applied to canonical record",
      };
    }

    await sr.save();
    res.json({ requestId: sr.requestId, status: sr.status, result: sr.result, history: sr.history });
  })
);

/** POST /v1/service-requests/:id/objection   { by, note } — public objection. */
router.post(
  "/:id/objection",
  audit("service_request.objection", (req) => ({ type: "service_request", id: req.params.id })),
  asyncHandler(async (req, res) => {
    const { by, note } = req.body || {};
    if (!note) throw ApiError.badRequest("note is required");
    const sr = await ServiceRequest.findOne({ requestId: req.params.id });
    if (!sr) throw ApiError.notFound("Unknown request id");
    if ([SR_STATUS.APPROVED, SR_STATUS.REJECTED, SR_STATUS.COMPLETED].includes(sr.status)) {
      throw ApiError.badRequest(`Objections closed for a ${sr.status} request`);
    }
    sr.objections.push({ by: by || "anonymous", note, at: new Date() });
    await sr.save();
    res.status(201).json({ requestId: sr.requestId, objections: sr.objections });
  })
);

/** POST /v1/service-requests/:id/assign   { assignedRole, assignedTo } — staff. */
router.post(
  "/:id/assign",
  requireRole(...STAFF_ROLES),
  audit("service_request.assign", (req) => ({ type: "service_request", id: req.params.id })),
  asyncHandler(async (req, res) => {
    const { assignedRole, assignedTo } = req.body || {};
    const sr = await ServiceRequest.findOneAndUpdate(
      { requestId: req.params.id },
      { $set: { assignedRole, assignedTo } },
      { new: true }
    ).lean();
    if (!sr) throw ApiError.notFound("Unknown request id");
    res.json({ requestId: sr.requestId, assignedRole: sr.assignedRole, assignedTo: sr.assignedTo });
  })
);

module.exports = router;
