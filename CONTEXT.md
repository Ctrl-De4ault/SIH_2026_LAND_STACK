# Land Stack — Project Context

> **Read this first.** This file is the single source of truth for what Land Stack is,
> what has been built, how to run it, and what remains. It exists so any new work
> session can resume without re-discovering the project.
>
> Last updated: 2026-08-27

---

## 1. What this is

**Land Stack** is an integrated, GIS-based **Digital Public Infrastructure (DPI) for land
governance in India**, built as a functional prototype for **Smart India Hackathon 2026
(SIH2026)** under the **Department of Land Resources**.

The deliverables are:

1. A **Standard Technical Document / PRD** — `Land-Stack-PRD.html` (done).
2. A **static citizen-portal prototype** — `index.html` + `assets/` (done).
3. A **full-stack MERN application** implementing every PRD module and functional
   requirement — `server/` (done) + `client/` (in progress).

### The core differentiator (do not lose this)

Land Stack must be **clearly distinct from Bhulekh**, India's existing state land-record
viewer. Bhulekh is essentially a **read-only record viewer**. Land Stack differs by being:

- **A spatial-first DPI**, not a text record lookup — every right is tied to a mapped
  parcel keyed by **ULPIN** (the 14-character "Bhu-Aadhaar").
- **Consent-aware** — sensitive layers (RoR, registration, encumbrance, tax) are
  **gated by consent tokens or staff role**, not open to all. This is the headline
  differentiator and is implemented end-to-end.
- **Transactional & workflow-driven** — citizens file service requests (mutation,
  certified copy, etc.); officers advance them through a legal state machine; a completed
  mutation **auto-applies to the canonical record** (FR-11).
- **Interoperable** — an Open API gateway (OpenAPI 3.1 + OGC WFS/WMS/WMTS) so other
  systems can build on it.
- **Verifiable** — certificates carry an integrity hash and are **publicly verifiable /
  tamper-evident** by record ID.
- **Intelligent** — a geo-intelligence layer scores dispute risk and flags change
  detection.
- **Auditable** — every sensitive read/write writes to an **immutable audit log** (FR-10).

> **Important constraint:** all data is **fictional demonstration data — not a real land
> record**. Demo credentials are intentionally exposed and labelled demo-only.

---

## 2. Repository layout

```
SIH2026/
├── CONTEXT.md              ← this file
├── Land-Stack-PRD.html     PRD / Standard Technical Document
├── README.md               prototype readme
├── DEPLOY.md               GitHub push + Pages deploy guide
├── index.html              static citizen-portal prototype (file:// runnable)
├── assets/
│   ├── data.js             mock parcel data (12 Chandigarh parcels) + ULPIN algo
│   ├── app.js              prototype logic + EN/HI i18n + cert/QR
│   └── styles.css          "refined-green" design system
├── server/                 ← MERN backend (COMPLETE)
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js  app.js  config.js  db.js  constants.js  openapi.js
│       ├── models/   (9 Mongoose models + geojson + barrel)
│       ├── middleware/ (auth, audit, consent, error)
│       ├── routes/   (11 route files + aggregator index.js)
│       ├── utils/    (jwt, ulpin, ids, parcelView, mappingEngine, geoIntel, …)
│       └── seed/     (seedData.js ports the prototype; seed.js runs it)
└── client/                 ← React + Vite frontend (SCAFFOLD DONE, UI PENDING)
    ├── package.json  vite.config.js  index.html
    └── src/
        ├── api.js          fetch wrapper covering every server route
        ├── i18n.js         EN/HI strings (ported + extended)
        ├── lang.jsx        language context/provider
        ├── auth.jsx        auth context/provider (JWT, role)
        ├── styles.css      ported design system + console styles
        └── lib/
            ├── format.js   land-use colours, date/area/money formatters
            └── qr.js       deterministic pseudo-QR (ported)
```

---

## 3. Tech stack

| Layer     | Choice                                                                 |
|-----------|------------------------------------------------------------------------|
| Backend   | Node/Express 4, Mongoose 8 (MongoDB, GeoJSON + `2dsphere` indexes)     |
| Auth      | JWT (bcryptjs), plus `x-api-key` for institutional clients             |
| Frontend  | React 18, Vite 5, React Router 6, MapLibre GL 4                        |
| Interop   | OpenAPI 3.1 (`/v1/openapi.json`, Redoc at `/v1/docs`); OGC WFS/WMS/WMTS |
| GIS CRS   | EPSG:4326 (WGS84) storage                                             |

**Zero-setup DB:** `server/src/db.js` uses `MONGODB_URI` if set; otherwise it spins up an
in-memory MongoDB via `mongodb-memory-server` (a devDependency). On boot, `index.js`
auto-seeds if the parcels collection is empty. So `npm install && npm run dev` in `server/`
works with **no external MongoDB required**.

---

## 4. Domain model

### ULPIN (the spatial key)
14-significant-character identifier, formatted `CH-01-0007-0400-2854`
(`state-district-village-parcel-check`). The 4-char check block is a hash of the base.
`server/src/utils/ulpin.js` mints and validates them (tamper-evident). Seeded ULPINs match
the static prototype's verify registry (e.g. `LS-VER-7F3A9C2E → CH-01-0007-0400-2854`).

### Three-layer spatial model (embedded in each Parcel)
- **Base** (public): cadastre geometry + ULPIN + area + centroid.
- **Essential** (consent-gated): RoR / ownership, registration, zoning, encumbrance.
- **Use-case** (restricted): property tax, utilities.

`server/src/utils/parcelView.js` enforces the gating: base is always visible; protected
layers are replaced with `{protected:true, access}` unless the caller is staff or presents
a valid consent token scoped to that parcel + layer.

---

## 5. Server status — COMPLETE ✅

All 9 PRD modules and the functional requirements are implemented. API is versioned under
`/v1`; OGC under `/geoserver`. Best-effort auth runs on every request; `requireRole`
guards staff endpoints.

| Module | Area                        | Key endpoints                                                                 | FRs |
|-------:|-----------------------------|-------------------------------------------------------------------------------|-----|
| —      | Auth                        | `POST /v1/auth/login`, `GET /v1/auth/me`, `GET /v1/auth/demo-users`           | —   |
| M1     | Parcel explorer             | `GET /v1/parcels` (bbox/q/landUse → FeatureCollection), `/:ulpin`, `/geojson`, consent-gated `/:ulpin/ror`, `/:ulpin/encumbrance` | FR-01/02/03 |
| M2     | ULPIN registry              | `/:ulpin/validate`, `/resolve`, `/lineage`, `POST /mint`, `POST /legacy-map`  | FR-04/05 |
| M3     | Layer catalogue             | `GET /v1/layers` (grouped by tier), `/:key`                                   | —   |
| M4     | Open API gateway            | `GET /v1/openapi.json`, `GET /v1/docs` (Redoc); OGC `/geoserver/wfs|wms|wmts` | —   |
| M5     | Consent & data-exchange     | `POST /v1/consent`, `GET /v1/consent`, `/:token`, `POST /:token/revoke`       | FR-12 |
| M6     | Schema mapping              | `GET /v1/mapping`, `/:key`, `POST /:key/apply` (transform engine + trace)     | FR-06 |
| M7/M8  | Service requests & workflow | `POST /v1/service-requests`, `GET` (queue), `/:id`, `POST /:id/transition|objection|assign` | FR-08/09/11 |
| —      | Certificates                | `POST /v1/certificates`, `GET /:recordId/verify` (public, tamper-evident), `/:recordId`, list | FR-07 |
| M9     | Geo-intelligence            | `GET /v1/geo-intel`, `/dashboard` (KPIs), `/parcel/:ulpin`, `POST /dispute-risk/:ulpin`, `POST /scan/change-detection`, `POST /:id/status` | FR-13/14 |
| —      | Audit trail                 | `GET /v1/audit` (admin/steward, immutable)                                    | FR-10 |

**Verification done (pure-JS self-tests, all passing):**
- ULPIN mint/validate matches prototype (`CH-01-0007-0400-2854`); tampering detected.
- Mapping engine transforms sample input → exact expected output (10 fields).
- ID/hash helpers are stable and tamper-sensitive.
- Dispute-risk scoring: seeded parcel[3] → **high (1.0)** with itemised factors; clean
  parcel → **low (0)**; change-detection is deterministic per ULPIN.
- Every server file passes `node --check`.

---

## 6. Client status — SCAFFOLD DONE, UI PENDING 🚧

**Done (`client/`):**
- `package.json`, `vite.config.js` (proxies `/v1`, `/geoserver`, `/health` → `:8080`),
  `index.html`.
- `src/api.js` — typed fetch wrapper for **every** server route, JWT + consent-token
  handling, error normalisation.
- `src/auth.jsx` — auth context (login/logout/me, `isStaff`), token persisted in
  localStorage.
- `src/lang.jsx` + `src/i18n.js` — EN/HI, ~120 keys, ported from prototype and extended
  for the console/consent/geo-intel screens.
- `src/lib/format.js` — land-use colour ramp, date/area/money formatters, risk classes.
- `src/lib/qr.js` — deterministic pseudo-QR for the certificate.
- `src/styles.css` — full "refined-green" design system + console styles (tabs, tables,
  KPI cards, distribution bars, mapping playground, login).

**Still to build (tasks #26, #27):**
- `src/main.jsx` — mounts `<App/>` inside `AuthProvider` + `LangProvider` + Router,
  imports `styles.css` and `maplibre-gl/dist/maplibre-gl.css`.
- `src/App.jsx` — routes: `/` citizen portal, `/verify`, `/console`.
- Shared components: `BrandMark`, `TopBar` (brand + nav + search + lang + sign-in),
  `Modal`, `Toast`/toast context.
- **Citizen portal** (`pages/CitizenPortal.jsx`, task #26): MapLibre parcel explorer
  (OSM raster basemap, land-use fill, hover popup, click-to-select), search with
  suggestions, `ParcelPanel` with consent-gated layer blocks + unlock-by-token, certificate
  issue + `VerifyModal`, service-request file + track.
- **Officer console** (`pages/Console.jsx`, task #27): login, dashboard KPIs
  (`/v1/geo-intel/dashboard`), workflow queue with transitions/assign, geo-intel flags +
  change-scan + dispute scoring, consent registry, audit trail, schema-mapping playground,
  layer catalogue, link to `/v1/docs`.

**Brand mark SVG** (three stacked survey sheets), reuse in TopBar and certificate:
```html
<svg class="mark" viewBox="0 0 40 40" aria-hidden="true"><g fill="none" stroke-width="2">
  <path d="M6 24 L20 17 L34 24 L20 31 Z" fill="#C9942B" stroke="#C9942B"/>
  <path d="M6 18 L20 11 L34 18 L20 25 Z" fill="#1F8A70" stroke="#1F8A70"/>
  <path d="M6 12 L20 5 L34 12 L20 19 Z" fill="#12463C" stroke="#12463C"/>
</g></svg>
```
Map framing from prototype: center `[76.785, 30.7345]`, zoom `15.3`; OSM raster with
`raster-saturation: -0.68, raster-opacity: 0.86`. Land-use colours live in
`client/src/lib/format.js`.

---

## 7. How to run

**Backend** (from `server/`):
```bash
npm install
cp .env.example .env      # optional; defaults work out of the box
npm run dev               # nodemon on http://localhost:8080  (in-memory Mongo + auto-seed)
# API docs: http://localhost:8080/v1/docs
```

**Frontend** (from `client/`, once UI is built):
```bash
npm install
npm run dev               # Vite on http://localhost:5173, proxies API to :8080
```

A root-level `package.json` with `concurrently` to run both is planned (task #28).

---

## 8. Demo credentials & IDs

Password for **all** demo accounts: `landstack123`
(also returned by `GET /v1/auth/demo-users`).

| Email                    | Role             |
|--------------------------|------------------|
| citizen@landstack.in     | citizen          |
| patwari@landstack.in     | patwari          |
| registrar@landstack.in   | sub_registrar    |
| planner@landstack.in     | planner          |
| tax@landstack.in         | tax_officer      |
| bank@landstack.in        | institution (API key `ls-inst-demo-key-001`) |
| admin@landstack.in       | admin            |
| steward@landstack.in     | national_steward |

Pre-seeded demo objects: certificates `LS-VER-7F3A9C2E`, `LS-VER-1B8D4402`; consent token
`LS-CONSENT-DEMO01` (parcel[0], scope RoR+encumbrance); service request `LS-SR-DEMO0001`
(mutation on parcel[3], `under_review`).

---

## 9. Sandbox constraints (why verification is limited here)

The build environment **cannot reach the npm registry** (403) and has **no MongoDB, no
esbuild/babel, no JSX build tooling**. Therefore in-session we **cannot** `npm install`,
run the stack, or compile JSX. Verification strategy used:
- Every plain-`.js` file is checked with `node --check`.
- Dependency-free modules are executed directly in Node to prove correctness.
- JSX is written to idiomatic conventions and delimiter/tag-balance checked.

The user runs `npm install` / `npm run dev` on their own machine. Code is written to be
correct and conventional so it runs there unchanged.

---

## 10. Remaining task list

- **#26** Client: citizen portal (map, search, parcel panel w/ consent gating, verify,
  service requests).
- **#27** Client: officer console (login, dashboard KPIs, workflow queue, geo-intel,
  consent registry, audit, schema mapping, API docs link).
- **#28** Root scripts (`concurrently`), `README`/run docs, final `node --check` sweep +
  git commit.
