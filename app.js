// ── app.js — UI rendering only (no standings math) ────────────────
// All logic lives in engine.py / data.json.
// This file fetches pre-computed data and renders it.

// ── Data loading ──────────────────────────────────────────────────
async function loadData() {
  // Local dev (python server.py) → live API.  GitHub Pages → static file.
  const url = window.location.hostname === 'localhost' ? '/api/data' : 'data.json';
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
  return resp.json();
}

// ── Helpers ───────────────────────────────────────────────────────
function shiftAbbr(id) {
  return id.replace('tue_dinner','Tue 4:25').replace('tue_late','Tue Late')
           .replace('wed_dinner','Wed 4:25').replace('wed_late','Wed Late')
           .replace('thu_dinner','Thu 4:25').replace('thu_late','Thu Late');
}

function h1ClinchCaption(how) {
  if (how === 'solo')    return 'Outright lead — no other team is within one game of this 1st-half record';
  if (how === 'half')    return 'Clinched: at least one full game ahead on 1st-half record vs the next team out';
  if (how === 'overall') return 'Clinched: tied within one game on 1st half, but at least one full game ahead overall vs the next team out';
  return '';
}

function spotEl(spotLabel, clinched) {
  const cls   = clinched ? '' : ' leading';
  const title = clinched ? 'Clinched — cannot lose this spot on the numbers'
                         : 'Leading — not yet mathematically clinched';
  return `<span class="h1-spot${cls}" title="${title}">${clinched ? '✓' : '▲'} ${spotLabel}</span>`;
}

function statusBadge(t) {
  if (t.status === 'clinched') {
    const cls = t.spot_label?.startsWith('H1') ? 'h1'
              : t.spot_label?.startsWith('H2') ? 'h2' : 'wc';
    return `<span class="status-badge badge-${cls}">✓ ${t.spot_label}</span>`;
  }
  if (t.status === 'leadH1' || t.status === 'leadH2')
    return `<span class="status-badge badge-lead">▲ ${t.spot_label}</span>`;
  if (t.status === 'elim')
    return `<span class="status-badge badge-elim">Elim</span>`;
  return `<span class="status-badge badge-cont">Contention</span>`;
}

function rowCls(t) {
  if (t.status === 'clinched')                             return 'row-qual';
  if (t.status === 'leadH1' || t.status === 'leadH2')     return 'row-lead';
  if (t.status === 'elim')                                 return 'row-elim';
  return '';
}

// ── Topline chip row (always-visible shift summary) ───────────────
function renderTopline(teams) {
  const spotTeams = teams
    .filter(t => t.spot_label)
    .sort((a, b) => {
      const order = s => s.startsWith('H1') ? 0 : s.startsWith('H2') ? 1 : 2;
      return order(a.spot_label) - order(b.spot_label)
          || a.spot_label.localeCompare(b.spot_label);
    });

  if (!spotTeams.length) {
    // Fall back to showing the current H1 leaders (top 2 by H1 record)
    const h1Leaders = [...teams]
      .sort((a, b) => b.h1.pct - a.h1.pct || a.draw_rank - b.draw_rank)
      .slice(0, 2);
    if (!h1Leaders.length) return `<span class="topline-empty">No results yet</span>`;
    return h1Leaders.map(t =>
      `<span class="topline-chip chip-neutral">${t.name} <span class="chip-rec">${t.h1.w}–${t.h1.l} H1</span></span>`
    ).join('');
  }

  return spotTeams.map(t => {
    const clinched = t.status === 'clinched';
    const cls = clinched
      ? (t.spot_label.startsWith('H1') ? 'chip-h1' : t.spot_label.startsWith('H2') ? 'chip-h2' : 'chip-wc')
      : 'chip-lead';
    const icon = clinched ? '✓' : '▲';
    return `<span class="topline-chip ${cls}">${icon} ${t.name} <span class="chip-spot">${t.spot_label}</span></span>`;
  }).join('');
}

// ── Shift card ────────────────────────────────────────────────────
function renderShift(shift) {
  const teams      = shift.teams;
  const totalSpots = shift.h1_spots + shift.h2_spots + shift.wc_spots;
  const sid        = shift.shift_id;

  // ── H1 panel ────────────────────────────────────────────────
  const h1Qual = teams.filter(t => t.status === 'clinched' && t.spot_label?.startsWith('H1'))
                      .sort((a, b) => a.spot_label.localeCompare(b.spot_label));
  const h1Lead = teams.filter(t => t.status === 'leadH1')
                      .sort((a, b) => a.spot_label.localeCompare(b.spot_label));
  const inH1Spot = t => t.spot_label?.startsWith('H1');
  const h1Other  = teams.filter(t => !inH1Spot(t))
                        .sort((a, b) => b.h1.pct - a.h1.pct || a.draw_rank - b.draw_rank);

  function h1RowClinchLead(t) {
    const isLead  = t.status === 'leadH1';
    const recMain = isLead ? `${t.overall.w}–${t.overall.l}` : `${t.h1.w}–${t.h1.l}`;
    const recHtml = isLead
      ? `<span class="h1-rec"><span class="h1-rec-num">${recMain}</span><span class="h1-rec-context">overall</span></span>`
      : `<span class="h1-rec">${recMain}</span>`;
    const how      = t.status === 'clinched' && t.spot_label?.startsWith('H1') && t.h1_clinch_how;
    const howShort = { solo: 'Outright', half: 'Half +1', overall: 'Overall' };
    const howHtml  = how
      ? `<span class="h1-clinch-how kind-${t.h1_clinch_how}" title="${h1ClinchCaption(t.h1_clinch_how).replace(/"/g,'&quot;')}">${howShort[t.h1_clinch_how]}</span>`
      : '';
    return `<div class="h1-row">
      ${spotEl(t.spot_label, t.status === 'clinched')}
      <span class="h1-name">${t.name}${howHtml}</span>
      ${recHtml}
    </div>`;
  }

  function h1RowOther(t) {
    let tag = '';
    if (t.status === 'clinched' && t.spot_label && !t.spot_label.startsWith('H1'))
      tag = `<span class="h1-inline-tag clinch">✓ ${t.spot_label}</span>`;
    else if (t.status === 'leadH2')
      tag = `<span class="h1-inline-tag lead">▲ ${t.spot_label}</span>`;
    return `<div class="h1-row h1-row-other">
      <span class="h1-name">${t.name}${tag}</span>
      <span class="h1-rec">
        <span class="h1-rec-num">${t.h1.w}–${t.h1.l}</span><span class="h1-rec-context">H1</span>
        <span class="h1-rec-ov">${t.overall.w}–${t.overall.l} ov</span>
      </span>
    </div>`;
  }

  const h1SecClinched = h1Qual.length
    ? `<div class="h1-section">
        <div class="h1-section-head"><strong>✓ Clinched</strong><span class="h1-section-sub">${shift.h1_spots} spot${shift.h1_spots > 1 ? 's' : ''}. <strong>Outright</strong> = no one within one game. <strong>Half +1</strong> = ≥1 full game ahead on H1. <strong>Overall</strong> = tied on H1 but ≥1 game ahead overall.</span></div>
        ${h1Qual.map(h1RowClinchLead).join('')}
      </div>`
    : `<div class="h1-section"><div class="h1-section-head"><strong>✓ Clinched</strong></div>
        <div class="h1-row"><span class="h1-name placeholder-empty">None yet</span></div></div>`;

  const h1SecLeading = h1Lead.length
    ? `<div class="h1-section">
        <div class="h1-section-head"><strong>▲ Leading</strong><span class="h1-section-sub">Ahead but not clinched — overall record shown (tiebreaker when within one game on H1)</span></div>
        ${h1Lead.map(h1RowClinchLead).join('')}
      </div>`
    : '';

  const nOther  = h1Other.length;
  const otherId = `h1-other-${sid}`;
  const collapseO = nOther > 3;
  const h1OtherTitle = shift.h1_done ? 'Out of H1 spots' : 'Not in a top H1 spot yet';
  const h1SecOther = nOther === 0 ? '' : `<div class="h1-section h1-section-other">
    <div class="h1-section-head"><strong>${h1OtherTitle}</strong></div>
    ${collapseO
      ? `<button type="button" class="h1-other-toggle" data-count="${nOther}" onclick="toggleEl('${otherId}')">▼ ${nOther} teams — show list</button>
         <div id="${otherId}" class="h1-other-body" style="display:none">${h1Other.map(h1RowOther).join('')}</div>`
      : h1Other.map(h1RowOther).join('')}
  </div>`;

  const h1Panel = `<div class="h1-panel">
    <div class="h1-header">1st Half — ${shift.h1_spots} spot${shift.h1_spots > 1 ? 's' : ''}</div>
    <div class="h1-sections">${h1SecClinched}${h1SecLeading}${h1SecOther}</div>
  </div>`;

  // ── Shift WC panel (wed_late only) ──────────────────────────
  let wcPanel = '';
  if (shift.wc_spots > 0) {
    const wcQual = teams.filter(t => t.status === 'clinched' && t.spot_label?.startsWith('SWC'));
    const wcLead = teams.filter(t => t.status === 'leadH2'   && t.spot_label?.startsWith('SWC'));
    const wcRows = [...wcQual, ...wcLead].map(t =>
      `<div class="h1-row">${spotEl(t.spot_label, t.status === 'clinched')}
       <span class="h1-name">${t.name}</span>
       <span class="h1-rec">${t.overall.w}–${t.overall.l}</span></div>`
    ).join('') || `<div class="h1-row"><span class="h1-name placeholder-empty">None yet</span></div>`;
    wcPanel = `<div class="wc-panel">
      <div class="wc-header">Shift Wild Card${shift.wc_spots > 1 ? 's' : ''} — ${shift.wc_spots} spot${shift.wc_spots > 1 ? 's' : ''}</div>
      ${wcRows}
    </div>`;
  }

  // ── H2 panel ────────────────────────────────────────────────
  const h2Qual     = teams.filter(t => t.status === 'clinched' && t.spot_label?.startsWith('H2'))
                          .sort((a, b) => a.spot_label.localeCompare(b.spot_label));
  const h2Lead     = teams.filter(t => t.status === 'leadH2'   && t.spot_label?.startsWith('H2'))
                          .sort((a, b) => a.spot_label.localeCompare(b.spot_label));
  const contention = teams.filter(t => t.status === 'contention').sort((a,b) => b.h2.pct - a.h2.pct);
  const elim       = teams.filter(t => t.status === 'elim').sort((a,b) => b.h2.pct - a.h2.pct);

  function h2Row(t, showSpot) {
    const sp = showSpot ? `${spotEl(t.spot_label, t.status === 'clinched')} ` : '';
    return `<div class="h2-row">
      ${sp}<span class="h2-name${t.status === 'elim' ? ' elim' : ''}">${t.name}</span>
      <span class="h2-rec${t.status === 'elim' ? ' elim' : ''}">${t.h2.w}–${t.h2.l}</span>
    </div>`;
  }
  function h2Col(items, header, showSpot = false) {
    if (!items.length) return '';
    return `<div class="h2-col">
      <div class="h2-col-header">${header}</div>
      ${items.map(t => h2Row(t, showSpot)).join('')}
    </div>`;
  }

  const h2ColsHtml = [
    h2Col([...h2Qual, ...h2Lead], '✓ Clinch · ▲ Lead', true),
    h2Col(contention, 'Still alive', false),
    h2Col(elim, 'Out (H2 path)', false),
  ].filter(Boolean).join('');

  const h2Panel = `<div class="h2-panel">
    <div class="h2-header">2nd Half — ${shift.h2_spots} spot${shift.h2_spots > 1 ? 's' : ''} <span class="h2-header-hint">(teams without an H1 spot)</span></div>
    <div class="h2-cols">${h2ColsHtml || '<div class="h2-empty">No results yet</div>'}</div>
  </div>`;

  // ── Full standings table (2nd expand) ────────────────────────
  const allSorted = [...teams].sort((a, b) => b.overall.pct - a.overall.pct || a.draw_rank - b.draw_rank);
  const tblRows = allSorted.map(t => `<tr class="${rowCls(t)}">
    <td>${t.name}</td>
    <td>${t.h1.w}–${t.h1.l}</td>
    <td>${t.h2.w}–${t.h2.l}</td>
    <td><strong>${t.overall.w}–${t.overall.l}</strong></td>
    <td>${t.draw_display}</td>
    <td>${statusBadge(t)}</td>
  </tr>`).join('');

  const tableId = `tbl-${sid}`;

  return `<div class="shift-card">
    <button class="shift-summary" onclick="toggleShift('${sid}')"
            id="shift-btn-${sid}" aria-expanded="false" aria-controls="shift-details-${sid}">
      <div class="shift-summary-left">
        <span class="shift-title">${shift.label}</span>
        <span class="shift-spot-count">${totalSpots} playoff spots</span>
      </div>
      <div class="shift-topline">${renderTopline(teams)}</div>
      <span class="shift-chevron" aria-hidden="true"></span>
    </button>

    <div class="shift-details" id="shift-details-${sid}" hidden>
      <div class="halves">
        ${h1Panel}
        ${wcPanel}
        ${h2Panel}
      </div>
      <button class="expand-btn" onclick="toggleEl('${tableId}')">▼ Full standings — all records &amp; draw shot</button>
      <div id="${tableId}" style="display:none" class="full-table">
        <table>
          <thead><tr><th>Skip</th><th>H1</th><th>H2</th><th>Overall</th><th>Draw</th><th>Status</th></tr></thead>
          <tbody>${tblRows}</tbody>
        </table>
      </div>
    </div>
  </div>`;
}

// ── EWC card ──────────────────────────────────────────────────────
function renderEWC(ewc) {
  const pool   = ewc.pool;
  const inPlay = pool.filter(t => t.ewc_status !== 'elim');
  const elim   = pool.filter(t => t.ewc_status === 'elim');

  // Topline: current EWC holders (or top 4 if none)
  const wcTeams = pool.filter(t => t.ewc_status === 'wc');
  const topline = wcTeams.length
    ? wcTeams.map(t => `<span class="topline-chip chip-lead">▲ ${t.name} <span class="chip-spot">${t.shift_label.replace('Tuesday','Tue').replace('Wednesday','Wed').replace('Thursday','Thu')}</span></span>`).join('')
    : pool.slice(0, 4).map(t => `<span class="topline-chip chip-neutral">${t.name} <span class="chip-rec">${t.overall.w}–${t.overall.l}</span></span>`).join('');

  function ewcRow(t, i) {
    const chip = t.ewc_status === 'wc'
      ? `<span class="status-badge badge-ewc">Event WC</span>`
      : t.ewc_status === 'contention'
      ? `<span class="status-badge badge-cont">Contention</span>`
      : `<span class="status-badge badge-elim">Eliminated</span>`;
    const rc = t.ewc_status === 'wc' ? 'row-wc' : t.ewc_status === 'elim' ? 'row-elim' : '';
    return `<tr class="${rc}">
      <td>${i + 1}</td><td>${t.name}</td>
      <td>${t.shift_label}</td>
      <td><strong>${t.overall.w}–${t.overall.l}</strong></td>
      <td>${t.draw_display}</td>
      <td>${chip}</td>
    </tr>`;
  }

  const inPlayRows = inPlay.map((t, i) => ewcRow(t, i)).join('');
  const elimRows   = elim.map((t, i)  => ewcRow(t, inPlay.length + i)).join('');

  return `<div class="shift-card ewc-card">
    <button class="shift-summary" onclick="toggleShift('ewc')"
            id="shift-btn-ewc" aria-expanded="false" aria-controls="shift-details-ewc">
      <div class="shift-summary-left">
        <span class="shift-title">Event Wild Cards</span>
        <span class="shift-spot-count">4 spots · best overall across all shifts</span>
      </div>
      <div class="shift-topline">${topline}</div>
      <span class="shift-chevron" aria-hidden="true"></span>
    </button>

    <div class="shift-details" id="shift-details-ewc" hidden>
      <div class="ewc-table">
        <table>
          <thead><tr><th>#</th><th>Skip</th><th>Shift</th><th>Overall</th><th>Draw</th><th>Status</th></tr></thead>
          <tbody>${inPlayRows}</tbody>
        </table>
        ${elimRows ? `
          <button class="expand-btn" onclick="toggleEl('ewc-elim')">▼ Show ${elim.length} eliminated</button>
          <div id="ewc-elim" style="display:none">
            <table><thead><tr><th>#</th><th>Skip</th><th>Shift</th><th>Overall</th><th>Draw</th><th>Status</th></tr></thead>
              <tbody>${elimRows}</tbody></table>
          </div>` : ''}
      </div>
    </div>
  </div>`;
}

// ── Byes banner ───────────────────────────────────────────────────
function renderByesBanner(qualified) {
  const byes    = qualified.slice(0, 4);
  const entries = byes.map((t, i) =>
    `<div class="bye-entry">
      <span class="bye-seed">${i + 1}</span>
      <span class="bye-name">${t.name}</span>
      <span class="bye-meta">${shiftAbbr(t.shift)} · ${t.overall.w}–${t.overall.l}</span>
    </div>`
  ).join('');
  return `<div class="byes-banner">
    <span class="byes-label">1st-Round Byes</span>
    ${entries}
  </div>`;
}

// ── Init ──────────────────────────────────────────────────────────
async function init() {
  try {
    const data = await loadData();
    window._data = data;

    let html = renderByesBanner(data.qualified);
    for (const shift of data.shifts) html += renderShift(shift);
    html += renderEWC(data.ewc);
    document.getElementById('standings-root').innerHTML = html;

    renderBracket(data.qualified, data.shifts, null);

  } catch (e) {
    document.getElementById('standings-root').innerHTML =
      `<div class="loading error">Error: ${e.message}<br>
       <small>Local: make sure <code>python server.py</code> is running.</small></div>`;
    console.error(e);
  }
}

// ── UI helpers ────────────────────────────────────────────────────
function showTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  const panel = document.getElementById(`tab-${name}`);
  if (panel) panel.classList.add('active');
}

function toggleShift(sid) {
  const details = document.getElementById(`shift-details-${sid}`);
  const btn     = document.getElementById(`shift-btn-${sid}`);
  if (!details || !btn) return;
  const opening = details.hidden;
  details.hidden = !opening;
  btn.setAttribute('aria-expanded', opening ? 'true' : 'false');
  btn.classList.toggle('is-open', opening);
}

function toggleEl(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const btn    = el.previousElementSibling;
  const hidden = el.style.display === 'none';
  el.style.display = hidden ? 'block' : 'none';
  if (btn?.classList.contains('expand-btn'))
    btn.textContent = btn.textContent.replace(hidden ? '▼' : '▲', hidden ? '▲' : '▼');
  if (btn?.classList.contains('h1-other-toggle')) {
    const n = btn.dataset.count || '0';
    btn.textContent = hidden ? '▲ Hide list' : `▼ ${n} teams — show list`;
  }
}

init();
