"use strict";

const crypto = require("crypto");
const { ROLES, SERVICE_TYPES } = require("../constants");

/**
 * seedData — ports the prototype's fictional Chandigarh cadastre (assets/data.js)
 * into canonical Land Stack documents, and adds the extra collections the full
 * stack needs (users, layer catalogue, mapping profile, geo-intel, certificates,
 * consent). Everything here is FICTIONAL demonstration data — not a real record.
 *
 * The ULPIN and geometry generation is a faithful port of the prototype so the
 * seeded ULPINs match the ones shown in the static demo and its verify registry.
 */

// Demo password shared by every seeded account (documented in the README).
const DEMO_PASSWORD = "landstack123";

// --- Geometry constants (from assets/data.js) ------------------------------
const BASE = { lng: 76.779, lat: 30.7305 };
const M_PER_DEG_LAT = 110900;
const M_PER_DEG_LNG = 95700;
const COLS = 4;
const PW = 150;
const PH = 130;
const GAP_X = 55;
const GAP_Y = 60;

const mToDegLng = (m) => m / M_PER_DEG_LNG;
const mToDegLat = (m) => m / M_PER_DEG_LAT;

// Deterministic pseudo-random jitter (identical to prototype).
function jitter(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x) - 0.5; // -0.5..0.5
}

// 4-char check group — identical to prototype checkBlock().
function checkBlock(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return String(h % 10000).padStart(4, "0");
}

function makeUlpin(index) {
  const district = "01"; // Chandigarh
  const village = String(7 + Math.floor(index / 4)).padStart(4, "0");
  const parcel = String(400 + index).padStart(4, "0");
  const base = "CH-" + district + "-" + village + "-" + parcel;
  return base + "-" + checkBlock(base);
}

// --- Prototype attribute records (verbatim) --------------------------------
const RECORDS = [
  {
    sector: "Sector 17-A", landUse: "Commercial", zoning: "C-1",
    owners: [{ name: "Harpreet Singh Gill", share: "1/1" }],
    area_local: "1.8 kanal", khasra: "217/2",
    registration: { type: "Sale Deed", docNo: "CHD/2019/04421", date: "2019-06-14" },
    mutationDate: "2019-07-02",
    encumbrance: { status: "clear", detail: "No active charge" },
    tax: { status: "paid", paidTill: "2025-26", due: 0 },
    utilities: ["Water", "Power", "Sewerage"],
    disputeRisk: "low", lastUpdated: "2026-05-19",
  },
  {
    sector: "Sector 17-A", landUse: "Commercial", zoning: "C-1",
    owners: [{ name: "Meridian Retail Pvt. Ltd.", share: "1/1" }],
    area_local: "2.4 kanal", khasra: "218",
    registration: { type: "Sale Deed", docNo: "CHD/2021/09134", date: "2021-11-03" },
    mutationDate: "2021-11-27",
    encumbrance: { status: "mortgage", detail: "Mortgage — Punjab National Bank (₹2.10 Cr)" },
    tax: { status: "paid", paidTill: "2025-26", due: 0 },
    utilities: ["Water", "Power", "Sewerage", "Fibre"],
    disputeRisk: "low", lastUpdated: "2026-04-30",
  },
  {
    sector: "Sector 18-B", landUse: "Residential", zoning: "R-2",
    owners: [{ name: "Anjali Verma", share: "1/2" }, { name: "Rohit Verma", share: "1/2" }],
    area_local: "10 marla", khasra: "77/1",
    registration: { type: "Gift Deed", docNo: "CHD/2018/02210", date: "2018-02-21" },
    mutationDate: "2018-03-15",
    encumbrance: { status: "clear", detail: "No active charge" },
    tax: { status: "due", paidTill: "2024-25", due: 4820 },
    utilities: ["Water", "Power", "Sewerage"],
    disputeRisk: "low", lastUpdated: "2026-06-01",
  },
  {
    sector: "Sector 18-B", landUse: "Residential", zoning: "R-2",
    owners: [{ name: "Estate of Late Kartar Kaur", share: "disputed" }],
    area_local: "14 marla", khasra: "77/2",
    registration: { type: "Inheritance (under review)", docNo: "CHD/2023/00718", date: "2023-01-30" },
    mutationDate: "pending",
    encumbrance: { status: "clear", detail: "No active charge" },
    tax: { status: "due", paidTill: "2022-23", due: 11250 },
    utilities: ["Water", "Power"],
    disputeRisk: "high", lastUpdated: "2026-07-22",
  },
  {
    sector: "Sector 18-B", landUse: "Institutional", zoning: "PS-1",
    owners: [{ name: "Chandigarh Education Society", share: "1/1" }],
    area_local: "3.1 kanal", khasra: "80",
    registration: { type: "Lease (99 yr)", docNo: "CHD/2005/01188", date: "2005-08-09" },
    mutationDate: "2005-09-01",
    encumbrance: { status: "clear", detail: "No active charge" },
    tax: { status: "exempt", paidTill: "—", due: 0 },
    utilities: ["Water", "Power", "Sewerage"],
    disputeRisk: "low", lastUpdated: "2026-03-11",
  },
  {
    sector: "Sector 19-C", landUse: "Residential", zoning: "R-3",
    owners: [{ name: "Mohammed Irfan", share: "1/1" }],
    area_local: "8 marla", khasra: "142/3",
    registration: { type: "Sale Deed", docNo: "CHD/2022/05560", date: "2022-09-19" },
    mutationDate: "2022-10-08",
    encumbrance: { status: "mortgage", detail: "Mortgage — HDFC Bank (₹48.0 L)" },
    tax: { status: "paid", paidTill: "2025-26", due: 0 },
    utilities: ["Water", "Power", "Sewerage"],
    disputeRisk: "low", lastUpdated: "2026-05-02",
  },
  {
    sector: "Sector 19-C", landUse: "Mixed Use", zoning: "MU-1",
    owners: [{ name: "Deepak Aggarwal", share: "2/3" }, { name: "Sunita Aggarwal", share: "1/3" }],
    area_local: "1.2 kanal", khasra: "145",
    registration: { type: "Sale Deed", docNo: "CHD/2020/07781", date: "2020-12-01" },
    mutationDate: "2020-12-20",
    encumbrance: { status: "clear", detail: "No active charge" },
    tax: { status: "paid", paidTill: "2025-26", due: 0 },
    utilities: ["Water", "Power", "Sewerage", "Fibre"],
    disputeRisk: "medium", lastUpdated: "2026-06-28",
  },
  {
    sector: "Sector 19-C", landUse: "Park / Open Space", zoning: "OS",
    owners: [{ name: "Municipal Corporation, Chandigarh", share: "1/1" }],
    area_local: "5.0 kanal", khasra: "150",
    registration: { type: "Government Land", docNo: "—", date: "—" },
    mutationDate: "—",
    encumbrance: { status: "clear", detail: "Public land — non-transferable" },
    tax: { status: "exempt", paidTill: "—", due: 0 },
    utilities: ["Water"],
    disputeRisk: "low", lastUpdated: "2026-02-04",
  },
  {
    sector: "Sector 20-A", landUse: "Residential", zoning: "R-2",
    owners: [{ name: "Priya Nair", share: "1/1" }],
    area_local: "12 marla", khasra: "203/1",
    registration: { type: "Sale Deed", docNo: "CHD/2024/01099", date: "2024-03-27" },
    mutationDate: "2024-04-14",
    encumbrance: { status: "clear", detail: "No active charge" },
    tax: { status: "paid", paidTill: "2025-26", due: 0 },
    utilities: ["Water", "Power", "Sewerage", "Fibre"],
    disputeRisk: "low", lastUpdated: "2026-06-30",
  },
  {
    sector: "Sector 20-A", landUse: "Commercial", zoning: "C-2",
    owners: [{ name: "Gurnam Singh", share: "1/1" }],
    area_local: "1.5 kanal", khasra: "205",
    registration: { type: "Sale Deed", docNo: "CHD/2017/03342", date: "2017-05-16" },
    mutationDate: "2017-06-05",
    encumbrance: { status: "mortgage", detail: "Mortgage — State Bank of India (₹95.0 L)" },
    tax: { status: "due", paidTill: "2024-25", due: 7300 },
    utilities: ["Water", "Power", "Sewerage"],
    disputeRisk: "medium", lastUpdated: "2026-05-25",
  },
  {
    sector: "Sector 20-A", landUse: "Residential", zoning: "R-3",
    owners: [{ name: "Farida Begum", share: "1/1" }],
    area_local: "6 marla", khasra: "209/4",
    registration: { type: "Sale Deed", docNo: "CHD/2023/06620", date: "2023-08-11" },
    mutationDate: "2023-09-01",
    encumbrance: { status: "clear", detail: "No active charge" },
    tax: { status: "paid", paidTill: "2025-26", due: 0 },
    utilities: ["Water", "Power", "Sewerage"],
    disputeRisk: "low", lastUpdated: "2026-07-05",
  },
  {
    sector: "Sector 20-A", landUse: "Institutional", zoning: "PS-2",
    owners: [{ name: "Directorate of Health Services", share: "1/1" }],
    area_local: "4.2 kanal", khasra: "212",
    registration: { type: "Government Land", docNo: "—", date: "—" },
    mutationDate: "—",
    encumbrance: { status: "clear", detail: "Public land — non-transferable" },
    tax: { status: "exempt", paidTill: "—", due: 0 },
    utilities: ["Water", "Power", "Sewerage"],
    disputeRisk: "low", lastUpdated: "2026-01-18",
  },
];

// --- Mapping helpers -------------------------------------------------------
function mapEncumbranceStatus(s) {
  if (s === "mortgage") return "charged";
  if (["clear", "charged", "attached", "disputed"].includes(s)) return s;
  return "clear";
}

function mutationStatus(rec) {
  if (rec.mutationDate === "pending") {
    return rec.disputeRisk === "high" ? "disputed" : "pending";
  }
  return "recorded";
}

function parcelStatus(rec) {
  if (rec.disputeRisk === "high") return "disputed";
  if (rec.mutationDate === "pending") return "under_mutation";
  return "active";
}

// Build one canonical parcel document from a prototype record + index.
function buildParcel(rec, i) {
  const col = i % COLS;
  const row = Math.floor(i / COLS);

  const originLng = BASE.lng + mToDegLng(col * (PW + GAP_X));
  const originLat = BASE.lat + mToDegLat(row * (PH + GAP_Y));

  const w = mToDegLng(PW);
  const h = mToDegLat(PH);
  const jx = mToDegLng(9);
  const jy = mToDegLat(9);

  const ring = [
    [originLng + jitter(i + 1) * jx, originLat + jitter(i + 2) * jy],
    [originLng + w + jitter(i + 3) * jx, originLat + jitter(i + 4) * jy],
    [originLng + w + jitter(i + 5) * jx, originLat + h + jitter(i + 6) * jy],
    [originLng + jitter(i + 7) * jx, originLat + h + jitter(i + 8) * jy],
  ];
  ring.push(ring[0]);

  const areaSqm = Math.round(PW * PH * (0.9 + Math.abs(jitter(i)) * 0.2));
  const centroid = [
    (ring[0][0] + ring[1][0] + ring[2][0] + ring[3][0]) / 4,
    (ring[0][1] + ring[1][1] + ring[2][1] + ring[3][1]) / 4,
  ];

  const ulpin = makeUlpin(i);
  const villageCode = String(7 + Math.floor(i / 4)).padStart(4, "0");
  const parcelCode = String(400 + i).padStart(4, "0");

  const legacyIds = [{ type: "khasra", value: rec.khasra }];
  if (rec.registration.docNo && rec.registration.docNo !== "—") {
    legacyIds.push({ type: "deed_no", value: rec.registration.docNo });
  }

  return {
    ulpin,
    state: "Chandigarh (UT)",
    district: "Chandigarh",
    revenueUnit: rec.sector,
    village: "RE-" + villageCode,
    sector: rec.sector,
    landUse: rec.landUse,
    geometry: { type: "Polygon", coordinates: [ring] },
    centroid: { type: "Point", coordinates: centroid },
    crs: "EPSG:4326",
    area: { value: areaSqm, unit: "sqm", local: rec.area_local },
    owners: rec.owners,
    legacyIds,
    lineage: {
      parents: [],
      event: rec.registration.type.startsWith("Inheritance") ? "inheritance" : "original",
    },
    layers: {
      ror: {
        khataNo: "KH-" + parcelCode,
        khasraNo: rec.khasra,
        mutationDate: rec.mutationDate,
        mutationStatus: mutationStatus(rec),
        tenancy: "Freehold",
      },
      registration: {
        type: rec.registration.type,
        docNo: rec.registration.docNo,
        date: rec.registration.date,
        subRegistrarOffice: "Sub-Registrar Office, Chandigarh (UT)",
      },
      zoning: {
        code: rec.zoning,
        description: rec.landUse,
        masterPlan: "Chandigarh Master Plan 2031",
      },
      encumbrance: {
        status: mapEncumbranceStatus(rec.encumbrance.status),
        detail: rec.encumbrance.detail,
      },
      tax: {
        status: rec.tax.status,
        paidTill: rec.tax.paidTill,
        due: rec.tax.due,
        currency: "INR",
      },
      utilities: rec.utilities,
    },
    status: parcelStatus(rec),
    disputeRisk: rec.disputeRisk,
  };
}

// --- Static reference collections ------------------------------------------
const USERS = [
  { email: "citizen@landstack.in", name: "Asha Sharma", role: ROLES.CITIZEN },
  { email: "patwari@landstack.in", name: "R. Kumar (Patwari)", role: ROLES.PATWARI },
  { email: "registrar@landstack.in", name: "S. Rao (Sub-Registrar)", role: ROLES.SUB_REGISTRAR },
  { email: "planner@landstack.in", name: "P. Mehta (Town Planner)", role: ROLES.PLANNER },
  { email: "tax@landstack.in", name: "T. Singh (Tax Officer)", role: ROLES.TAX_OFFICER },
  { email: "bank@landstack.in", name: "Verifier Bank", role: ROLES.INSTITUTION, orgName: "Verifier Bank Ltd.", apiKey: "ls-inst-demo-key-001" },
  { email: "admin@landstack.in", name: "System Administrator", role: ROLES.ADMIN },
  { email: "steward@landstack.in", name: "National Land Steward", role: ROLES.NATIONAL_STEWARD },
];

const LAYER_CATALOGUE = [
  { key: "cadastre", title: "Cadastral parcels", tier: "base", order: 1,
    description: "Authoritative parcel geometry keyed by ULPIN.",
    formats: ["GeoJSON", "WFS", "WMS"], steward: "Survey & Revenue Department",
    updateCadence: "on transaction", access: "open",
    endpoint: "/geoserver/wfs?typeName=landstack:parcels" },
  { key: "ulpin", title: "ULPIN registry", tier: "base", order: 2,
    description: "Unique Land Parcel Identification Number index and resolver.",
    formats: ["JSON"], steward: "Land Stack Registry", updateCadence: "on transaction",
    access: "open", endpoint: "/v1/parcels/{ulpin}" },
  { key: "ror", title: "Record of Rights (RoR)", tier: "essential", order: 3,
    description: "Ownership, khata/khasra, mutation status and tenancy.",
    formats: ["JSON"], steward: "Revenue Department", updateCadence: "on mutation",
    access: "consent", endpoint: "/v1/parcels/{ulpin}/ror" },
  { key: "registration", title: "Registration / deeds", tier: "essential", order: 4,
    description: "Registered deed type, document number and date.",
    formats: ["JSON"], steward: "Registration Department", updateCadence: "on registration",
    access: "consent", endpoint: "/v1/parcels/{ulpin}" },
  { key: "zoning", title: "Zoning & master plan", tier: "essential", order: 5,
    description: "Zoning code and master-plan land-use designation.",
    formats: ["GeoJSON", "WMS"], steward: "Town & Country Planning", updateCadence: "on plan revision",
    access: "open", endpoint: "/geoserver/wms" },
  { key: "encumbrance", title: "Encumbrance", tier: "essential", order: 6,
    description: "Active charges, mortgages and attachments on the parcel.",
    formats: ["JSON"], steward: "Registration Department", updateCadence: "on charge event",
    access: "consent", endpoint: "/v1/parcels/{ulpin}/encumbrance" },
  { key: "tax", title: "Property tax", tier: "usecase", order: 7,
    description: "Assessment status, dues and last-paid period.",
    formats: ["JSON"], steward: "Municipal Corporation", updateCadence: "on assessment",
    access: "restricted", endpoint: "/v1/parcels/{ulpin}" },
  { key: "utilities", title: "Utility connections", tier: "usecase", order: 8,
    description: "Water, power, sewerage and fibre connectivity.",
    formats: ["JSON"], steward: "Utility Boards", updateCadence: "on connection change",
    access: "restricted", endpoint: "/v1/parcels/{ulpin}" },
];

const MAPPING_PROFILES = [
  {
    key: "chandigarh-legacy-ror",
    sourceName: "Chandigarh legacy RoR export",
    sourceSystem: "State revenue CSV (pre-DPI)",
    description:
      "Maps a state's legacy record-of-rights export columns onto the canonical Land Stack parcel schema (M6 / FR-06).",
    fieldMap: [
      { source: "khasra_no", target: "layers.ror.khasraNo", transform: "trim" },
      { source: "owner_name", target: "owners.0.name", transform: "trim" },
      { source: "share", target: "owners.0.share", transform: "identity" },
      { source: "deed_type", target: "layers.registration.type", transform: "identity" },
      { source: "deed_no", target: "layers.registration.docNo", transform: "upper" },
      { source: "reg_date", target: "layers.registration.date", transform: "date" },
      { source: "mutation_dt", target: "layers.ror.mutationDate", transform: "date" },
      { source: "land_use", target: "landUse", transform: "identity" },
      { source: "zone_code", target: "layers.zoning.code", transform: "upper" },
      { source: "tax_due", target: "layers.tax.due", transform: "number" },
    ],
    sampleIn: {
      khasra_no: " 217/2 ",
      owner_name: " Harpreet Singh Gill ",
      share: "1/1",
      deed_type: "Sale Deed",
      deed_no: "chd/2019/04421",
      reg_date: "14-06-2019",
      mutation_dt: "02-07-2019",
      land_use: "Commercial",
      zone_code: "c-1",
      tax_due: "0",
    },
    sampleOut: {
      landUse: "Commercial",
      owners: [{ name: "Harpreet Singh Gill", share: "1/1" }],
      layers: {
        ror: { khasraNo: "217/2", mutationDate: "2019-07-02" },
        registration: { type: "Sale Deed", docNo: "CHD/2019/04421", date: "2019-06-14" },
        zoning: { code: "C-1" },
        tax: { due: 0 },
      },
    },
  },
];

// --- Derived collections (need generated ULPINs) ---------------------------
function hashSnapshot(snap) {
  return crypto.createHash("sha256").update(JSON.stringify(snap)).digest("hex").slice(0, 32);
}

function buildGeoIntel(parcels) {
  const at = (iso) => new Date(iso);
  return [
    {
      ulpin: parcels[3].ulpin, kind: "dispute_risk", score: 0.82, severity: "high",
      summary: "Pending inheritance mutation with a contested share; multiple probable claimants and tax arrears since 2022-23.",
      detectedAt: at("2026-07-22T09:30:00+05:30"),
      evidence: { mutationStatus: "disputed", taxDue: 11250, ownersShare: "disputed" },
      status: "open",
    },
    {
      ulpin: parcels[6].ulpin, kind: "change_detection", score: 0.41, severity: "medium",
      summary: "Built-up footprint increased ~7% versus the last cadastral snapshot — possible unpermitted construction.",
      detectedAt: at("2026-06-28T14:05:00+05:30"),
      evidence: { areaDeltaPct: 7.0, source: "satellite-2026Q2 vs cadastre" },
      status: "open",
    },
    {
      ulpin: parcels[9].ulpin, kind: "dispute_risk", score: 0.46, severity: "medium",
      summary: "Active mortgage combined with property-tax arrears — monitor for distress transfer.",
      detectedAt: at("2026-05-25T11:20:00+05:30"),
      evidence: { encumbrance: "charged", taxDue: 7300 },
      status: "open",
    },
    {
      ulpin: parcels[7].ulpin, kind: "encroachment", score: 0.28, severity: "low",
      summary: "Minor boundary overlap detected with an adjacent parcel along the eastern edge of the open space.",
      detectedAt: at("2026-02-04T08:00:00+05:30"),
      evidence: { overlapSqm: 34 },
      status: "reviewing",
    },
  ];
}

function buildCertificates(parcels) {
  const mk = (recordId, idx, issuedAt, issuedTo) => {
    const p = parcels[idx];
    const snapshot = {
      ulpin: p.ulpin,
      ownerNames: p.owners.map((o) => o.name).join(", "),
      landUse: p.landUse,
      sector: p.sector,
      area: p.area,
      encumbranceStatus: p.layers.encumbrance.status,
      issuedAt,
    };
    return {
      recordId,
      ulpin: p.ulpin,
      kind: "ror_extract",
      issuedAt: new Date(issuedAt),
      issuedTo,
      issuedByRole: ROLES.SUB_REGISTRAR,
      snapshot,
      hash: hashSnapshot(snapshot),
      revoked: false,
    };
  };
  // IDs match the prototype's pre-seeded verify registry.
  return [
    mk("LS-VER-7F3A9C2E", 0, "2026-08-20T10:14:00+05:30", "Harpreet Singh Gill"),
    mk("LS-VER-1B8D4402", 8, "2026-08-22T16:42:00+05:30", "Priya Nair"),
  ];
}

function buildConsents(parcels) {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return [
    {
      token: "LS-CONSENT-DEMO01",
      ulpin: parcels[0].ulpin,
      grantedBy: parcels[0].owners[0].name,
      grantedTo: "Verifier Bank Ltd.",
      scope: ["ror", "encumbrance"],
      purpose: "Home-loan collateral verification",
      expiresAt: expires,
      revoked: false,
    },
  ];
}

function buildServiceRequests(parcels) {
  // One in-flight request so the workflow queue is populated on first boot.
  return [
    {
      requestId: "LS-SR-DEMO0001",
      type: SERVICE_TYPES.MUTATION,
      ulpin: parcels[3].ulpin,
      applicant: { name: "Rupinder Kaur", email: "rupinder@example.in", phone: "+91-98xxxxxx01" },
      payload: {
        reason: "Transmission on inheritance",
        incomingOwners: [{ name: "Rupinder Kaur", share: "1/1" }],
        supportingDocs: ["succession_certificate.pdf"],
      },
      status: "under_review",
      assignedRole: ROLES.PATWARI,
      history: [
        { from: null, to: "submitted", at: new Date("2026-07-25T10:00:00+05:30"), byRole: "citizen", note: "Filed via citizen portal" },
        { from: "submitted", to: "under_review", at: new Date("2026-07-26T09:15:00+05:30"), byRole: ROLES.PATWARI, note: "Documents received; scheduling field verification" },
      ],
      objections: [],
      result: { mutationApplied: false },
    },
  ];
}

// --- Public builder --------------------------------------------------------
function buildSeedData() {
  const parcels = RECORDS.map(buildParcel);
  return {
    parcels,
    users: USERS,
    layerCatalogue: LAYER_CATALOGUE,
    mappingProfiles: MAPPING_PROFILES,
    geoIntel: buildGeoIntel(parcels),
    certificates: buildCertificates(parcels),
    consents: buildConsents(parcels),
    serviceRequests: buildServiceRequests(parcels),
  };
}

module.exports = { buildSeedData, makeUlpin, checkBlock, DEMO_PASSWORD };
