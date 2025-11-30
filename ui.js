// ui.js

import { formatDateTime, timeAgo, getJoinDateFromUID } from '/utils.js';
import { generateWeaponStarsHTML } from '/weaponlogic.js';
import { generateVehicleStarsHTML } from '/vehiclelogic.js';
import { calculateDisplayConstants } from './uiconst.js'; // <-- Added this import

// Dark-only: force classes immediately and remove any light mode class
(() => {
    const apply = el => {
        if (!el) return;
        el.classList.add('dark');
        el.classList.remove('light');
    };
    try {
        apply(document.documentElement);
        apply(document.body);
    } catch {}
})();

// Dark-only color constants
const TEXT_COLOR = '#ffffff';
const CHART_BORDER = '#0f172a';
const CTRL_BG = '#161a23';
const CTRL_BG_SUBTLE = '#1f2736';
const CTRL_BORDER = '#3b3f4a';

const T_TABLE = {1:100,2:500,3:1500,4:3000,5:5000,6:11000,7:18000,8:27000,9:37000,10:48000,11:60000,12:73000,13:87000,14:102000,15:117000,16:132000,17:147000,18:162000,19:177000,20:192000,21:207000,22:222000};

function T(level) {
    if (level <= 0) return 0;
    if (level <= 22) return T_TABLE[level];
    return level * 25000 - 325000;
}

function levelProgress(level, totalXp) {
    const start = T(level - 1);
    const end = T(level);
    const width = Math.max(0, end - start);
    const into = totalXp - start;
    let pct = width > 0 ? (into / width) * 100 : 0;
    if (!isFinite(pct)) pct = 0;
    pct = Math.max(0, Math.min(100, pct));
    return { start, end, width, into, percent: pct };
}

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

function palette(n) {
    const arr = [];
    for (let i = 0; i < n; i++) {
        const h = Math.round(360 * i / n);
        arr.push(`hsl(${h} 70% 50%)`);
    }
    return arr;
}

function buildLegendForChart(chart, container, sortMode) {
    if (!container) return;
    const labels = chart.data.labels.slice();
    const values = chart.data.datasets[0].data.slice();
    const colors = chart.data.datasets[0].backgroundColor.slice();
    const items = labels.map((label, i) => ({ label, value: Number(values[i]) || 0, color: colors[i], i }));
    if (sortMode === 'alpha') items.sort((a, b) => a.label.localeCompare(b.label));
    else items.sort((a, b) => b.value - a.value);
    const textColor = TEXT_COLOR;
    container.innerHTML = items.map(it => {
        const opacity = chart.getDataVisibility(it.i) ? 1 : 0.4;
        return `
            <button data-idx="${it.i}" class="legend-item" style="display:inline-flex;align-items:center;gap:8px;padding:4px 8px;border-radius:6px;border:1px solid rgba(0,0,0,.12);background:transparent;color:${textColor};-webkit-text-fill-color:${textColor};opacity:${opacity};cursor:pointer;overflow:visible;">
                <span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:${it.color};flex:0 0 auto;"></span>
                <span class="legend-text" style="white-space:nowrap;color:${textColor};-webkit-text-fill-color:${textColor};">${it.label}</span>
            </button>
        `;
    }).join('');
    Array.from(container.querySelectorAll('button.legend-item')).forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = Number(btn.getAttribute('data-idx'));
            chart.toggleDataVisibility(idx);
            chart.update();
            const hidden = !chart.getDataVisibility(idx);
            btn.style.opacity = hidden ? 0.4 : 1;
            const txt = btn.querySelector('.legend-text');
            if (txt) txt.style.textDecoration = hidden ? 'line-through' : 'none';
        });
    });
}

function renderChartWithLegend(canvas, dataObj, legendEl, sortSelect, resetBtn, chartTypeSelect) {
    const entries = Object.entries(dataObj || {}).filter(([, v]) => typeof v === 'number' && v > 0);
    if (!entries.length) {
        if (canvas && canvas.parentElement) canvas.parentElement.innerHTML = '<div class="text-gray-400">No data</div>';
        if (legendEl) legendEl.innerHTML = '';
        return;
    }

    entries.sort((a, b) => b[1] - a[1]);
    const origLabels = entries.map(e => e[0]);
    const origData = entries.map(e => e[1]);
    const origColors = palette(origLabels.length);
    const ctx = canvas.getContext('2d');
    
    const makeConfig = (type) => ({
        type,
        data: {
            labels: [], // Will be set dynamically
            datasets: [{
                data: [],
                backgroundColor: [],
                borderColor: CHART_BORDER,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: type === 'bar' ? 'y' : 'x',
            plugins: {
                legend: { display: false },
                tooltip: {
                    bodyColor: TEXT_COLOR,
                    titleColor: TEXT_COLOR,
                    callbacks: {
                        label: c => {
                            const v = c.raw;
                            const total = c.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total ? (v / total * 100) : 0;
                            return `${c.label}: ${v.toLocaleString()} (${pct.toFixed(2)}%)`;
                        }
                    }
                }
            },
            scales: type === 'bar' ? {
                x: {
                    beginAtZero: true,
                    ticks: { color: TEXT_COLOR },
                    grid: { color: CHART_BORDER }
                },
                y: {
                    ticks: { color: TEXT_COLOR },
                    grid: { color: CHART_BORDER }
                }
            } : undefined
        }
    });

    let chart = new window.Chart(ctx, makeConfig('pie')); // Default pie

    let visible = new Set([...Array(origLabels.length).keys()]);

    const getSortMode = () => sortSelect ? sortSelect.value : 'size';

    const updateChart = (sortMode) => {
        let visItems = Array.from(visible).map(i => ({
            label: origLabels[i],
            value: origData[i],
            color: origColors[i],
            idx: i
        }));
        if (sortMode === 'alpha') {
            visItems.sort((a, b) => a.label.localeCompare(b.label));
        } else {
            visItems.sort((a, b) => b.value - a.value);
        }

        chart.data.labels = visItems.map(it => it.label);
        chart.data.datasets[0].data = visItems.map(it => it.value);
        chart.data.datasets[0].backgroundColor = visItems.map(it => it.color);

        // Scale labels font for bar chart (no rotation)
        if (chart.config.type === 'bar') {
            const numVis = visItems.length;
            const fontSize = Math.max(10, Math.min(18, Math.floor(300 / Math.max(1, numVis))));
            const rotation = 0;
            if (chart.options.scales?.y) {
                chart.options.scales.y.ticks.font = { size: fontSize };
                chart.options.scales.y.ticks.maxRotation = rotation;
                chart.options.scales.y.ticks.minRotation = rotation;
            }
        }

        chart.update();
    };

    const renderLegend = (sortMode) => {
        const allItems = origLabels.map((label, i) => ({
            label,
            value: origData[i],
            color: origColors[i],
            i
        }));
        if (sortMode === 'alpha') {
            allItems.sort((a, b) => a.label.localeCompare(b.label));
        } else {
            allItems.sort((a, b) => b.value - a.value);
        }
        const textColor = TEXT_COLOR;
        legendEl.innerHTML = allItems.map(it => {
            const isVis = visible.has(it.i);
            const opacity = isVis ? 1 : 0.4;
            const decoration = isVis ? 'none' : 'line-through';
            return `
                <button data-idx="${it.i}" class="legend-item" style="display:inline-flex;align-items:center;gap:8px;padding:4px 8px;border-radius:6px;border:1px solid rgba(0,0,0,.12);background:transparent;color:${textColor};-webkit-text-fill-color:${textColor};opacity:${opacity};cursor:pointer;overflow:visible;">
                    <span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:${it.color};flex:0 0 auto;"></span>
                    <span class="legend-text" style="white-space:nowrap;color:${textColor};-webkit-text-fill-color:${textColor};text-decoration:${decoration};">${it.label}</span>
                </button>
            `;
        }).join('');
        Array.from(legendEl.querySelectorAll('button.legend-item')).forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-idx'));
                if (visible.has(idx)) {
                    visible.delete(idx);
                } else {
                    visible.add(idx);
                }
                updateChartAndLegend();
            });
        });
    };

    const updateChartAndLegend = () => {
        const sortMode = getSortMode();
        updateChart(sortMode);
        renderLegend(sortMode);
    };

    updateChartAndLegend(); // Initial render

    if (sortSelect) {
        sortSelect.addEventListener('change', updateChartAndLegend);
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            visible = new Set([...Array(origLabels.length).keys()]);
            updateChartAndLegend();
        });
    }

    if (chartTypeSelect) {
        chartTypeSelect.addEventListener('change', () => {
            const newType = chartTypeSelect.value;
            chart.destroy();
            chart = new window.Chart(ctx, makeConfig(newType));
            updateChartAndLegend();
        });
    }
}

function processChartsQueue() {
    const w = window;
    const q = w.__wbChartsQueue || [];
    if (!q.length) {
        if (w.__wbChartsInterval) { clearInterval(w.__wbChartsInterval); w.__wbChartsInterval = null; }
        return;
    }
    const pending = [];
    for (const spec of q) {
        const canvas = document.getElementById(spec.canvasId);
        const legendEl = document.getElementById(spec.legendId);
        const sortSelect = document.getElementById(spec.sortId);
        const resetBtn = document.getElementById(spec.resetId);
        if (!canvas || !legendEl || !sortSelect || !resetBtn) { pending.push(spec); continue; }
        const chartTypeSelect = document.getElementById(spec.chartTypeId);
        if (!spec.data || Object.keys(spec.data).length === 0) {
            const p = canvas.parentElement;
            if (p) p.innerHTML = '<div class="text-gray-400">No data</div>';
            legendEl.innerHTML = '';
            continue;
        }
        ensureChartJs().then(() => renderChartWithLegend(canvas, spec.data, legendEl, sortSelect, resetBtn, chartTypeSelect));

    }
    w.__wbChartsQueue = pending;
    if (!w.__wbChartsQueue.length && w.__wbChartsInterval) { clearInterval(w.__wbChartsInterval); w.__wbChartsInterval = null; }
}

function queuePieCharts(specs) {
    const w = window;
    if (!w.__wbChartsQueue) w.__wbChartsQueue = [];
    w.__wbChartsQueue.push(...specs);
    if (!w.__wbChartsInterval) w.__wbChartsInterval = setInterval(processChartsQueue, 150);
}

export function renderPlayerInfo(data, rawData, percentiles, sortStates, timePrefs) {
    // Blacklist check
    const BLACKLISTED_UIDS = [
        '6698bdf3d142af601f50256a',  // Add blacklisted UIDs here
        // etc.
    ];
    
    if (BLACKLISTED_UIDS.includes(String(data.uid))) {
        return `
            <div class="stat-card">
                <h3>⛔ Access Restricted</h3>
                <p>This player's statistics are not available for viewing. Please join the support server to resolve the issue.</p>
            </div>
        `;
    }

    // This single call replaces the large block of calculation logic.
    const consts = calculateDisplayConstants(data, rawData, percentiles, sortStates);

    // These variables are kept here as they are used for date formatting and chart setup.
    const { timeZone, timeFormat } = timePrefs;
    const joinTimestamp = getJoinDateFromUID(data.uid);

    // --- Generate K/D Milestone HTML (depends on consts) ---
    let kdMilestoneHTML = '';
    if (consts.totalDeaths > 0) {
        const current_kd = consts.totalKills / consts.totalDeaths;
        const next_kd_ratio = (Math.trunc(current_kd * 10) / 10) + 0.1;
        const kills_needed = (next_kd_ratio * consts.totalDeaths) - consts.totalKills;
        const kills_to_rank_up = Math.ceil(kills_needed);
        const rankUpText = kills_to_rank_up > 0 ? `Need ${kills_to_rank_up.toLocaleString()} kills for ${next_kd_ratio.toFixed(3)} K/D` : `Next milestone passed`;
        const previous_kd_milestone = (Math.ceil(current_kd * 10) - 1) / 10;
        let rankDownText = '';
        if (previous_kd_milestone > 0) {
            const deaths_needed = (consts.totalKills / previous_kd_milestone) - consts.totalDeaths;
            const deaths_to_rank_down = Math.ceil(deaths_needed);
            rankDownText = `Drop to ${previous_kd_milestone.toFixed(3)} in ${deaths_to_rank_down.toLocaleString()} deaths`;
        } else {
            rankDownText = 'K/D cannot drop further';
        }
        kdMilestoneHTML = `
            <div class="stat-row">
                <span class="stat-label-emoji">📈</span>
                <span class="stat-value-pill ${kills_to_rank_up > 0 ? 'success' : 'subtle'}">${rankUpText}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label-emoji">📉</span>
                <span class="stat-value-pill danger">${rankDownText}</span>
            </div>
        `;
    }

    // --- Generate Level Progress HTML (depends on consts) ---
    const lvl = data.level || 0;
    const lifetimeXp = data.xp || 0;
    const lp = levelProgress(lvl, lifetimeXp);
    const levelProgressHTML = `
        <div class="stat-row" style="flex-direction:column;align-items:flex-start;gap:6px;margin-top:6px;">
            <div style="width:100%;height:8px;background:#2e3340;border-radius:4px;overflow:hidden;">
                <div style="height:100%;width:${lp.percent}%;background:linear-gradient(90deg,#0ea5e9,#22c55e);"></div>
            </div>
            <span class="stat-value">${lp.percent.toFixed(2)}% complete</span>
        </div>
    `;

    // --- Generate Miscellaneous Stats HTML (depends on consts) ---
    const miscStatsHTML = `
        <div class="stat-card">
            <h3>🔧 Miscellaneous Stats</h3>
            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;">
                <div>
                    <div class="stat-row"><span class="stat-label">Kills per Game:</span><span class="stat-value">${consts.killsPerGame}</span></div>
                    <div class="stat-row"><span class="stat-label">Deaths per Game:</span><span class="stat-value">${consts.deathsPerGame}</span></div>
                    <div class="stat-row"><span class="stat-label">Weapon Kills per Vehicle Kill:</span><span class="stat-value">${consts.weaponKillsPerVehicleKill}</span></div>
                    <div class="stat-row"><span class="stat-label">Self Destructs:</span><span class="stat-value">${consts.totalSelfDestructs.toLocaleString()}</span></div>
                    <div class="stat-row"><span class="stat-label">Self Destructs per Game:</span><span class="stat-value">${consts.selfDestructsPerGame}</span></div>
                    <div class="stat-row"><span class="stat-label">Self Destruct % of Deaths:</span><span class="stat-value">${consts.selfDestructPercentage}%</span></div>
                    <div class="stat-row"><span class="stat-label">Damage Dealt:</span><span class="stat-value">${Math.round(consts.totalDamageDealt).toLocaleString()}</span></div>
                    <div class="stat-row"><span class="stat-label">Damage Received:</span><span class="stat-value">${Math.round(consts.totalDamageReceived).toLocaleString()}</span></div>
                    <div class="stat-row"><span class="stat-label">Damage Dealt per Damage Received:</span><span class="stat-value">${consts.damageRatio}</span></div>
                    <div class="stat-row"><span class="stat-label">Damage Dealt per Kill:</span><span class="stat-value">${consts.damagePerKill}</span></div>
                    <div class="stat-row"><span class="stat-label">Damage Received per Death:</span><span class="stat-value">${consts.damagePerDeath}</span></div>
                    <div class="stat-row"><span class="stat-label">Damage Dealt per Game:</span><span class="stat-value">${consts.damagePerGame}</span></div>
                    <div class="stat-row"><span class="stat-label">Damage Received per Game:</span><span class="stat-value">${consts.damageReceivedPerGame}</span></div>
                    <div class="stat-row"><span class="stat-label">Total Headshots:</span><span class="stat-value">${consts.totalHeadshots.toLocaleString()}</span></div>
                    <div class="stat-row"><span class="stat-label">Headshots per Game:</span><span class="stat-value">${consts.headshotsPerGame}</span></div>
                </div>
                <div>
                    <div class="stat-row"><span class="stat-label">Headshots per Kill:</span><span class="stat-value">${consts.headshotsPerKill}</span></div>
                    <div class="stat-row"><span class="stat-label">Shots Fired (Unzoomed):</span><span class="stat-value">${consts.totalShotsFiredUnzoomed.toLocaleString()}</span></div>
                    <div class="stat-row"><span class="stat-label">Shots Fired (Zoomed):</span><span class="stat-value">${consts.totalShotsFiredZoomed.toLocaleString()}</span></div>
                    <div class="stat-row"><span class="stat-label">Shots Hit (Unzoomed):</span><span class="stat-value">${consts.totalShotsHitUnzoomed.toLocaleString()}</span></div>
                    <div class="stat-row"><span class="stat-label">Shots Hit (Zoomed):</span><span class="stat-value">${consts.totalShotsHitZoomed.toLocaleString()}</span></div>
                    <div class="stat-row"><span class="stat-label">Shots Hit per Fired (Unzoomed):</span><span class="stat-value">${consts.accUnzoomed}</span></div>
                    <div class="stat-row"><span class="stat-label">Shots Hit per Fired (Zoomed):</span><span class="stat-value">${consts.accZoomed}</span></div>
                    <div class="stat-row"><span class="stat-label">Shots Hit per Fired (Both):</span><span class="stat-value">${consts.accBoth}</span></div>
                    <div class="stat-row"><span class="stat-label">Shots Fired per Game:</span><span class="stat-value">${consts.shotsFiredPerGame}</span></div>
                    <div class="stat-row"><span class="stat-label">Shots Hit per Game:</span><span class="stat-value">${consts.shotsHitPerGame}</span></div>
                    <div class="stat-row"><span class="stat-label">Total Jumps:</span><span class="stat-value">${consts.numberOfJumps.toLocaleString()}</span></div>
                    <div class="stat-row"><span class="stat-label">Jumps per Game:</span><span class="stat-value">${consts.jumpsPerGame}</span></div>
                    <div class="stat-row"><span class="stat-label">Jumps per Damage Dealt:</span><span class="stat-value">${consts.jumpsPerDamage}</span></div>
                    <div class="stat-row"><span class="stat-label">Missiles Launched:</span><span class="stat-value">${consts.scudsLaunched.toLocaleString()}</span></div>
                    <div class="stat-row"><span class="stat-label">Missiles Launched per Missile Launch Game:</span><span class="stat-value">${consts.missilesPerMissileLaunchGame}</span></div>
                </div>
            </div>
        </div>
    `;

    // --- Chart Setup (depends on consts and data) ---
    const uidKey = String(data.uid || Math.random().toString(36).slice(2));
    const idWeapon = `pie_weapon_${uidKey}`, legWeapon = `legend_weapon_${uidKey}`, sortWeapon = `sort_weapon_${uidKey}`, resetWeapon = `reset_weapon_${uidKey}`;
    const idVehicle = `pie_vehicle_${uidKey}`, legVehicle = `legend_vehicle_${uidKey}`, sortVehicle = `sort_vehicle_${uidKey}`, resetVehicle = `reset_vehicle_${uidKey}`;
    const idDeaths = `pie_deaths_${uidKey}`, legDeaths = `legend_deaths_${uidKey}`, sortDeaths = `sort_deaths_${uidKey}`, resetDeaths = `reset_deaths_${uidKey}`;
    const idWins = `pie_wins_${uidKey}`, legWins = `legend_wins_${uidKey}`, sortWins = `sort_wins_${uidKey}`, resetWins = `reset_wins_${uidKey}`;
    const idLosses = `pie_losses_${uidKey}`, legLosses = `legend_losses_${uidKey}`, sortLosses = `sort_losses_${uidKey}`, resetLosses = `reset_losses_${uidKey}`;
    const idDamageDealt = `pie_damage_dealt_${uidKey}`;
    const legDamageDealt = `legend_damage_dealt_${uidKey}`;
    const sortDamageDealt = `sort_damage_dealt_${uidKey}`;
    const resetDamageDealt = `reset_damage_dealt_${uidKey}`;
    const idDamageReceived = `pie_damage_received_${uidKey}`;
    const legDamageReceived = `legend_damage_received_${uidKey}`;
    const sortDamageReceived = `sort_damage_received_${uidKey}`;
    const resetDamageReceived = `reset_damage_received_${uidKey}`;
    
    queuePieCharts([
    { canvasId: idWeapon, legendId: legWeapon, sortId: sortWeapon, resetId: resetWeapon, chartTypeId: `chart_type_${idWeapon}`, data: consts.weaponKillsData },
    { canvasId: idDamageDealt, legendId: legDamageDealt, sortId: sortDamageDealt, resetId: resetDamageDealt, chartTypeId: `chart_type_${idDamageDealt}`, data: consts.weaponDamageDealtData },
    { canvasId: idDamageReceived, legendId: legDamageReceived, sortId: sortDamageReceived, resetId: resetDamageReceived, chartTypeId: `chart_type_${idDamageReceived}`, data: consts.weaponDamageReceivedData },
    { canvasId: idVehicle, legendId: legVehicle, sortId: sortVehicle, resetId: resetVehicle, chartTypeId: `chart_type_${idVehicle}`, data: data.kills_per_vehicle || {} },
    { canvasId: idDeaths, legendId: legDeaths, sortId: sortDeaths, resetId: resetDeaths, chartTypeId: `chart_type_${idDeaths}`, data: data.deaths || {} },
    { canvasId: idWins, legendId: legWins, sortId: sortWins, resetId: resetWins, chartTypeId: `chart_type_${idWins}`, data: data.wins || {} },
    { canvasId: idLosses, legendId: legLosses, sortId: sortLosses, resetId: resetLosses, chartTypeId: `chart_type_${idLosses}`, data: data.losses || {} }
]);

    const chartCard = (title, canvasId, sortId, legendId, resetId, chartTypeId) => `
    <div class="graph-card" style="padding:8px;">
        <h4 style="text-align:center;margin:0 0 8px 0;color:${TEXT_COLOR};">${title}</h4>
        <div style="position:relative;height:360px;width:100%;"><canvas id="${canvasId}" style="width:100%;height:100%;"></canvas></div>
        <div class="chart-controls" style="display:flex;align-items:center;gap:8px;justify-content:flex-end;margin:8px 0;">
            <label style="font-size:.875rem;opacity:.85;color:${TEXT_COLOR};">Chart</label>
            <select id="${chartTypeId}" style="padding:4px 8px;border-radius:6px;border:1px solid ${CTRL_BORDER};background:${CTRL_BG};color:${TEXT_COLOR};">
                <option value="pie" selected>Pie</option>
                <option value="bar">Bar</option>
            </select>
            <label style="font-size:.875rem;opacity:.85;color:${TEXT_COLOR};">Sort</label>
            <select id="${sortId}" style="padding:4px 8px;border-radius:6px;border:1px solid ${CTRL_BORDER};background:${CTRL_BG};color:${TEXT_COLOR};">
                <option value="size" selected>By Size</option>
                <option value="alpha">Alphabetical</option>
            </select>
            <button id="${resetId}" class="btn btn-subtle" style="padding:4px 10px;border-radius:6px;border:1px solid ${CTRL_BORDER};background:${CTRL_BG_SUBTLE};color:${TEXT_COLOR};">Reset</button>
        </div>
        <div id="${legendId}" class="pie-legend" style="display:flex;flex-wrap:wrap;gap:8px;row-gap:6px;margin-top:4px;overflow:visible;"></div>
    </div>
`;

    // Update the graphsHTML section around line 480:
const graphsHTML = `
    <div class="stat-card">
        <h3>📈 Graphs</h3>
        <div style="display:grid;grid-template-columns:1fr;gap:16px;">
            ${chartCard('Kills per Weapon', idWeapon, sortWeapon, legWeapon, resetWeapon, `chart_type_${idWeapon}`)}
            ${chartCard('Damage Dealt per Weapon', idDamageDealt, sortDamageDealt, legDamageDealt, resetDamageDealt, `chart_type_${idDamageDealt}`)}
            ${chartCard('Damage Received per Weapon', idDamageReceived, sortDamageReceived, legDamageReceived, resetDamageReceived, `chart_type_${idDamageReceived}`)}
            ${chartCard('Kills per Vehicle', idVehicle, sortVehicle, legVehicle, resetVehicle, `chart_type_${idVehicle}`)}
            ${chartCard('Deaths by Cause', idDeaths, sortDeaths, legDeaths, resetDeaths, `chart_type_${idDeaths}`)}
            ${chartCard('Wins per Game Mode', idWins, sortWins, legWins, resetWins, `chart_type_${idWins}`)}
            ${chartCard('Losses per Game Mode', idLosses, sortLosses, legLosses, resetLosses, `chart_type_${idLosses}`)}
        </div>
    </div>
`;
    const isSteamUser = data.steam === true;
    const steamText = isSteamUser ? 'Yes' : 'No';
    const steamHighlightClass = isSteamUser ? 'success' : 'danger';
    let specialLogoHTML = '';
    const playerLinks = data.socialLinks;
    if (playerLinks) {
        if (playerLinks.discord) specialLogoHTML += `<a href="${playerLinks.discord}" target="_blank" rel="noopener noreferrer" title="Discord"><img src="/discord.png" alt="Discord Logo" class="player-name-logo"></a>`;
        if (playerLinks.youtube) specialLogoHTML += `<a href="${playerLinks.youtube}" target="_blank" rel="noopener noreferrer" title="Visit YouTube Channel"><img src="/youtube.png" alt="YouTube Logo" class="player-name-logo"></a>`;
    }
    let biographyHTML = '';
    if (data.biography) biographyHTML = `<div class="player-bio">${data.biography}</div>`;

    return `
        <div class="player-header">
            <div class="player-name-details">
                <div class="player-name">${data.nick || 'Unknown Player'}${specialLogoHTML}</div>
                <div class="player-uid">UID: ${data.uid}</div>
                ${biographyHTML}
            </div>
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <h3>📊 Basic Information</h3>
                <div class="stat-row"><span class="stat-label">Level:</span><span class="stat-value highlight">${(data.level || 0).toLocaleString()}</span></div>
                ${levelProgressHTML}
                <div class="stat-row"><span class="stat-label">XP:</span><span class="stat-value">${(data.xp || 0).toLocaleString()}</span></div>
                <div class="stat-row"><span class="stat-label">XP Rank:</span><span class="stat-value">Top ${consts.topXpPercent.toFixed(4)}%</span></div>
                <div class="stat-row"><span class="stat-label">Squad:</span>${data.squad?`<a class="stat-value" href="https://didyougetsniped.github.io/squads?squad=${data.squad}">${data.squad}</a>`:`<span class="stat-value">None</span>`}</div>
                <div class="stat-row"><span class="stat-label">Steam:</span><span class="${steamHighlightClass}">${steamText}</span></div>
                <div class="stat-row"><span class="stat-label">Total Games Played:</span><span class="stat-value">${consts.totalGames.toLocaleString()}</span></div>
                <div class="stat-row"><span class="stat-label">Coins:</span><span class="stat-value">${(data.coins || 0).toLocaleString()}</span></div>
                <div class="stat-row"><span class="stat-label">Join Date:</span>
                    <div class="stat-value-container">
                        <span id="join-date-full"><span class="stat-value" id="join-date">${formatDateTime(joinTimestamp, timeZone, timeFormat)}</span> <span class="time-ago" id="join-date-ago">${timeAgo(joinTimestamp)}</span></span>
                        <button class="btn-copy-inline" data-copy="join-date-full">Copy</button>
                    </div>
                </div>
                <div class="stat-row"><span class="stat-label">Last Played:</span>
                    <div class="stat-value-container">
                        <span id="last-played-full"><span class="stat-value" id="last-played">${formatDateTime(data.time, timeZone, timeFormat)}</span> <span class="time-ago" id="last-played-ago">${timeAgo(data.time)}</span></span>
                        <button class="btn-copy-inline" data-copy="last-played-full">Copy</button>
                    </div>
                </div>
                </div>
            <div class="stat-card">
                <h3>⭐ Broker Performance Rating (BPR) <a href="https://didyougetsniped.github.io/bpr" target="_blank" rel="noopener noreferrer" style="font-size: 0.8em; margin-left: 5px; color: #0d6efd;">(explanation)</a></h3>
                <div class="stat-row" style="margin-bottom: 20px;">
                    <div><span class="stat-label">Score:</span></div>
                    <span class="stat-value highlight">${consts.performanceScoreDisplay}</span>
                </div>
                <h3>🏆 ELO Ratings</h3>
                <div class="stat-row"><span class="stat-label">Kills ELO:</span><span class="stat-value highlight">${(data.killsELO || 0).toFixed(2)}</span></div>
                <div class="stat-row"><span class="stat-label">Kills ELO Rank:</span><span class="stat-value">Top ${consts.topKillsPercent.toFixed(4)}%</span></div>
                <div class="stat-row"><span class="stat-label">Games ELO:</span><span class="stat-value highlight">${(data.gamesELO || 0).toFixed(2)}</span></div>
                <div class="stat-row"><span class="stat-label">Games ELO Rank:</span><span class="stat-value">Top ${consts.topGamesPercent.toFixed(4)}%</span></div>
                <h3 style="margin-top: 10px;">💀 Kills and Deaths</h3>
                <div class="stat-row"><span class="stat-label">K/D Ratio:</span><span class="stat-value highlight">${data.kdr || '0.000'}</span></div>
                ${kdMilestoneHTML}
                <div class="stat-row"><span class="stat-label">Total Kills:</span><span class="stat-value">${consts.totalKills.toLocaleString()}</span></div>
                <div class="stat-row"><span class="stat-label">Total Deaths:</span><span class="stat-value">${consts.totalDeaths.toLocaleString()}</span></div>
                <div class="stat-row"><span class="stat-label">Total Weapon Kills:</span><span class="stat-value">${consts.weaponKillsTotal.toLocaleString()}</span></div>
                <div class="stat-row"><span class="stat-label">Total Vehicle Kills:</span><span class="stat-value">${consts.vehicleKillsTotal.toLocaleString()}</span></div>
            </div>
        </div>

        ${consts.weaponStarsHTML}
        ${consts.weaponStatsHTML}
        
        ${consts.vehicleStarsHTML}
        ${consts.vehicleKillsStatsHTML}
        
        ${consts.deathStatsHTML}

        <div class="dual-stats-grid">
            ${consts.winsStatsHTML}
            ${consts.lossesStatsHTML}
        </div>

        ${miscStatsHTML}
        ${graphsHTML}

        <div class="raw-json">
            <div class="json-header"><h3>📋 Raw JSON Data</h3><button class="btn btn-copy" data-copy="raw">Copy JSON</button></div>
            <pre id="raw-json-content">${JSON.stringify(rawData, null, 2)}</pre>
        </div>
    `;
}

export function renderSearchResults(results) {
    const resultsHTML = results.map(player => `
        <button class="search-result-item" data-uid="${player.uid}">
            <span class="result-name">${player.nick}</span>
            <span class="result-uid">UID: ${player.uid}</span>
        </button>
    `).join('');
    return `
        <div class="stat-card">
            <h3>Search Results (${results.length})</h3>
            <p>Multiple players found. Please select one to view their stats.</p>
            <div class="search-results-list">
                ${resultsHTML}
            </div>
        </div>
    `;
}

export function displayMessage(container, message, type = 'error') {
    container.innerHTML = `<div class="message ${type}">${message}</div>`;
};

export function updateMetaTags(playerData) {
    if (!playerData) return;
    document.title = `${playerData.nick}'s War Brokers Stats`;
    const ogTitleTag = document.querySelector('meta[property="og:title"]');
    if (ogTitleTag) ogTitleTag.setAttribute('content', `${playerData.nick}'s War Brokers Stats`);
    const ogDescriptionTag = document.querySelector('meta[property="og:description"]');
    if (ogDescriptionTag) {
        const description = `Level: ${playerData.level} | Squad: ${playerData.squad || 'None'} | K/D: ${playerData.kdr} | Kills ELO: ${(playerData.killsELO || 0).toFixed(2)} | Games ELO: ${(playerData.gamesELO || 0).toFixed(2)}`;
        ogDescriptionTag.setAttribute('content', description);
    }
}

export function resetMetaTags() {
    document.title = 'War Brokers Player Stats';
    const ogTitleTag = document.querySelector('meta[property="og:title"]');
    if (ogTitleTag) ogTitleTag.setAttribute('content', 'War Brokers Player Stats');
    const ogDescriptionTag = document.querySelector('meta[property="og:description"]');
    if (ogDescriptionTag) ogDescriptionTag.setAttribute('content', 'Check out your player statistics by name or UID!');

}
