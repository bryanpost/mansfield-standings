// ── bracket.js — SVG playoff bracket ─────────────────────────────

let _bracketSlots = null;
let _bracketSeeds = null;

function renderBracket(qualified, configs, allTeams) {
  if (qualified.length < 4) {
    document.getElementById('bracket-root').innerHTML =
      '<div class="loading">Not enough teams qualified yet.</div>';
    return;
  }

  _bracketSeeds = qualified;

  if (!_bracketSlots) {
    _bracketSlots = computeDefaultSlots(qualified, configs, allTeams);
  }

  drawBracket(qualified);
}

// ── Seeding ───────────────────────────────────────────────────────
function computeDefaultSlots(seeds, configs, allTeams) {
  const byNum = Object.fromEntries(seeds.map(t => [t.seed, t]));
  const byes  = [1,4,2,3].map(s => byNum[s] ?? null);
  const pool  = seeds.filter(t => t.seed > 4);

  // Distribute 24 seeds across 4 quadrants, spreading same-shift teams
  const qSlots = [[], [], [], []];
  const spreadOrd = [0, 2, 1, 3];
  const byShift = {};
  pool.forEach(t => {
    if (!byShift[t.shift]) byShift[t.shift] = [];
    byShift[t.shift].push(t);
  });
  Object.values(byShift).sort((a,b) => b.length - a.length).forEach(grp => {
    grp.sort((a,b) => a.seed - b.seed).forEach(t => {
      let r = spreadOrd.find(r => qSlots[r].length < 6 && !qSlots[r].some(x => x.shift === t.shift));
      if (r === undefined) r = spreadOrd.find(r => qSlots[r].length < 6 && qSlots[r].filter(x => x.shift === t.shift).length < 2);
      if (r === undefined) r = spreadOrd.slice().sort((a,b) => qSlots[a].length - qSlots[b].length).find(r => qSlots[r].length < 6);
      if (r !== undefined) qSlots[r].push(t);
    });
  });

  // Arrange each quadrant to avoid same-shift R1/R2 clashes
  function arrange(teams6, bye) {
    function valid(a) {
      if (a[0]?.shift === a[1]?.shift) return false;
      if (a[2]?.shift === a[3]?.shift) return false;
      if (a[4]?.shift === a[5]?.shift) return false;
      const p0 = new Set([a[0],a[1]].filter(Boolean).map(t => t.shift));
      const p1 = new Set([a[2],a[3]].filter(Boolean).map(t => t.shift));
      for (const s of p0) if (p1.has(s)) return false;
      if (bye) {
        if (a[4]?.shift === bye.shift) return false;
        if (a[5]?.shift === bye.shift) return false;
      }
      return true;
    }
    const arr = [...teams6];
    function perm(a, i = 0) {
      if (i === a.length) return valid(a) ? [...a] : null;
      for (let j = i; j < a.length; j++) {
        [a[i],a[j]] = [a[j],a[i]];
        const r = perm(a, i+1); if (r) return r;
        [a[i],a[j]] = [a[j],a[i]];
      }
      return null;
    }
    const res = perm(arr) || teams6;
    return [[res[0].seed,res[1].seed],[res[2].seed,res[3].seed],[res[4].seed,res[5].seed]];
  }

  return qSlots.map((slots, i) => arrange(slots, byes[i]));
}

// ── SVG Drawing ───────────────────────────────────────────────────
const BW=148, BH=26, GAP=10, CSTEP=180, LX=8;
const OY=44;

function drawBracket(seeds) {
  const byNum = Object.fromEntries(seeds.map(t => [t.seed, t]));
  const byes  = [1,4,2,3].map(s => byNum[s]);
  const MH    = BH * 2;
  const quadH = 3 * MH + 2 * GAP;
  const sideH = quadH * 2 + 32;
  const SVW   = LX*2 + CSTEP*4*2 + 160;
  const SVH   = OY + sideH + 80;

  const C = {
    bg:      'var(--bracket-surface)',
    bdr:     'var(--bracket-border)',
    text:    'var(--bracket-text)',
    dim:     'var(--bracket-muted)',
    bye:     'var(--bracket-bye)',
    byeText: 'var(--bracket-bye-text)',
    warn:    'var(--bracket-warn)',
    hdrText: 'var(--bracket-hdr-text)',
    champBg: 'var(--bracket-champ-bg)',
    champBdr: 'var(--bracket-champ-border)',
    champLbl: 'var(--bracket-champ-label)',
    champName: 'var(--bracket-champ-name)',
    ok:      'var(--bracket-ok)',
    byeSeed: 'var(--bracket-bye-seed)',
  };

  function col(i, side) {
    return side === 'left' ? LX + i*CSTEP : SVW - LX - BW - i*CSTEP;
  }

  function teamBox(x, y, t, isBye=false, qi=-1, p=-1, slot=-1) {
    if (!t) {
      return `<rect x="${x}" y="${y}" width="${BW}" height="${BH}" fill="${C.bg}" stroke="${C.bdr}" rx="2"/>
        <text x="${x+BW/2}" y="${y+BH/2+4}" font-size="11" fill="${C.dim}" text-anchor="middle" font-style="italic">TBD</text>`;
    }
    const fill = isBye ? C.bye : C.bg;
    const tc   = isBye ? C.byeText : C.text;
    const rec  = `<rect x="${x}" y="${y}" width="${BW}" height="${BH}" fill="${fill}" stroke="${isBye?C.bye:C.bdr}" rx="2"/>`;
    const seed = `<text x="${x+6}" y="${y+BH/2+4}" font-size="10" fill="${isBye ? C.byeSeed : C.dim}" font-family="monospace">${t.seed}</text>`;
    const name = `<text x="${x+22}" y="${y+BH/2+4}" font-size="12" fill="${tc}" font-weight="600">${t.name}</text>`;
    const shift = `<text x="${x+BW-28}" y="${y+BH/2+4}" font-size="9" fill="${isBye ? C.byeSeed : C.dim}">${shiftAbbr(t.shift)}</text>`;

    // Clickable chevron for editing
    let editBtn = '';
    if (qi >= 0 && p >= 0 && slot >= 0) {
      editBtn = `<text x="${x+BW-12}" y="${y+BH/2+4}" font-size="10" fill="${C.dim}" 
        style="cursor:pointer" onclick="startEdit(event,${qi},${p},${slot})">▾</text>`;
    }

    // Same-shift warning
    const partner = qi >= 0 ? getPartner(qi, p, slot) : null;
    const warnBdr = partner && partner.shift === t.shift ? ` stroke="${C.warn}" stroke-width="1.5"` : '';
    const warnRec = partner && partner.shift === t.shift
      ? `<rect x="${x}" y="${y}" width="${BW}" height="${BH}" fill="none" stroke="${C.warn}" stroke-width="1.5" rx="2"/>`
      : '';

    return rec + warnRec + seed + name + shift + editBtn;
  }

  function getPartner(qi, p, slot) {
    const partnerSlot = 1 - slot;
    const seed = _bracketSlots[qi][p][partnerSlot];
    return _bracketSeeds?.find(t => t.seed === seed) ?? null;
  }

  function matchup(bx, y, top, bot, side, topBye=false, botBye=false, qi=-1, p=-1) {
    const topY = y, botY = y + BH;
    const tEl = teamBox(bx, topY, top, topBye, qi, p, 0);
    const bEl = teamBox(bx, botY, bot, botBye, qi, p, 1);
    const midY = y + MH/2;
    const brX  = side === 'left' ? bx + BW : bx;
    return { svg: tEl + bEl, mid: midY, brX };
  }

  function warnOverlay(x, y) {
    return `<rect x="${x}" y="${y}" width="${BW}" height="${MH}" fill="none" stroke="${C.warn}" 
      stroke-width="1.5" stroke-dasharray="5,3" rx="2" opacity="0.6"/>
      <text x="${x+BW/2}" y="${y-4}" font-size="9" fill="${C.warn}" text-anchor="middle">⚠ possible same shift</text>`;
  }

  function r2Warn(qi, slots) {
    // R2 game0: pair0 shifts must be disjoint from pair1 shifts
    const p0 = [byNum[slots[0][0]], byNum[slots[0][1]]].filter(Boolean);
    const p1 = [byNum[slots[1][0]], byNum[slots[1][1]]].filter(Boolean);
    const p0s = new Set(p0.map(t => t.shift));
    const p1s = new Set(p1.map(t => t.shift));
    const g0warn = [...p0s].some(s => p1s.has(s));
    // R2 game1: pair2 vs bye
    const bye = byes[qi];
    const p2 = [byNum[slots[2][0]], byNum[slots[2][1]]].filter(Boolean);
    const g1warn = bye && p2.some(t => t.shift === bye.shift);
    return { g0warn, g1warn };
  }

  function drawQuad(side, qi, oy) {
    let s = '';
    const slots = _bracketSlots[qi];
    const bye   = byes[qi];
    const wcMs  = [];

    for (let p = 0; p < 3; p++) {
      const y  = oy + p*(MH+GAP);
      const t0 = byNum[slots[p][0]], t1 = byNum[slots[p][1]];
      const m  = matchup(col(0,side), y, t0, t1, side, false, false, qi, p);
      s += m.svg; wcMs.push(m);
    }

    const r2_0y = Math.round((wcMs[0].mid + wcMs[1].mid)/2) - BH;
    const r2_1y = Math.round(wcMs[2].mid) - BH;
    const { g0warn, g1warn } = r2Warn(qi, slots);
    if (g0warn) s += warnOverlay(col(1,side), r2_0y);
    if (g1warn) s += warnOverlay(col(1,side), r2_1y);

    const mR2_0 = matchup(col(1,side), r2_0y, null, null, side);
    const mR2_1 = matchup(col(1,side), r2_1y, null, bye, side, false, true);
    s += mR2_0.svg + mR2_1.svg;

    const qf_y = Math.round((mR2_0.mid + mR2_1.mid)/2) - BH;
    const mQF  = matchup(col(2,side), qf_y, null, null, side);
    s += mQF.svg;

    return { svg: s, qfMid: mQF.mid, qfBrX: mQF.brX };
  }

  function drawSide(side, qi0, qi1) {
    const q0 = drawQuad(side, qi0, OY);
    const q1 = drawQuad(side, qi1, OY + quadH + 32);
    let s = q0.svg + q1.svg;
    const sf_y = Math.round((q0.qfMid + q1.qfMid)/2) - BH;
    const mSF  = matchup(col(3,side), sf_y, null, null, side);
    s += mSF.svg;
    return { svg: s, sfMid: mSF.mid };
  }

  const left  = drawSide('left',  0, 1);
  const right = drawSide('right', 2, 3);

  const cx = SVW / 2 - BW / 2;

  // Column headers
  const headers = ['WILD CARD','ROUND OF 16','QUARTERFINAL','SEMIFINAL','FINAL','SEMIFINAL','QUARTERFINAL','ROUND OF 16','WILD CARD'];
  let hdrSvg = '';
  for (let i = 0; i < 4; i++) {
    const lx = col(i,'left') + BW/2;
    const rx = col(i,'right') + BW/2;
    const lbl = headers[i];
    const rbl = headers[8-i];
    hdrSvg += `<text x="${lx}" y="24" font-size="9" font-weight="600" letter-spacing="1" fill="${C.hdrText}" text-anchor="middle" font-family="monospace">${lbl}</text>`;
    if (i > 0) hdrSvg += `<text x="${cx}" y="24" font-size="9" font-weight="600" letter-spacing="1" fill="${C.hdrText}" text-anchor="middle" font-family="monospace"></text>`;
    hdrSvg += `<text x="${rx}" y="24" font-size="9" font-weight="600" letter-spacing="1" fill="${C.hdrText}" text-anchor="middle" font-family="monospace">${rbl}</text>`;
  }
  // Center FINAL label
  hdrSvg += `<text x="${SVW/2}" y="24" font-size="9" font-weight="600" letter-spacing="1" fill="${C.hdrText}" text-anchor="middle" font-family="monospace">FINAL</text>`;

  // Champion + finalists
  const champY = OY + sideH/2 - 22;
  const topFinY = champY - BH - 8;
  const botFinY = champY + 46;
  const champSvg = `
    <rect x="${cx-10}" y="${topFinY}" width="${BW}" height="${BH}" fill="${C.bg}" stroke="${C.bdr}" rx="2"/>
    <text x="${cx-10+BW/2}" y="${topFinY+BH/2+4}" font-size="11" fill="${C.dim}" text-anchor="middle" font-style="italic">TBD</text>
    <rect x="${cx-10}" y="${champY}" width="${BW+20}" height="${BH+14}" fill="${C.champBg}" stroke="${C.champBdr}" stroke-width="2" rx="4"/>
    <text x="${SVW/2}" y="${champY+10}" font-size="9" font-weight="600" letter-spacing="2" fill="${C.champLbl}" text-anchor="middle" font-family="monospace">CHAMPION</text>
    <text x="${SVW/2}" y="${champY+28}" font-size="18" font-weight="800" fill="${C.champName}" text-anchor="middle">TBD</text>
    <rect x="${cx+10}" y="${botFinY}" width="${BW}" height="${BH}" fill="${C.bg}" stroke="${C.bdr}" rx="2"/>
    <text x="${cx+10+BW/2}" y="${botFinY+BH/2+4}" font-size="11" fill="${C.dim}" text-anchor="middle" font-style="italic">TBD</text>`;

  const svg = `<svg viewBox="0 0 ${SVW} ${SVH}" xmlns="http://www.w3.org/2000/svg" style="width:100%;min-width:${SVW}px;font-family:'IBM Plex Sans',sans-serif">
    <rect width="${SVW}" height="${SVH}" fill="${C.bg}"/>
    ${hdrSvg}
    ${left.svg}
    ${right.svg}
    ${champSvg}
  </svg>`;

  const sameShiftCount = _bracketSlots.reduce((n, quad) =>
    n + quad.reduce((m, pair) => {
      const t0 = byNum[pair[0]], t1 = byNum[pair[1]];
      return m + (t0 && t1 && t0.shift === t1.shift ? 1 : 0);
    }, 0), 0);

  document.getElementById('bracket-root').innerHTML = `
    <div class="bracket-note">
      <strong>${seeds.length} of 28</strong> playoff spots filled.
      Seeds 1–4 receive Wild Card byes.
      Click any Wild Card team to reassign.
      ${sameShiftCount > 0 ? `<span style="color:${C.warn}">⚠ ${sameShiftCount} same-shift R1 matchup${sameShiftCount>1?'s':''}</span>` : `<span style="color:${C.ok}">✓ No same-shift R1 matchups</span>`}
      <button class="reset-btn" onclick="resetBracket()">↺ Reset seeding</button>
    </div>
    <div class="bracket-wrap">${svg}</div>
    <div id="bracket-dropdown" class="bracket-dropdown" style="display:none"></div>`;
}

function resetBracket() {
  _bracketSlots = null;
  renderBracket(_bracketSeeds, null, null);
}

function startEdit(evt, qi, p, slot) {
  evt.stopPropagation();
  const dd = document.getElementById('bracket-dropdown');
  const x  = Math.min(evt.clientX, window.innerWidth - 240);
  const y  = evt.clientY + 8;
  dd.style.display = 'block';
  dd.style.left = x + 'px';
  dd.style.top  = y + 'px';

  const used = new Set(_bracketSlots.flat(2));
  const partner = _bracketSlots[qi][p][1 - slot];
  const partnerTeam = _bracketSeeds?.find(t => t.seed === partner);

  dd.innerHTML = '<div class="bracket-dd-header">Select team for this slot</div>' +
    _bracketSeeds?.filter(t => t.seed > 4).map(t => {
      const isUsed = used.has(t.seed) && t.seed !== _bracketSlots[qi][p][slot];
      const sameShift = partnerTeam && t.shift === partnerTeam.shift;
      const cls = ['bracket-dd-item', isUsed ? 'is-used' : '', sameShift && !isUsed ? 'is-warn' : ''].filter(Boolean).join(' ');
      const note  = isUsed ? ' (taken)' : sameShift ? ' ⚠ same shift' : '';
      return `<div class="${cls}" onclick="${isUsed ? '' : 'setSlot(' + qi + ',' + p + ',' + slot + ',' + t.seed + ')'}"
        >#${t.seed} ${t.name} <span class="bracket-dd-shift">${shiftAbbr(t.shift)}</span>${note}</div>`;
    }).join('');
}

function setSlot(qi, p, slot, seed) {
  // Swap if seed already placed elsewhere
  const flatSlots = _bracketSlots.flat(2);
  if (flatSlots.includes(seed)) {
    const oldSeed = _bracketSlots[qi][p][slot];
    for (let q = 0; q < 4; q++) for (let pp = 0; pp < 3; pp++) for (let ss = 0; ss < 2; ss++) {
      if (_bracketSlots[q][pp][ss] === seed) _bracketSlots[q][pp][ss] = oldSeed;
    }
  }
  _bracketSlots[qi][p][slot] = seed;
  document.getElementById('bracket-dropdown').style.display = 'none';
  renderBracket(_bracketSeeds, null, null);
}

document.addEventListener('click', () => {
  const dd = document.getElementById('bracket-dropdown');
  if (dd) dd.style.display = 'none';
});
