// history.js
// ─────────────────────────────────────────────────────────────────────────────
// Provides the "📅 Historical Stats" panel injected into wbinfo player profiles.
// Exports only setupHistoricalMount() — everything else is internal.
// ─────────────────────────────────────────────────────────────────────────────

const REPO_RAW = 'https://raw.githubusercontent.com/DidYouGetSniped/didyougetsniped.github.io/main';

// ── Style constants (dark-theme only, matches the rest of the site) ───────────
const C = {
    text:       '#f1f5f9',
    muted:      '#94a3b8',
    border:     '#1e293b',
    borderMed:  '#334155',
    cardBg:     '#1a1f2e',
    inputBg:    '#20253a',
    purple:     '#7c3aed',
    purpleDim:  '#5b21b6',
    blue:       '#3b82f6',
    green:      '#10b981',
    red:        '#ef4444',
};

// ── Metrics for the line-chart trend view ─────────────────────────────────────
const TREND_METRICS = [
    { key: 'kdr',                  label: 'K/D Ratio',              fmt: v => Number(v).toFixed(3),       numericFmt: v => Number(v) },
    { key: 'killsELO',             label: 'Kills ELO',              fmt: v => Number(v).toFixed(2),       numericFmt: v => Number(v) },
    { key: 'gamesELO',             label: 'Games ELO',              fmt: v => Number(v).toFixed(2),       numericFmt: v => Number(v) },
    { key: 'totalKills',           label: 'Total Kills',            fmt: v => Number(v).toLocaleString(), numericFmt: v => Number(v) },
    { key: 'totalDeaths',          label: 'Total Deaths',           fmt: v => Number(v).toLocaleString(), numericFmt: v => Number(v) },
    { key: 'weaponKillsTotal',     label: 'Weapon Kills',           fmt: v => Number(v).toLocaleString(), numericFmt: v => Number(v) },
    { key: 'vehicleKillsTotal',    label: 'Vehicle Kills',          fmt: v => Number(v).toLocaleString(), numericFmt: v => Number(v) },
    { key: 'totalGames',           label: 'Total Games',            fmt: v => Number(v).toLocaleString(), numericFmt: v => Number(v) },
    { key: 'totalWins',            label: 'Total Wins',             fmt: v => Number(v).toLocaleString(), numericFmt: v => Number(v) },
    { key: 'totalLosses',          label: 'Total Losses',           fmt: v => Number(v).toLocaleString(), numericFmt: v => Number(v) },
    { key: 'level',                label: 'Level',                  fmt: v => String(v),                  numericFmt: v => Number(v) },
    { key: 'xp',                   label: 'XP',                     fmt: v => Number(v).toLocaleString(), numericFmt: v => Number(v) },
    { key: 'coins',                label: 'Coins',                  fmt: v => Number(v).toLocaleString(), numericFmt: v => Number(v) },
    { key: 'totalHeadshots',       label: 'Total Headshots',        fmt: v => Number(v).toLocaleString(), numericFmt: v => Number(v) },
    { key: 'totalDamageDealt',     label: 'Total Damage Dealt',     fmt: v => Number(v).toLocaleString(), numericFmt: v => Number(v) },
    { key: 'totalDamageReceived',  label: 'Total Damage Received',  fmt: v => Number(v).toLocaleString(), numericFmt: v => Number(v) },
    { key: 'totalShotsFired',      label: 'Total Shots Fired',      fmt: v => Number(v).toLocaleString(), numericFmt: v => Number(v) },
    { key: 'totalShotsHit',        label: 'Total Shots Hit',        fmt: v => Number(v).toLocaleString(), numericFmt: v => Number(v) },
    { key: 'selfDestructs',        label: 'Self Destructs',         fmt: v => Number(v).toLocaleString(), numericFmt: v => Number(v) },
    { key: 'killsPercentile',      label: 'Kills Rank (top %)',     fmt: v => Number(v).toFixed(4) + '%', numericFmt: v => Number(v) },
    { key: 'gamesPercentile',      label: 'Games Rank (top %)',     fmt: v => Number(v).toFixed(4) + '%', numericFmt: v => Number(v) },
    { key: 'xpPercentile',         label: 'XP Rank (top %)',        fmt: v => Number(v).toFixed(4) + '%', numericFmt: v => Number(v) },
];

// ── Stats shown in the comparison table ───────────────────────────────────────
// higher: true  → green when B > A   (bigger is better)
// higher: false → green when B < A   (smaller is better — e.g. percentile rank)
// higher: null  → no colour coding
const COMPARE_STATS = [
    { key: 'nick',                label: 'Username',               fmt: v => String(v ?? '—'),                       higher: null  },
    { key: 'level',               label: 'Level',                  fmt: v => Number(v).toLocaleString(),             higher: true  },
    { key: 'xp',                  label: 'XP',                     fmt: v => Number(v).toLocaleString(),             higher: true  },
    { key: 'coins',               label: 'Coins',                  fmt: v => Number(v).toLocaleString(),             higher: true  },
    { key: 'squad',               label: 'Squad',                  fmt: v => v || 'None',                            higher: null  },
    { key: 'killsELO',            label: 'Kills ELO',              fmt: v => Number(v).toFixed(2),                   higher: true  },
    { key: 'gamesELO',            label: 'Games ELO',              fmt: v => Number(v).toFixed(2),                   higher: true  },
    { key: 'kdr',                 label: 'K/D Ratio',              fmt: v => Number(v).toFixed(3),                   higher: true  },
    { key: 'totalKills',          label: 'Total Kills',            fmt: v => Number(v).toLocaleString(),             higher: true  },
    { key: 'totalDeaths',         label: 'Total Deaths',           fmt: v => Number(v).toLocaleString(),             higher: false },
    { key: 'weaponKillsTotal',    label: 'Weapon Kills',           fmt: v => Number(v).toLocaleString(),             higher: true  },
    { key: 'vehicleKillsTotal',   label: 'Vehicle Kills',          fmt: v => Number(v).toLocaleString(),             higher: true  },
    { key: 'totalGames',          label: 'Total Games',            fmt: v => Number(v).toLocaleString(),             higher: true  },
    { key: 'totalWins',           label: 'Total Wins',             fmt: v => Number(v).toLocaleString(),             higher: true  },
    { key: 'totalLosses',         label: 'Total Losses',           fmt: v => Number(v).toLocaleString(),             higher: false },
    { key: 'totalHeadshots',      label: 'Total Headshots',        fmt: v => Number(v).toLocaleString(),             higher: true  },
    { key: 'totalDamageDealt',    label: 'Total Damage Dealt',     fmt: v => Number(v).toLocaleString(),             higher: true  },
    { key: 'totalDamageReceived', label: 'Total Damage Received',  fmt: v => Number(v).toLocaleString(),             higher: false },
    { key: 'totalShotsFired',     label: 'Total Shots Fired',      fmt: v => Number(v).toLocaleString(),             higher: null  },
    { key: 'totalShotsHit',       label: 'Total Shots Hit',        fmt: v => Number(v).toLocaleString(),             higher: true  },
    { key: 'selfDestructs',       label: 'Self Destructs',         fmt: v => Number(v).toLocaleString(),             higher: false },
    { key: 'killsPercentile',     label: 'Kills Rank (top %)',     fmt: v => Number(v).toFixed(4) + '%',             higher: false },
    { key: 'gamesPercentile',     label: 'Games Rank (top %)',     fmt: v => Number(v).toFixed(4) + '%',             higher: false },
    { key: 'xpPercentile',        label: 'XP Rank (top %)',        fmt: v => Number(v).toFixed(4) + '%',             higher: false },
];

// ── Chart.js lazy loader (mirrors ui.js so the lib loads once) ────────────────
function ensureChartJs() {
    if (window.Chart) return Promise.resolve(window.Chart);
    if (window.__wbChartLoading) return window.__wbChartLoading;
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
    s.async = true;
    window.__wbChartLoading = new Promise((res, rej) => {
        s.onload = () => res(window.Chart);
        s.onerror = () => rej(new Error('Chart.js failed to load'));
    });
    document.head.appendChild(s);
    return window.__wbChartLoading;
}

// ── Tiny style helpers ────────────────────────────────────────────────────────
const sel = (extra = '') =>
    `padding:8px 12px;border-radius:8px;border:1px solid ${C.borderMed};` +
    `background:${C.inputBg};color:${C.text};font-family:'JetBrains Mono',monospace;font-size:.9em;${extra}`;

const tabActiveStyle  = `padding:8px 18px;border-radius:8px;border:none;cursor:pointer;font-family:'JetBrains Mono',monospace;font-weight:600;font-size:.9em;background:linear-gradient(135deg,${C.purple},${C.purpleDim});color:#fff;box-shadow:0 4px 12px rgba(124,58,237,.4);`;
const tabInactiveStyle = `padding:8px 18px;border-radius:8px;border:none;cursor:pointer;font-family:'JetBrains Mono',monospace;font-weight:600;font-size:.9em;background:${C.border};color:${C.muted};`;

// ── Chart instance registry (keyed by canvas element id) ─────────────────────
const _charts = {};
function destroyChart(id) {
    if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; }
}

// ── API fetch ─────────────────────────────────────────────────────────────────
async function fetchSnapshots(uid) {
    const url = `${REPO_RAW}/historical-stats/${uid}/snapshots.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

// ── HTML builder ──────────────────────────────────────────────────────────────
function buildPanelHTML(pid, snapshots) {
    // Options rendered newest-first for user convenience.
    // The option value is the index into the chronological snapshots array.
    const opts = [...snapshots]
        .map((s, i) => ({ s, i }))
        .reverse()
        .map(({ s, i }) => `<option value="${i}">${s.date} — ${s.nick}</option>`)
        .join('');

    const metricOptions = TREND_METRICS.map(m =>
        `<option value="${m.key}">${m.label}</option>`).join('');

    const headerRow = `
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:8px;padding:8px 4px;
             margin-bottom:4px;border-bottom:2px solid ${C.borderMed};">
            <span style="color:${C.muted};font-size:.8em;font-weight:700;text-transform:uppercase;">Stat</span>
            <span style="color:${C.blue};font-size:.8em;font-weight:700;text-align:right;" id="hist-cmp-label-a-${pid}">Snapshot A</span>
            <span style="color:${C.purple};font-size:.8em;font-weight:700;text-align:right;" id="hist-cmp-label-b-${pid}">Snapshot B</span>
            <span style="color:${C.muted};font-size:.8em;font-weight:700;text-align:right;">Δ Change</span>
        </div>`;

    return `
<div class="stat-card" id="hist-panel-${pid}" style="margin-top:20px;">
    <h3>📅 Historical Stats
        <span style="font-size:.65em;opacity:.55;font-weight:400;">
            — ${snapshots.length} snapshot${snapshots.length !== 1 ? 's' : ''}
        </span>
    </h3>

    <!-- Tab bar -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;">
        <button class="hist-tab-btn" data-panel="${pid}" data-tab="trends"   style="${tabActiveStyle}">📈 Trends</button>
        <button class="hist-tab-btn" data-panel="${pid}" data-tab="compare"  style="${tabInactiveStyle}">⚖️ Compare Two</button>
        <button class="hist-tab-btn" data-panel="${pid}" data-tab="barchart" style="${tabInactiveStyle}">📊 Bar Chart</button>
    </div>

    <!-- ── TRENDS TAB ─────────────────────────────────────────────────────── -->
    <div id="hist-tab-trends-${pid}">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
            <label style="color:${C.text};font-weight:600;">Metric:</label>
            <select id="hist-metric-${pid}" style="${sel()}">
                ${metricOptions}
            </select>
        </div>
        <div style="position:relative;height:320px;width:100%;">
            <canvas id="hist-line-${pid}"></canvas>
        </div>
        <div id="hist-line-summary-${pid}" style="margin-top:12px;text-align:center;font-size:.9em;color:${C.muted};"></div>
    </div>

    <!-- ── COMPARE TAB ────────────────────────────────────────────────────── -->
    <div id="hist-tab-compare-${pid}" style="display:none;">
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px;">
            <div style="flex:1;min-width:200px;">
                <label style="color:${C.blue};font-weight:600;display:block;margin-bottom:6px;">🔵 Snapshot A (baseline):</label>
                <select id="hist-cmp-a-${pid}" style="${sel('width:100%;')}">
                    ${opts}
                </select>
            </div>
            <div style="flex:1;min-width:200px;">
                <label style="color:${C.purple};font-weight:600;display:block;margin-bottom:6px;">🟣 Snapshot B (compare to):</label>
                <select id="hist-cmp-b-${pid}" style="${sel('width:100%;')}">
                    ${opts}
                </select>
            </div>
        </div>
        <div id="hist-cmp-table-${pid}">
            ${headerRow}
            <div id="hist-cmp-rows-${pid}"></div>
        </div>
    </div>

    <!-- ── BAR CHART TAB ──────────────────────────────────────────────────── -->
    <div id="hist-tab-barchart-${pid}" style="display:none;">
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;">
            <div style="flex:1;min-width:200px;">
                <label style="color:${C.blue};font-weight:600;display:block;margin-bottom:6px;">🔵 Snapshot A:</label>
                <select id="hist-bar-a-${pid}" style="${sel('width:100%;')}">
                    ${opts}
                </select>
            </div>
            <div style="flex:1;min-width:200px;">
                <label style="color:${C.purple};font-weight:600;display:block;margin-bottom:6px;">🟣 Snapshot B:</label>
                <select id="hist-bar-b-${pid}" style="${sel('width:100%;')}">
                    ${opts}
                </select>
            </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
            <label style="color:${C.text};font-weight:600;">Metric:</label>
            <select id="hist-bar-metric-${pid}" style="${sel()}">
                ${metricOptions}
            </select>
        </div>
        <div style="position:relative;height:320px;width:100%;">
            <canvas id="hist-bar-${pid}"></canvas>
        </div>
        <div id="hist-bar-summary-${pid}" style="margin-top:12px;text-align:center;font-size:.9em;color:${C.muted};"></div>
    </div>
</div>`;
}

// ── Chart renderers ───────────────────────────────────────────────────────────

function drawLineChart(pid, snapshots, metricKey) {
    const metric  = TREND_METRICS.find(m => m.key === metricKey);
    const labels  = snapshots.map(s => s.date);
    const values  = snapshots.map(s => {
        const v = s[metricKey];
        return (v !== undefined && v !== null) ? Number(v) : null;
    });

    const canvasId = `hist-line-${pid}`;
    destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    _charts[canvasId] = new window.Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: metric?.label ?? metricKey,
                data: values,
                borderColor: C.purple,
                backgroundColor: 'rgba(124,58,237,.15)',
                pointBackgroundColor: C.purple,
                pointRadius: snapshots.length > 60 ? 2 : 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.3,
                spanGaps: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, labels: { color: C.text } },
                tooltip: {
                    titleColor: C.text,
                    bodyColor:  C.text,
                    callbacks: { label: c => metric ? metric.fmt(c.raw) : String(c.raw) }
                }
            },
            scales: {
                x: { ticks: { color: C.text, maxTicksLimit: 12 }, grid: { color: C.border } },
                y: {
                    ticks: { color: C.text, callback: v => metric ? metric.fmt(v) : v },
                    grid:  { color: C.border }
                }
            }
        }
    });

    // Summary line: first → last change
    const summaryEl = document.getElementById(`hist-line-summary-${pid}`);
    if (summaryEl) {
        const first = values.find(v => v !== null);
        const last  = [...values].reverse().find(v => v !== null);
        if (first !== undefined && last !== undefined && snapshots.length > 1) {
            const delta = last - first;
            const sign  = delta >= 0 ? '+' : '';
            const color = delta >= 0 ? C.green : C.red;
            const formatted = metric
                ? metric.fmt(Math.abs(delta)).replace(',', '') // crude — just show abs change
                : Math.abs(delta).toLocaleString();
            summaryEl.innerHTML =
                `Change across ${snapshots.length} snapshots: ` +
                `<span style="color:${color};font-weight:700;">${sign}${delta >= 0 ? formatted : '-' + formatted}</span>` +
                ` &nbsp;|&nbsp; First: <strong>${metric ? metric.fmt(first) : first}</strong>` +
                ` &nbsp;→&nbsp; Latest: <strong>${metric ? metric.fmt(last) : last}</strong>`;
        } else {
            summaryEl.innerHTML = '';
        }
    }
}

function drawBarChart(pid, snapA, snapB, metricKey) {
    const metric = TREND_METRICS.find(m => m.key === metricKey);
    const valA = Number(snapA?.[metricKey] ?? 0);
    const valB = Number(snapB?.[metricKey] ?? 0);

    const canvasId = `hist-bar-${pid}`;
    destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    _charts[canvasId] = new window.Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: [snapA?.date ?? 'A', snapB?.date ?? 'B'],
            datasets: [{
                label: metric?.label ?? metricKey,
                data: [valA, valB],
                backgroundColor: [`rgba(59,130,246,.75)`, `rgba(124,58,237,.75)`],
                borderColor:     [C.blue, C.purple],
                borderWidth: 2,
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    titleColor: C.text,
                    bodyColor:  C.text,
                    callbacks: { label: c => metric ? metric.fmt(c.raw) : String(c.raw) }
                }
            },
            scales: {
                x: { ticks: { color: C.text }, grid: { color: C.border } },
                y: {
                    ticks: { color: C.text, callback: v => metric ? metric.fmt(v) : v },
                    grid:  { color: C.border },
                    beginAtZero: true,
                }
            }
        }
    });

    const summaryEl = document.getElementById(`hist-bar-summary-${pid}`);
    if (summaryEl && snapA && snapB) {
        const delta = valB - valA;
        const sign  = delta >= 0 ? '+' : '';
        const color = delta >= 0 ? C.green : C.red;
        summaryEl.innerHTML = `Change: <span style="color:${color};font-weight:700;">${sign}${metric ? metric.fmt(Math.abs(delta)) : Math.abs(delta).toLocaleString()}</span>`;
    }
}

function renderCompareTable(pid, snapA, snapB) {
    // Update column headers
    const labelA = document.getElementById(`hist-cmp-label-a-${pid}`);
    const labelB = document.getElementById(`hist-cmp-label-b-${pid}`);
    if (labelA) labelA.textContent = `🔵 ${snapA.date}`;
    if (labelB) labelB.textContent = `🟣 ${snapB.date}`;

    const rowsEl = document.getElementById(`hist-cmp-rows-${pid}`);
    if (!rowsEl) return;

    rowsEl.innerHTML = COMPARE_STATS.map(stat => {
        const vA = snapA[stat.key];
        const vB = snapB[stat.key];
        const fA = stat.fmt(vA ?? 0);
        const fB = stat.fmt(vB ?? 0);

        let deltaHTML = '';
        if (stat.higher !== null && typeof vA === 'number' && typeof vB === 'number') {
            const delta = Number(vB) - Number(vA);
            if (delta !== 0) {
                const positive = stat.higher ? delta > 0 : delta < 0;
                const color    = positive ? C.green : C.red;
                const sign     = delta > 0 ? '+' : '';
                deltaHTML = `<span style="color:${color};font-weight:700;">${sign}${delta.toLocaleString()}</span>`;
            } else {
                deltaHTML = `<span style="color:${C.muted};">—</span>`;
            }
        }

        return `
            <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:8px;align-items:center;
                 padding:8px 4px;border-bottom:1px solid ${C.border};">
                <span style="color:${C.muted};font-size:.88em;">${stat.label}</span>
                <span style="color:${C.text};text-align:right;font-size:.95em;">${fA}</span>
                <span style="color:${C.text};text-align:right;font-size:.95em;">${fB}</span>
                <span style="text-align:right;">${deltaHTML}</span>
            </div>`;
    }).join('');
}

// ── Refresh helpers ───────────────────────────────────────────────────────────

function refreshLine(pid, snapshots) {
    const el = document.getElementById(`hist-metric-${pid}`);
    if (!el) return;
    ensureChartJs().then(() => drawLineChart(pid, snapshots, el.value));
}

function refreshCompare(pid, snapshots) {
    const selA = document.getElementById(`hist-cmp-a-${pid}`);
    const selB = document.getElementById(`hist-cmp-b-${pid}`);
    if (!selA || !selB) return;
    const snapA = snapshots[Number(selA.value)];
    const snapB = snapshots[Number(selB.value)];
    if (snapA && snapB) renderCompareTable(pid, snapA, snapB);
}

function refreshBar(pid, snapshots) {
    const selA   = document.getElementById(`hist-bar-a-${pid}`);
    const selB   = document.getElementById(`hist-bar-b-${pid}`);
    const selMet = document.getElementById(`hist-bar-metric-${pid}`);
    if (!selA || !selB || !selMet) return;
    const snapA = snapshots[Number(selA.value)];
    const snapB = snapshots[Number(selB.value)];
    if (snapA && snapB) ensureChartJs().then(() => drawBarChart(pid, snapA, snapB, selMet.value));
}

// ── Tab switcher ──────────────────────────────────────────────────────────────

function switchTab(pid, tab, snapshots) {
    const tabs = ['trends', 'compare', 'barchart'];
    tabs.forEach(t => {
        const el  = document.getElementById(`hist-tab-${t}-${pid}`);
        const btn = document.querySelector(`.hist-tab-btn[data-panel="${pid}"][data-tab="${t}"]`);
        if (el)  el.style.display  = t === tab ? '' : 'none';
        if (btn) btn.style.cssText = t === tab ? tabActiveStyle : tabInactiveStyle;
    });
    // Lazily render charts when tab is first revealed
    if (tab === 'trends')   refreshLine(pid, snapshots);
    if (tab === 'compare')  refreshCompare(pid, snapshots);
    if (tab === 'barchart') refreshBar(pid, snapshots);
}

// ── Main public export ────────────────────────────────────────────────────────

/**
 * Find the #hist-mount-{uid} placeholder inserted by ui.js, render the
 * "Historical Stats" button there, and wire up everything on click.
 */
export function setupHistoricalMount(uid) {
    const mountId = `hist-mount-${uid}`;
    const mount   = document.getElementById(mountId);
    if (!mount) return;

    // Render the trigger button
    mount.innerHTML = `
        <button id="hist-open-btn-${uid}" class="btn"
            style="background:linear-gradient(135deg,${C.purple},${C.purpleDim});
                   box-shadow:0 6px 20px rgba(124,58,237,.4);margin-top:8px;">
            📅 Historical Stats
        </button>
        <div id="hist-content-${uid}"></div>`;

    const btn     = document.getElementById(`hist-open-btn-${uid}`);
    const content = document.getElementById(`hist-content-${uid}`);
    let   loaded  = false;

    btn.addEventListener('click', async () => {
        if (loaded) {
            // Toggle visibility if already loaded
            const panel = document.getElementById(`hist-panel-${uid.replace(/[^a-z0-9]/gi, '_')}`);
            if (panel) panel.style.display = panel.style.display === 'none' ? '' : 'none';
            return;
        }

        btn.disabled    = true;
        btn.textContent = '⏳ Loading historical data…';

        try {
            const snapshots = await fetchSnapshots(uid);
            loaded = true;

            if (!snapshots || snapshots.length === 0) {
                content.innerHTML = `
                    <div class="message info" style="margin-top:12px;">
                        No historical snapshots are available yet for this player.
                        Snapshots are collected automatically once per day.
                    </div>`;
                btn.textContent = '📅 Historical Stats (no data yet)';
                btn.disabled = false;
                return;
            }

            const pid = uid.replace(/[^a-z0-9]/gi, '_');
            content.innerHTML = buildPanelHTML(pid, snapshots);

            // Default compare/bar selectors: oldest (A) vs newest (B)
            const setDefault = (selIdA, selIdB) => {
                const a = document.getElementById(selIdA);
                const b = document.getElementById(selIdB);
                if (!a || !b || snapshots.length < 2) return;
                // Options are newest-first; value = original index.
                // Oldest = index 0, newest = index snapshots.length-1
                a.value = '0';
                b.value = String(snapshots.length - 1);
            };
            setDefault(`hist-cmp-a-${pid}`, `hist-cmp-b-${pid}`);
            setDefault(`hist-bar-a-${pid}`, `hist-bar-b-${pid}`);

            // Tab buttons
            document.querySelectorAll(`.hist-tab-btn[data-panel="${pid}"]`).forEach(tabBtn => {
                tabBtn.addEventListener('click', () => switchTab(pid, tabBtn.dataset.tab, snapshots));
            });

            // Metric / selector change listeners
            document.getElementById(`hist-metric-${pid}`)
                ?.addEventListener('change', () => refreshLine(pid, snapshots));
            document.getElementById(`hist-cmp-a-${pid}`)
                ?.addEventListener('change', () => refreshCompare(pid, snapshots));
            document.getElementById(`hist-cmp-b-${pid}`)
                ?.addEventListener('change', () => refreshCompare(pid, snapshots));
            document.getElementById(`hist-bar-a-${pid}`)
                ?.addEventListener('change', () => refreshBar(pid, snapshots));
            document.getElementById(`hist-bar-b-${pid}`)
                ?.addEventListener('change', () => refreshBar(pid, snapshots));
            document.getElementById(`hist-bar-metric-${pid}`)
                ?.addEventListener('change', () => refreshBar(pid, snapshots));

            // Render the initial trend chart (after Chart.js loads)
            ensureChartJs().then(() => {
                refreshLine(pid, snapshots);
                refreshCompare(pid, snapshots);   // pre-populate compare table
            });

            btn.textContent = '📅 Historical Stats (hide)';
            btn.disabled    = false;
        } catch (err) {
            content.innerHTML = `
                <div class="message info" style="margin-top:12px;">
                    No historical data found for this player yet —
                    they may not be in the tracked list.
                    <br><small style="opacity:.7;">(${err.message})</small>
                </div>`;
            btn.textContent = '📅 Historical Stats (unavailable)';
            btn.disabled    = false;
        }
    });
}
