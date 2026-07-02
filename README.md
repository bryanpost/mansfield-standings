# Mansfield Curling — Standings site

**Live:** https://bryanpost.github.io/mansfield-standings/
**Repo:** https://github.com/bryanpost/mansfield-standings

Live, auto-computed league standings + open game/draw entry.
Static site (no server): the pages load React from a CDN and read/write the
Supabase database directly over its REST API. Hosted on **GitHub Pages**.

## Pages
| URL | File | Purpose | Who uses it |
|---|---|---|---|
| `/` | `index.html` | Public standings (tiebreaker engine + playoff berths) | Everyone / club site link |
| `/enter/games/` | `enter/games/index.html` | Tap-the-winner result entry | Shift captains |
| `/enter/draws/` | `enter/draws/index.html` | Draw-shot entry (once per team) | Admins |

`/enter/` (no sub-path) redirects to `/enter/games/`.

`support.js` (runtime) and `mansfield-data.js` (Supabase data layer) live at the
site root. Path rules that MUST hold for the nested entry pages to work:
- The `<script src="…support.js">` tag resolves relative to the **HTML page**, so
  `index.html` uses `./support.js` and the nested entry pages use `../../support.js`.
- The dynamic `import('./mansfield-data.js')` inside the app resolves relative to
  **support.js** (always the site root), NOT the page — so it is `./mansfield-data.js`
  on *every* page regardless of nesting. Do not "correct" it to `../../`; that
  overshoots the GitHub Pages project prefix and breaks the entry pages.

---

## How changes get deployed (current workflow)

The site source lives in a separate design project (Design Components +
`deploy/` staging folder). Changes flow to this repo like so:

1. **Author in the design project.** Edits are made to the source there and
   staged into its `deploy/` folder.
2. **Hand off to Claude Code.** Open Claude Code, run `/design-login` so it can
   see the design project's files, then paste the commit instructions produced
   in the design chat — what changed, the commit message, and "push to main."
3. **Claude Code commits + pushes to `main`** directly. No manual file copying,
   downloading, or drag-and-drop.
4. **GitHub Pages redeploys automatically** (~1 min) from `main` / root.

> The design chat can *read* this repo (to verify a push landed) but cannot push
> itself — that's why the commit step runs through Claude Code.

### GitHub Pages settings (already configured, for reference)
**Settings → Pages** → Source = **Deploy from a branch** → Branch = **main**,
folder = **/ (root)**.

### The three URLs to share
- Standings (link this from the club site): https://bryanpost.github.io/mansfield-standings/
- Results entry (give to captains): https://bryanpost.github.io/mansfield-standings/enter/games/
- Draw entry (admins): https://bryanpost.github.io/mansfield-standings/enter/draws/

The entry pages are deliberately **not** linked from the public standings — with
the open-write model, a visible button would invite anyone to change scores.
Captains bookmark the direct URLs above.

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
