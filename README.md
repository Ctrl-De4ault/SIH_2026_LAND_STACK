# Land Stack — GIS-based Digital Public Infrastructure for Land Governance

**Land Stack** is an integrated, GIS-based **Digital Public Infrastructure (DPI) for land governance** in India, built for **Smart India Hackathon 2026** (Department of Land Resources problem statement).

It is a **parcel-centric platform**: every land record — ownership, registration, zoning, encumbrance, tax, utilities — hangs off a single spatial identity, the **ULPIN** ("Bhu-Aadhaar"). This repo contains a full-stack **MERN + MapLibre** prototype: an Express/Mongoose API, a React citizen portal, and an officer console, plus the Standard Technical Document (PRD).

> ⚠️ **All data is fictional demonstration data — not a real land record.** Owner names, ULPINs, deed numbers and coordinates are invented for a mock Chandigarh pilot. Demo login credentials are intentionally exposed and are for demonstration only.

---

## Two ways to run it

### A. Instant static demo (zero install)

The fastest look at the citizen journey. No build, no server, no install — **just open `index.html`** in any modern browser.

```
D:\SIH2026\index.html   ← double-click, or drag into a browser tab
```

Basemap tiles and MapLibre load from the internet; offline, parcels still render on a plain background (graceful degradation).

### B. Full-stack app (the real deliverable)

The complete DPI: live API, consent-gated layers, workflows, verifiable certificates, geo-intelligence and an officer console.

**Prerequisites:** Node.js 18+ and npm. **No database install needed** — the server auto-starts an in-memory MongoDB on boot.

```bash
# from the repo root (D:\SIH2026)
npm run install:all     # installs root + server + client dependencies
npm run dev             # starts API (:8080) and client (:5173) together
```

Then open **http://localhost:5173**. The API's interactive docs are at **http://localhost:8080/v1/docs**.

That's it. On first boot the server spins up an in-memory MongoDB and seeds it with the mock Chandigarh dataset automatically. To use a **persistent** database instead, copy `server/.env.example` to `server/.env` and set `MONGODB_URI` (a local `mongodb://127.0.0.1:27017` or an Atlas connection string).

<details>
<summary>Running the two services separately</summary>

```bash
npm run dev:server      # API only, on :8080  (nodemon)
npm run dev:client      # Vite dev server only, on :5173
npm run seed            # re-seed the database explicitly
npm run build           # production build of the client
```
The Vite dev server proxies `/v1`, `/health` and `/geoserver` to the API on `:8080`, so the client talks to the API with no CORS setup.
</details>

### C. Deploy it online (free tier)

To put the full stack on the internet — database, API and frontend — follow
**[`DEPLOYMENT.md`](DEPLOYMENT.md)**. It walks through MongoDB Atlas (free M0) + Render
(backend) + Vercel (frontend), using the included `render.yaml` and `vercel.json`, with no
application code changes.

---

## What you can do

**As a citizen (no login):**

- **Explore the map** — every parcel is colour-coded by land use and keyed by its ULPIN.
- **Search** by ULPIN, owner name, or address with live autocomplete.
- **Open a parcel** to see its layered record: *Base* (geometry, area, ULPIN, ownership summary, zoning), and — where permitted — *Essential* (Record of Rights, registration, encumbrance) and *Use-case* (tax, utilities).
- **Verify ownership & get a record** — issues a certificate with a scannable QR and a unique, independently-checkable record ID (`LS-VER-…`).
- **Apply for a service** (mutation, certified copy, encumbrance certificate, correction, sub-division) and **track it** by request ID.
- **Verify a record** — paste any `LS-VER-…` ID to confirm it was issued by the platform and detect tampering. Try `LS-VER-7F3A9C2E` or `LS-VER-1B8D4402`.
- **Switch language** — English / हिंदी across the whole interface.

**As an officer (Officer Console → sign in with a demo account):**

- **Overview dashboard** — parcels by dispute risk / land use, service-request pipeline, geo-flags, tax arrears, active consents.
- **Workflow queue** — advance service requests through the mutation lifecycle; completion auto-applies the mutation and issues a fresh certificate.
- **Geo-intelligence** — run a change-detection scan (mock imagery diff), score a parcel's dispute risk factor-by-factor, and triage flags.
- **Consent registry** — issue a scoped, time-boxed consent token, then paste it into the citizen Parcel Explorer to unlock consent-gated layers; revoke at any time.
- **Schema mapping** — transform a legacy record into the canonical parcel schema with a per-field trace.
- **Layer catalogue** and **immutable audit trail** (admin / national steward only).

Demo accounts are listed one-click in the console's sign-in screen (they load from `GET /v1/auth/demo-users`).

---

## How this is different from Bhulekh

Bhulekh and state RoR portals are **read-only, state-siloed, text-record viewers**. Land Stack is designed as **shared infrastructure**:

| | Bhulekh / state RoR portals | **Land Stack** |
|---|---|---|
| **Core object** | A text record of rights | A **parcel identity (ULPIN)** everything links to |
| **Layers** | Ownership text only | **Base + Essential + Use-case** unified on one parcel |
| **Map** | Separate (BhuNaksha), weakly linked | **Map-first**; every attribute hangs off the geometry |
| **Access control** | All-or-nothing, per portal | **Consent-gated** layers (token *or* staff role), DPDP-aligned |
| **Reach** | Per-state, per-department silos | **Federated DPI** with open APIs + OGC (WMS/WFS) |
| **Citizen output** | View / print a record | **Verifiable, tamper-evident record** with a checkable ID |
| **Workflows** | Out of scope | **Mutation lifecycle** with auto-apply + certificate issuance |
| **Intelligence** | None | **Change detection + dispute-risk scoring** |
| **Trust** | Implicit | **Explicit** — encumbrance, dispute-risk, tax surfaced up front + immutable audit |

---

## Architecture

```
SIH2026/
├─ package.json            # root scripts (install:all, dev, seed, build) via concurrently
│
├─ server/                 # Express + Mongoose API  (CommonJS)
│  └─ src/
│     ├─ index.js          # boot: connect DB → auto-seed → listen (:8080)
│     ├─ db.js             # MongoDB, with zero-setup in-memory fallback
│     ├─ models/           # Parcel, User, ServiceRequest, Certificate, Consent,
│     │                    #   GeoIntel, AuditLog, LayerCatalogue, MappingProfile
│     ├─ middleware/       # JWT auth + RBAC, consent-gating, audit, errors
│     ├─ routes/           # parcels, ulpin, layers, mapping, service-requests,
│     │                    #   consent, certificates, geo-intel, audit, OGC, OpenAPI
│     ├─ utils/            # ULPIN, mapping engine, geo-intel, certificate hashing
│     └─ seed/             # mock Chandigarh dataset + seeding
│
├─ client/                 # React 18 + Vite + MapLibre GL  (ES modules)
│  └─ src/
│     ├─ main.jsx          # providers: Router › Lang › Auth › Toast › App
│     ├─ App.jsx           # top bar + routes  (/  /verify  /console)
│     ├─ pages/            # CitizenPortal, VerifyPage, Console
│     ├─ components/       # MapView, SearchBox, ParcelPanel, Certificate, modals
│     ├─ api.js            # typed client over the API (bearer + consent headers)
│     ├─ auth.jsx / lang.jsx / ui.jsx   # context providers
│     └─ lib/ , i18n.js , styles.css
│
├─ index.html + assets/    # the zero-backend static demo (option A)
├─ Land-Stack-PRD.html     # Standard Technical Document / PRD
├─ DEPLOYMENT.md           # full-stack deploy: Atlas + Render + Vercel (free tier)
├─ vercel.json             # frontend build + API proxy rewrites (Vercel)
├─ render.yaml             # backend web-service blueprint (Render)
└─ DEPLOY.md               # GitHub push + Pages deploy guide (static demo only)
```

**Backend modules (per the PRD):** M1 parcel service · M2 ULPIN registry · M3 layer catalogue · M4 OGC + OpenAPI · M5 consent · M6 schema mapping · M7 service requests · M8 mutation workflow · M9 geo-intelligence. Cross-cutting: FR-07 verifiable certificates, FR-10 immutable audit, FR-11 workflow auto-apply, FR-13 change detection, FR-14 dispute-risk scoring.

**Stack:** Node/Express 4, MongoDB/Mongoose 8, JWT (bcryptjs) + API keys · React 18, Vite 5, React Router 6, MapLibre GL 4. The API also speaks **OGC WMS/WFS** and publishes an **OpenAPI** spec at `/v1/docs`.

---

## Roadmap beyond the prototype

Real PostGIS geometry store + GeoServer tile publishing; DigiLocker / API Setu integration for identity and document pull; production RBAC and consent artifacts; and expanded AI/ML (automated valuation, encroachment detection at scale). See `Land-Stack-PRD.html` for the full requirements and Standard Technical Document.

---

*Prototype for Smart India Hackathon 2026 · Department of Land Resources problem statement · fictional demonstration data only — not a real land record.*
