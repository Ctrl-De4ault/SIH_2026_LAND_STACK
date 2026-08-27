// Mirror of server/src/constants.js — kept in sync by hand so the client can
// label workflow states and offer valid service types / transitions.

export const ROLES = {
  CITIZEN: "citizen",
  PATWARI: "patwari",
  SUB_REGISTRAR: "sub_registrar",
  PLANNER: "planner",
  TAX_OFFICER: "tax_officer",
  INSTITUTION: "institution",
  ADMIN: "admin",
  NATIONAL_STEWARD: "national_steward",
};

export const ROLE_LABELS = {
  citizen: "Citizen",
  patwari: "Patwari (Revenue Inspector)",
  sub_registrar: "Sub-Registrar",
  planner: "Town Planner",
  tax_officer: "Tax Officer",
  institution: "Institution (bank / utility)",
  admin: "Administrator",
  national_steward: "National Steward",
};

export const SERVICE_TYPES = {
  MUTATION: "mutation",
  CERTIFIED_COPY: "certified_copy",
  ENCUMBRANCE_CERT: "encumbrance_certificate",
  CORRECTION: "correction",
  SUBDIVISION: "subdivision",
};

// Service type → i18n key (labels live in i18n.js).
export const SERVICE_TYPE_KEYS = [
  { value: "mutation", key: "srMutation" },
  { value: "certified_copy", key: "srCertifiedCopy" },
  { value: "encumbrance_certificate", key: "srEncumbranceCert" },
  { value: "correction", key: "srCorrection" },
  { value: "subdivision", key: "srSubdivision" },
];

export const SR_STATUS = {
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  FIELD_VERIFICATION: "field_verification",
  OBJECTION_WINDOW: "objection_window",
  APPROVED: "approved",
  REJECTED: "rejected",
  COMPLETED: "completed",
};

export const SR_TRANSITIONS = {
  submitted: ["under_review", "rejected"],
  under_review: ["field_verification", "rejected"],
  field_verification: ["objection_window", "rejected"],
  objection_window: ["approved", "rejected"],
  approved: ["completed"],
  rejected: [],
  completed: [],
};

export const SR_STATUS_LABELS = {
  submitted: "Submitted",
  under_review: "Under review",
  field_verification: "Field verification",
  objection_window: "Objection window",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

// Tone for status pills (maps to .pill.ok / .warn / .risk / .neutral).
export const SR_STATUS_TONE = {
  submitted: "neutral",
  under_review: "warn",
  field_verification: "warn",
  objection_window: "warn",
  approved: "ok",
  rejected: "risk",
  completed: "ok",
};
