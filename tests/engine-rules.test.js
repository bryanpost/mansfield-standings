// Rule-conformance tests for the Mansfield standings engine.
// Source of truth: docs/rules/ENGINE-RULES.md (pages 5-7 of the MCC guidelines).
// Run: node tests/engine-rules.test.js
const { Component } = require('./load-engine.js');
const assert = require('assert');
let pass = 0, fail = 0;
const t = (name, fn) => { try { fn(); pass++; console.log('PASS', name); } catch (e) { fail++; console.log('FAIL', name, '\n     ', e.message.split('\n')[0]); } };
const eng = () => { const e = new Component(); e.shifts = ['S']; return e; };
const team = (name, fh, sh, overall, draw) => ({ key: 'S|' + name, name, shift: 'S', fh: { w: fh[0], l: fh[1] }, sh: { w: sh[0], l: sh[1] }, overall: { w: overall[0], l: overall[1] }, draw });
const none = {};   // no head-to-head history

// ---- Page 6: the document's own worked example: 9-0, 8-0, 8-1 in a half ----
t('doc example: 9-0 loses winner spot to 8-0 on overall record -> 9-0 is automatically runner-up', () => {
  const A = team('A', [9,0], [0,0], [9,0]), B = team('B', [8,0], [0,0], [11,0]), C = team('C', [8,1], [0,0], [8,1]);
  const e = eng(); const pool = [A,B,C];
  const w = e.selectBest(pool, o=>o.fh, e.halfCrit('half1'), none);
  assert.strictEqual(w.winner && w.winner.name, 'B');
  const r = e.selectBest(pool.filter(x=>x!==w.winner), o=>o.fh, e.halfCrit('half1'), none);
  assert.strictEqual(r.winner && r.winner.name, 'A');
});
t('doc example: if 9-0 wins on tiebreak, criteria re-applied between 8-0 and 8-1 (8-0 and 8-1 are within a game -> tied, then overall)', () => {
  const A = team('A', [9,0], [0,0], [14,0]), B = team('B', [8,0], [0,0], [9,0]), C = team('C', [8,1], [0,0], [13,1]);
  const e = eng(); const pool = [A,B,C];
  const w = e.selectBest(pool, o=>o.fh, e.halfCrit('half1'), none);
  assert.strictEqual(w.winner.name, 'A');
  const r = e.selectBest([B,C], o=>o.fh, e.halfCrit('half1'), none);
  assert.strictEqual(r.winner.name, 'C');   // C is 1.5 games clear overall
});
t('9-0 vs 8-0 is tied; 9-0 vs 8-1 is not', () => {
  const e = eng(); const g = (w,l)=>({w,l});
  assert.strictEqual(e.gb(g(9,0), g(8,0)), 0.5);
  assert.strictEqual(e.gb(g(9,0), g(8,1)), 1);
});
t('12-6 does NOT beat 11-6 on overall record', () => {
  const A = team('A', [5,0], [0,0], [12,6]), B = team('B', [5,0], [0,0], [11,6]);
  const e = eng();
  const s = e.survivors([A,B], o=>o.overall);
  assert.strictEqual(s.length, 2);
});
t('12-6 does beat 11-7 (a full game clear)', () => {
  const A = team('A', [5,0], [0,0], [12,6]), B = team('B', [5,0], [0,0], [11,7]);
  const e = eng();
  assert.deepStrictEqual(e.survivors([A,B], o=>o.overall).map(x=>x.name), ['A']);
});

// ---- Page 6: half-winner criteria order ----
const h2h = (a, b, w, l) => ({ [a.key]: { season: { [b.name]: {w,l} }, half1: { [b.name]: {w,l} }, half2: {} }, [b.key]: { season: { [a.name]: {w:l,l:w} }, half1: { [a.name]: {w:l,l:w} }, half2: {} } });
t('half tie, equal overall -> head-to-head for the half decides', () => {
  const A = team('A', [6,1], [0,0], [10,5]), B = team('B', [6,1], [0,0], [10,5]);
  const e = eng();
  const r = e.selectBest([A,B], o=>o.fh, e.halfCrit('half1'), h2h(A,B,1,0));
  assert.strictEqual(r.winner && r.winner.name, 'A');
});
t('half h2h skipped when teams have NOT all played each other -> falls through to draw', () => {
  const A = team('A', [6,1], [0,0], [10,5], 20), B = team('B', [6,1], [0,0], [10,5], 12);
  const e = eng();
  const r = e.selectBest([A,B], o=>o.fh, e.halfCrit('half1'), {});
  assert.strictEqual(r.winner && r.winner.name, 'B');   // lower draw wins
});
t('lowest draw wins; X and blank rank below any measured value (even 72)', () => {
  const A = team('A', [6,1], [0,0], [10,5], 72), B = team('B', [6,1], [0,0], [10,5], 'X'), C = team('C', [6,1], [0,0], [10,5], null);
  const e = eng();
  const r = e.selectBest([B,C,A], o=>o.fh, e.halfCrit('half1'), {});
  assert.strictEqual(r.winner && r.winner.name, 'A');
});
t('X vs blank is a coin flip', () => {
  const B = team('B', [6,1], [0,0], [10,5], 'X'), C = team('C', [6,1], [0,0], [10,5], null);
  const e = eng();
  const r = e.selectBest([B,C], o=>o.fh, e.halfCrit('half1'), {});
  assert.ok(r.coin && r.tied.length === 2);
});
t('3 teams: one is a full game behind and drops out, remaining two go to criteria (not "one tie, all tie")', () => {
  const A = team('A', [8,1], [0,0], [10,5], 30), B = team('B', [8,1], [0,0], [10,5], 10), C = team('C', [6,3], [0,0], [10,5], 1);
  const e = eng();
  const r = e.selectBest([A,B,C], o=>o.fh, e.halfCrit('half1'), {});
  assert.strictEqual(r.winner.name, 'B');   // C is out despite best draw
});

// ---- Page 6: shift wild card / Page 6-7: event wild card ----
t('shift wild card: overall, then season h2h (not half h2h), then draw', () => {
  const A = team('A', [0,0], [0,0], [11,6], 20), B = team('B', [0,0], [0,0], [11,6], 10);
  const e = eng();
  const only = { [A.key]: { season: {}, half1: { B: {w:1,l:0} }, half2: {} }, [B.key]: { season: {}, half1: { A: {w:0,l:1} }, half2: {} } };
  const r = e.selectBest([A,B], o=>o.overall, e.wcCrit(), only);   // half-only h2h must be ignored
  assert.strictEqual(r.winner.name, 'B');
});
t('event wild card has NO head-to-head step: goes overall -> draw', () => {
  const A = team('A', [0,0], [0,0], [11,6], 20), B = team('B', [0,0], [0,0], [11,6], 10);
  const e = eng();
  const hh = h2h(A,B,1,0);   // A beat B, but that must not matter
  const r = e.selectBest([A,B], o=>o.overall, e.eventCrit(), hh);
  assert.strictEqual(r.winner.name, 'B');
});

// ---- Page 5: playoff spots ----
const total = Object.values(new Component().CONFIG).reduce((n,c)=> n + (c.first==='two'?2:1) + (c.second==='two'?2:1) + c.wc, 0);
t('page 5: 24 shift berths + 4 event wild cards = 28', () => { assert.strictEqual(total, 24); });
t('page 5: per-shift spots match (Tue4:25 2+2, TueLate 1+1, Wed 2+2, WedLate 2+2+2WC, Thu 2+2, ThuLate 2+2)', () => {
  const C = new Component().CONFIG;
  assert.deepStrictEqual(C['Tuesday Dinner'],   { first:'two', second:'two', wc:0 });
  assert.deepStrictEqual(C['Tuesday Late'],     { first:'one', second:'one', wc:0 });
  assert.deepStrictEqual(C['Wednesday Dinner'], { first:'two', second:'two', wc:0 });
  assert.deepStrictEqual(C['Wednesday Late'],   { first:'two', second:'two', wc:2 });
  assert.deepStrictEqual(C['Thursday Dinner'],  { first:'two', second:'two', wc:0 });
  assert.deepStrictEqual(C['Thursday Late'],    { first:'two', second:'two', wc:0 });
});
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
