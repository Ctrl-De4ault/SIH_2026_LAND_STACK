# Deploy Land Stack to GitHub Pages

The repository is **already initialized and committed** for you (one commit on the `main` branch). Because this sandbox has no network access to GitHub and none of your credentials, the actual push has to run from **your own machine** — but that's just two commands, and everything else is ready.

> This is a pure static site, so **GitHub Pages hosts it for free with zero build config**.

---

## Prerequisites

- A **GitHub account** — https://github.com
- **Git installed** on your machine — check with `git --version`. If missing: https://git-scm.com/download/win
  (On first push over HTTPS, a browser window opens to log you in — no token to manage.)

---

## Step 1 — Create an empty repo on GitHub

1. Go to **https://github.com/new**
2. **Repository name:** `land-stack` (or anything you like)
3. **Visibility:** **Public**  ← required for free GitHub Pages *(private Pages needs a paid plan)*
4. **Do NOT** tick "Add a README", ".gitignore", or a license — the repo already has commits, and an initialized remote would collide.
5. Click **Create repository**.

GitHub then shows a "push an existing repository" box. Use the commands below (they're the same thing).

---

## Step 2 — Push from your machine

Open **Git Bash**, **PowerShell**, or **Command Prompt**, then:

```bash
cd D:\SIH2026

git remote add origin https://github.com/<YOUR-USERNAME>/land-stack.git
git push -u origin main
```

Replace `<YOUR-USERNAME>` with your GitHub username. If a login window pops up, sign in to GitHub — that authorizes the push.

> Already added a remote before and got "remote origin already exists"? Run
> `git remote set-url origin https://github.com/<YOUR-USERNAME>/land-stack.git` and push again.

---

## Step 3 — Turn on GitHub Pages

1. In your new repo: **Settings** → **Pages** (left sidebar).
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. **Branch:** `main`  ·  **Folder:** `/ (root)`  →  **Save**.
4. Wait ~1 minute and refresh. Pages shows your live URL:

```
https://<YOUR-USERNAME>.github.io/land-stack/
```

That's the working demo. The PRD is also live at:

```
https://<YOUR-USERNAME>.github.io/land-stack/Land-Stack-PRD.html
```

---

## Verifying it works

- The map loads 12 colour-coded parcels. Click one → the record panel slides in.
- Search `Harpreet` or `CH-01` → autocomplete suggestions appear.
- Open a parcel → **Verify ownership** → a certificate with a QR + `LS-VER-…` ID.
- **Verify a record** → paste `LS-VER-7F3A9C2E` → shows as valid.

Because all asset paths are **relative** (`assets/...`) and MapLibre loads from a CDN, the site works correctly under the `/land-stack/` subpath with no changes.

---

## Optional

**Attribute the commit to you.** The initial commit was authored as "Land Stack" by the prototype tooling. To make it yours before pushing (or amend after):

```bash
git config user.name  "Your Name"
git config user.email "you@example.com"
git commit --amend --reset-author --no-edit
```

**Prefer not to use the command line?** Install **GitHub Desktop** (https://desktop.github.com), choose *File → Add local repository → `D:\SIH2026`*, then *Publish repository* (uncheck "Keep this code private"). Then do Step 3.

**Have the GitHub CLI?** From `D:\SIH2026`:
`gh repo create land-stack --public --source=. --remote=origin --push`

---

## Updating the site later

Any time you change files:

```bash
cd D:\SIH2026
git add -A
git commit -m "describe your change"
git push
```

Pages redeploys automatically within a minute.

---

*Static prototype for Smart India Hackathon 2026 — demonstration data only.*
