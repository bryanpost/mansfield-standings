-- Migration 001: bring the original database (setup.sql) up to db/schema.sql.
-- Run in the Supabase SQL Editor. Safe to re-run.
--
-- STEP 1 - PREFLIGHT. Run these four queries first, on their own.
-- Each should return ZERO rows. If any returns rows, fix that data (or tell
-- Claude what you see) before running step 2, otherwise step 2 will stop with
-- an error and change nothing.
--
--   -- games whose winner is not one of the two teams
--   select id, season, shift, week, home_no, away_no, winner_no from public.games
--    where winner_no is not null and winner_no not in (home_no, away_no);
--
--   -- games pointing at a team number that does not exist in that shift
--   select g.id, g.season, g.shift, g.week, g.home_no, g.away_no from public.games g
--    where not exists (select 1 from public.teams t where t.season=g.season and t.shift=g.shift and t.team_no=g.home_no)
--       or not exists (select 1 from public.teams t where t.season=g.season and t.shift=g.shift and t.team_no=g.away_no);
--
--   -- a team playing itself
--   select id, season, shift, week, home_no from public.games where home_no = away_no;
--
--   -- draw values in a format the site will not accept (anything other than 12, 12.5, X, ...)
--   select id, season, shift, team_no, name, draw_value from public.teams
--    where draw_value is not null
--      and upper(btrim(draw_value)) !~ '^(X|([0-9]|[1-6][0-9]|7[01])(\.[05])?|72(\.0)?)$'
--      and btrim(draw_value) <> '';
--
-- STEP 2 - run everything below this line.

begin;

-- Normalise existing draw values: blank -> null, x -> X.
update public.teams set draw_value = null           where draw_value is not null and btrim(draw_value) = '';
update public.teams set draw_value = upper(btrim(draw_value)) where draw_value is not null and draw_value <> upper(btrim(draw_value));

-- The first-half break week must now be stated explicitly for every team.
alter table public.teams alter column first_half_end_week drop default;

-- Integrity constraints.
alter table public.teams drop constraint if exists teams_draw_value_format;
alter table public.teams add constraint teams_draw_value_format check (
  draw_value is null
  or draw_value ~ '^(X|([0-9]|[1-6][0-9]|7[01])(\.[05])?|72(\.0)?)$'
);

alter table public.games drop constraint if exists games_distinct_teams;
alter table public.games add constraint games_distinct_teams check (home_no <> away_no);

alter table public.games drop constraint if exists games_winner_is_a_player;
alter table public.games add constraint games_winner_is_a_player
  check (winner_no is null or winner_no in (home_no, away_no));

alter table public.games drop constraint if exists games_home_fk;
alter table public.games add constraint games_home_fk foreign key (season, shift, home_no)
  references public.teams (season, shift, team_no);

alter table public.games drop constraint if exists games_away_fk;
alter table public.games add constraint games_away_fk foreign key (season, shift, away_no)
  references public.teams (season, shift, team_no);

create index if not exists games_season_shift_week on public.games (season, shift, week);

-- Audit trail.
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
alter table public.entry_log enable row level security;
revoke all on public.entry_log from anon, authenticated;

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

commit;
