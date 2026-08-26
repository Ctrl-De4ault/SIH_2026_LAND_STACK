/* ============================================================================
   Land Stack — Prototype mock data
   Loaded as a plain <script> (NOT fetch) so index.html opens from file://
   with no CORS issues. Exposes a single global: window.LANDSTACK
   ----------------------------------------------------------------------------
   All data here is FICTIONAL and for demonstration only. Owner names,
   ULPINs, deed numbers and coordinates are invented for the Chandigarh
   pilot mock. Nothing here is a real land record.
   ========================================================================== */
(function () {
  "use strict";

  // Approx. centre of the mock pilot area (near Chandigarh Sector 17).
  var BASE = { lng: 76.7790, lat: 30.7305 };

  // Metres → degrees at ~30.73°N
  var M_PER_DEG_LAT = 110900;
  var M_PER_DEG_LNG = 95700;

  // Parcel grid geometry (a tidy cadastre with "streets" as gaps)
  var COLS = 4, ROWS = 3;
  var PW = 150, PH = 130;      // parcel size in metres
  var GAP_X = 55, GAP_Y = 60;  // street width in metres

  // --- Attribute records (one per parcel, row-major) -----------------------
  // Deliberately varied: mortgages, a dispute, mixed land use, tax dues.
  var RECORDS = [
    {
      sector: "Sector 17-A", landUse: "Commercial", zoning: "C-1",
      owners: [{ name: "Harpreet Singh Gill", share: "1/1" }],
      area_local: "1.8 kanal", khasra: "217/2",
      registration: { type: "Sale Deed", docNo: "CHD/2019/04421", date: "2019-06-14" },
      mutationDate: "2019-07-02",
      encumbrance: { status: "clear", detail: "No active charge" },
      tax: { status: "paid", paidTill: "2025-26", due: 0 },
      utilities: ["Water", "Power", "Sewerage"],
      disputeRisk: "low", lastUpdated: "2026-05-19"
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
      disputeRisk: "low", lastUpdated: "2026-04-30"
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
      disputeRisk: "low", lastUpdated: "2026-06-01"
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
      disputeRisk: "high", lastUpdated: "2026-07-22"
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
      disputeRisk: "low", lastUpdated: "2026-03-11"
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
      disputeRisk: "low", lastUpdated: "2026-05-02"
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
      disputeRisk: "medium", lastUpdated: "2026-06-28"
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
      disputeRisk: "low", lastUpdated: "2026-02-04"
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
      disputeRisk: "low", lastUpdated: "2026-06-30"
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
      disputeRisk: "medium", lastUpdated: "2026-05-25"
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
      disputeRisk: "low", lastUpdated: "2026-07-05"
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
      disputeRisk: "low", lastUpdated: "2026-01-18"
    }
  ];

  // --- Helpers --------------------------------------------------------------
  function mToDegLng(m) { return m / M_PER_DEG_LNG; }
  function mToDegLat(m) { return m / M_PER_DEG_LAT; }

  // Deterministic pseudo-random jitter so parcels look surveyed, not robotic.
  function jitter(seed) {
    var x = Math.sin(seed * 12.9898) * 43758.5453;
    return (x - Math.floor(x)) - 0.5; // -0.5..0.5
  }

  // Build a 4-char check group from a string (fake ULPIN check block).
  function checkBlock(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return String(h % 10000).padStart(4, "0");
  }

  function makeUlpin(index) {
    var district = "01";                                   // Chandigarh
    var village = String(7 + Math.floor(index / 4)).padStart(4, "0");
    var parcel = String(400 + index).padStart(4, "0");
    var base = "CH-" + district + "-" + village + "-" + parcel;
    return base + "-" + checkBlock(base);
  }

  // --- Assemble the FeatureCollection --------------------------------------
  var features = [];
  var byUlpin = {};
  for (var i = 0; i < RECORDS.length; i++) {
    var col = i % COLS;
    var row = Math.floor(i / COLS);

    var originLng = BASE.lng + mToDegLng(col * (PW + GAP_X));
    var originLat = BASE.lat + mToDegLat(row * (PH + GAP_Y));

    var w = mToDegLng(PW), h = mToDegLat(PH);
    var jx = mToDegLng(9), jy = mToDegLat(9); // up to ~9 m corner jitter

    var ring = [
      [originLng + jitter(i + 1) * jx,       originLat + jitter(i + 2) * jy],
      [originLng + w + jitter(i + 3) * jx,   originLat + jitter(i + 4) * jy],
      [originLng + w + jitter(i + 5) * jx,   originLat + h + jitter(i + 6) * jy],
      [originLng + jitter(i + 7) * jx,       originLat + h + jitter(i + 8) * jy]
    ];
    ring.push(ring[0]); // close

    // crude area in sqm for display consistency
    var area_sqm = Math.round(PW * PH * (0.9 + Math.abs(jitter(i)) * 0.2));

    var rec = RECORDS[i];
    var ulpin = makeUlpin(i);
    var centroid = [
      (ring[0][0] + ring[1][0] + ring[2][0] + ring[3][0]) / 4,
      (ring[0][1] + ring[1][1] + ring[2][1] + ring[3][1]) / 4
    ];

    var props = {
      id: "P" + (i + 1),
      ulpin: ulpin,
      khasra: rec.khasra,
      address: rec.sector + ", Chandigarh (UT)",
      sector: rec.sector,
      landUse: rec.landUse,
      zoning: rec.zoning,
      area_sqm: area_sqm,
      area_local: rec.area_local,
      owners: rec.owners,
      ownerNames: rec.owners.map(function (o) { return o.name; }).join(", "),
      registration: rec.registration,
      mutationDate: rec.mutationDate,
      encumbrance: rec.encumbrance,
      tax: rec.tax,
      utilities: rec.utilities,
      disputeRisk: rec.disputeRisk,
      lastUpdated: rec.lastUpdated,
      centroid: centroid
    };

    var feature = {
      type: "Feature",
      id: i + 1,
      properties: props,
      geometry: { type: "Polygon", coordinates: [ring] }
    };
    features.push(feature);
    byUlpin[ulpin] = props;
  }

  var parcels = { type: "FeatureCollection", features: features };

  // --- Colour ramp by land use (kept in sync with styles.css legend) --------
  var LANDUSE_COLORS = {
    "Residential": "#2E9E7B",
    "Commercial": "#C9942B",
    "Institutional": "#5B7FB0",
    "Mixed Use": "#7E6BB5",
    "Park / Open Space": "#5FA55A",
    "Agricultural": "#9C8B3E"
  };

  // --- Pre-seeded verification registry ------------------------------------
  // A couple of "already issued" verifiable records so the Verify-a-record
  // lookup has demo IDs to try. Runtime-issued certificates are added here too.
  var verifyRegistry = {};
  function seed(id, ulpin, issued) {
    verifyRegistry[id] = { ulpin: ulpin, issuedAt: issued, valid: true };
  }
  seed("LS-VER-7F3A9C2E", features[0].properties.ulpin, "2026-08-20T10:14:00+05:30");
  seed("LS-VER-1B8D4402", features[8].properties.ulpin, "2026-08-22T16:42:00+05:30");

  // --- Public API -----------------------------------------------------------
  window.LANDSTACK = {
    center: [BASE.lng + 0.006, BASE.lat + 0.004],
    zoom: 15.3,
    parcels: parcels,
    byUlpin: byUlpin,
    landUseColors: LANDUSE_COLORS,
    verifyRegistry: verifyRegistry,
    pilot: "Chandigarh (UT)",
    disclaimer: "Fictional demonstration data — not a real land record."
  };
})();
