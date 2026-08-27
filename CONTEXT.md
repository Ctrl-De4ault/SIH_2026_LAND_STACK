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
   requirement — `server/` (done) + `client/` (done).
4. A **free-tier deployment path** — `DEPLOYMENT.md` + `render.yaml` + `vercel.json` (done).

### The demonstration dataset

The fictional cadastre is a **mock Prayagraj (Uttar Pradesh)** pilot: 12 parcels across four
revenue blocks — **Civil Lines, Georgetown, Tagore Town, Rajapur** — laid out as irregular
mohalla blocks (each with its own origin, street bearing and lane rhythm), not a uniform
grid. Areas are computed from the actual polygon and reported in m², hectares and local UP
units (**bigha / biswa**, 1 bigha = 20 biswa ≈ 2529 m²). `server/src/seed/seedData.js` and
`assets/data.js` generate **byte-identical** geometry and ULPINs, so the static demo and the
full stack always agree.

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
├── DEPLOY.md               GitHub push + Pages deploy guide (static demo only)
├── DEPLOYMENT.md           full-stack free-tier guide (Atlas + Render + Vercel)
├── render.yaml             Render blueprint for the backend
├── vercel.json             Vercel build + `/v1` proxy for the frontend
├── package.json            root scripts (concurrently runs server + client)
├── index.html              static citizen-portal prototype (file:// runnable)
├── assets/
│   ├── data.js             mock parcel data (12 Prayagraj parcels) + ULPIN algo
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
│       └── seed/     (seedData.js = the Prayagraj cadastre; seed.js runs it)
└── client/                 ← React + Vite frontend (COMPLETE)
    ├── package.json  vite.config.js  index.html
    └── src/
        ├── main.jsx       mounts App inside Auth + Lang providers + Router
        ├── App.jsx        routes: / portal, /verify, /console
        ├── api.js         fetch wrapper covering every server route
        ├── ui.jsx         BrandMark, TopBar, Modal, toast context
        ├── i18n.js        EN/HI strings (ported + extended)
        ├── lang.jsx       language context/provider
        ├── auth.jsx       auth context/provider (JWT, role)
        ├── styles.css     ported design system + console styles
        ├── pages/         CitizenPortal, VerifyPage, Console
        ├── components/    MapView, SearchBox, ParcelPanel, LocationPanel,
        │                  Certificate, CitizenModals
        └── lib/
            ├── constants.js
            ├── format.js   land-use colours, map framing, formatters
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
14-significant-character identifier, formatted `UP-21-0007-0400-5374`
(`state-district-village-parcel-check`). The 4-char check block is a hash of the base.
`server/src/utils/ulpin.js` mints and validates them (tamper-evident). Seeded ULPINs match
the static prototype's verify registry (e.g. `LS-VER-7F3A9C2E → UP-21-0007-0400-5374`).
Village codes map to the four revenue blocks: `0007` Civil Lines, `0008` Georgetown,
`0009` Tagore Town, `0010` Rajapur.

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
- ULPIN mint/validate matches prototype (`UP-21-0007-0400-5374`); tampering detected.
- Mapping engine transforms sample input → exact expected output (10 fields).
- ID/hash helpers are stable and tamper-sensitive.
- Dispute-risk scoring: seeded parcel[3] → **high (1.0)** with itemised factors; clean
  parcel → **low (0)**; change-detection is deterministic per ULPIN.
- Every server file passes `node --check`.

---

## 6. Client status — COMPLETE ✅

**Foundations (`client/`):**
- `package.json`, `vite.config.js` (proxies `/v1`, `/geoserver`, `/health` → `:8080`),
  `index.html`. No `base` override and no custom `outDir` — required for the Vercel deploy.
- `src/api.js` — typed fetch wrapper for **every** server route, JWT + consent-token
  handling, error normalisation. Uses **relative** paths (`/v1/...`) so the same build works
  locally and behind the Vercel proxy.
- `src/auth.jsx` — auth context (login/logout/me, `isStaff`), token persisted in
  localStorage.
- `src/lang.jsx` + `src/i18n.js` — EN/HI, ~120 keys.
- `src/lib/format.js` — land-use colour ramp, map framing, date/area/money formatters,
  risk classes, haversine helpers for the point inspector.
- `src/lib/qr.js` — deterministic pseudo-QR for the certificate.
- `src/styles.css` — full "refined-green" design system + console styles.

**Screens built:**
- `src/main.jsx` → `AuthProvider` + `LangProvider` + Router; `src/App.jsx` routes
  `/` citizen portal, `/verify`, `/console`.
- `src/ui.jsx` — `BrandMark`, `TopBar` (brand + nav + lang + sign-in), `Modal`, toasts.
- **Citizen portal** (`pages/CitizenPortal.jsx`): MapLibre parcel explorer, `SearchBox`
  with suggestions, `ParcelPanel` (consent-gated layer blocks + unlock-by-token, each field
  rendered exactly once), `LocationPanel` point inspector (reverse geocode + nearest parcel
  + nearby land-use mix), certificate issue, service-request file + track.
- **Officer console** (`pages/Console.jsx`): login, dashboard KPIs, workflow queue with
  transitions/assign, geo-intel flags + change-scan + dispute scoring, consent registry,
  audit trail, schema-mapping playground, layer catalogue, link to `/v1/docs`.
- **Verify page** (`pages/VerifyPage.jsx`): public `LS-VER-…` lookup, tamper detection.

**Brand mark SVG** (three stacked survey sheets), reused in TopBar and certificate:
```html
<svg class="mark" viewBox="0 0 40 40" aria-hidden="true"><g fill="none" stroke-width="2">
  <path d="M6 24 L20 17 L34 24 L20 31 Z" fill="#C9942B" stroke="#C9942B"/>
  <path d="M6 18 L20 11 L34 18 L20 25 Z" fill="#1F8A70" stroke="#1F8A70"/>
  <path d="M6 12 L20 5 L34 12 L20 19 Z" fill="#12463C" stroke="#12463C"/>
</g></svg>
```
Map framing: center `[81.8362, 25.4516]`, zoom `15.6` (the Prayagraj cadastre spans about
650 m × 645 m); OSM raster with `raster-saturation: -0.68, raster-opacity: 0.86`. Both the
centre and the land-use colours live in `client/src/lib/format.js` — change them there only.

---

## 7. How to run

**Both at once** (from the repo root):
```bash
npm install               # installs concurrently
npm run dev               # server on :8080 + client on :5173
```

**Backend only** (from `server/`):
```bash
npm install
cp .env.example .env      # optional; defaults work out of the box
npm run dev               # nodemon on http://localhost:8080  (in-memory Mongo + auto-seed)
# API docs: http://localhost:8080/v1/docs
```

**Frontend only** (from `client/`):
```bash
npm install
npm run dev               # Vite on http://localhost:5173, proxies API to :8080
```

**Static demo, zero install:** open `index.html` directly (works from `file://`).

**Re-seed after changing the cadastre:** the ULPINs are derived from the block/parcel codes,
so editing `seedData.js` changes them. Run `npm run seed` in `server/` (or drop the database)
so old parcels do not linger alongside new ones.

**Deploy online (free tier):** follow `DEPLOYMENT.md` — MongoDB Atlas M0 + Render (backend,
persistent process so boot auto-seed works) + Vercel (frontend, with a `/v1` rewrite so the
browser stays same-origin and no CORS or client change is needed).

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

Pre-seeded demo objects: certificates `LS-VER-7F3A9C2E` (parcel[0] → `UP-21-0007-0400-5374`,
Rakesh Chandra Dwivedi) and `LS-VER-1B8D4402` (parcel[8] → `UP-21-0010-0408-7710`,
Shalini Srivastava); consent token `LS-CONSENT-DEMO01` (parcel[0], scope RoR+encumbrance);
service request `LS-SR-DEMO0001` (mutation on parcel[3] → `UP-21-0008-0403-4528`,
`under_review`).

Good things to try in a demo: search `Shalini` or `UP-21`; open the disputed Georgetown
parcel `UP-21-0008-0403-4528` (high dispute risk, pending inheritance mutation, tax arrears);
unlock parcel[0]'s Essential layers with `LS-CONSENT-DEMO01`.

---

## 9. Sandbox constraints (why verification is limited here)

The build environment **cannot reach the npm registry** (403) and has **no MongoDB**, so
in-session we cannot `npm install` or actually boot the stack. `client/node_modules` was
installed on Windows, so the bundled `esbuild` binary is `win32-x64` and will not execute
in the Linux sandbox — but `@babel/parser` inside it is pure JS and **is** usable.
Verification strategy used:
- Every plain-`.js` file is checked with `node --check`.
- Every file under `client/src` (19 files, JS + JSX) is parsed with
  `@babel/parser` using the `jsx` plugin — all parse cleanly.
- Every `t("…")` key used in the client is checked against `i18n.js`: 112 keys used,
  139 defined, EN and HI in exact parity, nothing missing.
- Dependency-free modules are executed directly in Node to prove correctness (ULPIN,
  mapping engine, dispute scoring, seed geometry incl. a SAT no-overlap test).

The user runs `npm install` / `npm run dev` on their own machine. Code is written to be
correct and conventional so it runs there unchanged.

---

## 10. Remaining work

Nothing is outstanding on the build itself — PRD, static prototype, server, client and the
deployment path are all done. Open items are all "run it somewhere real":

- Run `npm install && npm run dev` locally (the sandbox that authored this cannot reach the
  npm registry, so the stack has never actually been booted here).
- Follow `DEPLOYMENT.md` to put it online, replacing the three placeholder Render URLs in
  `vercel.json` with the real service URL before pushing.
- Optional polish ideas: a second mapping profile for a different state's legacy export,
  parcel-split/merge lineage demo, and a rural block to sit alongside the four urban ones.
