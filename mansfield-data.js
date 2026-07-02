// Shared Supabase data layer for the Mansfield standings + entry pages.
// Reads/writes the `teams` and `games` tables via the PostgREST API.
// The publishable key is safe to ship publicly — Row Level Security governs access.

const SUPABASE_URL = 'https://oufdqsxesayexbohwfhx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zOqo3l_CaWlYqyCB4wISwQ_S0hI-oUp';
export const DEFAULT_SEASON = '2025-26';

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: 'Bearer ' + SUPABASE_KEY,
  'Content-Type': 'application/json',
};

async function sbGet(path) {
  const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, { headers: HEADERS });
  if (!r.ok) throw new Error('Supabase GET ' + r.status + ': ' + (await r.text()));
  return r.json();
}
async function sbPatch(path, body) {
  const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error('Supabase PATCH ' + r.status + ': ' + (await r.text()));
}

function parseDraw(v) {
  if (v == null || v === '') return null;
  if (String(v).trim().toUpperCase() === 'X') return 'X';
  const n = Number(v);
  return isNaN(n) ? 'X' : n;
}

// Returns data in the exact shape the standings/entry engines expect
// (mirrors the old season.json), plus row ids + team numbers for writes.
export async function loadSeason(season) {
  const [teams, games] = await Promise.all([
    sbGet('teams?season=eq.' + encodeURIComponent(season) + '&select=*&order=shift.asc,team_no.asc'),
    sbGet('games?season=eq.' + encodeURIComponent(season) + '&select=*&order=shift.asc,week.asc'),
  ]);

  const shifts = [];
  const nameByShiftNo = {};
  teams.forEach(t => {
    if (!shifts.includes(t.shift)) shifts.push(t.shift);
    (nameByShiftNo[t.shift] = nameByShiftNo[t.shift] || {})[t.team_no] = t.name;
  });

  const outTeams = teams.map(t => ({ name: t.name, shift: t.shift, team_no: t.team_no, draw: t.draw_value ?? null }));

  // per-team half breakpoints (object keyed by team name) — engine handles this uniformly
  const halfBreak = {};
  teams.forEach(t => { (halfBreak[t.shift] = halfBreak[t.shift] || {})[t.name] = t.first_half_end_week; });

  const draws = teams
    .filter(t => t.draw_value != null && t.draw_value !== '')
    .map(t => ({ shift: t.shift, team: t.name, val: parseDraw(t.draw_value) }));

  const outGames = games.map(g => {
    const nm = nameByShiftNo[g.shift] || {};
    return {
      id: g.id, shift: g.shift, week: g.week, date: g.game_date,
      a: nm[g.home_no], b: nm[g.away_no],
      home_no: g.home_no, away_no: g.away_no,
      winner: g.winner_no != null ? nm[g.winner_no] : null,
      winner_no: g.winner_no,
    };
  });

  const weeks = outGames.reduce((m, g) => Math.max(m, g.week), 0);
  return { season, shifts, weeks, halfBreak, teams: outTeams, games: outGames, draws };
}

// Set (or clear) the winner of a game. winnerNo = team_no or null.
export async function setWinner(gameId, winnerNo) {
  await sbPatch('games?id=eq.' + gameId, { winner_no: winnerNo });
}

// Set (or clear) a team's draw-shot value.
export async function setDraw(season, shift, teamNo, value) {
  await sbPatch(
    'teams?season=eq.' + encodeURIComponent(season) +
    '&shift=eq.' + encodeURIComponent(shift) +
    '&team_no=eq.' + teamNo,
    { draw_value: value }
  );
}
