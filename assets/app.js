/* ============================================================================
   Land Stack — Citizen Portal (prototype) — application logic
   Depends on: maplibre-gl (global maplibregl) and window.LANDSTACK (data.js)
   ========================================================================== */
(function () {
  "use strict";

  var DATA = window.LANDSTACK;
  if (!DATA) { console.error("LANDSTACK data missing"); return; }

  /* ----------------------------- i18n ----------------------------------- */
  var I18N = {
    en: {
      tagline: "Citizen Portal · Prototype",
      searchPlaceholder: "Search by ULPIN, owner name, or address…",
      verifyRecord: "Verify a record",
      pilot: "Chandigarh pilot",
      hintTitle: "Tap any parcel",
      hintBody: "Every parcel is keyed by its ULPIN and linked to all its land-record layers — ownership, registration, zoning, encumbrance, tax and utilities.",
      landUse: "Land use",
      parcelIdentity: "Parcel identity · ULPIN",
      verifyOwnership: "Verify ownership & get record",
      disclaimer: "Fictional demonstration data — not a real land record.",
      ownershipRecord: "Ownership verification record",
      scanVerify: "SCAN TO VERIFY", verified: "Verified",
      certFoot: "Issued by the Land Stack prototype. Verifiable via the record ID. Not legally valid.",
      printSave: "Print / Save PDF", copyId: "Copy record ID",
      verifyIntro: "Enter a Land Stack record ID to confirm it was issued by the platform and see the parcel it certifies.",
      check: "Check",
      // panel
      base: "Base", essential: "Essential", usecase: "Use-case",
      ownershipRoR: "Ownership · Record of Rights", registration: "Registration",
      zoningLanduse: "Land use & zoning", encumbrance: "Encumbrance & charges",
      propertyTax: "Property tax", utilities: "Utilities & services",
      spatial: "Spatial base & identity",
      khasra: "Legacy Khasra", area: "Area", crs: "CRS", coordinates: "Centroid",
      shareLbl: "share", deedType: "Instrument", docNo: "Document no.",
      regDate: "Registered", mutation: "Last mutation", zone: "Zone code",
      taxStatus: "Status", paidTill: "Paid up to", dueAmount: "Amount due",
      lastUpdated: "Record last updated",
      // badges / values
      bClear: "Encumbrance-free", bMortgage: "Under mortgage",
      bTaxPaid: "Tax paid", bTaxDue: "Tax due", bTaxExempt: "Tax exempt",
      riskLow: "Low dispute risk", riskMedium: "Medium dispute risk", riskHigh: "High dispute risk",
      vClear: "Clear — no active charge", pending: "Pending", nonTransfer: "Public land — non-transferable",
      exempt: "Exempt",
      // certificate
      cRecordId: "Record ID", cParcel: "Parcel (ULPIN)", cOwners: "Owner(s)",
      cAddress: "Address", cEncumbrance: "Encumbrance", cIssued: "Issued", cValidity: "Validity",
      cValidityVal: "Prototype — informational only",
      // lookup
      lrValidTitle: "Valid record", lrInvalidTitle: "Not found",
      lrValidBody: "This record ID was issued by Land Stack and certifies the parcel below.",
      lrInvalidBody: "No record with this ID was issued by the platform. Check the ID and try again.",
      lrIssued: "Issued", lrParcel: "Parcel",
      // toasts
      tCopied: "Record ID copied to clipboard", tVerified: "Ownership verified — record issued",
      tNoResults: "No parcels match your search"
    },
    hi: {
      tagline: "नागरिक पोर्टल · प्रोटोटाइप",
      searchPlaceholder: "ULPIN, स्वामी का नाम या पता खोजें…",
      verifyRecord: "रिकॉर्ड सत्यापित करें",
      pilot: "चंडीगढ़ पायलट",
      hintTitle: "किसी भी भूखंड पर टैप करें",
      hintBody: "प्रत्येक भूखंड उसके ULPIN से जुड़ा है और उसकी सभी भू-अभिलेख परतों — स्वामित्व, पंजीकरण, ज़ोनिंग, भार, कर और सुविधाओं — से लिंक है।",
      landUse: "भू-उपयोग",
      parcelIdentity: "भूखंड पहचान · ULPIN",
      verifyOwnership: "स्वामित्व सत्यापित करें और रिकॉर्ड लें",
      disclaimer: "काल्पनिक प्रदर्शन डेटा — वास्तविक भू-अभिलेख नहीं।",
      ownershipRecord: "स्वामित्व सत्यापन रिकॉर्ड",
      scanVerify: "सत्यापन हेतु स्कैन करें", verified: "सत्यापित",
      certFoot: "Land Stack प्रोटोटाइप द्वारा जारी। रिकॉर्ड ID से सत्यापन योग्य। वैध नहीं।",
      printSave: "प्रिंट / PDF सहेजें", copyId: "रिकॉर्ड ID कॉपी करें",
      verifyIntro: "यह पुष्टि करने के लिए कि रिकॉर्ड प्लेटफ़ॉर्म द्वारा जारी किया गया था, Land Stack रिकॉर्ड ID दर्ज करें।",
      check: "जाँचें",
      base: "आधार", essential: "आवश्यक", usecase: "उपयोग",
      ownershipRoR: "स्वामित्व · अधिकार अभिलेख", registration: "पंजीकरण",
      zoningLanduse: "भू-उपयोग व ज़ोनिंग", encumbrance: "भार व दायित्व",
      propertyTax: "संपत्ति कर", utilities: "सुविधाएँ व सेवाएँ",
      spatial: "स्थानिक आधार व पहचान",
      khasra: "पुराना खसरा", area: "क्षेत्रफल", crs: "CRS", coordinates: "केंद्रबिंदु",
      shareLbl: "हिस्सा", deedType: "दस्तावेज़", docNo: "दस्तावेज़ सं.",
      regDate: "पंजीकृत", mutation: "अंतिम दाखिल-खारिज", zone: "ज़ोन कोड",
      taxStatus: "स्थिति", paidTill: "भुगतान तक", dueAmount: "बकाया राशि",
      lastUpdated: "रिकॉर्ड अंतिम अद्यतन",
      bClear: "भार-मुक्त", bMortgage: "बंधक अधीन",
      bTaxPaid: "कर भुगतान", bTaxDue: "कर बकाया", bTaxExempt: "कर मुक्त",
      riskLow: "कम विवाद जोखिम", riskMedium: "मध्यम विवाद जोखिम", riskHigh: "उच्च विवाद जोखिम",
      vClear: "स्पष्ट — कोई सक्रिय भार नहीं", pending: "लंबित", nonTransfer: "सार्वजनिक भूमि — अहस्तांतरणीय",
      exempt: "मुक्त",
      cRecordId: "रिकॉर्ड ID", cParcel: "भूखंड (ULPIN)", cOwners: "स्वामी",
      cAddress: "पता", cEncumbrance: "भार", cIssued: "जारी", cValidity: "वैधता",
      cValidityVal: "प्रोटोटाइप — केवल सूचना हेतु",
      lrValidTitle: "वैध रिकॉर्ड", lrInvalidTitle: "नहीं मिला",
      lrValidBody: "यह रिकॉर्ड ID Land Stack द्वारा जारी किया गया था और नीचे दिए भूखंड को प्रमाणित करता है।",
      lrInvalidBody: "इस ID से कोई रिकॉर्ड जारी नहीं हुआ। ID जाँचें और पुनः प्रयास करें।",
      lrIssued: "जारी", lrParcel: "भूखंड",
      tCopied: "रिकॉर्ड ID कॉपी हो गया", tVerified: "स्वामित्व सत्यापित — रिकॉर्ड जारी",
      tNoResults: "आपकी खोज से कोई भूखंड मेल नहीं खाता"
    }
  };
  var lang = "en";
  function t(k) { return (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k; }

  function applyLang() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
    });
    // sample IDs block keeps its clickable codes
    var tryEl = document.querySelector('[data-i18n-html="tryIds"]');
    if (tryEl) {
      var label = lang === "hi" ? "आज़माएँ: " : "Try: ";
      tryEl.innerHTML = label +
        '<code data-fill>LS-VER-7F3A9C2E</code> <code data-fill>LS-VER-1B8D4402</code>';
      wireSampleIds();
    }
    document.documentElement.lang = lang;
    if (selected) renderPanel(selected); // re-render open panel in new language
  }

  /* ----------------------------- helpers -------------------------------- */
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var toastTimer;
  function toast(msg) {
    var el = $("toast"); el.textContent = msg; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }
  function fmtArea(sqm) {
    return sqm.toLocaleString() + " m² (" + (sqm / 10000).toFixed(3) + " ha)";
  }
  function fmtDate(d) {
    if (!d || d === "—" || d === "pending") return d || "—";
    var parts = d.split("-"); if (parts.length !== 3) return d;
    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return parseInt(parts[2],10) + " " + months[parseInt(parts[1],10)-1] + " " + parts[0];
  }

  /* ----------------------------- MAP ------------------------------------ */
  var map = new maplibregl.Map({
    container: "map",
    style: {
      version: 8,
      sources: {
        osm: {
          type: "raster",
          tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                  "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
                  "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "© OpenStreetMap contributors"
        }
      },
      layers: [{
        id: "osm", type: "raster", source: "osm",
        paint: { "raster-saturation": -0.55, "raster-opacity": 0.92, "raster-contrast": -0.05 }
      }]
    },
    center: DATA.center, zoom: DATA.zoom, attributionControl: true
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

  var selected = null;      // selected parcel properties
  var selectedFid = null;   // selected feature id
  var hoverFid = null;

  // land-use fill color expression
  function fillColorExpr() {
    var expr = ["match", ["get", "landUse"]];
    Object.keys(DATA.landUseColors).forEach(function (k) { expr.push(k, DATA.landUseColors[k]); });
    expr.push("#8AA39B"); // fallback
    return expr;
  }

  var hoverPopup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12, className: "ls-pop" });

  map.on("load", function () {
    map.addSource("parcels", { type: "geojson", data: DATA.parcels, promoteId: undefined });

    map.addLayer({
      id: "parcels-fill", type: "fill", source: "parcels",
      paint: {
        "fill-color": fillColorExpr(),
        "fill-opacity": ["case",
          ["boolean", ["feature-state", "selected"], false], 0.74,
          ["boolean", ["feature-state", "hover"], false], 0.64, 0.48]
      }
    });
    map.addLayer({
      id: "parcels-line", type: "line", source: "parcels",
      paint: {
        "line-color": ["case", ["boolean", ["feature-state", "selected"], false], "#C9942B", "#0B2A26"],
        "line-width": ["case",
          ["boolean", ["feature-state", "selected"], false], 3.6,
          ["boolean", ["feature-state", "hover"], false], 2.0, 1.0],
        "line-opacity": 0.9
      }
    });

    buildLegend();

    // hover
    map.on("mousemove", "parcels-fill", function (e) {
      if (!e.features.length) return;
      map.getCanvas().style.cursor = "pointer";
      var f = e.features[0];
      if (hoverFid !== null && hoverFid !== f.id) map.setFeatureState({ source: "parcels", id: hoverFid }, { hover: false });
      hoverFid = f.id;
      map.setFeatureState({ source: "parcels", id: hoverFid }, { hover: true });
      var p = f.properties;
      var sw = DATA.landUseColors[p.landUse] || "#8AA39B";
      hoverPopup.setLngLat(e.lngLat).setHTML(
        '<div style="font-family:IBM Plex Mono,monospace;font-size:11px;color:#0B2A26">' +
        '<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:' + sw + ';margin-right:6px"></span>' +
        esc(p.ulpin) + '</div>' +
        '<div style="font-family:IBM Plex Sans,sans-serif;font-size:12px;color:#40534E;margin-top:2px">' +
        esc(p.landUse) + " · " + esc(p.sector) + '</div>'
      ).addTo(map);
    });
    map.on("mouseleave", "parcels-fill", function () {
      map.getCanvas().style.cursor = "";
      if (hoverFid !== null) map.setFeatureState({ source: "parcels", id: hoverFid }, { hover: false });
      hoverFid = null; hoverPopup.remove();
    });

    // click to select
    map.on("click", "parcels-fill", function (e) {
      if (!e.features.length) return;
      selectFeature(e.features[0].id, e.features[0].properties);
    });
  });

  map.on("error", function (ev) {
    // Basemap tile errors (e.g. offline) are non-fatal — parcels still render.
    if (ev && ev.error && /tile/i.test(ev.error.message || "")) return;
  });

  function selectByUlpin(ulpin, fly) {
    var feat = DATA.parcels.features.filter(function (f) { return f.properties.ulpin === ulpin; })[0];
    if (!feat) return;
    selectFeature(feat.id, feat.properties, fly);
  }

  function selectFeature(fid, props, fly) {
    if (selectedFid !== null) map.setFeatureState({ source: "parcels", id: selectedFid }, { selected: false });
    selectedFid = fid;
    map.setFeatureState({ source: "parcels", id: selectedFid }, { selected: true });
    selected = props;
    renderPanel(props);
    openPanel();
    if (fly !== false && props.centroid) {
      map.flyTo({ center: props.centroid, zoom: Math.max(map.getZoom(), 16.2), duration: 700 });
    }
  }

  function buildLegend() {
    var wrap = $("legendItems"); wrap.innerHTML = "";
    Object.keys(DATA.landUseColors).forEach(function (k) {
      var row = el("div", "item");
      row.innerHTML = '<span class="sw" style="background:' + DATA.landUseColors[k] + '"></span>' + esc(k);
      wrap.appendChild(row);
    });
  }

  /* --------------------------- PANEL ------------------------------------ */
  function riskClass(r) { return r === "high" ? "risk" : r === "medium" ? "warn" : "ok"; }
  function riskLabel(r) { return r === "high" ? t("riskHigh") : r === "medium" ? t("riskMedium") : t("riskLow"); }

  function kv(k, v, mono) {
    return '<div class="kv"><span class="k">' + esc(k) + '</span><span class="v' + (mono ? " mono" : "") + '">' + v + "</span></div>";
  }
  function layerBlock(tier, tierClass, title, innerHTML) {
    return '<div class="layer"><div class="lh"><span class="tier ' + tierClass + '">' + tier +
      '</span><h4>' + esc(title) + '</h4></div><div class="lb">' + innerHTML + "</div></div>";
  }

  function renderPanel(p) {
    $("pUlpin").textContent = p.ulpin;
    $("pAddr").textContent = p.address;

    // --- trust badges ---
    var badges = "";
    badges += '<span class="badge ' + riskClass(p.disputeRisk) + '"><span class="d"></span>' + esc(riskLabel(p.disputeRisk)) + "</span>";
    if (p.encumbrance.status === "mortgage")
      badges += '<span class="badge warn"><span class="d"></span>' + esc(t("bMortgage")) + "</span>";
    else
      badges += '<span class="badge ok"><span class="d"></span>' + esc(t("bClear")) + "</span>";
    if (p.tax.status === "paid") badges += '<span class="badge ok"><span class="d"></span>' + esc(t("bTaxPaid")) + "</span>";
    else if (p.tax.status === "due") badges += '<span class="badge risk"><span class="d"></span>' + esc(t("bTaxDue")) + "</span>";
    else badges += '<span class="badge"><span class="d"></span>' + esc(t("bTaxExempt")) + "</span>";

    // --- BASE ---
    var base = kv(t("khasra"), esc(p.khasra), true) +
      kv(t("area"), esc(fmtArea(p.area_sqm)) + " · " + esc(p.area_local)) +
      kv(t("crs"), "EPSG:4326 (WGS84)", true) +
      kv(t("coordinates"), p.centroid[1].toFixed(5) + ", " + p.centroid[0].toFixed(5), true);

    // --- ESSENTIAL: ownership ---
    var owners = p.owners.map(function (o) {
      var initial = o.name.replace(/^(Estate of\s+)?(Late\s+)?/i, "").trim().charAt(0).toUpperCase();
      return '<div class="owner"><div class="av">' + esc(initial) + '</div><div>' +
        '<div class="nm">' + esc(o.name) + '</div>' +
        '<div class="sh">' + esc(t("shareLbl")) + ": " + esc(o.share) + "</div></div></div>";
    }).join("");

    // --- ESSENTIAL: registration ---
    var reg = kv(t("deedType"), esc(p.registration.type)) +
      kv(t("docNo"), esc(p.registration.docNo), true) +
      kv(t("regDate"), esc(fmtDate(p.registration.date))) +
      kv(t("mutation"), p.mutationDate === "pending" ? '<span style="color:var(--coral)">' + esc(t("pending")) + "</span>" : esc(fmtDate(p.mutationDate)));

    // --- ESSENTIAL: zoning ---
    var zone = kv(t("landUse"), '<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:2px;background:' +
        (DATA.landUseColors[p.landUse] || "#8AA39B") + '"></span>' + esc(p.landUse) + "</span>") +
      kv(t("zone"), esc(p.zoning), true);

    // --- ESSENTIAL: encumbrance ---
    var encVal = p.encumbrance.status === "mortgage"
      ? '<span style="color:var(--amber)">' + esc(p.encumbrance.detail) + "</span>"
      : '<span style="color:var(--survey)">' + esc(p.encumbrance.detail) + "</span>";
    var enc = '<div style="font-size:13.5px;color:var(--ink)">' + encVal + "</div>";

    // --- USE-CASE: tax ---
    var taxStatusTxt = p.tax.status === "paid" ? t("bTaxPaid") : p.tax.status === "due" ? t("bTaxDue") : t("exempt");
    var tax = kv(t("taxStatus"), esc(taxStatusTxt)) +
      kv(t("paidTill"), esc(p.tax.paidTill)) +
      (p.tax.due > 0 ? kv(t("dueAmount"), "₹" + p.tax.due.toLocaleString()) : "");

    // --- USE-CASE: utilities ---
    var util = '<div class="chiprow">' + p.utilities.map(function (u) { return '<span class="chip">' + esc(u) + "</span>"; }).join("") + "</div>";

    var html =
      '<div class="badges">' + badges + "</div>" +
      layerBlock("01 · " + t("base"), "base", t("spatial"), base) +
      layerBlock("02 · " + t("essential"), "", t("ownershipRoR"), owners) +
      layerBlock("02 · " + t("essential"), "", t("registration"), reg) +
      layerBlock("02 · " + t("essential"), "", t("zoningLanduse"), zone) +
      layerBlock("02 · " + t("essential"), "", t("encumbrance"), enc) +
      layerBlock("03 · " + t("usecase"), "use", t("propertyTax"), tax) +
      layerBlock("03 · " + t("usecase"), "use", t("utilities"), util) +
      '<div style="font-family:var(--font-mono);font-size:11px;color:var(--ink-soft);text-align:center;margin-top:14px">' +
        esc(t("lastUpdated")) + ": " + esc(fmtDate(p.lastUpdated)) + "</div>";

    $("pBody").innerHTML = html;
  }

  function openPanel() { $("panel").classList.add("open"); }
  function closePanel() {
    $("panel").classList.remove("open");
    if (selectedFid !== null) { map.setFeatureState({ source: "parcels", id: selectedFid }, { selected: false }); selectedFid = null; }
    selected = null;
  }

  /* --------------------------- SEARCH ----------------------------------- */
  var searchInput = $("searchInput"), suggest = $("suggest"), searchBox = $("search");
  var activeIdx = -1, currentMatches = [];

  function matchParcels(q) {
    q = q.trim().toLowerCase();
    if (!q) return [];
    return DATA.parcels.features.filter(function (f) {
      var p = f.properties;
      return p.ulpin.toLowerCase().indexOf(q) >= 0 ||
             p.ownerNames.toLowerCase().indexOf(q) >= 0 ||
             p.address.toLowerCase().indexOf(q) >= 0 ||
             p.khasra.toLowerCase().indexOf(q) >= 0 ||
             p.landUse.toLowerCase().indexOf(q) >= 0;
    }).slice(0, 8);
  }

  function renderSuggest(matches) {
    currentMatches = matches; activeIdx = -1;
    if (!matches.length) {
      suggest.innerHTML = '<div class="empty">' + esc(t("tNoResults")) + "</div>";
      suggest.classList.add("open"); return;
    }
    suggest.innerHTML = matches.map(function (f, i) {
      var p = f.properties, sw = DATA.landUseColors[p.landUse] || "#8AA39B";
      return '<div class="row" role="option" data-i="' + i + '">' +
        '<span class="swatch" style="background:' + sw + '"></span>' +
        '<div><div class="main">' + esc(p.ownerNames) + '</div>' +
        '<div class="meta">' + esc(p.ulpin) + " · " + esc(p.sector) + "</div></div>" +
        '<span class="use">' + esc(p.landUse) + "</span></div>";
    }).join("");
    suggest.classList.add("open");
    Array.prototype.forEach.call(suggest.querySelectorAll(".row"), function (row) {
      row.addEventListener("click", function () { choose(parseInt(row.getAttribute("data-i"), 10)); });
    });
  }

  function choose(i) {
    var f = currentMatches[i]; if (!f) return;
    suggest.classList.remove("open");
    searchInput.value = f.properties.ownerNames;
    searchBox.classList.add("has-val");
    selectByUlpin(f.properties.ulpin, true);
  }

  searchInput.addEventListener("input", function () {
    var v = searchInput.value;
    searchBox.classList.toggle("has-val", v.length > 0);
    if (!v.trim()) { suggest.classList.remove("open"); return; }
    renderSuggest(matchParcels(v));
  });
  searchInput.addEventListener("keydown", function (e) {
    if (!suggest.classList.contains("open")) return;
    var rows = suggest.querySelectorAll(".row");
    if (e.key === "ArrowDown") { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, rows.length - 1); paintActive(rows); }
    else if (e.key === "ArrowUp") { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); paintActive(rows); }
    else if (e.key === "Enter") { e.preventDefault(); if (activeIdx >= 0) choose(activeIdx); else if (currentMatches.length) choose(0); }
    else if (e.key === "Escape") { suggest.classList.remove("open"); }
  });
  function paintActive(rows) {
    Array.prototype.forEach.call(rows, function (r, i) { r.classList.toggle("active", i === activeIdx); });
  }
  $("searchClear").addEventListener("click", function () {
    searchInput.value = ""; searchBox.classList.remove("has-val"); suggest.classList.remove("open"); searchInput.focus();
  });
  document.addEventListener("click", function (e) {
    if (!searchBox.contains(e.target)) suggest.classList.remove("open");
  });

  /* --------------------------- pseudo-QR -------------------------------- */
  // Deterministic, non-scannable data-matrix visual generated from a string.
  function drawQR(canvas, str) {
    var N = 25, ctx = canvas.getContext("2d");
    var size = canvas.width, cell = Math.floor(size / N), pad = Math.floor((size - cell * N) / 2);
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#0B2A26";
    // hash stream
    var h = 2166136261;
    function bit(i) {
      h ^= str.charCodeAt(i % str.length) + i * 131; h = Math.imul(h, 16777619);
      return ((h >>> (i % 29)) & 1);
    }
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      if (isFinder(x, y, N)) continue;
      if (bit(y * N + x + 7)) ctx.fillRect(pad + x * cell, pad + y * cell, cell, cell);
    }
    // finder patterns
    finder(ctx, pad, pad, cell);
    finder(ctx, pad + (N - 7) * cell, pad, cell);
    finder(ctx, pad, pad + (N - 7) * cell, cell);
  }
  function isFinder(x, y, N) {
    return (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
  }
  function finder(ctx, ox, oy, cell) {
    ctx.fillStyle = "#0B2A26"; ctx.fillRect(ox, oy, cell * 7, cell * 7);
    ctx.fillStyle = "#fff"; ctx.fillRect(ox + cell, oy + cell, cell * 5, cell * 5);
    ctx.fillStyle = "#1F8A70"; ctx.fillRect(ox + cell * 2, oy + cell * 2, cell * 3, cell * 3);
    ctx.fillStyle = "#0B2A26";
  }

  /* --------------------------- CERTIFICATE ------------------------------ */
  function hash8(str) {
    var h = 5381; for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return ("00000000" + h.toString(16).toUpperCase()).slice(-8);
  }
  function nowISO() {
    var d = new Date(), pad = function (n) { return ("0" + n).slice(-2); };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" +
      pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()) + "+05:30";
  }
  function prettyTime(iso) {
    var d = iso.replace("+05:30", "").split("T");
    return fmtDate(d[0]) + ", " + (d[1] || "").slice(0, 5) + " IST";
  }

  function issueCertificate(p) {
    var issuedAt = nowISO();
    var recordId = "LS-VER-" + hash8(p.ulpin + issuedAt);
    DATA.verifyRegistry[recordId] = { ulpin: p.ulpin, issuedAt: issuedAt, valid: true };

    var enc = p.encumbrance.status === "mortgage" ? p.encumbrance.detail : t("vClear");
    var rows = [
      [t("cRecordId"), recordId, true],
      [t("cParcel"), p.ulpin, true],
      [t("cOwners"), p.ownerNames, false],
      [t("cAddress"), p.address, false],
      [t("cEncumbrance"), enc, false],
      [t("cIssued"), prettyTime(issuedAt), false],
      [t("cValidity"), t("cValidityVal"), false]
    ];
    $("certInfo").innerHTML = rows.map(function (r) {
      return '<div class="crow"><div class="k">' + esc(r[0]) + '</div><div class="v' + (r[2] ? " mono" : "") + '">' + esc(r[1]) + "</div></div>";
    }).join("");
    drawQR($("certQr"), recordId + "|" + p.ulpin);
    $("certCard").setAttribute("data-record", recordId);
    openOverlay("certOverlay");
    toast(t("tVerified"));
  }

  /* --------------------------- VERIFY LOOKUP ---------------------------- */
  function runLookup(id) {
    id = (id || "").trim().toUpperCase();
    var res = $("lookupResult"); res.className = "verify-result";
    if (!id) return;
    var rec = DATA.verifyRegistry[id];
    if (rec && rec.valid) {
      var p = DATA.byUlpin[rec.ulpin] || {};
      res.classList.add("show", "valid");
      res.innerHTML =
        '<div class="vr-top"><svg class="vr-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>' + esc(t("lrValidTitle")) + "</div>" +
        '<p style="margin:0 0 10px;font-size:13.5px;color:var(--ink-soft)">' + esc(t("lrValidBody")) + "</p>" +
        kv(t("lrParcel"), esc(rec.ulpin), true) +
        kv(t("cOwners"), esc(p.ownerNames || "—")) +
        kv(t("cAddress"), esc(p.address || "—")) +
        kv(t("lrIssued"), esc(prettyTime(rec.issuedAt)));
    } else {
      res.classList.add("show", "invalid");
      res.innerHTML =
        '<div class="vr-top"><svg class="vr-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>' + esc(t("lrInvalidTitle")) + "</div>" +
        '<p style="margin:0;font-size:13.5px;color:var(--ink-soft)">' + esc(t("lrInvalidBody")) + "</p>";
    }
  }
  function wireSampleIds() {
    document.querySelectorAll("[data-fill]").forEach(function (c) {
      c.addEventListener("click", function () { $("lookupInput").value = c.textContent; runLookup(c.textContent); });
    });
  }

  /* --------------------------- OVERLAYS --------------------------------- */
  function openOverlay(id) { $(id).classList.add("open"); }
  function closeOverlay(id) { $(id).classList.remove("open"); }

  /* --------------------------- PRINT ------------------------------------ */
  function printCert() {
    var card = $("certCard").outerHTML;
    var w = window.open("", "_blank", "width=640,height=800");
    if (!w) { toast("Popup blocked — allow popups to print."); return; }
    w.document.write(
      '<!DOCTYPE html><html><head><title>Land Stack — Ownership Record</title>' +
      '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;600&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">' +
      '<link rel="stylesheet" href="assets/styles.css">' +
      '<style>body{background:#fff;padding:28px;font-family:IBM Plex Sans,sans-serif}</style></head><body>' +
      card + '<scr' + 'ipt>window.onload=function(){setTimeout(function(){window.print();},350);}</scr' + 'ipt></body></html>');
    w.document.close();
  }

  /* --------------------------- WIRING ----------------------------------- */
  $("panelClose").addEventListener("click", closePanel);
  $("verifyOwnership").addEventListener("click", function () { if (selected) issueCertificate(selected); });
  $("openVerify").addEventListener("click", function () { $("lookupInput").value = ""; $("lookupResult").className = "verify-result"; openOverlay("lookupOverlay"); });
  $("certClose").addEventListener("click", function () { closeOverlay("certOverlay"); });
  $("lookupClose").addEventListener("click", function () { closeOverlay("lookupOverlay"); });
  $("lookupBtn").addEventListener("click", function () { runLookup($("lookupInput").value); });
  $("lookupInput").addEventListener("keydown", function (e) { if (e.key === "Enter") runLookup(this.value); });
  $("certPrint").addEventListener("click", printCert);
  $("certCopy").addEventListener("click", function () {
    var id = $("certCard").getAttribute("data-record") || "";
    if (navigator.clipboard) navigator.clipboard.writeText(id).then(function () { toast(t("tCopied")); });
    else toast(t("tCopied"));
  });
  $("hintClose").addEventListener("click", function () { $("mapHint").style.display = "none"; });

  document.querySelectorAll(".overlay").forEach(function (ov) {
    ov.addEventListener("click", function (e) { if (e.target === ov) ov.classList.remove("open"); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") document.querySelectorAll(".overlay.open").forEach(function (o) { o.classList.remove("open"); });
  });

  $("langEn").addEventListener("click", function () { lang = "en"; this.classList.add("on"); $("langHi").classList.remove("on"); applyLang(); });
  $("langHi").addEventListener("click", function () { lang = "hi"; this.classList.add("on"); $("langEn").classList.remove("on"); applyLang(); });

  // initial
  applyLang();
  wireSampleIds();
})();
