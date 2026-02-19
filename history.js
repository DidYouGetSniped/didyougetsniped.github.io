// history.js
// ─────────────────────────────────────────────────────────────────────────────
// Provides the "📅 Historical Stats" panel injected into wbinfo player profiles.
// Exports only setupHistoricalMount() — everything else is internal.
// ─────────────────────────────────────────────────────────────────────────────

const REPO_RAW = 'https://raw.githubusercontent.com/DidYouGetSniped/didyougetsniped.github.io/main';

// ── Style constants (dark-theme only, matches the rest of the site) ───────────
const C = {
    text:      '#f1f5f9',
    muted:     '#94a3b8',
    border:    '#1e293b',
    borderMed: '#334155',
    inputBg:   '#20253a',
    sectionBg: '#141824',
    purple:    '#7c3aed',
    purpleDim: '#5b21b6',
    blue:      '#3b82f6',
    green:     '#10b981',
    red:       '#ef4444',
};

// ── Per-weapon stat sub-fields available for charting ─────────────────────────
const WEAPON_SUBFIELDS = [
    { key: 'kills',          label: 'Kills'            },
    { key: 'deaths',         label: 'Deaths'           },
    { key: 'headshots',      label: 'Headshots'        },
    { key: 'kdr',            label: 'K/D Ratio'        },
    { key: 'accuracy',       label: 'Accuracy (%)'     },
    { key: 'headshotRate',   label: 'Headshot Rate (%)'},
    { key: 'damageDealt',    label: 'Damage Dealt'     },
    { key: 'damageReceived', label: 'Damage Received'  },
    { key: 'damagePerKill',  label: 'Damage per Kill'  },
    { key: 'shotsFired',     label: 'Shots Fired'      },
    { key: 'shotsHit',       label: 'Shots Hit'        },
];

// ── Top-level metrics (non-weapon) ────────────────────────────────────────────
const TOP_METRICS = [
    { key: 'kdr',                 label: 'K/D Ratio'           },
    { key: 'killsELO',            label: 'Kills ELO'           },
    { key: 'gamesELO',            label: 'Games ELO'           },
    { key: 'totalKills',          label: 'Total Kills'         },
    { key: 'totalDeaths',         label: 'Total Deaths'        },
    { key: 'weaponKillsTotal',    label: 'Weapon Kills'        },
    { key: 'vehicleKillsTotal',   label: 'Vehicle Kills'       },
    { key: 'totalGames',          label: 'Total Games'         },
    { key: 'totalWins',           label: 'Total Wins'          },
    { key: 'totalLosses',         label: 'Total Losses'        },
    { key: 'level',               label: 'Level'               },
    { key: 'xp',                  label: 'XP'                  },
    { key: 'coins',               label: 'Coins'               },
    { key: 'totalHeadshots',      label: 'Total Headshots'     },
    { key: 'totalDamageDealt',    label: 'Total Damage Dealt'  },
    { key: 'totalDamageReceived', label: 'Total Damage Received'},
    { key: 'totalShotsFired',     label: 'Total Shots Fired'   },
    { key: 'totalShotsHit',       label: 'Total Shots Hit'     },
    { key: 'selfDestructs',       label: 'Self Destructs'      },
    { key: 'killsPercentile',     label: 'Kills Rank (top %)'  },
    { key: 'gamesPercentile',     label: 'Games Rank (top %)'  },
    { key: 'xpPercentile',        label: 'XP Rank (top %)'     },
];

// ── Comparison table stats ────────────────────────────────────────────────────
const COMPARE_STATS = [
    { key: 'nick',                label: 'Username',            fmt: v => String(v ?? '—'),                       higher: null  },
    { key: 'level',               label: 'Level',               fmt: v => Number(v).toLocaleString(),             higher: true  },
    { key: 'xp',                  label: 'XP',                  fmt: v => Number(v).toLocaleString(),             higher: true  },
    { key: 'coins',               label: 'Coins',               fmt: v => Number(v).toLocaleString(),             higher: true  },
    { key: 'squad',               label: 'Squad',               fmt: v => v || 'None',                            higher: null  },
    { key: 'killsELO',            label: 'Kills ELO',           fmt: v => Number(v).toFixed(2),                   higher: true  },
    { key: 'gamesELO',            label: 'Games ELO',           fmt: v => Number(v).toFixed(2),                   higher: true  },
    { key: 'kdr',                 label: 'K/D Ratio',           fmt: v => Number(v).toFixed(3),                   higher: true  },
    { key: 'totalKills',          label: 'Total Kills',         fmt: v => Number(v).toLocaleString(),             higher: true  },
    { key: 'totalDeaths',         label: 'Total Deaths',        fmt: v => Number(v).toLocaleString(),             higher: false },
    { key: 'weaponKillsTotal',    label: 'Weapon Kills',        fmt: v => Number(v).toLocaleString(),             higher: true  },
    { key: 'vehicleKillsTotal',   label: 'Vehicle Kills',       fmt: v => Number(v).toLocaleString(),             higher: true  },
    { key: 'totalGames',          label: 'Total Games',         fmt: v => Number(v).toLocaleString(),             higher: true  },
    { key: 'totalWins',           label: 'Total Wins',          fmt: v => Number(v).toLocaleString(),             higher: true  },
    { key: 'totalLosses',         label: 'Total Losses',        fmt: v => Number(v).toLocaleString(),             higher: false },
    { key: 'totalHeadshots',      label: 'Total Headshots',     fmt: v => Number(v).toLocaleString(),             higher: true  },
    { key: 'totalDamageDealt',    label: 'Total Damage Dealt',  fmt: v => Number(v).toLocaleString(),             higher: true  },
    { key: 'totalDamageReceived', label: 'Total Damage Received',fmt: v => Number(v).toLocaleString(),            higher: false },
    { key: 'totalShotsFired',     label: 'Total Shots Fired',   fmt: v => Number(v).toLocaleString(),             higher: null  },
    { key: 'totalShotsHit',       label: 'Total Shots Hit',     fmt: v => Number(v).toLocaleString(),             higher: true  },
    { key: 'selfDestructs',       label: 'Self Destructs',      fmt: v => Number(v).toLocaleString(),             higher: false },
    { key: 'killsPercentile',     label: 'Kills Rank (top %)',  fmt: v => Number(v).toFixed(4) + '%',             higher: false },
    { key: 'gamesPercentile',     label: 'Games Rank (top %)',  fmt: v => Number(v).toFixed(4) + '%',             higher: false },
    { key: 'xpPercentile',        label: 'XP Rank (top %)',     fmt: v => Number(v).toFixed(4) + '%',             higher: false },
];

// ── Colour palette for multi-series lines ─────────────────────────────────────
const SERIES_COLOURS = [
    '#7c3aed','#3b82f6','#10b981','#f59e0b','#ef4444',
    '#06b6d4','#ec4899','#84cc16','#f97316','#a855f7',
    '#14b8a6','#eab308','#6366f1','#22c55e','#fb923c',
];
let _colourIndex = 0;
function nextColour() {
    const c = SERIES_COLOURS[_colourIndex % SERIES_COLOURS.length];
    _colourIndex++;
    return c;
}

// ── Chart.js lazy loader ──────────────────────────────────────────────────────
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

// ── Style helpers ─────────────────────────────────────────────────────────────
const sel = (extra = '') =>
    `padding:8px 12px;border-radius:8px;border:1px solid ${C.borderMed};` +
    `background:${C.inputBg};color:${C.text};font-family:'JetBrains Mono',monospace;font-size:.9em;${extra}`;

const tabActive   = `padding:8px 18px;border-radius:8px;border:none;cursor:pointer;font-family:'JetBrains Mono',monospace;font-weight:600;font-size:.9em;background:linear-gradient(135deg,${C.purple},${C.purpleDim});color:#fff;box-shadow:0 4px 12px rgba(124,58,237,.4);`;
const tabInactive = `padding:8px 18px;border-radius:8px;border:none;cursor:pointer;font-family:'JetBrains Mono',monospace;font-weight:600;font-size:.9em;background:${C.border};color:${C.muted};`;

// ── Chart instance registry ───────────────────────────────────────────────────
const _charts = {};
function destroyChart(id) {
    if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; }
}

// ── API ───────────────────────────────────────────────────────────────────────
async function fetchSnapshots(uid) {
    const res = await fetch(`${REPO_RAW}/historical-stats/${uid}/snapshots.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

// ── Series resolver ───────────────────────────────────────────────────────────
// A series descriptor looks like one of:
//   { type: 'top',     key: 'kdr' }
//   { type: 'weapon',  weapon: 'Sniper Rifle', field: 'kills' }
//   { type: 'vehicle', vehicle: 'Tank Lvl 1',  field: 'kills' }

function resolveSeriesValues(snapshots, descriptor) {
    return snapshots.map(s => {
        if (descriptor.type === 'top') {
            const v = s[descriptor.key];
            return v !== undefined && v !== null ? Number(v) : null;
        }
        if (descriptor.type === 'weapon') {
            const ws = s.weapon_stats?.[descriptor.weapon];
            if (!ws) return null;
            return ws[descriptor.field] !== undefined ? Number(ws[descriptor.field]) : null;
        }
        if (descriptor.type === 'vehicle') {
            const vs = s.vehicle_stats?.[descriptor.vehicle];
            if (!vs) return null;
            return vs[descriptor.field] !== undefined ? Number(vs[descriptor.field]) : null;
        }
        return null;
    });
}

function seriesLabel(descriptor) {
    if (descriptor.type === 'top') {
        return TOP_METRICS.find(m => m.key === descriptor.key)?.label ?? descriptor.key;
    }
    if (descriptor.type === 'weapon') {
        const sf = WEAPON_SUBFIELDS.find(f => f.key === descriptor.field)?.label ?? descriptor.field;
        return `${descriptor.weapon} — ${sf}`;
    }
    if (descriptor.type === 'vehicle') {
        return `${descriptor.vehicle} — Kills`;
    }
    return '?';
}

// ── Multi-series line chart ───────────────────────────────────────────────────
function drawMultiLineChart(canvasId, snapshots, seriesList) {
    destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const labels = snapshots.map(s => s.date);
    const datasets = seriesList.map(({ descriptor, colour }) => ({
        label: seriesLabel(descriptor),
        data: resolveSeriesValues(snapshots, descriptor),
        borderColor: colour,
        backgroundColor: colour + '22',
        pointBackgroundColor: colour,
        pointRadius: snapshots.length > 60 ? 2 : 5,
        pointHoverRadius: 7,
        fill: false,
        tension: 0.3,
        spanGaps: true,
    }));

    _charts[canvasId] = new window.Chart(canvas.getContext('2d'), {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    display: true,
                    labels: { color: C.text, boxWidth: 14, padding: 16 },
                },
                tooltip: {
                    titleColor: C.text,
                    bodyColor: C.text,
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${ctx.raw !== null ? Number(ctx.raw).toLocaleString() : '—'}`,
                    },
                },
            },
            scales: {
                x: { ticks: { color: C.text, maxTicksLimit: 12 }, grid: { color: C.border } },
                y: { ticks: { color: C.text }, grid: { color: C.border } },
            },
        },
    });
}

// ── Bar chart (two snapshots, one metric) ─────────────────────────────────────
function drawBarChart(canvasId, snapA, snapB, descriptor) {
    destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const valA = resolveSeriesValues([snapA], descriptor)[0] ?? 0;
    const valB = resolveSeriesValues([snapB], descriptor)[0] ?? 0;
    const label = seriesLabel(descriptor);

    _charts[canvasId] = new window.Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: [snapA.date, snapB.date],
            datasets: [{
                label,
                data: [valA, valB],
                backgroundColor: [`rgba(59,130,246,.75)`, `rgba(124,58,237,.75)`],
                borderColor: [C.blue, C.purple],
                borderWidth: 2,
                borderRadius: 6,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    titleColor: C.text,
                    bodyColor: C.text,
                    callbacks: { label: ctx => `${label}: ${Number(ctx.raw).toLocaleString()}` },
                },
            },
            scales: {
                x: { ticks: { color: C.text }, grid: { color: C.border } },
                y: { ticks: { color: C.text }, grid: { color: C.border }, beginAtZero: true },
            },
        },
    });
}

// ── Comparison table ──────────────────────────────────────────────────────────
function renderCompareTable(pid, snapA, snapB) {
    const la = document.getElementById(`hist-cmp-label-a-${pid}`);
    const lb = document.getElementById(`hist-cmp-label-b-${pid}`);
    if (la) la.textContent = `🔵 ${snapA.date}`;
    if (lb) lb.textContent = `🟣 ${snapB.date}`;

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
                const colour   = positive ? C.green : C.red;
                const sign     = delta > 0 ? '+' : '';
                deltaHTML = `<span style="color:${colour};font-weight:700;">${sign}${delta.toLocaleString()}</span>`;
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

// ── Collect all weapon and vehicle names present in any snapshot ──────────────
function collectNames(snapshots) {
    const weapons  = new Set();
    const vehicles = new Set();
    for (const s of snapshots) {
        Object.keys(s.weapon_stats  || {}).forEach(n => weapons.add(n));
        Object.keys(s.vehicle_stats || {}).forEach(n => vehicles.add(n));
    }
    return {
        weapons:  [...weapons].sort(),
        vehicles: [...vehicles].sort(),
    };
}

// ── HTML builder ──────────────────────────────────────────────────────────────
function buildPanelHTML(pid, snapshots) {
    const { weapons, vehicles } = collectNames(snapshots);

    const snapshotOpts = [...snapshots]
        .map((s, i) => ({ s, i }))
        .reverse()
        .map(({ s, i }) => `<option value="${i}">${s.date} — ${s.nick}</option>`)
        .join('');

    // ── Weapon checklist (kills only — subfield chosen separately) ────────
    const weaponCheckboxes = weapons.map(w =>
        `<label style="display:flex;align-items:center;gap:6px;cursor:pointer;white-space:nowrap;">
            <input type="checkbox" class="hist-wchk-${pid}" data-name="${w}" style="accent-color:${C.purple};width:14px;height:14px;">
            <span style="font-size:.85em;color:${C.text};">${w}</span>
        </label>`
    ).join('');

    const vehicleCheckboxes = vehicles.map(v =>
        `<label style="display:flex;align-items:center;gap:6px;cursor:pointer;white-space:nowrap;">
            <input type="checkbox" class="hist-vchk-${pid}" data-name="${v}" style="accent-color:${C.blue};width:14px;height:14px;">
            <span style="font-size:.85em;color:${C.text};">${v}</span>
        </label>`
    ).join('');

    const subFieldOptions = WEAPON_SUBFIELDS.map(f =>
        `<option value="${f.key}">${f.label}</option>`).join('');

    // ── Dropdown-add options ───────────────────────────────────────────────
    const topMetricOptions = TOP_METRICS.map(m =>
        `<option value="top::${m.key}">${m.label}</option>`).join('');

    const weaponDropOptions = weapons.flatMap(w =>
        WEAPON_SUBFIELDS.map(f =>
            `<option value="weapon::${w}::${f.key}">${w} — ${f.label}</option>`)
    ).join('');

    const vehicleDropOptions = vehicles.map(v =>
        `<option value="vehicle::${v}::kills">${v} — Kills</option>`
    ).join('');

    // ── Bar chart metric dropdown ──────────────────────────────────────────
    const barTopOptions = TOP_METRICS.map(m =>
        `<option value="top::${m.key}">${m.label}</option>`).join('');
    const barWeaponOptions = weapons.flatMap(w =>
        WEAPON_SUBFIELDS.map(f =>
            `<option value="weapon::${w}::${f.key}">${w} — ${f.label}</option>`)
    ).join('');
    const barVehicleOptions = vehicles.map(v =>
        `<option value="vehicle::${v}::kills">${v} — Kills</option>`
    ).join('');

    const compareHeader = `
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
        <button class="hist-tab-btn" data-panel="${pid}" data-tab="trends"   style="${tabActive}">📈 Trends</button>
        <button class="hist-tab-btn" data-panel="${pid}" data-tab="compare"  style="${tabInactive}">⚖️ Compare Two</button>
        <button class="hist-tab-btn" data-panel="${pid}" data-tab="barchart" style="${tabInactive}">📊 Bar Chart</button>
    </div>

    <!-- ══════════════════ TRENDS TAB ══════════════════════════════════════ -->
    <div id="hist-tab-trends-${pid}">

        <!-- ── Weapon checklist ── -->
        ${weapons.length ? `
        <div style="background:${C.sectionBg};border:1px solid ${C.borderMed};border-radius:10px;padding:14px;margin-bottom:14px;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
                <span style="color:${C.text};font-weight:700;font-size:.95em;">🔫 Weapons</span>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                    <label style="color:${C.muted};font-size:.85em;">Stat:</label>
                    <select id="hist-wfield-${pid}" style="${sel()}">
                        ${subFieldOptions}
                    </select>
                    <button id="hist-wall-${pid}" style="padding:5px 10px;border-radius:6px;border:1px solid ${C.borderMed};background:${C.inputBg};color:${C.text};cursor:pointer;font-size:.82em;">All</button>
                    <button id="hist-wnone-${pid}" style="padding:5px 10px;border-radius:6px;border:1px solid ${C.borderMed};background:${C.inputBg};color:${C.text};cursor:pointer;font-size:.82em;">None</button>
                </div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px 16px;">
                ${weaponCheckboxes}
            </div>
        </div>` : ''}

        <!-- ── Vehicle checklist ── -->
        ${vehicles.length ? `
        <div style="background:${C.sectionBg};border:1px solid ${C.borderMed};border-radius:10px;padding:14px;margin-bottom:14px;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
                <span style="color:${C.text};font-weight:700;font-size:.95em;">🚗 Vehicles (Kills)</span>
                <div style="display:flex;gap:8px;">
                    <button id="hist-vall-${pid}" style="padding:5px 10px;border-radius:6px;border:1px solid ${C.borderMed};background:${C.inputBg};color:${C.text};cursor:pointer;font-size:.82em;">All</button>
                    <button id="hist-vnone-${pid}" style="padding:5px 10px;border-radius:6px;border:1px solid ${C.borderMed};background:${C.inputBg};color:${C.text};cursor:pointer;font-size:.82em;">None</button>
                </div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px 16px;">
                ${vehicleCheckboxes}
            </div>
        </div>` : ''}

        <!-- ── Dropdown add-series ── -->
        <div style="background:${C.sectionBg};border:1px solid ${C.borderMed};border-radius:10px;padding:14px;margin-bottom:14px;">
            <span style="color:${C.text};font-weight:700;font-size:.95em;display:block;margin-bottom:10px;">➕ Add Series</span>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                <select id="hist-add-select-${pid}" style="${sel('flex:1;min-width:200px;')}">
                    <optgroup label="── Overall Stats ──">${topMetricOptions}</optgroup>
                    ${weapons.length ? `<optgroup label="── Weapon Stats ──">${weaponDropOptions}</optgroup>` : ''}
                    ${vehicles.length ? `<optgroup label="── Vehicle Stats ──">${vehicleDropOptions}</optgroup>` : ''}
                </select>
                <button id="hist-add-btn-${pid}"
                    style="padding:8px 16px;border-radius:8px;border:none;cursor:pointer;
                           background:linear-gradient(135deg,${C.purple},${C.purpleDim});
                           color:#fff;font-family:'JetBrains Mono',monospace;font-weight:600;font-size:.9em;">
                    + Add
                </button>
            </div>
            <!-- Active series tags -->
            <div id="hist-series-tags-${pid}" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;"></div>
        </div>

        <!-- ── Chart ── -->
        <div style="position:relative;height:360px;width:100%;">
            <canvas id="hist-line-${pid}"></canvas>
        </div>
        <div id="hist-line-empty-${pid}" style="display:none;text-align:center;padding:40px;color:${C.muted};">
            Select at least one weapon, vehicle, or add a series above to see the chart.
        </div>
    </div>

    <!-- ══════════════════ COMPARE TAB ══════════════════════════════════════ -->
    <div id="hist-tab-compare-${pid}" style="display:none;">
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px;">
            <div style="flex:1;min-width:200px;">
                <label style="color:${C.blue};font-weight:600;display:block;margin-bottom:6px;">🔵 Snapshot A (baseline):</label>
                <select id="hist-cmp-a-${pid}" style="${sel('width:100%;')}">
                    ${snapshotOpts}
                </select>
            </div>
            <div style="flex:1;min-width:200px;">
                <label style="color:${C.purple};font-weight:600;display:block;margin-bottom:6px;">🟣 Snapshot B (compare to):</label>
                <select id="hist-cmp-b-${pid}" style="${sel('width:100%;')}">
                    ${snapshotOpts}
                </select>
            </div>
        </div>
        ${compareHeader}
        <div id="hist-cmp-rows-${pid}"></div>
    </div>

    <!-- ══════════════════ BAR CHART TAB ════════════════════════════════════ -->
    <div id="hist-tab-barchart-${pid}" style="display:none;">
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;">
            <div style="flex:1;min-width:200px;">
                <label style="color:${C.blue};font-weight:600;display:block;margin-bottom:6px;">🔵 Snapshot A:</label>
                <select id="hist-bar-a-${pid}" style="${sel('width:100%;')}">
                    ${snapshotOpts}
                </select>
            </div>
            <div style="flex:1;min-width:200px;">
                <label style="color:${C.purple};font-weight:600;display:block;margin-bottom:6px;">🟣 Snapshot B:</label>
                <select id="hist-bar-b-${pid}" style="${sel('width:100%;')}">
                    ${snapshotOpts}
                </select>
            </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
            <label style="color:${C.text};font-weight:600;">Metric:</label>
            <select id="hist-bar-metric-${pid}" style="${sel('flex:1;min-width:200px;')}">
                <optgroup label="── Overall Stats ──">${barTopOptions}</optgroup>
                ${weapons.length ? `<optgroup label="── Weapon Stats ──">${barWeaponOptions}</optgroup>` : ''}
                ${vehicles.length ? `<optgroup label="── Vehicle Stats ──">${barVehicleOptions}</optgroup>` : ''}
            </select>
        </div>
        <div style="position:relative;height:320px;width:100%;">
            <canvas id="hist-bar-${pid}"></canvas>
        </div>
        <div id="hist-bar-summary-${pid}" style="margin-top:12px;text-align:center;font-size:.9em;color:${C.muted};"></div>
    </div>
</div>`;
}

// ── Parse a dropdown value string into a descriptor ───────────────────────────
function parseDescriptor(value) {
    const parts = value.split('::');
    if (parts[0] === 'top')     return { type: 'top',     key: parts[1] };
    if (parts[0] === 'weapon')  return { type: 'weapon',  weapon: parts[1], field: parts[2] };
    if (parts[0] === 'vehicle') return { type: 'vehicle', vehicle: parts[1], field: 'kills' };
    return null;
}

// ── Trends tab state & rendering ─────────────────────────────────────────────
function setupTrendsTab(pid, snapshots) {
    // activeSeries: Array<{ id, descriptor, colour }>
    const activeSeries = [];
    let   nextId = 0;

    const canvasId  = `hist-line-${pid}`;
    const emptyEl   = () => document.getElementById(`hist-line-empty-${pid}`);
    const canvas    = () => document.getElementById(canvasId);
    const tagsEl    = () => document.getElementById(`hist-series-tags-${pid}`);

    function redraw() {
        const c = canvas();
        const e = emptyEl();
        if (!c || !e) return;

        if (activeSeries.length === 0) {
            c.style.display = 'none';
            e.style.display = '';
            destroyChart(canvasId);
            return;
        }
        c.style.display = '';
        e.style.display = 'none';
        ensureChartJs().then(() => drawMultiLineChart(canvasId, snapshots, activeSeries));
    }

    function renderTags() {
        const el = tagsEl();
        if (!el) return;
        el.innerHTML = activeSeries.map(s => `
            <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;
                  border-radius:20px;border:1px solid ${s.colour}44;background:${s.colour}18;
                  font-size:.82em;color:${C.text};">
                <span style="width:8px;height:8px;border-radius:50%;background:${s.colour};flex:0 0 auto;"></span>
                ${seriesLabel(s.descriptor)}
                <button data-sid="${s.id}"
                    style="background:none;border:none;color:${C.muted};cursor:pointer;
                           font-size:1em;line-height:1;padding:0 2px;" title="Remove">✕</button>
            </span>`).join('');

        el.querySelectorAll('button[data-sid]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.dataset.sid);
                const idx = activeSeries.findIndex(s => s.id === id);
                if (idx >= 0) activeSeries.splice(idx, 1);
                renderTags();
                redraw();
            });
        });
    }

    function addSeries(descriptor) {
        // Don't add duplicate
        const exists = activeSeries.some(s => JSON.stringify(s.descriptor) === JSON.stringify(descriptor));
        if (exists) return;
        activeSeries.push({ id: nextId++, descriptor, colour: nextColour() });
        renderTags();
        redraw();
    }

    // ── Weapon checkboxes ──────────────────────────────────────────────────
    const wField = () => document.getElementById(`hist-wfield-${pid}`)?.value ?? 'kills';

    function syncWeaponCheckboxes() {
        document.querySelectorAll(`.hist-wchk-${pid}`).forEach(chk => {
            const name  = chk.dataset.name;
            const field = wField();
            const desc  = { type: 'weapon', weapon: name, field };
            const key   = JSON.stringify(desc);
            const inList = activeSeries.some(s => JSON.stringify(s.descriptor) === key);

            if (chk.checked && !inList) {
                activeSeries.push({ id: nextId++, descriptor: desc, colour: nextColour() });
            } else if (!chk.checked && inList) {
                const idx = activeSeries.findIndex(s => JSON.stringify(s.descriptor) === key);
                if (idx >= 0) activeSeries.splice(idx, 1);
            }
        });
        renderTags();
        redraw();
    }

    document.querySelectorAll(`.hist-wchk-${pid}`).forEach(chk => {
        chk.addEventListener('change', syncWeaponCheckboxes);
    });

    // When the weapon subfield changes, update all active weapon series
    document.getElementById(`hist-wfield-${pid}`)?.addEventListener('change', () => {
        const field = wField();
        // Update in-place so colours stay stable
        for (const s of activeSeries) {
            if (s.descriptor.type === 'weapon') s.descriptor.field = field;
        }
        // Sync checkboxes visual state (they're still checked, just field changed)
        renderTags();
        redraw();
    });

    document.getElementById(`hist-wall-${pid}`)?.addEventListener('click', () => {
        document.querySelectorAll(`.hist-wchk-${pid}`).forEach(c => c.checked = true);
        syncWeaponCheckboxes();
    });
    document.getElementById(`hist-wnone-${pid}`)?.addEventListener('click', () => {
        document.querySelectorAll(`.hist-wchk-${pid}`).forEach(c => c.checked = false);
        syncWeaponCheckboxes();
    });

    // ── Vehicle checkboxes ─────────────────────────────────────────────────
    document.querySelectorAll(`.hist-vchk-${pid}`).forEach(chk => {
        chk.addEventListener('change', () => {
            const name = chk.dataset.name;
            const desc = { type: 'vehicle', vehicle: name, field: 'kills' };
            const key  = JSON.stringify(desc);
            if (chk.checked) {
                if (!activeSeries.some(s => JSON.stringify(s.descriptor) === key)) {
                    activeSeries.push({ id: nextId++, descriptor: desc, colour: nextColour() });
                }
            } else {
                const idx = activeSeries.findIndex(s => JSON.stringify(s.descriptor) === key);
                if (idx >= 0) activeSeries.splice(idx, 1);
            }
            renderTags();
            redraw();
        });
    });

    document.getElementById(`hist-vall-${pid}`)?.addEventListener('click', () => {
        document.querySelectorAll(`.hist-vchk-${pid}`).forEach(c => c.checked = true);
        document.querySelectorAll(`.hist-vchk-${pid}`).forEach(chk => {
            const name = chk.dataset.name;
            const desc = { type: 'vehicle', vehicle: name, field: 'kills' };
            const key  = JSON.stringify(desc);
            if (!activeSeries.some(s => JSON.stringify(s.descriptor) === key)) {
                activeSeries.push({ id: nextId++, descriptor: desc, colour: nextColour() });
            }
        });
        renderTags();
        redraw();
    });
    document.getElementById(`hist-vnone-${pid}`)?.addEventListener('click', () => {
        document.querySelectorAll(`.hist-vchk-${pid}`).forEach(c => c.checked = false);
        for (let i = activeSeries.length - 1; i >= 0; i--) {
            if (activeSeries[i].descriptor.type === 'vehicle') activeSeries.splice(i, 1);
        }
        renderTags();
        redraw();
    });

    // ── Dropdown add-series ────────────────────────────────────────────────
    document.getElementById(`hist-add-btn-${pid}`)?.addEventListener('click', () => {
        const sel = document.getElementById(`hist-add-select-${pid}`);
        if (!sel) return;
        const desc = parseDescriptor(sel.value);
        if (desc) addSeries(desc);
    });

    // Initial state: empty chart with placeholder message
    redraw();
}

// ── Bar chart tab wiring ──────────────────────────────────────────────────────
function refreshBar(pid, snapshots) {
    const selA   = document.getElementById(`hist-bar-a-${pid}`);
    const selB   = document.getElementById(`hist-bar-b-${pid}`);
    const selMet = document.getElementById(`hist-bar-metric-${pid}`);
    if (!selA || !selB || !selMet) return;

    const snapA      = snapshots[Number(selA.value)];
    const snapB      = snapshots[Number(selB.value)];
    const descriptor = parseDescriptor(selMet.value);
    const summaryEl  = document.getElementById(`hist-bar-summary-${pid}`);

    if (!snapA || !snapB || !descriptor) return;

    ensureChartJs().then(() => {
        drawBarChart(`hist-bar-${pid}`, snapA, snapB, descriptor);

        if (summaryEl) {
            const valA  = resolveSeriesValues([snapA], descriptor)[0] ?? 0;
            const valB  = resolveSeriesValues([snapB], descriptor)[0] ?? 0;
            const delta = valB - valA;
            const sign  = delta >= 0 ? '+' : '';
            const colour = delta >= 0 ? C.green : C.red;
            summaryEl.innerHTML = delta !== 0
                ? `Change: <span style="color:${colour};font-weight:700;">${sign}${Number(delta).toLocaleString()}</span>`
                : `No change between these snapshots.`;
        }
    });
}

// ── Tab switcher ──────────────────────────────────────────────────────────────
function switchTab(pid, tab, snapshots) {
    ['trends', 'compare', 'barchart'].forEach(t => {
        const el  = document.getElementById(`hist-tab-${t}-${pid}`);
        const btn = document.querySelector(`.hist-tab-btn[data-panel="${pid}"][data-tab="${t}"]`);
        if (el)  el.style.display  = t === tab ? '' : 'none';
        if (btn) btn.style.cssText = t === tab ? tabActive : tabInactive;
    });
    if (tab === 'compare') {
        const selA = document.getElementById(`hist-cmp-a-${pid}`);
        const selB = document.getElementById(`hist-cmp-b-${pid}`);
        if (selA && selB) renderCompareTable(pid,
            snapshots[Number(selA.value)],
            snapshots[Number(selB.value)]);
    }
    if (tab === 'barchart') refreshBar(pid, snapshots);
}

// ── Public export ─────────────────────────────────────────────────────────────
export function setupHistoricalMount(uid) {
    const mount = document.getElementById(`hist-mount-${uid}`);
    if (!mount) return;

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
            _colourIndex = 0; // reset palette for each player
            content.innerHTML = buildPanelHTML(pid, snapshots);

            // Default snapshot selectors: oldest → newest
            const setDefault = (aId, bId) => {
                const a = document.getElementById(aId);
                const b = document.getElementById(bId);
                if (!a || !b || snapshots.length < 2) return;
                a.value = '0';
                b.value = String(snapshots.length - 1);
            };
            setDefault(`hist-cmp-a-${pid}`, `hist-cmp-b-${pid}`);
            setDefault(`hist-bar-a-${pid}`, `hist-bar-b-${pid}`);

            // Tab buttons
            document.querySelectorAll(`.hist-tab-btn[data-panel="${pid}"]`).forEach(tabBtn => {
                tabBtn.addEventListener('click', () => switchTab(pid, tabBtn.dataset.tab, snapshots));
            });

            // Compare selectors
            [`hist-cmp-a-${pid}`, `hist-cmp-b-${pid}`].forEach(id => {
                document.getElementById(id)?.addEventListener('change', () => {
                    const a = snapshots[Number(document.getElementById(`hist-cmp-a-${pid}`)?.value)];
                    const b = snapshots[Number(document.getElementById(`hist-cmp-b-${pid}`)?.value)];
                    if (a && b) renderCompareTable(pid, a, b);
                });
            });

            // Bar chart selectors
            [`hist-bar-a-${pid}`, `hist-bar-b-${pid}`, `hist-bar-metric-${pid}`].forEach(id => {
                document.getElementById(id)?.addEventListener('change', () => refreshBar(pid, snapshots));
            });

            // Wire up trends tab (checkboxes, add-series, etc.)
            ensureChartJs().then(() => {
                setupTrendsTab(pid, snapshots);
                // Pre-populate compare table
                const a = snapshots[Number(document.getElementById(`hist-cmp-a-${pid}`)?.value ?? 0)];
                const b = snapshots[Number(document.getElementById(`hist-cmp-b-${pid}`)?.value ?? snapshots.length - 1)];
                if (a && b) renderCompareTable(pid, a, b);
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
