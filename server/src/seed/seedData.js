"use strict";

const crypto = require("crypto");
const { ROLES, SERVICE_TYPES } = require("../constants");

/**
 * seedData — the fictional Prayagraj (Uttar Pradesh) demonstration cadastre,
 * expressed as canonical Land Stack documents, plus the extra collections the
 * full stack needs (users, layer catalogue, mapping profile, geo-intel,
 * certificates, consent).
 *
 * Everything here is FICTIONAL demonstration data — not a real land record.
 * Owner names, ULPINs, khasra numbers, deed numbers and coordinates are
 * invented for a mock pilot in Prayagraj city.
 */

// Demo password shared by every seeded account (documented in the README).
const DEMO_PASSWORD = "landstack123";

// ---------------------------------------------------------------------------
// Geometry — irregular mohalla blocks (NOT a uniform grid)
// ---------------------------------------------------------------------------
// Parcels are laid out as four revenue blocks, each with its own origin, street
// bearing and internal lane rhythm. Every plot then gets its own frontage,
// depth, setback and skew, so the cadastre reads like a real settlement rather
// than a chessboard of identical squares sitting side by side. All of it is
// deterministic, so a re-seed always produces the same map.

const BASE = { lng: 81.833, lat: 25.4545 }; // Civil Lines, Prayagraj
const M_PER_DEG_LAT = 110900;
const M_PER_DEG_LNG = 100500; // at ~25.45°N

const mToDegLng = (m) => m / M_PER_DEG_LNG;
const mToDegLat = (m) => m / M_PER_DEG_LAT;

/**
 * One entry per revenue block (mohalla).
 *   code    — revenue village code used inside the ULPIN
 *   x / y   — metre offset from BASE (east / north); roads fill the gaps
 *   bearing — street angle in degrees, so blocks are not axis-aligned
 *   cols    — plots along a frontage before the row wraps to the next lane
 *   depth   — nominal plot depth for the block, varied per plot below
 */
const BLOCKS = {
  "Civil Lines": { code: "0007", x: 0, y: 0, bearing: -7, cols: 2, depth: 62 },
  Georgetown: { code: "0008", x: 335, y: -155, bearing: 12, cols: 2, depth: 54 },
  "Tagore Town": { code: "0009", x: 85, y: -385, bearing: -3, cols: 2, depth: 50 },
  Rajapur: { code: "0010", x: 470, y: -520, bearing: 8, cols: 3, depth: 56 },
};

// Deterministic pseudo-random value in -0.5..0.5.
function jitter(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x) - 0.5;
}

// 4-char check group — self-checking ULPIN, validated offline (see utils/ulpin).
function checkBlock(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return String(h % 10000).padStart(4, "0");
}

const STATE_CODE = "UP";
const DISTRICT_CODE = "21"; // Prayagraj (demo code)

function makeUlpin(index, villageCode) {
  const village = String(villageCode || 7 + Math.floor(index / 4)).padStart(4, "0");
  const parcel = String(400 + index).padStart(4, "0");
  const base = `${STATE_CODE}-${DISTRICT_CODE}-${village}-${parcel}`;
  return `${base}-${checkBlock(base)}`;
}

// Local area units used across Uttar Pradesh: 1 bigha = 20 biswa ≈ 2529 m².
const SQM_PER_BIGHA = 2529;
const SQM_PER_BISWA = SQM_PER_BIGHA / 20;

function localArea(sqm) {
  const bigha = Math.floor(sqm / SQM_PER_BIGHA);
  const biswa = (sqm - bigha * SQM_PER_BIGHA) / SQM_PER_BISWA;
  return bigha ? `${bigha} bigha ${biswa.toFixed(1)} biswa` : `${biswa.toFixed(1)} biswa`;
}

// Shoelace area of a closed local-metre polygon.
function quadArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a / 2);
}

// ---------------------------------------------------------------------------
// Attribute records — 12 fictional Prayagraj parcels
// ---------------------------------------------------------------------------
const RECORDS = [
  {
    block: "Civil Lines", landUse: "Commercial", zoning: "C-1",
    owners: [{ name: "Rakesh Chandra Dwivedi", share: "1/1" }],
    khasra: "217/2",
    registration: { type: "Sale Deed", docNo: "PRJ/2019/04421", date: "2019-06-14" },
    mutationDate: "2019-07-02",
    encumbrance: { status: "clear", detail: "No active charge" },
    tax: { status: "paid", paidTill: "2025-26", due: 0 },
    utilities: ["Water", "Power", "Sewerage"],
    disputeRisk: "low", lastUpdated: "2026-05-19",
  },
  {
    block: "Civil Lines", landUse: "Commercial", zoning: "C-1",
    owners: [{ name: "Sangam Retail Pvt. Ltd.", share: "1/1" }],
    khasra: "218",
    registration: { type: "Sale Deed", docNo: "PRJ/2021/09134", date: "2021-11-03" },
    mutationDate: "2021-11-27",
    encumbrance: { status: "mortgage", detail: "Mortgage — Punjab National Bank (₹2.10 Cr)" },
    tax: { status: "paid", paidTill: "2025-26", due: 0 },
    utilities: ["Water", "Power", "Sewerage", "Fibre"],
    disputeRisk: "low", lastUpdated: "2026-04-30",
  },
  {
    block: "Georgetown", landUse: "Residential", zoning: "R-2",
    owners: [{ name: "Anjali Mishra", share: "1/2" }, { name: "Rohit Mishra", share: "1/2" }],
    khasra: "77/1",
    registration: { type: "Gift Deed", docNo: "PRJ/2018/02210", date: "2018-02-21" },
    mutationDate: "2018-03-15",
    encumbrance: { status: "clear", detail: "No active charge" },
    tax: { status: "due", paidTill: "2024-25", due: 4820 },
    utilities: ["Water", "Power", "Sewerage"],
    disputeRisk: "low", lastUpdated: "2026-06-01",
  },
  {
    block: "Georgetown", landUse: "Residential", zoning: "R-2",
    owners: [{ name: "Estate of Late Kamla Devi Pandey", share: "disputed" }],
    khasra: "77/2",
    registration: { type: "Inheritance (under review)", docNo: "PRJ/2023/00718", date: "2023-01-30" },
    mutationDate: "pending",
    encumbrance: { status: "clear", detail: "No active charge" },
    tax: { status: "due", paidTill: "2022-23", due: 11250 },
    utilities: ["Water", "Power"],
    disputeRisk: "high", lastUpdated: "2026-07-22",
  },
  {
    block: "Georgetown", landUse: "Institutional", zoning: "PS-1",
    owners: [{ name: "Prayagraj Education Society", share: "1/1" }],
    khasra: "80",
    registration: { type: "Lease (99 yr)", docNo: "PRJ/2005/01188", date: "2005-08-09" },
    mutationDate: "2005-09-01",
    encumbrance: { status: "clear", detail: "No active charge" },
    tax: { status: "exempt", paidTill: "—", due: 0 },
    utilities: ["Water", "Power", "Sewerage"],
    disputeRisk: "low", lastUpdated: "2026-03-11",
  },
  {
    block: "Tagore Town", landUse: "Residential", zoning: "R-3",
    owners: [{ name: "Mohammad Irfan Ansari", share: "1/1" }],
    khasra: "142/3",
    registration: { type: "Sale Deed", docNo: "PRJ/2022/05560", date: "2022-09-19" },
    mutationDate: "2022-10-08",
    encumbrance: { status: "mortgage", detail: "Mortgage — HDFC Bank (₹48.0 L)" },
    tax: { status: "paid", paidTill: "2025-26", due: 0 },
    utilities: ["Water", "Power", "Sewerage"],
    disputeRisk: "low", lastUpdated: "2026-05-02",
  },
  {
    block: "Tagore Town", landUse: "Mixed Use", zoning: "MU-1",
    owners: [{ name: "Deepak Agrawal", share: "2/3" }, { name: "Sunita Agrawal", share: "1/3" }],
    khasra: "145",
    registration: { type: "Sale Deed", docNo: "PRJ/2020/07781", date: "2020-12-01" },
    mutationDate: "2020-12-20",
    encumbrance: { status: "clear", detail: "No active charge" },
    tax: { status: "paid", paidTill: "2025-26", due: 0 },
    utilities: ["Water", "Power", "Sewerage", "Fibre"],
    disputeRisk: "medium", lastUpdated: "2026-06-28",
  },
  {
    block: "Tagore Town", landUse: "Park / Open Space", zoning: "OS",
    owners: [{ name: "Nagar Nigam, Prayagraj", share: "1/1" }],
    khasra: "150",
    registration: { type: "Government Land", docNo: "—", date: "—" },
    mutationDate: "—",
    encumbrance: { status: "clear", detail: "Public land — non-transferable" },
    tax: { status: "exempt", paidTill: "—", due: 0 },
    utilities: ["Water"],
    disputeRisk: "low", lastUpdated: "2026-02-04",
  },
  {
    block: "Rajapur", landUse: "Residential", zoning: "R-2",
    owners: [{ name: "Shalini Srivastava", share: "1/1" }],
    khasra: "203/1",
    registration: { type: "Sale Deed", docNo: "PRJ/2024/01099", date: "2024-03-27" },
    mutationDate: "2024-04-14",
    encumbrance: { status: "clear", detail: "No active charge" },
    tax: { status: "paid", paidTill: "2025-26", due: 0 },
    utilities: ["Water", "Power", "Sewerage", "Fibre"],
    disputeRisk: "low", lastUpdated: "2026-06-30",
  },
  {
    block: "Rajapur", landUse: "Commercial", zoning: "C-2",
    owners: [{ name: "Vinod Kumar Kesarwani", share: "1/1" }],
    khasra: "205",
    registration: { type: "Sale Deed", docNo: "PRJ/2017/03342", date: "2017-05-16" },
    mutationDate: "2017-06-05",
    encumbrance: { status: "mortgage", detail: "Mortgage — State Bank of India (₹95.0 L)" },
    tax: { status: "due", paidTill: "2024-25", due: 7300 },
    utilities: ["Water", "Power", "Sewerage"],
    disputeRisk: "medium", lastUpdated: "2026-05-25",
  },
  {
    block: "Rajapur", landUse: "Residential", zoning: "R-3",
    owners: [{ name: "Farida Bano", share: "1/1" }],
    khasra: "209/4",
    registration: { type: "Sale Deed", docNo: "PRJ/2023/06620", date: "2023-08-11" },
    mutationDate: "2023-09-01",
    encumbrance: { status: "clear", detail: "No active charge" },
    tax: { status: "paid", paidTill: "2025-26", due: 0 },
    utilities: ["Water", "Power", "Sewerage"],
    disputeRisk: "low", lastUpdated: "2026-07-05",
  },
  {
    block: "Rajapur", landUse: "Institutional", zoning: "PS-2",
    owners: [{ name: "Directorate of Health Services, Uttar Pradesh", share: "1/1" }],
    khasra: "212",
    registration: { type: "Government Land", docNo: "—", date: "—" },
    mutationDate: "—",
    encumbrance: { status: "clear", detail: "Public land — non-transferable" },
    tax: { status: "exempt", paidTill: "—", due: 0 },
    utilities: ["Water", "Power", "Sewerage"],
    disputeRisk: "low", lastUpdated: "2026-01-18",
  },
];

// ---------------------------------------------------------------------------
// Layout — one pass over RECORDS, grouped by block
// ---------------------------------------------------------------------------
function buildLayout() {
  const shapes = new Array(RECORDS.length);

  const groups = new Map();
  RECORDS.forEach((rec, i) => {
    if (!groups.has(rec.block)) groups.set(rec.block, []);
    groups.get(rec.block).push(i);
  });

  for (const [name, idxs] of groups) {
    const b = BLOCKS[name];
    const th = (b.bearing * Math.PI) / 180;
    const cos = Math.cos(th);
    const sin = Math.sin(th);

    // Local block coordinates -> WGS84.
    const place = ([x, y]) => [
      BASE.lng + mToDegLng(b.x + x * cos - y * sin),
      BASE.lat + mToDegLat(b.y + x * sin + y * cos),
    ];

    let cursor = 0; // distance travelled along the current frontage
    let lane = 0; // which row of plots inside the block
    let col = 0;

    for (const i of idxs) {
      if (col === b.cols) {
        col = 0;
        cursor = 0;
        lane += 1;
      }

      const front = Math.round(34 + Math.abs(jitter(i + 1)) * 62); // 34..96 m
      const depth = Math.round(b.depth * (0.84 + Math.abs(jitter(i + 4)) * 0.42));
      const setback = jitter(i + 6) * 9; // plots do not share a building line
      const skew = jitter(i + 9) * 9; // rear boundary slides, so edges are not parallel

      const yFront = -lane * (b.depth + 20) + setback;
      const yRear = yFront - depth;

      const pts = [
        [cursor, yFront],
        [cursor + front, yFront + jitter(i + 12) * 4],
        [cursor + front + skew, yRear],
        [cursor + skew * 0.4, yRear + jitter(i + 15) * 5],
      ];

      const ring = pts.map(place);
      ring.push(ring[0]);

      shapes[i] = {
        ring,
        areaSqm: Math.round(quadArea(pts)),
        centroid: [
          (ring[0][0] + ring[1][0] + ring[2][0] + ring[3][0]) / 4,
          (ring[0][1] + ring[1][1] + ring[2][1] + ring[3][1]) / 4,
        ],
        villageCode: b.code,
      };

      cursor += front + 8 + Math.abs(jitter(i + 18)) * 8; // gully between plots
      col += 1;
    }
  }

  return shapes;
}

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

// Build one canonical parcel document from a record + its generated shape.
function buildParcel(rec, i, shape) {
  const ulpin = makeUlpin(i, shape.villageCode);
  const parcelCode = String(400 + i).padStart(4, "0");

  const legacyIds = [{ type: "khasra", value: rec.khasra }];
  if (rec.registration.docNo && rec.registration.docNo !== "—") {
    legacyIds.push({ type: "deed_no", value: rec.registration.docNo });
  }

  return {
    ulpin,
    state: "Uttar Pradesh",
    district: "Prayagraj",
    revenueUnit: rec.block,
    village: "RE-" + shape.villageCode,
    sector: rec.block,
    landUse: rec.landUse,
    geometry: { type: "Polygon", coordinates: [shape.ring] },
    centroid: { type: "Point", coordinates: shape.centroid },
    crs: "EPSG:4326",
    area: { value: shape.areaSqm, unit: "sqm", local: localArea(shape.areaSqm) },
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
        subRegistrarOffice: "Sub-Registrar Office, Prayagraj Sadar",
      },
      zoning: {
        code: rec.zoning,
        description: rec.landUse,
        masterPlan: "Prayagraj Master Plan 2031",
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
  { email: "patwari@landstack.in", name: "R. Kumar (Lekhpal)", role: ROLES.PATWARI },
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
    key: "up-legacy-ror",
    sourceName: "Uttar Pradesh legacy RoR export",
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
      owner_name: " Rakesh Chandra Dwivedi ",
      share: "1/1",
      deed_type: "Sale Deed",
      deed_no: "prj/2019/04421",
      reg_date: "14-06-2019",
      mutation_dt: "02-07-2019",
      land_use: "Commercial",
      zone_code: "c-1",
      tax_due: "0",
    },
    sampleOut: {
      landUse: "Commercial",
      owners: [{ name: "Rakesh Chandra Dwivedi", share: "1/1" }],
      layers: {
        ror: { khasraNo: "217/2", mutationDate: "2019-07-02" },
        registration: { type: "Sale Deed", docNo: "PRJ/2019/04421", date: "2019-06-14" },
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
  // issuedTo is derived from the parcel, so it can never drift from the owner.
  const mk = (recordId, idx, issuedAt) => {
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
      issuedTo: p.owners[0].name,
      issuedByRole: ROLES.SUB_REGISTRAR,
      snapshot,
      hash: hashSnapshot(snapshot),
      revoked: false,
    };
  };
  // Pre-seeded record IDs used by the "verify a certificate" demo.
  return [
    mk("LS-VER-7F3A9C2E", 0, "2026-08-20T10:14:00+05:30"),
    mk("LS-VER-1B8D4402", 8, "2026-08-22T16:42:00+05:30"),
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
      applicant: { name: "Sarita Pandey", email: "sarita@example.in", phone: "+91-98xxxxxx01" },
      payload: {
        reason: "Transmission on inheritance",
        incomingOwners: [{ name: "Sarita Pandey", share: "1/1" }],
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
  const shapes = buildLayout();
  const parcels = RECORDS.map((rec, i) => buildParcel(rec, i, shapes[i]));
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
