// ── app.js — UI rendering only (no standings math) ────────────────
// All logic lives in engine.py on the server.
// This file fetches pre-computed data from /api/data and renders it.

// ── Data loading ──────────────────────────────────────────────────
async function loadData() {
  const url = window.location.hostname === 'localhost' ? '/api/data' : 'data.json';
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
  return resp.json();
}

// ── Render helpers ────────────────────────────────────────────────
function shiftAbbr(id) {
  return id.replace('tue_dinner','Tue 4:25').replace('tue_late','Tue Late')
           .replace('wed_dinner','Wed 4:25').replace('wed_late','Wed Late')
           .replace('thu_dinner','Thu 4:25').replace('thu_late','Thu Late');
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
  return `<span class="status-badge badge-cont">In play</span>`;
}

function rowCls(t) {
  if (t.status === 'clinched')                              return 'row-qual';
  if (t.status === 'leadH1' || t.status === 'leadH2')      return 'row-lead';
  if (t.status === 'elim')                                  return 'row-elim';
  return '';
}

// ── Shift table ───────────────────────────────────────────────────
function renderShift(shift) {
  const teams = [...shift.teams].sort(
    (a, b) => b.overall.pct - a.overall.pct || a.draw_rank - b.draw_rank
  );

  const totalSpots = shift.h1_spots + shift.h2_spots + shift.wc_spots;
  const spotsDesc = [
    `${shift.h1_spots} from 1st half`,
    `${shift.h2_spots} from 2nd half`,
    shift.wc_spots > 0 ? `${shift.wc_spots} shift wild card` : null,
  ].filter(Boolean).join(', ');

  const rows = teams.map((t, i) => `<tr class="${rowCls(t)}">
    <td class="col-rank">${i + 1}</td>
    <td class="col-name">${t.name}</td>
    <td class="col-rec">${t.h1.w}–${t.h1.l}</td>
    <td class="col-rec">${t.h2.w}–${t.h2.l}</td>
    <td class="col-num">${t.overall.w}</td>
    <td class="col-num">${t.overall.l}</td>
    <td class="col-draw">${t.draw_display}</td>
    <td class="col-status">${statusBadge(t)}</td>
  </tr>`).join('');

  return `<div class="shift-tab">
    <div class="shift-tab-header">
      <span class="shift-title">${shift.label}</span>
      <span class="shift-desc">${totalSpots} playoff spots — ${spotsDesc}</span>
    </div>
    <div class="shift-table-wrap">
      <table class="shift-table">
        <thead><tr>
          <th class="col-rank">#</th>
          <th class="col-name">Skip</th>
          <th class="col-rec">1st Half</th>
          <th class="col-rec">2nd Half</th>
          <th class="col-num">W</th>
          <th class="col-num">L</th>
          <th class="col-draw">Draw</th>
          <th class="col-status">Status</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="shift-legend">
      Sorted by overall record, then draw shot. &nbsp;
      <strong>✓</strong> = clinched · <strong>▲</strong> = leading (not yet clinched) ·
      Draw: lower inches is better; <strong>X</strong> = missed deadline; <strong>—</strong> = no score recorded.
    </div>
  </div>`;
}

// ── EWC section ───────────────────────────────────────────────────
function renderEWC(ewc) {
  const pool   = ewc.pool;
  const inPlay = pool.filter(t => t.ewc_status !== 'elim');
  const elim   = pool.filter(t => t.ewc_status === 'elim');

  function ewcRow(t, i) {
    const chip = t.ewc_status === 'wc'
      ? `<span class="status-badge badge-ewc">Event WC</span>`
      : t.ewc_status === 'contention'
      ? `<span class="status-badge badge-cont">In play</span>`
      : `<span class="status-badge badge-elim">Eliminated</span>`;
    const rc = t.ewc_status === 'wc' ? 'row-wc' : t.ewc_status === 'elim' ? 'row-elim' : '';
    return `<tr class="${rc}">
      <td>${i + 1}</td>
      <td>${t.name}</td>
      <td>${t.shift_label}</td>
      <td>${t.overall.w}–${t.overall.l}</td>
      <td>${t.draw_display}</td>
      <td>${chip}</td>
    </tr>`;
  }

  const inPlayRows = inPlay.map((t, i) => ewcRow(t, i)).join('');
  const elimRows   = elim.map((t, i)  => ewcRow(t, inPlay.length + i)).join('');

  return `<div class="ewc-block">
    <div class="ewc-block-header">
      <span class="ewc-title">⭐ Event Wild Cards — 4 Spots</span>
      <span class="ewc-desc">Best overall record among all teams not qualified via their shift · ${ewc.winners_count} awarded · ${ewc.contention_count} in contention</span>
    </div>
    <div class="ewc-table">
      <table>
        <thead><tr><th>#</th><th>Skip</th><th>Shift</th><th>Overall</th><th>Draw</th><th>Status</th></tr></thead>
        <tbody>${inPlayRows}</tbody>
      </table>
      ${elimRows ? `
        <button class="expand-btn" onclick="toggleEl('ewc-elim')">▼ Show ${elim.length} eliminated</button>
        <div id="ewc-elim" style="display:none">
          <table><thead><tr><th>#</th><th>Skip</th><th>Shift</th><th>Overall</th><th>Draw</th><th>Status</th></tr></thead>
            <tbody>${elimRows}</tbody>
          </table>
        </div>` : ''}
    </div>
  </div>`;
}

// ── Byes banner ───────────────────────────────────────────────────
function renderByesBanner(qualified) {
  const byes = qualified.slice(0, 4);
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

    // Build standings tab content: byes banner + all shifts + EWC
    let html = renderByesBanner(data.qualified);
    for (const shift of data.shifts) html += renderShift(shift);
    html += renderEWC(data.ewc);
    document.getElementById('standings-root').innerHTML = html;

    renderBracket(data.qualified, data.shifts, null);

  } catch (e) {
    document.getElementById('standings-root').innerHTML =
      `<div class="loading" style="color:#e74c3c">Error: ${e.message}<br><small>Make sure the server is running: python server.py</small></div>`;
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

function toggleEl(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const btn    = el.previousElementSibling;
  const hidden = el.style.display === 'none';
  el.style.display = hidden ? 'block' : 'none';
  if (btn?.classList.contains('expand-btn')) {
    btn.textContent = btn.textContent.replace(hidden ? '▼' : '▲', hidden ? '▲' : '▼');
  }
}

init();
