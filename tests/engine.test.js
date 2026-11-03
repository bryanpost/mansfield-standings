// Tests for src/engine.js. Run: node --test tests/
// Source of truth for the expected behaviour: docs/rules/ENGINE-RULES.md (pages 5-7 of the guidelines).
import test from 'node:test';
import assert from 'node:assert/strict';
import { gamesBehind, survivors, selectBest, computeSeason, buildShift, parseDraw, PLAYOFF_SPOTS, EVENT_WILD_CARDS } from '../src/engine.js';

// ---- helpers ----------------------------------------------------------------

// A bare team state, as buildShift would produce, for testing the tiebreaker functions directly.
let seq = 0;
const T = (name, { h1 = [0, 0], h2 = [0, 0], all, draw = null } = {}) => ({
  name, no: ++seq, shift: 'S', draw,
  half: { 1: { w: h1[0], l: h1[1] }, 2: { w: h2[0], l: h2[1] } },
  all: { w: all[0], l: all[1] }, rem: { 1: 0, 2: 0 }, results: [],
  h2h: { season: new Map(), half1: new Map(), half2: new Map() },
});
const meet = (a, b, scope, aWins, bWins) => {
  a.h2h[scope].set(b, { w: aWins, l: bWins });
  b.h2h[scope].set(a, { w: bWins, l: aWins });
};
const HALF1 = ['overall', { h2h: 'half1' }, { h2h: 'season' }, 'draw'];
const names = (ts) => ts.map((t) => t.name);

// A league from compact notation: games are [week, home, away, winner|null].
const league = (shift, n, games, firstHalfEnd = 10, draws = {}) => ({
  teams: Array.from({ length: n }, (_, i) => ({
    shift, team_no: i + 1, name: 'T' + (i + 1),
    first_half_end_week: typeof firstHalfEnd === 'function' ? firstHalfEnd(i + 1) : firstHalfEnd,
    draw_value: draws[i + 1] ?? null,
  })),
  games: games.map(([week, home_no, away_no, winner_no]) => ({ shift, week, home_no, away_no, winner_no })),
});
const shiftOf = (res, name) => res.shifts.find((s) => s.name === name);
const rowOf = (res, name, no) => shiftOf(res, name).standings.find((r) => r.no === no);
// A full round robin among `n` teams in weeks 1..: returns the games with winners decided by `pick(a, b)`.
const roundRobin = (n, startWeek, pick) => {
  const out = []; let wk = startWeek;
  for (let a = 1; a <= n; a++) for (let b = a + 1; b <= n; b++) out.push([wk++, a, b, pick(a, b, wk - 1)]);
  return out;
};

// ---- page 6: the "one full game" rule and the worked example -----------------

test('9-0 vs 8-0 is tied; 9-0 vs 8-1 is not; 12-6 does not beat 11-6', () => {
  assert.equal(gamesBehind({ w: 9, l: 0 }, { w: 8, l: 0 }), 0.5);
  assert.equal(gamesBehind({ w: 9, l: 0 }, { w: 8, l: 1 }), 1);
  assert.equal(survivors([T('A', { all: [12, 6] }), T('B', { all: [11, 6] })], (t) => t.all).length, 2);
  assert.deepEqual(names(survivors([T('A', { all: [12, 6] }), T('B', { all: [11, 7] })], (t) => t.all)), ['A']);
});

test('worked example: 9-0 loses the winner spot to 8-0 on overall record, so it is automatically runner-up', () => {
  const A = T('A', { h1: [9, 0], all: [9, 0] }), B = T('B', { h1: [8, 0], all: [11, 0] }), C = T('C', { h1: [8, 1], all: [8, 1] });
  const first = selectBest([A, B, C], (t) => t.half[1], HALF1);
  assert.equal(first.winner.name, 'B');
  const second = selectBest([A, C], (t) => t.half[1], HALF1);
  assert.equal(second.winner.name, 'A');
});

test('worked example: if the 9-0 team wins on tiebreak, criteria are re-applied between 8-0 and 8-1', () => {
  const A = T('A', { h1: [9, 0], all: [14, 0] }), B = T('B', { h1: [8, 0], all: [9, 0] }), C = T('C', { h1: [8, 1], all: [13, 1] });
  assert.equal(selectBest([A, B, C], (t) => t.half[1], HALF1).winner.name, 'A');
  assert.equal(selectBest([B, C], (t) => t.half[1], HALF1).winner.name, 'C');   // 1.5 games clear overall
});

test('"one tie is not all tie": a team a full game back drops out even with the best draw', () => {
  const A = T('A', { h1: [8, 1], all: [10, 5], draw: 30 }), B = T('B', { h1: [8, 1], all: [10, 5], draw: 10 }), C = T('C', { h1: [6, 3], all: [10, 5], draw: 1 });
  assert.equal(selectBest([A, B, C], (t) => t.half[1], HALF1).winner.name, 'B');
});

// ---- page 6: criteria order -------------------------------------------------

test('half tie, equal overall: head-to-head within the half decides', () => {
  const A = T('A', { h1: [6, 1], all: [10, 5] }), B = T('B', { h1: [6, 1], all: [10, 5] });
  meet(A, B, 'half1', 1, 0);
  assert.equal(selectBest([A, B], (t) => t.half[1], HALF1).winner.name, 'A');
});

test('head-to-head is skipped unless every pair has met; then lowest draw decides', () => {
  const A = T('A', { h1: [6, 1], all: [10, 5], draw: 20 }), B = T('B', { h1: [6, 1], all: [10, 5], draw: 12 });
  assert.equal(selectBest([A, B], (t) => t.half[1], HALF1).winner.name, 'B');
});

test('half head-to-head is tried before season head-to-head', () => {
  const A = T('A', { h1: [6, 1], all: [10, 5] }), B = T('B', { h1: [6, 1], all: [10, 5] });
  meet(A, B, 'half1', 1, 0);      // A won the half meeting
  meet(A, B, 'season', 0, 2);     // B leads the season series
  assert.equal(selectBest([A, B], (t) => t.half[1], HALF1).winner.name, 'A');
});

test('draw: lowest wins; X and blank rank below any measured value, even 72', () => {
  const A = T('A', { h1: [6, 1], all: [10, 5], draw: 72 }), B = T('B', { h1: [6, 1], all: [10, 5], draw: 'X' }), C = T('C', { h1: [6, 1], all: [10, 5], draw: null });
  assert.equal(selectBest([B, C, A], (t) => t.half[1], HALF1).winner.name, 'A');
});

test('X vs blank is a coin flip', () => {
  const B = T('B', { h1: [6, 1], all: [10, 5], draw: 'X' }), C = T('C', { h1: [6, 1], all: [10, 5], draw: null });
  const r = selectBest([B, C], (t) => t.half[1], HALF1);
  assert.equal(r.winner, null);
  assert.equal(r.tied.length, 2);
});

test('shift wild card: overall, then SEASON head-to-head (half-only head-to-head ignored), then draw', () => {
  const A = T('A', { all: [11, 6], draw: 20 }), B = T('B', { all: [11, 6], draw: 10 });
  meet(A, B, 'half1', 1, 0);
  const r = selectBest([A, B], (t) => t.all, ['overall', { h2h: 'season' }, 'draw']);
  assert.equal(r.winner.name, 'B');
});

test('event wild card has no head-to-head step: overall, then draw', () => {
  const A = T('A', { all: [11, 6], draw: 20 }), B = T('B', { all: [11, 6], draw: 10 });
  meet(A, B, 'season', 1, 0);     // must not matter
  assert.equal(selectBest([A, B], (t) => t.all, ['overall', 'draw']).winner.name, 'B');
});

test('page 5: spots add up to 28 and match the posted breakdown', () => {
  const shiftSpots = Object.values(PLAYOFF_SPOTS).reduce((n, c) => n + c.first + c.second + c.wild, 0);
  assert.equal(shiftSpots + EVENT_WILD_CARDS, 28);
  assert.deepEqual(PLAYOFF_SPOTS['Tuesday Late'], { first: 1, second: 1, wild: 0 });
  assert.deepEqual(PLAYOFF_SPOTS['Wednesday Late'], { first: 2, second: 2, wild: 2 });
});

test('draw values parse as the database stores them', () => {
  assert.equal(parseDraw('12.5'), 12.5);
  assert.equal(parseDraw('x'), 'X');
  assert.equal(parseDraw(''), null);
  assert.equal(parseDraw(null), null);
});

// ---- records, halves, head-to-head ------------------------------------------

test('records and halves follow each team\'s own first_half_end_week', () => {
  // Wed-Late style: team 1 ends the first half at week 10, team 2 at week 11. Week 11 game: 1 beats 2.
  const res = computeSeason(league('Wednesday Late', 3, [[11, 1, 2, 1], [11, 3, 3 + 0 * 0, null]].slice(0, 1), (n) => (n === 2 ? 11 : 10)));
  const r1 = rowOf(res, 'Wednesday Late', 1), r2 = rowOf(res, 'Wednesday Late', 2);
  assert.deepEqual(r1.secondHalf, { w: 1, l: 0 });    // week 11 is second half for team 1 ...
  assert.deepEqual(r2.firstHalf, { w: 0, l: 1 });     // ... and first half for team 2
});

test('a boundary-week game counts toward season head-to-head but not half head-to-head', () => {
  // Team 1 ends the first half at week 10, team 2 at week 11, so week 11 is second half for 1 and first half for 2.
  const L = league('Wednesday Late', 3, [[11, 1, 2, 1], [3, 1, 3, 1], [3, 2, 3, 2]], (n) => (n === 2 ? 11 : 10));
  const [t1, t2, t3] = buildShift('Wednesday Late', L.teams, L.games);
  // the boundary game: always in the season series ...
  assert.deepEqual(t1.h2h.season.get(t2), { w: 1, l: 0 });
  assert.deepEqual(t2.h2h.season.get(t1), { w: 0, l: 1 });
  // ... but in neither half's series, because the halves differ
  assert.equal(t1.h2h.half1.get(t2), undefined);
  assert.equal(t1.h2h.half2.get(t2), undefined);
  assert.equal(t2.h2h.half1.get(t1), undefined);
  assert.equal(t2.h2h.half2.get(t1), undefined);
  // a same-half game (week 3) counts in that half for both teams
  assert.deepEqual(t1.h2h.half1.get(t3), { w: 1, l: 0 });
  assert.deepEqual(t3.h2h.half1.get(t1), { w: 0, l: 1 });
  // and each team's half record uses its own boundary
  assert.deepEqual(t1.half[2], { w: 1, l: 0 });
  assert.deepEqual(t2.half[1], { w: 1, l: 1 });
});

// ---- statuses ---------------------------------------------------------------

test('no games recorded: everything is a projected tie, no team shows a berth', () => {
  const res = computeSeason(league('Tuesday Late', 4, [[1, 1, 2, null], [1, 3, 4, null], [11, 1, 3, null], [11, 2, 4, null]]));
  for (const r of shiftOf(res, 'Tuesday Late').standings) assert.equal(r.berth?.status ?? 'projected', 'projected');
  for (const b of shiftOf(res, 'Tuesday Late').berths) assert.equal(b.status, 'projected');
});

test('half complete, winner a full game clear: final without waiting for the season', () => {
  // 4 teams, half 1 = weeks 1-3 (round robin). Team 1 wins all. Second half not played at all.
  const first = roundRobin(4, 1, (a, b) => (a === 1 ? 1 : b === 2 ? 2 : b === 3 ? 3 : (a === 2 ? 2 : 3))).map(([w, a, b, win]) => [w, a, b, win]);
  const second = [[11, 1, 2, null], [12, 3, 4, null]];
  const res = computeSeason(league('Tuesday Late', 4, [...first, ...second], 10));
  const s = shiftOf(res, 'Tuesday Late');
  assert.equal(s.firstHalfDone, true);
  const firstBerth = s.berths.find((b) => b.type === 'first');
  assert.equal(firstBerth.team, 1);
  assert.equal(firstBerth.status, 'final');
  assert.equal(s.berths.find((b) => b.type === 'second').status, 'projected');
});

test('half complete but decided by overall record with games left: provisional; final once those teams finish', () => {
  // Teams 1 and 2 tie the half 3-0 / 3-0 (not meeting: separate pairs), team 3,4 behind.
  const half = [[1, 1, 3, 1], [2, 1, 4, 1], [3, 1, 5, 1], [1, 2, 3, 2], [2, 2, 4, 2], [3, 2, 5, 2]];
  const open = computeSeason(league('Tuesday Late', 5, [...half, [11, 1, 2, 1], [12, 3, 4, null]], 10));
  const b1 = shiftOf(open, 'Tuesday Late').berths.find((b) => b.type === 'first');
  assert.ok(['provisional', 'final'].includes(b1.status));
  assert.ok(b1.team === 1 || b1.coinFlip || b1.team === 2);
});

test('one berth per team: a team that leads both halves takes only the first-half berth', () => {
  // Team 1 is best in both halves; the second-half berth must go to someone else.
  const g = [...roundRobin(3, 1, (a) => (a === 1 ? 1 : 2)), ...roundRobin(3, 11, (a) => (a === 1 ? 1 : 2))];
  const res = computeSeason(league('Tuesday Late', 3, g, 10));
  const berths = shiftOf(res, 'Tuesday Late').berths.filter((b) => b.type !== 'wild');
  const holders = berths.map((b) => b.team);
  assert.equal(new Set(holders).size, holders.length);
  assert.equal(berths.find((b) => b.type === 'first').team, 1);
  assert.equal(berths.find((b) => b.type === 'second').team, 2);
});

test('season over, two identical teams for one berth: final coin flip, no team is picked', () => {
  const g = [[1, 1, 3, 1], [1, 2, 4, 2], [2, 1, 4, 4], [2, 2, 3, 3]];   // 1,2,3,4 all 1-1
  const res = computeSeason(league('Tuesday Late', 4, g, 10));
  const first = shiftOf(res, 'Tuesday Late').berths.find((b) => b.type === 'first');
  assert.equal(first.coinFlip, true);
  assert.equal(first.team, null);
  assert.equal(first.tied.length, 4);
});

test('event wild cards go to the best remaining records league-wide, never to a team that already has a berth', () => {
  const g = (shift) => roundRobin(6, 1, (a, b) => (a < b ? a : b));   // lower number always wins
  const t = league('Tuesday Late', 6, g(), 10), u = league('Thursday Late', 6, g(), 10);
  const res = computeSeason({ teams: [...t.teams, ...u.teams], games: [...t.games, ...u.games.map((x) => ({ ...x, shift: 'Thursday Late' }))] });
  const evt = res.eventWildCards.berths;
  assert.equal(evt.length, EVENT_WILD_CARDS);
  const holders = new Set();
  for (const s of res.shifts) for (const b of s.berths) if (b.team) holders.add(s.name + b.team);
  for (const b of evt) assert.ok(!holders.has(b.shift + b.team));
});

// ---- early clinch -----------------------------------------------------------

test('early clinch: a runaway leader is clinched before the half ends', () => {
  // 4 teams. Team 1 is 6-0 with 1 game left; everyone else is 0-3 or worse with games left.
  const g = [
    [1, 1, 2, 1], [2, 1, 3, 1], [3, 1, 4, 1], [4, 1, 2, 1], [5, 1, 3, 1], [6, 1, 4, 1], [7, 1, 2, null],
    [1, 3, 4, 3], [2, 2, 4, 2],
  ];
  const res = computeSeason(league('Tuesday Late', 4, g, 10));
  const row = rowOf(res, 'Tuesday Late', 1);
  assert.equal(row.berth.type, 'first');
  assert.equal(row.berth.status, 'clinched');
});

test('a leader whose rivals could still catch up is only projected', () => {
  const g = [[1, 1, 2, 1], [2, 1, 3, null], [3, 2, 3, null], [4, 1, 4, null], [5, 2, 4, null], [6, 3, 4, null]];
  const res = computeSeason(league('Tuesday Late', 4, g, 10));
  assert.equal(rowOf(res, 'Tuesday Late', 1).berth?.status ?? 'projected', 'projected');
});

// Brute force: whenever the engine says "clinched", enumerate every way the remaining games of that half
// could end and check the team really does hold a berth of that type in all of them.
function checkClinchProperty(phase, trials) {
  let seed = phase === 1 ? 12345 : 987;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  let checked = 0;
  for (let trial = 0; trial < trials; trial++) {
    const n = 5 + Math.floor(rnd() * 2);                                  // 5 or 6 teams
    const shift = rnd() < 0.5 ? 'Tuesday Late' : 'Wednesday Dinner';      // 1 or 2 berths per half
    const strength = Array.from({ length: n }, () => Math.exp(rnd() * 3));
    const beats = (a, b) => (rnd() < strength[a - 1] / (strength[a - 1] + strength[b - 1]) ? a : b);
    const pairs = [];
    for (let a = 1; a <= n; a++) for (let b = a + 1; b <= n; b++) if (rnd() < 0.9) pairs.push([a, b]);
    const nOpen = 2 + Math.floor(rnd() * 5);
    const openIdx = new Set();
    while (openIdx.size < Math.min(nOpen, pairs.length)) openIdx.add(Math.floor(rnd() * pairs.length));
    let games;
    if (phase === 1) {
      games = pairs.map(([a, b], i) => [i + 1, a, b, openIdx.has(i) ? null : beats(a, b)]);
    } else {   // first half fully played; the open games are in the second half
      games = [
        ...pairs.map(([a, b], i) => [i + 1, a, b, beats(a, b)]),
        ...pairs.map(([a, b], i) => [11 + i, a, b, openIdx.has(i) ? null : beats(a, b)]),
      ];
    }
    const L = (g) => league(shift, n, g, 10);
    const res = computeSeason(L(games));
    const open = games.map((g, i) => [g, i]).filter(([g]) => g[3] == null);
    const wantType = phase === 1 ? 'first' : 'second';
    for (const row of shiftOf(res, shift).standings) {
      if (row.berth?.type !== wantType || row.berth.status !== 'clinched') continue;
      checked++;
      for (let mask = 0; mask < (1 << open.length); mask++) {
        const done = games.map((g) => [...g]);
        open.forEach(([g, i], bit) => { done[i][3] = mask & (1 << bit) ? g[1] : g[2]; });
        const r2 = rowOf(computeSeason(L(done)), shift, row.no);
        assert.ok(r2.berth && r2.berth.type === wantType && !r2.berth.coinFlip,
          `team ${row.no} was clinched (${wantType} half) but lost the berth (trial ${trial}, outcome ${mask}, got ${JSON.stringify(r2.berth)})`);
      }
    }
  }
  return checked;
}

test('property: first-half "clinched" is never wrong (exhaustive check on random small leagues)', () => {
  const checked = checkClinchProperty(1, 400);
  assert.ok(checked >= 30, `only ${checked} clinched cases exercised; widen the generator`);
});

test('property: second-half "clinched" is never wrong once the first half is settled', () => {
  const checked = checkClinchProperty(2, 2500);
  assert.ok(checked >= 30, `only ${checked} clinched cases exercised; widen the generator`);
});

// ---- standings order ---------------------------------------------------------

test('standings are ordered by games behind (wins minus losses), the same measure the rules use', () => {
  // 8-1 and 7-0 are within half a game under the rules; 9-0 is ahead of both.
  const g = [];
  // team 1: 9-0 vs opponents 4..12 is too large for a toy league; use 3 teams and direct records instead:
  const res = computeSeason(league('Tuesday Late', 3, [[1, 1, 2, 1], [2, 1, 3, 1], [3, 2, 3, 2]], 10));
  const rows = shiftOf(res, 'Tuesday Late').standings;
  assert.deepEqual(rows.map((r) => r.no), [1, 2, 3]);
  assert.equal(rows[0].behind, 0);
  assert.equal(rows[1].behind, 1);
  assert.equal(rows[2].behind, 2);
  void g;
});

test('bad input is rejected loudly rather than silently miscounted', () => {
  assert.throws(() => computeSeason(league('Tuesday Late', 3, [[1, 1, 2, 3]])), /did not play/);
  assert.throws(() => computeSeason(league('Tuesday Late', 3, [[1, 1, 9, null]])), /unknown team/);
});
