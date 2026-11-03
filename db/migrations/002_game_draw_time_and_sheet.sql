-- Migration 002: which draw and sheet each game is on (shown on the entry page).
-- Run in the Supabase SQL Editor. Safe to re-run. Nothing else changes: the
-- public key still cannot write these columns (only winner_no and draw_value).
alter table public.games add column if not exists draw_time text;   -- '6:35' / '8:45'
alter table public.games add column if not exists sheet     int;
