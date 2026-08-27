"use strict";

/**
 * Shared enumerations used across models, middleware and routes.
 * Centralized so RBAC checks and schema enums never drift apart.
 */

// PRD personas → system roles.
const ROLES = Object.freeze({
  CITIZEN: "citizen",
  PATWARI: "patwari", // Revenue Inspector / field officer
  SUB_REGISTRAR: "sub_registrar",
  PLANNER: "planner",
  TAX_OFFICER: "tax_officer",
  INSTITUTION: "institution", // banks, utilities (API consumers)
  ADMIN: "admin",
  NATIONAL_STEWARD: "national_steward",
});

const ALL_ROLES = Object.freeze(Object.values(ROLES));

// Staff roles that operate the admin console / workflow queues.
const STAFF_ROLES = Object.freeze([
  ROLES.PATWARI,
  ROLES.SUB_REGISTRAR,
  ROLES.PLANNER,
  ROLES.TAX_OFFICER,
  ROLES.ADMIN,
  ROLES.NATIONAL_STEWARD,
]);

// Citizen service-portal request types (M7 / FR-08).
const SERVICE_TYPES = Object.freeze({
  MUTATION: "mutation", // transfer / inheritance
  CERTIFIED_COPY: "certified_copy", // certified RoR extract
  ENCUMBRANCE_CERT: "encumbrance_certificate",
  CORRECTION: "correction", // fix an error in the record
  SUBDIVISION: "subdivision",
});

// Service-request workflow states (M8 / FR-09).
const SR_STATUS = Object.freeze({
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  FIELD_VERIFICATION: "field_verification",
  OBJECTION_WINDOW: "objection_window",
  APPROVED: "approved",
  REJECTED: "rejected",
  COMPLETED: "completed",
});

// Allowed forward transitions for the workflow engine.
const SR_TRANSITIONS = Object.freeze({
  [SR_STATUS.SUBMITTED]: [SR_STATUS.UNDER_REVIEW, SR_STATUS.REJECTED],
  [SR_STATUS.UNDER_REVIEW]: [SR_STATUS.FIELD_VERIFICATION, SR_STATUS.REJECTED],
  [SR_STATUS.FIELD_VERIFICATION]: [SR_STATUS.OBJECTION_WINDOW, SR_STATUS.REJECTED],
  [SR_STATUS.OBJECTION_WINDOW]: [SR_STATUS.APPROVED, SR_STATUS.REJECTED],
  [SR_STATUS.APPROVED]: [SR_STATUS.COMPLETED],
  [SR_STATUS.REJECTED]: [],
  [SR_STATUS.COMPLETED]: [],
});

module.exports = {
  ROLES,
  ALL_ROLES,
  STAFF_ROLES,
  SERVICE_TYPES,
  SR_STATUS,
  SR_TRANSITIONS,
};
