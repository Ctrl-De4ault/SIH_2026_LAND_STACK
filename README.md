# Land Stack — Citizen Portal (Interactive Prototype)

**Land Stack** is an integrated, GIS-based **Digital Public Infrastructure (DPI) for land governance** in India, built for **Smart India Hackathon 2026** (Department of Land Resources problem statement).

This folder contains the **first interactive demo** — a zero-backend, browser-runnable prototype of the flagship **"Citizen Search & Verify"** journey. It is meant to *show*, not tell: open one file and you can search a parcel, inspect every land-record layer tied to its ULPIN, and issue a verifiable ownership record.

> ⚠️ All data in this demo is **fictional**. Owner names, ULPINs, deed numbers and coordinates are invented for a mock Chandigarh pilot. Nothing here is a real land record.

---

## How to run

No build step, no server, no install. **Just open `index.html` in any modern browser** (Chrome, Edge, Firefox, Safari).

```
D:\SIH2026\index.html   ← double-click, or drag into a browser tab
```

The map basemap tiles load from the internet (OpenStreetMap) and MapLibre GL JS loads from a CDN, so a network connection gives the full experience. If you are **offline, the parcels still render** on a plain background — the demo degrades gracefully.

---

## What you can do in the demo

- **Search any parcel** by ULPIN, owner name, or address, with live autocomplete suggestions.
- **Click a parcel on the map** to open its full record. Parcels are colour-coded by land use, with a legend.
- **Read every layer around one parcel identity (ULPIN)** in a single panel:
  - *Base* — parcel geometry, area, khasra, ULPIN
  - *Essential* — ownership & shares, registration/deed, mutation status, zoning, encumbrance
  - *Use-case* — property tax status, connected utilities
- **See trust signals at a glance** — clear / mortgaged / disputed badges, plus a dispute-risk flag.
- **Verify ownership & issue a record** — generates a certificate with a scannable (pseudo) QR and a unique record ID (`LS-VER-XXXXXXXX`). Print or copy it.
- **Verify a record** — paste a record ID to confirm it was issued by the platform and see the parcel it certifies. Try the seeded IDs `LS-VER-7F3A9C2E` and `LS-VER-1B8D4402`.
- **Switch language** — English / हिंदी toggle across the whole interface.

---

## How this is different from Bhulekh

Bhulekh (and the state RoR portals) are **read-only, state-siloed, text-record viewers**: you look up a record of rights in one department's database, in one state's format, and that is where it ends. Land Stack is designed as **shared infrastructure**, not another viewer:

| | Bhulekh / state RoR portals | **Land Stack** |
|---|---|---|
| **Core object** | A text record of rights | A **parcel identity (ULPIN)** that everything links to |
| **Layers** | Ownership text only | **Base + Essential + Use-case** layers unified on one parcel |
| **Map** | Separate (BhuNaksha), weakly linked | **Map-first**; every attribute hangs off the geometry |
| **Reach** | Per-state, per-department silos | **Federated DPI** with open APIs across departments/states |
| **Citizen output** | View / print a record | **Verifiable ownership record** with an independently checkable ID |
| **Trust** | Implicit | **Explicit** — encumbrance, dispute-risk and tax status surfaced up front |

The demo makes the differentiator tangible: one click on a parcel shows *ownership + registration + zoning + encumbrance + tax + utilities* resolved through a single ULPIN — the "parcel-centric DPI" idea that Bhulekh does not attempt.

---

## Project files

```
SIH2026/
├─ index.html          # the app shell (topbar, map, panel, modals)
├─ assets/
│  ├─ app.js           # all interaction logic: map, search, panel, verify, i18n
│  ├─ data.js          # fictional mock data → window.LANDSTACK (12 parcels)
│  └─ styles.css       # "cadastral blueprint" design system
└─ README.md           # this file
```

Data is loaded via `<script src>` (not `fetch`) specifically so `index.html` works from `file://` with no CORS errors.

---

## Roadmap — from demo to DPI

This prototype is the **client-side proof of the citizen experience**. The intended build-out follows the PRD:

1. **MERN + geospatial backend** — Express/Node API over MongoDB for records and **PostGIS** for parcel geometry; **GeoServer** publishing OGC **WMS/WFS** layers that MapLibre consumes.
2. **Real ULPIN registry & interoperability** — open, versioned APIs with metadata catalogue, RBAC, audit trails; integration hooks for DigiLocker / API Setu and consent-first access (DPDP Act aligned).
3. **More modules** — parcel explorer for planners, department/admin dashboard, mutation & transaction workflow, encumbrance timeline.
4. **AI/ML & geospatial intelligence** — satellite change detection (unauthorised construction / encroachment), predictive dispute-risk scoring, automated valuation.

See `Land-Stack-PRD.html` (produced separately) for the full product requirements and the Standard Technical Document (API/interoperability/data-schema/GIS/security/UI standards).

---

*Prototype for Smart India Hackathon 2026 · Department of Land Resources problem statement · demonstration data only.*
