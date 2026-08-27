// ============================================================================
// Land Stack API client. Thin wrapper over fetch() that targets the Express
// API (proxied at /v1 and /geoserver in dev). Handles the bearer token,
// JSON encoding, consent tokens and error normalisation in one place.
// ============================================================================

const TOKEN_KEY = "landstack.token";

let authToken = null;
try {
  authToken = globalThis.localStorage ? localStorage.getItem(TOKEN_KEY) : null;
} catch {
  authToken = null;
}

export function setToken(token) {
  authToken = token || null;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable — keep token in memory only */
  }
}

export function getToken() {
  return authToken;
}

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = "GET", body, headers = {}, consent } = {}) {
  const opts = { method, headers: { ...headers } };
  if (authToken) opts.headers.Authorization = `Bearer ${authToken}`;
  if (consent) opts.headers["x-consent-token"] = consent;
  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(path, opts);
  } catch (networkErr) {
    throw new ApiError(
      "Cannot reach the Land Stack API. Is the server running on :8080?",
      0,
      { cause: String(networkErr) }
    );
  }

  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const message = (payload && payload.error && payload.error.message) ||
      (payload && payload.message) ||
      (typeof payload === "string" && payload) ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status, payload && payload.error ? payload.error.details : null);
  }
  return payload;
}

const qs = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (!entries.length) return "";
  return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
};

// --- Auth -------------------------------------------------------------------
export const auth = {
  login: (email, password) => request("/v1/auth/login", { method: "POST", body: { email, password } }),
  me: () => request("/v1/auth/me"),
  demoUsers: () => request("/v1/auth/demo-users"),
};

// --- Parcels (M1) -----------------------------------------------------------
export const parcels = {
  list: (params) => request(`/v1/parcels${qs(params)}`),
  get: (ulpin, consent) => request(`/v1/parcels/${encodeURIComponent(ulpin)}`, { consent }),
  geojson: (ulpin) => request(`/v1/parcels/${encodeURIComponent(ulpin)}/geojson`),
  ror: (ulpin, consent) => request(`/v1/parcels/${encodeURIComponent(ulpin)}/ror`, { consent }),
  encumbrance: (ulpin, consent) =>
    request(`/v1/parcels/${encodeURIComponent(ulpin)}/encumbrance`, { consent }),
};

// --- ULPIN registry (M2) ----------------------------------------------------
export const ulpin = {
  validate: (id) => request(`/v1/ulpin/${encodeURIComponent(id)}/validate`),
  resolve: (id) => request(`/v1/ulpin/${encodeURIComponent(id)}/resolve`),
  lineage: (id) => request(`/v1/ulpin/${encodeURIComponent(id)}/lineage`),
  mint: (body) => request("/v1/ulpin/mint", { method: "POST", body }),
  legacyMap: (body) => request("/v1/ulpin/legacy-map", { method: "POST", body }),
};

// --- Layer catalogue (M3) ---------------------------------------------------
export const layers = {
  list: () => request("/v1/layers"),
  get: (key) => request(`/v1/layers/${encodeURIComponent(key)}`),
};

// --- Schema mapping (M6) ----------------------------------------------------
export const mapping = {
  list: () => request("/v1/mapping"),
  get: (key) => request(`/v1/mapping/${encodeURIComponent(key)}`),
  apply: (key, record) => request(`/v1/mapping/${encodeURIComponent(key)}/apply`, { method: "POST", body: { record } }),
};

// --- Service requests / workflow (M7 / M8) ----------------------------------
export const service = {
  create: (body) => request("/v1/service-requests", { method: "POST", body }),
  list: (params) => request(`/v1/service-requests${qs(params)}`),
  get: (id) => request(`/v1/service-requests/${encodeURIComponent(id)}`),
  transition: (id, to, note) =>
    request(`/v1/service-requests/${encodeURIComponent(id)}/transition`, { method: "POST", body: { to, note } }),
  objection: (id, by, note) =>
    request(`/v1/service-requests/${encodeURIComponent(id)}/objection`, { method: "POST", body: { by, note } }),
  assign: (id, assignedRole, assignedTo) =>
    request(`/v1/service-requests/${encodeURIComponent(id)}/assign`, { method: "POST", body: { assignedRole, assignedTo } }),
};

// --- Consent (M5) -----------------------------------------------------------
export const consent = {
  issue: (body) => request("/v1/consent", { method: "POST", body }),
  list: (params) => request(`/v1/consent${qs(params)}`),
  get: (token) => request(`/v1/consent/${encodeURIComponent(token)}`),
  revoke: (token) => request(`/v1/consent/${encodeURIComponent(token)}/revoke`, { method: "POST" }),
};

// --- Certificates (FR-07) ---------------------------------------------------
export const certificates = {
  issue: (body) => request("/v1/certificates", { method: "POST", body }),
  verify: (recordId) => request(`/v1/certificates/${encodeURIComponent(recordId)}/verify`),
  get: (recordId) => request(`/v1/certificates/${encodeURIComponent(recordId)}`),
  list: (params) => request(`/v1/certificates${qs(params)}`),
};

// --- Geo-intelligence (M9) --------------------------------------------------
export const geoIntel = {
  list: (params) => request(`/v1/geo-intel${qs(params)}`),
  dashboard: () => request("/v1/geo-intel/dashboard"),
  forParcel: (ulpin) => request(`/v1/geo-intel/parcel/${encodeURIComponent(ulpin)}`),
  disputeRisk: (ulpin) => request(`/v1/geo-intel/dispute-risk/${encodeURIComponent(ulpin)}`, { method: "POST" }),
  changeScan: () => request("/v1/geo-intel/scan/change-detection", { method: "POST" }),
  setStatus: (id, status) => request(`/v1/geo-intel/${encodeURIComponent(id)}/status`, { method: "POST", body: { status } }),
};

// --- Audit (FR-10) ----------------------------------------------------------
export const audit = {
  list: (params) => request(`/v1/audit${qs(params)}`),
};

export const health = () => request("/v1/health");

export default {
  setToken,
  getToken,
  auth,
  parcels,
  ulpin,
  layers,
  mapping,
  service,
  consent,
  certificates,
  geoIntel,
  audit,
  health,
  ApiError,
};
