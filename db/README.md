# Database

Supabase (Postgres). `schema.sql` is the source of truth for a fresh database;
`migrations/` upgrades an existing one. Both are safe to re-run, and both were
tested against a local Postgres 16 (fresh install, upgrade from the original
`setup.sql`, anon-role permission checks, audit-log trigger).

| File | Use |
|---|---|
| `schema.sql` | Full current schema: tables, constraints, RLS, column-level grants, audit trigger. |
| `migrations/001_harden_existing_db.sql` | Upgrades the original database. Read the preflight queries at the top first. |

Access model: the public key can read everything and update only
`games.winner_no` and `teams.draw_value`. Every change to those is recorded in
`entry_log` (not readable from the browser; view it in the dashboard).
Undo a bad entry by looking it up in `entry_log` and restoring `old_value`.
