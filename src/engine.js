// Mansfield playoff-berth engine.
//
// Pure functions: no DOM, no network, no clock. Runs unchanged in the browser
// (an ES module served by GitHub Pages) and in Node (the tests).
//
// The rules it implements are written out in docs/rules/ENGINE-RULES.md
// (pages 5-7 of the MCC guidelines). Read that file first; the comments here
// only say where each rule lives in the code.

// ---- configuration (page 5: 28 playoff spots) -------------------------------

export const SHIFT_ORDER = [
  'Tuesday Dinner', 'Tuesday Late', 'Wednesday Dinner',
  'Wednesday Late', 'Thursday Dinner', 'Thursday Late',
];

// first / second = berths from each half (winner, then runner-up), wild = shift wild cards.
export const PLAYOFF_SPOTS = {
  'Tuesday Dinner':   { first: 2, second: 2, wild: 0 },
  'Tuesday Late':     { first: 1, second: 1, wild: 0 },
  'Wednesday Dinner': { first: 2, second: 2, wild: 0 },
  'Wednesday Late':   { first: 2, second: 2, wild: 2 },
  'Thursday Dinner':  { first: 2, second: 2, wild: 0 },
  'Thursday Late':    { first: 2, second: 2, wild: 0 },
};
export const EVENT_WILD_CARDS = 4;

// Tiebreaker order (page 6). 'overall' = overall season record by one full game.
const halfCriteria = (half) => ['overall', { h2h: 'half' + half }, { h2h: 'season' }, 'draw'];
const WILD_CRITERIA = ['overall', { h2h: 'season' }, 'draw'];       // shift wild card
const EVENT_CRITERIA = ['overall', 'draw'];                         // event wild card: no head-to-head
// A tie that survives every criterion is a coin flip.

// ---- small helpers ----------------------------------------------------------

/** How far record `a` is ahead of record `b`, in games. >= 1 means a full game clear (page 6). */
export const gamesBehind = (a, b) => ((a.w - b.w) + (b.l - a.l)) / 2;

/** Draw-shot value from the database text: a number, 'X', or null (not recorded). */
export function parseDraw(v) {
  if (v == null || String(v).trim() === '') return null;
  const t = String(v).trim().toUpperCase();
  if (t === 'X') return 'X';
  const n = Number(t);
  return Number.isFinite(n) ? n : 'X';
}
// Lower is better. X and "not recorded" rank the same, below any measured value (even 72").
const drawRank = (d) => (typeof d === 'number' ? d : Infinity);

const bump = (map, key, won) => {
  const m = map.get(key) ?? { w: 0, l: 0 };
  if (won) m.w++; else m.l++;
  map.set(key, m);
};

// ---- records ----------------------------------------------------------------

/**
 * Turn raw rows into per-team state for one shift.
 * teams: { team_no, name, first_half_end_week, draw_value }
 * games: { week, home_no, away_no, winner_no }  (winner_no null = not recorded yet)
 *
 * A team's half is decided by ITS OWN first_half_end_week (Wednesday Late differs by team).
 * Head-to-head for a half counts a game only if it is in that half for BOTH teams;
 * season head-to-head always counts it.
 */
export function buildShift(name, teams, games) {
  const byNo = new Map();
  for (const t of teams) {
    byNo.set(t.team_no, {
      shift: name, no: t.team_no, name: t.name, firstHalfEnd: t.first_half_end_week,
      draw: parseDraw(t.draw_value),
      half: { 1: { w: 0, l: 0 }, 2: { w: 0, l: 0 } },
      all: { w: 0, l: 0 },
      rem: { 1: 0, 2: 0 },                       // scheduled games still without a winner, by half
      results: [],                               // 'W' / 'L' in week order
      h2h: { season: new Map(), half1: new Map(), half2: new Map() },   // keyed by opponent state
    });
  }
  const halfOf = (t, week) => (week <= t.firstHalfEnd ? 1 : 2);

  for (const g of [...games].sort((a, b) => a.week - b.week)) {
    const a = byNo.get(g.home_no), b = byNo.get(g.away_no);
    if (!a || !b) throw new Error(`${name}: game in week ${g.week} refers to unknown team ${g.home_no} or ${g.away_no}`);
    const ha = halfOf(a, g.week), hb = halfOf(b, g.week);
    if (g.winner_no == null) { a.rem[ha]++; b.rem[hb]++; continue; }
    if (g.winner_no !== g.home_no && g.winner_no !== g.away_no) {
      throw new Error(`${name}: week ${g.week}: winner ${g.winner_no} did not play in ${g.home_no}v${g.away_no}`);
    }
    const win = g.winner_no === a.no ? a : b;
    const lose = win === a ? b : a;
    const hw = win === a ? ha : hb, hl = win === a ? hb : ha;
    win.half[hw].w++; win.all.w++; win.results.push('W');
    lose.half[hl].l++; lose.all.l++; lose.results.push('L');
    bump(win.h2h.season, lose, true); bump(lose.h2h.season, win, false);
    if (hw === hl) { bump(win.h2h['half' + hw], lose, true); bump(lose.h2h['half' + hl], win, false); }
  }
  return [...byNo.values()];
}

// ---- tiebreaker engine (page 6) ---------------------------------------------

/** Teams that no other team in `set` is a full game ahead of ("one tie is not all tie"). */
export const survivors = (set, get) =>
  set.filter((x) => !set.some((y) => y !== x && gamesBehind(get(y), get(x)) >= 1));

// Head-to-head among the teams in `set`. Only usable if every pair has met at least once.
function h2hAggregate(set, scope) {
  const agg = new Map();
  let allMet = true;
  for (const x of set) {
    let w = 0, l = 0;
    for (const o of set) { if (o === x) continue; const m = x.h2h[scope].get(o); if (m) { w += m.w; l += m.l; } }
    agg.set(x, { w, l });
  }
  for (let i = 0; i < set.length; i++) for (let j = i + 1; j < set.length; j++) {
    const m = set[i].h2h[scope].get(set[j]);
    if (!m || m.w + m.l === 0) allMet = false;
  }
  return { agg, allMet };
}

/**
 * Pick the best team from `pool`.
 *  basis    - which record decides the first cut (the half's record, or overall)
 *  criteria - tiebreakers in order
 * Returns { winner } or, if every criterion is exhausted, { tied } (coin flip).
 * `contenders` are the teams still tied once the basis record was applied; `usedSeason` says
 * a season-long criterion was needed (so the result can still move until their season ends).
 */
export function selectBest(pool, basis, criteria) {
  let c = survivors(pool, basis);
  if (c.length === 0) return { winner: null, tied: [], contenders: [], usedSeason: false };
  if (c.length === 1) return { winner: c[0], contenders: [], usedSeason: false };
  const contenders = c.slice();
  for (const crit of criteria) {
    if (crit === 'overall') {
      c = survivors(c, (t) => t.all);
    } else if (crit === 'draw') {
      const best = Math.min(...c.map((t) => drawRank(t.draw)));
      c = c.filter((t) => drawRank(t.draw) === best);
    } else if (crit.h2h) {
      const { agg, allMet } = h2hAggregate(c, crit.h2h);
      if (allMet) c = survivors(c, (t) => agg.get(t));
    }
    if (c.length === 1) return { winner: c[0], contenders, usedSeason: true };
  }
  return { winner: null, tied: c, contenders, usedSeason: true };
}

// Award `k` berths from `pool`, one at a time (winner, then runner-up, ...).
// A tie for the last slot(s) that only a coin flip can break is reported as a flip.
function runStage(pool, k, basis, criteria) {
  const taken = new Set(), picks = [], flips = [];
  let remaining = k;
  while (remaining > 0) {
    const avail = pool.filter((t) => !taken.has(t));
    if (avail.length === 0) break;
    const sel = selectBest(avail, basis, criteria);
    if (sel.winner) {
      taken.add(sel.winner); picks.push({ team: sel.winner, sel }); remaining--;
    } else if (sel.tied.length <= remaining) {
      // everyone tied gets a berth anyway; a coin flip would only decide the order
      for (const t of sel.tied) { taken.add(t); picks.push({ team: t, sel }); }
      remaining -= sel.tied.length;
    } else {
      sel.tied.slice(0, remaining).forEach((t) => taken.add(t));   // arbitrary, only so later stages have a pool
      flips.push({ teams: sel.tied, slots: remaining, sel });
      remaining = 0;
    }
  }
  return { taken, picks, flips };
}

// ---- berth status (docs/rules/ENGINE-RULES.md section 8) --------------------

// Has `team` clinched one of the stage's berths before the half is over? True if, even losing every
// remaining game in the half while every rival wins all of theirs, it stays a full game ahead of
// all but fewer than k rivals. Deliberately conservative.
function clinchedEarly(team, stagePool, st) {
  const h = st.half;
  const worst = { w: team.half[h].w, l: team.half[h].l + team.rem[h] };
  const notSafe = stagePool.filter((y) => y !== team &&
    !(gamesBehind(worst, { w: y.half[h].w + y.rem[h], l: y.half[h].l }) >= 1));
  return notSafe.length < st.k;
}

const seasonLeft = (t) => t.rem[1] + t.rem[2];

/** projected | clinched | provisional | final  (see ENGINE-RULES.md section 8) */
function berthStatus({ shiftTeams, st, sel, team, stagePool, priorSettled }) {
  let s;
  if (st.half) {
    const halfDone = shiftTeams.every((t) => t.rem[st.half] === 0);
    if (!halfDone) s = team && priorSettled && clinchedEarly(team, stagePool, st) ? 'clinched' : 'projected';
    else if (!sel.usedSeason || sel.contenders.every((t) => seasonLeft(t) === 0)) s = 'final';
    else s = 'provisional';
  } else {
    s = shiftTeams.every((t) => seasonLeft(t) === 0) ? 'final' : 'projected';
  }
  // a berth that depends on an earlier, unsettled berth cannot be more certain than that berth
  if (!priorSettled && (s === 'final' || s === 'clinched')) s = 'provisional';
  return s;
}

const SETTLED = new Set(['final', 'clinched']);

function allocateShift(name, shiftTeams) {
  const cfg = PLAYOFF_SPOTS[name] ?? { first: 0, second: 0, wild: 0 };
  const taken = new Set();
  const rows = new Map();          // team -> berth info
  const berths = [];
  let settled = true;              // every berth so far is final/clinched and no coin flip is pending
  const stages = [
    { type: 'first', k: cfg.first, half: 1 },
    { type: 'second', k: cfg.second, half: 2 },
    { type: 'wild', k: cfg.wild, half: 0 },
  ];
  for (const st of stages) {
    if (!st.k) continue;
    const stagePool = shiftTeams.filter((t) => !taken.has(t));
    const basis = st.half ? (t) => t.half[st.half] : (t) => t.all;
    const crit = st.half ? halfCriteria(st.half) : WILD_CRITERIA;
    const { taken: got, picks, flips } = runStage(stagePool, st.k, basis, crit);
    let stageSettled = flips.length === 0;
    for (const { team, sel } of picks) {
      const status = berthStatus({ shiftTeams, st, sel, team: sel.winner ? team : null, stagePool, priorSettled: settled });
      if (!SETTLED.has(status)) stageSettled = false;
      const info = { type: st.type, status, coinFlip: false };
      rows.set(team, info);
      berths.push({ type: st.type, status, team: team.no, tied: [], coinFlip: false });
    }
    for (const f of flips) {
      const status = berthStatus({ shiftTeams, st, sel: f.sel, team: null, stagePool, priorSettled: settled });
      for (const t of f.teams) rows.set(t, { type: st.type, status, coinFlip: true, slots: f.slots });
      berths.push({ type: st.type, status, team: null, tied: f.teams.map((t) => t.no), slots: f.slots, coinFlip: true });
    }
    got.forEach((t) => taken.add(t));
    settled = settled && stageSettled;
  }
  return { taken, rows, berths, settled };
}

// ---- standings --------------------------------------------------------------

function standingsRows(shiftTeams, rows) {
  const diff = (t) => t.all.w - t.all.l;
  const sorted = [...shiftTeams].sort((a, b) =>
    diff(b) - diff(a) || b.all.w - a.all.w || drawRank(a.draw) - drawRank(b.draw) || a.name.localeCompare(b.name));
  const lead = sorted[0] ? diff(sorted[0]) : 0;
  return sorted.map((t, i) => {
    const last = t.results[t.results.length - 1];
    let streak = 0;
    for (let j = t.results.length - 1; j >= 0 && t.results[j] === last; j--) streak++;
    const games = t.all.w + t.all.l;
    return {
      rank: i + 1, no: t.no, name: t.name,
      w: t.all.w, l: t.all.l, pct: games ? t.all.w / games : 0,
      behind: (lead - diff(t)) / 2,
      firstHalf: { ...t.half[1] }, secondHalf: { ...t.half[2] },
      remaining: seasonLeft(t),
      draw: t.draw,                                   // number, 'X' or null
      last5: t.results.slice(-5),
      streak: last ? { type: last, count: streak } : null,
      berth: rows.get(t) ?? null,
    };
  });
}

/**
 * Compute standings and playoff berths for a season.
 * input: { teams: [{shift, team_no, name, first_half_end_week, draw_value}],
 *          games: [{shift, week, home_no, away_no, winner_no}] }
 * Returns { shifts: [{ name, standings, berths, firstHalfDone, secondHalfDone, seasonDone }],
 *           eventWildCards: { berths, status } }
 */
export function computeSeason({ teams, games }) {
  const names = [...new Set(teams.map((t) => t.shift))]
    .sort((a, b) => (SHIFT_ORDER.indexOf(a) + 1 || 99) - (SHIFT_ORDER.indexOf(b) + 1 || 99));
  const shifts = [];
  const unqualified = [];
  let allSettled = true, allDone = true;
  for (const name of names) {
    const shiftTeams = buildShift(name, teams.filter((t) => t.shift === name), games.filter((g) => g.shift === name));
    const alloc = allocateShift(name, shiftTeams);
    allSettled = allSettled && alloc.settled;
    const seasonDone = shiftTeams.every((t) => seasonLeft(t) === 0);
    allDone = allDone && seasonDone;
    shiftTeams.filter((t) => !alloc.taken.has(t)).forEach((t) => unqualified.push(t));
    shifts.push({
      name, _teams: shiftTeams, _rows: alloc.rows,
      berths: alloc.berths,
      firstHalfDone: shiftTeams.every((t) => t.rem[1] === 0),
      secondHalfDone: shiftTeams.every((t) => t.rem[2] === 0),
      seasonDone,
    });
  }

  // Event wild cards: best overall record league-wide among teams without a berth (page 6).
  const ev = runStage(unqualified, EVENT_WILD_CARDS, (t) => t.all, EVENT_CRITERIA);
  const evStatus = allDone && allSettled ? 'final' : 'projected';
  const eventRows = new Map();
  const evBerths = [];
  for (const { team } of ev.picks) {
    eventRows.set(team, { type: 'event', status: evStatus, coinFlip: false });
    evBerths.push({ type: 'event', status: evStatus, shift: team.shift, team: team.no, tied: [], coinFlip: false });
  }
  for (const f of ev.flips) {
    for (const t of f.teams) eventRows.set(t, { type: 'event', status: evStatus, coinFlip: true, slots: f.slots });
    evBerths.push({ type: 'event', status: evStatus, team: null, tied: f.teams.map((t) => ({ shift: t.shift, no: t.no })), slots: f.slots, coinFlip: true });
  }

  for (const s of shifts) {
    const rows = new Map(s._rows);
    for (const t of s._teams) if (eventRows.has(t)) rows.set(t, eventRows.get(t));
    s.standings = standingsRows(s._teams, rows);
    delete s._teams; delete s._rows;
  }
  return { shifts, eventWildCards: { berths: evBerths, status: evStatus } };
}
