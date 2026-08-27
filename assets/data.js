/* ============================================================================
   Land Stack — Prototype mock data
   Loaded as a plain <script> (NOT fetch) so index.html opens from file://
   with no CORS issues. Exposes a single global: window.LANDSTACK
   ----------------------------------------------------------------------------
   All data here is FICTIONAL and for demonstration only. Owner names,
   ULPINs, khasra numbers, deed numbers and coordinates are invented for a
   mock Prayagraj (Uttar Pradesh) pilot. Nothing here is a real land record.

   Kept in sync with server/src/seed/seedData.js so the static demo and the
   full stack show the same parcels and the same ULPINs.
   ========================================================================== */
(function () {
  "use strict";

  // Approx. centre of the mock pilot area (Civil Lines, Prayagraj).
  var BASE = { lng: 81.8330, lat: 25.4545 };

  // Metres → degrees at ~25.45°N
  var M_PER_DEG_LAT = 110900;
  var M_PER_DEG_LNG = 100500;

  // --- Block layout ---------------------------------------------------------
  // Four revenue blocks (mohallas), each with its own origin, street bearing
  // and lane rhythm — so the cadastre is not one uniform grid of identical
  // squares sitting side by side. Roads are the gaps between blocks.
  //   code    revenue village code used inside the ULPIN
  //   x / y   metre offset from BASE (east / north)
  //   bearing street angle in degrees
  //   cols    plots along a frontage before the row wraps to the next lane
  //   depth   nominal plot depth for the block (varied per plot below)
  var BLOCKS = {
    "Civil Lines": { code: "0007", x: 0,   y: 0,    bearing: -7, cols: 2, depth: 62 },
    "Georgetown":  { code: "0008", x: 335, y: -155, bearing: 12, cols: 2, depth: 54 },
    "Tagore Town": { code: "0009", x: 85,  y: -385, bearing: -3, cols: 2, depth: 50 },
    "Rajapur":     { code: "0010", x: 470, y: -520, bearing: 8,  cols: 3, depth: 56 }
  };

  // --- Attribute records (one per parcel) ----------------------------------
  // Deliberately varied: mortgages, a dispute, mixed land use, tax dues.
  var RECORDS = [
    {
      block: "Civil Lines", landUse: "Commercial", zoning: "C-1",
      owners: [{ name: "Rakesh Chandra Dwivedi", share: "1/1" }],
      khasra: "217/2",
      registration: { type: "Sale Deed", docNo: "PRJ/2019/04421", date: "2019-06-14" },
      mutationDate: "2019-07-02",
      encumbrance: { status: "clear", detail: "No active charge" },
      tax: { status: "paid", paidTill: "2025-26", due: 0 },
      utilities: ["Water", "Power", "Sewerage"],
      disputeRisk: "low", lastUpdated: "2026-05-19"
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
      disputeRisk: "low", lastUpdated: "2026-04-30"
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
      disputeRisk: "low", lastUpdated: "2026-06-01"
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
      disputeRisk: "high", lastUpdated: "2026-07-22"
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
      disputeRisk: "low", lastUpdated: "2026-03-11"
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
      disputeRisk: "low", lastUpdated: "2026-05-02"
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
      disputeRisk: "medium", lastUpdated: "2026-06-28"
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
      disputeRisk: "low", lastUpdated: "2026-02-04"
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
      disputeRisk: "low", lastUpdated: "2026-06-30"
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
      disputeRisk: "medium", lastUpdated: "2026-05-25"
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
      disputeRisk: "low", lastUpdated: "2026-07-05"
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

  // Build a 4-char check group from a string (self-checking ULPIN block).
  function checkBlock(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return String(h % 10000).padStart(4, "0");
  }

  function makeUlpin(index, villageCode) {
    var parcel = String(400 + index).padStart(4, "0");
    var base = "UP-21-" + villageCode + "-" + parcel;  // UP = state, 21 = Prayagraj
    return base + "-" + checkBlock(base);
  }

  // Local area units used across Uttar Pradesh: 1 bigha = 20 biswa ≈ 2529 m².
  var SQM_PER_BIGHA = 2529;
  var SQM_PER_BISWA = SQM_PER_BIGHA / 20;

  function localArea(sqm) {
    var bigha = Math.floor(sqm / SQM_PER_BIGHA);
    var biswa = (sqm - bigha * SQM_PER_BIGHA) / SQM_PER_BISWA;
    return bigha ? bigha + " bigha " + biswa.toFixed(1) + " biswa"
                 : biswa.toFixed(1) + " biswa";
  }

  // Shoelace area of a closed local-metre polygon.
  function quadArea(pts) {
    var a = 0;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i], q = pts[(i + 1) % pts.length];
      a += p[0] * q[1] - q[0] * p[1];
    }
    return Math.abs(a / 2);
  }

  // --- Lay the blocks out --------------------------------------------------
  var shapes = new Array(RECORDS.length);
  var groups = {};
  var order = [];
  RECORDS.forEach(function (rec, i) {
    if (!groups[rec.block]) { groups[rec.block] = []; order.push(rec.block); }
    groups[rec.block].push(i);
  });

  order.forEach(function (name) {
    var b = BLOCKS[name];
    var th = b.bearing * Math.PI / 180;
    var cos = Math.cos(th), sin = Math.sin(th);

    function place(pt) {
      return [
        BASE.lng + mToDegLng(b.x + pt[0] * cos - pt[1] * sin),
        BASE.lat + mToDegLat(b.y + pt[0] * sin + pt[1] * cos)
      ];
    }

    var cursor = 0, lane = 0, col = 0;

    groups[name].forEach(function (i) {
      if (col === b.cols) { col = 0; cursor = 0; lane += 1; }

      var front = Math.round(34 + Math.abs(jitter(i + 1)) * 62);            // 34..96 m
      var depth = Math.round(b.depth * (0.84 + Math.abs(jitter(i + 4)) * 0.42));
      var setback = jitter(i + 6) * 9;   // plots do not share a building line
      var skew = jitter(i + 9) * 9;      // rear boundary slides; edges not parallel

      var yFront = -lane * (b.depth + 20) + setback;
      var yRear = yFront - depth;

      var pts = [
        [cursor, yFront],
        [cursor + front, yFront + jitter(i + 12) * 4],
        [cursor + front + skew, yRear],
        [cursor + skew * 0.4, yRear + jitter(i + 15) * 5]
      ];

      var ring = pts.map(place);
      ring.push(ring[0]); // close

      shapes[i] = {
        ring: ring,
        area_sqm: Math.round(quadArea(pts)),
        centroid: [
          (ring[0][0] + ring[1][0] + ring[2][0] + ring[3][0]) / 4,
          (ring[0][1] + ring[1][1] + ring[2][1] + ring[3][1]) / 4
        ],
        villageCode: b.code
      };

      cursor += front + 8 + Math.abs(jitter(i + 18)) * 8; // gully between plots
      col += 1;
    });
  });

  // --- Assemble the FeatureCollection --------------------------------------
  var features = [];
  var byUlpin = {};
  for (var i = 0; i < RECORDS.length; i++) {
    var rec = RECORDS[i];
    var s = shapes[i];
    var ulpin = makeUlpin(i, s.villageCode);

    var props = {
      id: "P" + (i + 1),
      ulpin: ulpin,
      khasra: rec.khasra,
      address: rec.block + ", Prayagraj, Uttar Pradesh",
      sector: rec.block,
      landUse: rec.landUse,
      zoning: rec.zoning,
      area_sqm: s.area_sqm,
      area_local: localArea(s.area_sqm),
      owners: rec.owners,
      ownerNames: rec.owners.map(function (o) { return o.name; }).join(", "),
      registration: rec.registration,
      mutationDate: rec.mutationDate,
      encumbrance: rec.encumbrance,
      tax: rec.tax,
      utilities: rec.utilities,
      disputeRisk: rec.disputeRisk,
      lastUpdated: rec.lastUpdated,
      centroid: s.centroid
    };

    features.push({
      type: "Feature",
      id: i + 1,
      properties: props,
      geometry: { type: "Polygon", coordinates: [s.ring] }
    });
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
    center: [81.8362, 25.4516],
    zoom: 15.6,
    parcels: parcels,
    byUlpin: byUlpin,
    landUseColors: LANDUSE_COLORS,
    verifyRegistry: verifyRegistry,
    pilot: "Prayagraj, Uttar Pradesh",
    disclaimer: "Fictional demonstration data — not a real land record."
  };
})();
