# Deploying Land Stack (full stack, free tier)

This guide deploys the **complete** app — live API, database, consent-gated layers,
workflows, certificates, geo-intelligence and the officer console — on three free
services that work together:

```
   Browser
      │  (only ever talks to your Vercel domain — no CORS)
      ▼
┌──────────────┐   /v1/* and /health rewritten to  ┌──────────────────┐
│    Vercel    │ ────────────────────────────────► │      Render      │
│  (frontend)  │            server-side proxy       │  (Express API)   │
│  client/dist │                                    │   npm start      │
└──────────────┘                                    └────────┬─────────┘
                                                             │ mongodb+srv
                                                             ▼
                                                   ┌──────────────────┐
                                                   │  MongoDB Atlas   │
                                                   │   (free M0)      │
                                                   └──────────────────┘
```

- **MongoDB Atlas (free M0)** — the persistent database.
- **Render (free web service)** — runs the Express server exactly like `npm start`
  does locally: it connects to Atlas, **auto-seeds the demo data on first boot**, and
  serves the API. No serverless caveats, no function timeouts.
- **Vercel** — builds the React client and serves it, and **proxies `/v1/*` to Render**
  via a rewrite so the browser sees a single origin (no CORS, no client code changes).

> ⚠️ All data is fictional demonstration data — not a real land record. The demo login
> credentials are intentionally public and for demonstration only.

**You do not need to change any application code.** Everything is driven by two files
already in the repo: `render.yaml` (backend) and `vercel.json` (frontend + API proxy).

---

## Before you start

Create free accounts (GitHub login works for all three):

- **GitHub** — https://github.com  (hosts the code)
- **MongoDB Atlas** — https://www.mongodb.com/cloud/atlas/register
- **Render** — https://render.com
- **Vercel** — https://vercel.com

**Deploy order matters:** Atlas → Render → Vercel. Vercel needs the Render URL, and
Render needs the Atlas connection string, so we build them in that order.

---

## Step 1 — Push the code to GitHub

If the project isn't on GitHub yet, create an **empty** repository there (no README),
then from the project root (`D:\SIH2026`):

```bash
git init                 # skip if the repo is already initialised
git add -A
git commit -m "Land Stack full-stack app + deployment config"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

If the repo already has a remote, just `git add -A && git commit -m "deploy config" && git push`.

---

## Step 2 — Create the database (MongoDB Atlas, free)

1. In Atlas, **Create a cluster** and choose the **M0 (Free)** tier. Pick a region near
   you (or near your Render region) and click **Create**.
2. **Database Access** (left sidebar) → **Add New Database User**.
   - Authentication: **Password**.
   - Username: `landstack` (or anything). Set a password — **copy it somewhere**.
   - Built-in role: **Read and write to any database**. Click **Add User**.
3. **Network Access** (left sidebar) → **Add IP Address** → **Allow access from anywhere**
   (`0.0.0.0/0`) → **Confirm**.
   *(Render's free instances use rotating IPs, so a fixed allow-list won't work. For a
   demo this is fine; the data is fictional.)*
4. **Get the connection string:** Clusters → **Connect** → **Drivers** → copy the string.
   It looks like:

   ```
   mongodb+srv://landstack:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```

   Replace `<password>` with the database user's password from step 2. You **don't** need
   to add a database name to the URL — the server sets it from `DB_NAME` (`landstack`).
   Keep this final string for Step 3.

---

## Step 3 — Deploy the backend (Render)

The repo includes `render.yaml`, so Render can configure the service for you.

**Using the Blueprint (recommended):**

1. In Render: **New +** → **Blueprint**.
2. Connect your GitHub account and select this repository.
3. Render reads `render.yaml` and shows a service named **landstack-api** (free plan,
   root directory `server`, build `npm install`, start `npm start`).
4. It will prompt for the secret env vars marked `sync: false`:
   - **MONGODB_URI** — paste the Atlas string from Step 2 (with the real password).
   - **CLIENT_ORIGIN** — leave blank for now (optional; not needed with the proxy).
   - `JWT_SECRET` is generated automatically; `DB_NAME`, `AUTO_SEED`, `NODE_ENV` are preset.
5. Click **Apply** / **Create**. Render installs and starts the server.

<details>
<summary>Prefer to click it together manually instead of the Blueprint?</summary>

**New +** → **Web Service** → connect the repo, then set:
- **Root Directory:** `server`
- **Runtime:** Node
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Instance Type:** **Free**
- **Environment variables:** `MONGODB_URI` (your Atlas string), `DB_NAME=landstack`,
  `AUTO_SEED=true`, `NODE_ENV=production`, `JWT_SECRET` (any long random string).
- **Health Check Path:** `/health`
</details>

**Watch the deploy logs.** On first boot with an empty database you should see the
auto-seed run and the server come up:

```
[seed] empty database detected → seeding demo data
[seed] inserted: {"parcels":...,"users":...,...}
[api] listening on http://0.0.0.0:10000  (or similar)
```

**Copy your service URL** from the top of the Render page — something like
`https://landstack-api.onrender.com` (Render may append characters if the name is taken,
e.g. `https://landstack-api-ab12.onrender.com`). **Use whatever Render actually shows.**

**Smoke-test the API** by opening these in your browser:
- `https://YOUR-RENDER-URL/health` → `{"status":"ok","service":"land-stack-api",...}`
- `https://YOUR-RENDER-URL/v1/docs` → the interactive OpenAPI docs.

---

## Step 4 — Point the frontend at your backend, then deploy (Vercel)

**4a. Put your real Render URL into `vercel.json`.** Open `vercel.json` at the repo root
and replace every `https://landstack-api.onrender.com` with your actual Render URL from
Step 3 (there are three of them — `/v1`, `/geoserver`, `/health`). Then commit & push:

```bash
git add vercel.json
git commit -m "Point Vercel proxy at Render API URL"
git push
```

`vercel.json` should look like this (with your URL):

```json
{
  "rewrites": [
    { "source": "/v1/:path*", "destination": "https://YOUR-RENDER-URL/v1/:path*" },
    { "source": "/geoserver/:path*", "destination": "https://YOUR-RENDER-URL/geoserver/:path*" },
    { "source": "/health", "destination": "https://YOUR-RENDER-URL/health" },
    { "source": "/:path*", "destination": "/index.html" }
  ]
}
```

**4b. Import the project into Vercel.**

1. In Vercel: **Add New…** → **Project** → import your GitHub repo.
2. **Leave the Root Directory as the repository root** (do *not* set it to `client`).
   Vercel reads `vercel.json`, which already defines the build:
   - Install: `npm --prefix client install`
   - Build: `npm --prefix client run build`
   - Output: `client/dist`
3. You don't need any environment variables on Vercel.
4. Click **Deploy**.

When it finishes, open your Vercel URL (e.g. `https://landstack.vercel.app`).

---

## Step 5 — Verify every feature works

Open the Vercel URL and check:

**Citizen portal (no login):**
- The **map** loads and parcels appear, colour-coded by land use.
- **Search** by ULPIN / owner / address returns suggestions.
- Open a parcel → the **Base** layer shows; **Essential/Use-case** layers are gated.
- **Verify ownership** issues a certificate with a QR and an `LS-VER-…` id.
- The **Verify** page confirms a valid id (try `LS-VER-7F3A9C2E`) and flags tampering.
- **Apply for a service** returns a request id you can track.

**Officer console** (`/console` → sign in with a one-click demo account):
- **Overview** dashboard shows KPIs and distributions.
- **Workflow queue** advances a request; completion issues a fresh certificate.
- **Geo-intelligence** runs a change scan and scores dispute risk.
- **Consent registry** issues a token — paste it into a citizen parcel to unlock a gated
  layer — then revoke it.
- **Audit trail** is visible when signed in as admin / national steward.

> The **first** request after ~15 minutes of inactivity can take ~50 seconds while
> Render's free instance wakes up (see below). After that it's fast.

---

## Troubleshooting

**First load is very slow (~50s), then fine.** Expected on Render's free tier: the
instance sleeps after ~15 min idle and cold-starts on the next request. Options: just
wait it out for the demo, upgrade Render to a paid instance, or ping
`https://YOUR-RENDER-URL/health` every ~10 min with a free uptime monitor to keep it warm.

**Login fails / tables are empty.** Check the Render logs. Make sure `MONGODB_URI` is set
and correct, and that Atlas **Network Access** includes `0.0.0.0/0`. Auto-seed only runs
when the parcel collection is empty — if the DB connected but wasn't seeded, open the
Render **Shell** and run `npm run seed` (this resets and reseeds).

**Render log says `Cannot find module 'mongodb-memory-server'`.** That means `MONGODB_URI`
wasn't set, so the server tried its in-memory fallback (whose module isn't installed in
production). Set `MONGODB_URI` to your Atlas string and redeploy.

**API/network errors in the browser, or CORS complaints.** The frontend should call
same-origin `/v1/...` paths that Vercel proxies to Render. Confirm `vercel.json` still has
the rewrites and that you **redeployed after editing the Render URL** into it. If you
changed the Render URL, update `vercel.json` and push again.

**Refreshing `/console` or `/verify` gives a 404.** The SPA catch-all rewrite is missing —
ensure the `{ "source": "/:path*", "destination": "/index.html" }` line is present in
`vercel.json`.

**Re-seed or reset the demo data.** Locally: put `MONGODB_URI` in `server/.env`, then
`npm run seed`. On Render: open the service **Shell** and run `npm run seed`.

---

## Free-tier limits (so nothing surprises you)

- **Atlas M0:** 512 MB storage — far more than this demo needs.
- **Render free web service:** sleeps after ~15 min idle (~50s cold start); shared CPU.
  Fine for a demo/hackathon.
- **Vercel Hobby:** generous static hosting + the proxy rewrites; no server cost since the
  backend lives on Render.

---

*Deployment guide for Land Stack · Smart India Hackathon 2026 · fictional demonstration
data only — not a real land record.*
