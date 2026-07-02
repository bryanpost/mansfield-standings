# Mansfield Curling — Standings site

Live, auto-computed league standings + open game/draw entry.
Static site (no server): the pages load React from a CDN and read/write the
Supabase database directly over its REST API. Any free static host works;
these instructions use **GitHub Pages**.

## Pages
| File | Purpose | Who uses it |
|---|---|---|
| `index.html` | Public standings (tiebreaker engine + playoff berths) | Everyone / club site link |
| `enter-results.html` | Tap-the-winner result entry | Shift captains |
| `enter-draws.html` | Draw-shot entry (once per team) | Admins |

`support.js` (runtime) and `mansfield-data.js` (Supabase data layer) must stay
next to the HTML files — the pages import them by relative path.

---

## Deploy to GitHub Pages (one time, ~10 min)

1. **Create a repo** on github.com — e.g. `mansfield-curling`. Public is fine
   (the data is already public; the publishable key is safe to ship).
2. **Add these files to the repo root.** Everything in this `deploy/` folder —
   the five site files **and** the `.github/` folder — becomes the repository
   root. Either:
   - drag-and-drop the files into the repo's web uploader, **or**
   - `git init` in this folder, then
     ```
     git add .
     git commit -m "Mansfield standings site"
     git remote add origin https://github.com/<you>/mansfield-curling.git
     git push -u origin main
     ```
3. **Turn on Pages:** repo → **Settings → Pages** → *Source* = **Deploy from a
   branch** → Branch = **main**, folder = **/ (root)** → **Save**.
4. Wait ~1 minute. Your site is at:
   ```
   https://<you>.github.io/mansfield-curling/
   ```

### The three URLs to share
- Standings (link this from the club site): `https://<you>.github.io/mansfield-curling/`
- Results entry (give to captains): `.../enter-results.html`
- Draw entry (admins): `.../enter-draws.html`

---

## Keep-alive (so Supabase never sleeps)

Free Supabase projects pause after ~7 days of inactivity. The included
**`.github/workflows/keepalive.yml`** pings the database once a day via GitHub
Actions to keep it awake — no setup needed beyond pushing the repo. It runs
automatically; you can also trigger it manually under the repo's **Actions**
tab (enable Actions there the first time if prompted).

---

## About the API key (safe to commit)

`mansfield-data.js` contains a Supabase **publishable** key (`sb_publishable_...`).
This is meant to be public — it ships to every browser that loads the site, and
hiding it would accomplish nothing (anyone can read it in DevTools). What it can
do is governed entirely by **Row Level Security**, set here to the open-entry
model: anyone can read; anyone can update game winners and draw values; nobody
can insert/delete or change schema. That is the same trust model as the physical
pegboard — a bad entry is one overwrite to fix, and paper is the backup.

**Never** commit a Supabase *service-role / secret* key — it bypasses RLS. This
project doesn't use one anywhere client-side; keep it that way.

Upgrade path if you ever want to restrict who can enter results: add a
magic-link login gate for captains (Supabase Auth) and tighten the update
policy. The standings UI wouldn't need to change.

---

## Changing things later

- **Which standings skin shows** — `index.html` defaults to the `sporty` skin.
  To ship a different one, edit the line `const skin = this.props.skin ?? 'sporty';`
  (options: `sporty`, `ledger`, `broadcast`, `brutalist`).
- **New season** — set `DEFAULT_SEASON` in `mansfield-data.js`.
- **Corrections** — fix a cell in the entry pages, or edit the row in the
  Supabase dashboard. Paper sheets are the backup.

> These are copies of the source Design Components (`Mansfield Standings.dc.html`,
> `Enter Results.dc.html`, `Enter Draws.dc.html`). Re-copy them into this folder
> whenever you update the originals.
