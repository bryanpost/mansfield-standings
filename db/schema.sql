-- Mansfield standings: canonical database schema (Supabase / Postgres).
--
-- This file is the source of truth for a fresh database. It is safe to re-run.
-- An existing database is brought up to date with the files in db/migrations/.
-- Run in the Supabase dashboard: SQL Editor -> paste -> Run.
--
-- Trust model: anyone with the site's public key may READ everything and may
-- change ONLY games.winner_no and teams.draw_value. Nobody can insert, delete,
-- or change any other column from the browser; the schedule and team list are
-- loaded from the dashboard. Every change to those two columns is logged.

-- 1. TABLES -----------------------------------------------------------------

create table if not exists public.teams (
  id          uuid primary key default gen_random_uuid(),
  season      text not null,                    -- e.g. '2026-27'
  shift       text not null,                    -- e.g. 'Tuesday Dinner'
  team_no     int  not null,                    -- number on the posted sheet
  name        text not null,
  -- Last week that counts toward the first half. NO DEFAULT on purpose: it comes
  -- from the season's schedule and differs by season (and by team on Wed Late).
  first_half_end_week int not null,
  draw_value  text,                             -- '12.5', 'X', or null (not recorded)
  unique (season, shift, team_no),
  constraint teams_draw_value_format check (
    draw_value is null
    or draw_value ~ '^(X|([0-9]|[1-6][0-9]|7[01])(\.[05])?|72(\.0)?)$'
  )
);

create table if not exists public.games (
  id         uuid primary key default gen_random_uuid(),
  season     text not null,
  shift      text not null,
  week       int  not null,
  game_date  date,
  draw_time  text,                              -- '6:35' / '8:45' (display only)
  sheet      int,                               -- sheet number (display only)
  home_no    int  not null,
  away_no    int  not null,
  winner_no  int,                               -- null = not entered yet
  unique (season, shift, week, home_no, away_no),
  constraint games_distinct_teams check (home_no <> away_no),
  constraint games_winner_is_a_player check (winner_no is null or winner_no in (home_no, away_no)),
  constraint games_home_fk foreign key (season, shift, home_no)
    references public.teams (season, shift, team_no),
  constraint games_away_fk foreign key (season, shift, away_no)
    references public.teams (season, shift, team_no)
);

create index if not exists games_season_shift_week on public.games (season, shift, week);

-- Audit trail of every winner / draw-shot change. Not readable from the browser.
create table if not exists public.entry_log (
  id           bigint generated always as identity primary key,
  changed_at   timestamptz not null default now(),
  table_name   text not null,
  row_id       uuid not null,
  season       text,
  shift        text,
  column_name  text not null,
  old_value    text,
  new_value    text,
  client_ip    text
);

-- 2. SECURITY ----------------------------------------------------------------

alter table public.teams     enable row level security;
alter table public.games     enable row level security;
alter table public.entry_log enable row level security;   -- no policies = no browser access

revoke all on public.teams, public.games, public.entry_log from anon, authenticated;

-- Everyone may READ (public standings).
grant select on public.teams, public.games to anon, authenticated;
drop policy if exists "read teams" on public.teams;
drop policy if exists "read games" on public.games;
create policy "read teams" on public.teams for select using (true);
create policy "read games" on public.games for select using (true);

-- Anyone may ENTER results / draws, but ONLY those columns (column-level grants).
grant update (winner_no)  on public.games to anon, authenticated;
grant update (draw_value) on public.teams to anon, authenticated;
drop policy if exists "enter results" on public.games;
drop policy if exists "enter draws"   on public.teams;
create policy "enter results" on public.games for update using (true) with check (true);
create policy "enter draws"   on public.teams for update using (true) with check (true);

-- No INSERT/DELETE grants or policies: the public cannot add or remove rows.

-- 3. AUDIT TRIGGER -------------------------------------------------------------

create or replace function public.log_game_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ip text;
begin
  begin
    ip := (current_setting('request.headers', true)::json) ->> 'x-forwarded-for';
  exception when others then
    ip := null;
  end;
  if new.winner_no is distinct from old.winner_no then
    insert into public.entry_log (table_name, row_id, season, shift, column_name, old_value, new_value, client_ip)
    values ('games', new.id, new.season, new.shift, 'winner_no', old.winner_no::text, new.winner_no::text, ip);
  end if;
  return new;
end;
$$;

create or replace function public.log_draw_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ip text;
begin
  begin
    ip := (current_setting('request.headers', true)::json) ->> 'x-forwarded-for';
  exception when others then
    ip := null;
  end;
  if new.draw_value is distinct from old.draw_value then
    insert into public.entry_log (table_name, row_id, season, shift, column_name, old_value, new_value, client_ip)
    values ('teams', new.id, new.season, new.shift, 'draw_value', old.draw_value, new.draw_value, ip);
  end if;
  return new;
end;
$$;

revoke all on function public.log_game_change() from public;
revoke all on function public.log_draw_change() from public;

drop trigger if exists games_entry_log on public.games;
create trigger games_entry_log after update on public.games
  for each row execute function public.log_game_change();

drop trigger if exists teams_entry_log on public.teams;
create trigger teams_entry_log after update on public.teams
  for each row execute function public.log_draw_change();
