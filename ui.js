import { formatDateTime, timeAgo, getJoinDateFromUID } from '/utils.js';
import { generateWeaponStarsHTML } from '/weaponlogic.js';
import { generateVehicleStarsHTML } from '/vehiclelogic.js'; // <-- Import new vehicle logic

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

function calculatePerformanceScore(total_kills, damage_dealt, total_deaths, damage_received, kills_elo_rank, games_elo_rank, total_games, num_self_destructs, xp) {
    try {
        if (total_deaths === 0 || damage_received === 0 || kills_elo_rank === 0 || games_elo_rank === 0 || total_games === 0) {
            console.error("Performance Score Calculation Error: One or more required stats are zero.", { total_deaths, damage_received, kills_elo_rank, games_elo_rank, total_games });
            return null;
        }
        const self_destruct_percentage = num_self_destructs / total_deaths;
        const combat_ratio = (total_kills * damage_dealt) / (total_deaths * damage_received);
        const kills_elo_bonus = Math.pow(1 / kills_elo_rank, 1 / 4) / 6.2;
        const factor_a = Math.sqrt(combat_ratio) + kills_elo_bonus;
        const avg_damage_impact = damage_dealt / (8250 * total_games);
        const games_elo_bonus = Math.pow(1 / games_elo_rank, 1 / 4) / 13.2;
        const resilience = (damage_received * (1 - self_destruct_percentage)) / (660 * total_deaths);
        const factor_b = avg_damage_impact + games_elo_bonus + resilience;
        const core_performance_score = Math.sqrt(factor_a * factor_b);
        const experience_bonus = Math.pow(xp, 1 / 4) / 62;
        const base_score = core_performance_score + experience_bonus;
        const overall_score = base_score * 100;
        if (isNaN(overall_score) || !isFinite(overall_score)) {
            console.error("Performance Score result is NaN or Infinite. Check inputs.", { total_kills, damage_dealt, total_deaths, damage_received, kills_elo_rank, games_elo_rank, total_games, num_self_destructs, xp });
            return null;
        }
        return overall_score;
    } catch (e) {
        console.error("An unexpected error occurred during performance score calculation:", e);
        return null;
    }
}

export function generateRowsHTML(data, sortByCount) {
    if (!data || Object.keys(data).length === 0) {
        return '<p class="text-gray-400">No data available.</p>';
    }
    const dataArray = Object.entries(data);
    if (sortByCount) dataArray.sort(([, a], [, b]) => b - a);
    else dataArray.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
    return dataArray.map(([name, count]) =>
        `<div class="stat-row">
            <span class="stat-label">${name}</span>
            <span class="stat-value">${count.toLocaleString()}</span>
        </div>`
    ).join('');
}

function createStatsCardHTML(title, data, sortState, toggleId, gridId, stackedHeader = false) {
    if (!data || Object.keys(data).length === 0) {
        return `<div class="stat-card"><h3>${title}</h3><p class="text-gray-400">No data available.</p></div>`;
    }
    const rows = generateRowsHTML(data, sortState);
    const toggleHTML = `
        <div class="sort-toggle">
            <span>Alphabetical</span>
            <label class="switch"><input type="checkbox" id="${toggleId}" ${sortState ? 'checked' : ''}><span class="slider"></span></label>
            <span>By Count</span>
        </div>`;
    const headerContent = stackedHeader ? `<h3>${title}</h3>${toggleHTML}` : `<div class="weapon-stats-header"><h3>${title}</h3>${toggleHTML}</div>`;
    return `
        <div class="stat-card">
            ${headerContent}
            <div class="stats-data-grid" id="${gridId}">${rows}</div>
        </div>`;
}

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

function renderPieWithLegend(canvas, dataObj, legendEl, sortSelect, resetBtn) {
    const entries = Object.entries(dataObj || {}).filter(([, v]) => typeof v === 'number' && v > 0);
    if (!entries.length) {
        if (canvas && canvas.parentElement) canvas.parentElement.innerHTML = '<div class="text-gray-400">No data</div>';
        if (legendEl) legendEl.innerHTML = '';
        return;
    }
    entries.sort((a, b) => b[1] - a[1]);
    const labels = entries.map(e => e[0]);
    a: {
        const uniq = new Set();
        for (let i = 0; i < labels.length; i++) {
            let l = labels[i];
            if (!uniq.has(l)) { uniq.add(l); continue; }
            let k = 2;
            while (uniq.has(`${l} (${k})`)) k++;
            labels[i] = `${l} (${k})`;
            uniq.add(labels[i]);
        }
    }
    const data = entries.map(e => e[1]);
    const colors = palette(labels.length);
    const ctx = canvas.getContext('2d');
    const chart = new window.Chart(ctx, {
        type: 'pie',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: CHART_BORDER, borderWidth: 1 }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: false },
                tooltip: {
                    bodyColor: TEXT_COLOR,
                    titleColor: TEXT_COLOR,
                    callbacks: { label: c => { const v = c.parsed; const total = c.dataset.data.reduce((a, b) => a + b, 0); const pct = total ? (v / total * 100) : 0; return `${c.label}: ${v.toLocaleString()} (${pct.toFixed(2)}%)`; } }
                }
            }
        }
    });
    const renderLegend = () => buildLegendForChart(chart, legendEl, (sortSelect && sortSelect.value) || 'size');
    renderLegend();
    if (sortSelect) sortSelect.addEventListener('change', renderLegend);
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            for (let i = 0; i < chart.data.labels.length; i++) {
                if (chart.getDataVisibility && !chart.getDataVisibility(i)) chart.toggleDataVisibility(i);
            }
            chart.update();
            renderLegend();
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
        if (!spec.data || Object.keys(spec.data).length === 0) {
            const p = canvas.parentElement;
            if (p) p.innerHTML = '<div class="text-gray-400">No data</div>';
            legendEl.innerHTML = '';
            continue;
        }
        ensureChartJs().then(() => renderPieWithLegend(canvas, spec.data, legendEl, sortSelect, resetBtn));
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

function valueForKeyCI(obj, key) {
    if (!obj) return 0;
    const target = key.toLowerCase();
    for (const k of Object.keys(obj)) if (k.toLowerCase() === target) return obj[k] || 0;
    return 0;
}

export function renderPlayerInfo(data, rawData, percentiles, sortStates, timePrefs) {
    const { kills, deaths, vehicleKills, wins, losses } = sortStates;
    const { timeZone, timeFormat } = timePrefs;
    const joinTimestamp = getJoinDateFromUID(data.uid);

    const weaponKillsData = {};
    if (data.weaponStats) for (const weaponName in data.weaponStats) weaponKillsData[weaponName] = data.weaponStats[weaponName].kills;
    
    // Generate both achievement sections
    const weaponStarsHTML = generateWeaponStarsHTML(weaponKillsData);
    const vehicleStarsHTML = generateVehicleStarsHTML(data.kills_per_vehicle);

    const weaponStatsHTML = createStatsCardHTML('🔫 Kills per Weapon', weaponKillsData, kills, 'weapon-sort-toggle', 'weapon-stats-grid');
    const vehicleKillsStatsHTML = createStatsCardHTML('🚗 Kills per Vehicle', data.kills_per_vehicle, vehicleKills, 'vehicle-sort-toggle', 'vehicle-kills-grid');
    const deathStatsHTML = createStatsCardHTML('💀 Deaths by Cause', data.deaths, deaths, 'death-sort-toggle', 'death-stats-grid');
    const winsStatsHTML = createStatsCardHTML('🏆 Wins per Game Mode', data.wins, wins, 'wins-sort-toggle', 'wins-stats-grid', true);
    const lossesStatsHTML = createStatsCardHTML('👎 Losses per Game Mode', data.losses, losses, 'losses-sort-toggle', 'losses-stats-grid', true);

    const totalSelfDestructs = Object.values(rawData.self_destructs || {}).reduce((sum, val) => sum + val, 0);
    const totalDamageDealt = Object.values(rawData.damage_dealt || {}).reduce((sum, val) => sum + val, 0);
    const totalDamageReceived = Object.values(rawData.damage_received || {}).reduce((sum, val) => sum + val, 0);
    const totalHeadshots = Object.values(rawData.headshots || {}).reduce((sum, val) => sum + val, 0);
    const totalShotsFiredUnzoomed = Object.values(rawData.shots_fired_unzoomed || {}).reduce((sum, val) => sum + val, 0);
    const totalShotsFiredZoomed = Object.values(rawData.shots_fired_zoomed || {}).reduce((sum, val) => sum + val, 0);
    const totalShotsHitUnzoomed = Object.values(rawData.shots_hit_unzoomed || {}).reduce((sum, val) => sum + val, 0);
    const totalShotsHitZoomed = Object.values(rawData.shots_hit_zoomed || {}).reduce((sum, val) => sum + val, 0);
    const totalShotsFired = totalShotsFiredUnzoomed + totalShotsFiredZoomed;
    const totalShotsHit = totalShotsHitUnzoomed + totalShotsHitZoomed;
    const numberOfJumps = rawData.number_of_jumps || 0;
    const scudsLaunched = rawData.scuds_launched || 0;
    const totalWins = Object.values(data.wins || {}).reduce((sum, val) => sum + val, 0);
    const totalLosses = Object.values(data.losses || {}).reduce((sum, val) => sum + val, 0);
    const totalGames = totalWins + totalLosses;
    const damageRatio = totalDamageReceived > 0 ? (totalDamageDealt / totalDamageReceived).toFixed(2) : 'N/A';
    const totalKills = data.totalKills || 0;
    const totalDeaths = data.totalDeaths || 0;
    const damagePerKill = totalKills > 0 ? (totalDamageDealt / totalKills).toFixed(2) : 'N/A';
    const damagePerDeath = totalDeaths > 0 ? (totalDamageReceived / totalDeaths).toFixed(2) : 'N/A';
    const selfDestructPercentage = totalDeaths > 0 ? ((totalSelfDestructs / totalDeaths) * 100).toFixed(2) :'0.00';
    const selfDestructsPerGame = totalGames > 0 ? (totalSelfDestructs / totalGames).toFixed(2) : 'N/A';
    const damagePerGame = totalGames > 0 ? Math.round(totalDamageDealt / totalGames).toLocaleString() : 'N/A';
    const damageReceivedPerGame = totalGames > 0 ? Math.round(totalDamageReceived / totalGames).toLocaleString() : 'N/A';
    const killsPerGame = totalGames > 0 ? (totalKills / totalGames).toFixed(2) : 'N/A';
    const deathsPerGame = totalGames > 0 ? (totalDeaths / totalGames).toFixed(2) : 'N/A';
    const accUnzoomed = totalShotsFiredUnzoomed > 0 ? ((totalShotsHitUnzoomed / totalShotsFiredUnzoomed) * 100).toFixed(2) + '%' : 'N/A';
    const accZoomed = totalShotsFiredZoomed > 0 ? ((totalShotsHitZoomed / totalShotsFiredZoomed) * 100).toFixed(2) + '%' : 'N/A';
    const accBoth = totalShotsFired > 0 ? ((totalShotsHit / totalShotsFired) * 100).toFixed(2) + '%' : 'N/A';
    const shotsFiredPerGame = totalGames > 0 ? (totalShotsFired / totalGames).toFixed(2) : 'N/A';
    const shotsHitPerGame = totalGames > 0 ? (totalShotsHit / totalGames).toFixed(2) : 'N/A';
    const jumpsPerGame = totalGames > 0 ? (numberOfJumps / totalGames).toFixed(2) : 'N/A';
    const jumpsPerDamage = totalDamageDealt > 0 ? (numberOfJumps / totalDamageDealt).toFixed(6) : 'N/A';
    const headshotsPerGame = totalGames > 0 ? (totalHeadshots / totalGames).toFixed(2) : 'N/A';
    const headshotsPerKill = totalKills > 0 ? (totalHeadshots / totalKills).toFixed(2) : 'N/A';
    const missilesPerGame = totalGames > 0 ? (scudsLaunched / totalGames).toFixed(2) : 'N/A';
    const missileLaunchGames = valueForKeyCI(data.wins, 'Missile Launch') + valueForKeyCI(data.losses, 'Missile Launch');
    const missilesPerMissileLaunchGame = missileLaunchGames > 0 ? (scudsLaunched / missileLaunchGames).toFixed(2) : 'N/A';
    const topKillsPercent = 100 - (percentiles.killsPercentile || 0);
    const killsEloRankDecimal = topKillsPercent / 100.0;
    const topGamesPercent = 100 - (percentiles.gamesPercentile || 0);
    const gamesEloRankDecimal = topGamesPercent / 100.0;
    const topXpPercent = 100 - (percentiles.xpPercentile || 0);
    const performanceScore = calculatePerformanceScore(
        totalKills,
        totalDamageDealt,
        totalDeaths,
        totalDamageReceived,
        killsEloRankDecimal,
        gamesEloRankDecimal,
        totalGames,
        totalSelfDestructs,
        data.xp || 0
    );
    const performanceScoreDisplay = performanceScore !== null ? performanceScore.toFixed(3) : 'N/A';
    let kdMilestoneHTML = '';
    if (totalDeaths > 0) {
        const current_kd = totalKills / totalDeaths;
        const next_kd_ratio = (Math.trunc(current_kd * 10) / 10) + 0.1;
        const kills_needed = (next_kd_ratio * totalDeaths) - totalKills;
        const kills_to_rank_up = Math.ceil(kills_needed);
        const rankUpText = kills_to_rank_up > 0 ? `Need ${kills_to_rank_up.toLocaleString()} kills for ${next_kd_ratio.toFixed(3)} K/D` : `Next milestone passed`;
        const previous_kd_milestone = (Math.ceil(current_kd * 10) - 1) / 10;
        let rankDownText = '';
        if (previous_kd_milestone > 0) {
            const deaths_needed = (totalKills / previous_kd_milestone) - totalDeaths;
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

    const miscStatsHTML = `
        <div class="stat-card">
            <h3>🔧 Miscellaneous Stats</h3>
            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;">
                <div>
                    <div class="stat-row"><span class="stat-label">Kills per Game:</span><span class="stat-value">${killsPerGame}</span></div>
                    <div class="stat-row"><span class="stat-label">Deaths per Game:</span><span class="stat-value">${deathsPerGame}</span></div>
                    <div class="stat-row"><span class="stat-label">Self Destructs:</span><span class="stat-value">${totalSelfDestructs.toLocaleString()}</span></div>
                    <div class="stat-row"><span class="stat-label">Self Destructs per Game:</span><span class="stat-value">${selfDestructsPerGame}</span></div>
                    <div class="stat-row"><span class="stat-label">Self Destruct % of Deaths:</span><span class="stat-value">${selfDestructPercentage}%</span></div>
                    <div class="stat-row"><span class="stat-label">Damage Dealt:</span><span class="stat-value">${Math.round(totalDamageDealt).toLocaleString()}</span></div>
                    <div class="stat-row"><span class="stat-label">Damage Received:</span><span class="stat-value">${Math.round(totalDamageReceived).toLocaleString()}</span></div>
                    <div class="stat-row"><span class="stat-label">Damage Dealt per Damage Received:</span><span class="stat-value">${damageRatio}</span></div>
                    <div class="stat-row"><span class="stat-label">Damage Dealt per Kill:</span><span class="stat-value">${damagePerKill}</span></div>
                    <div class="stat-row"><span class="stat-label">Damage Received per Death:</span><span class="stat-value">${damagePerDeath}</span></div>
                    <div class="stat-row"><span class="stat-label">Damage Dealt per Game:</span><span class="stat-value">${damagePerGame}</span></div>
                    <div class="stat-row"><span class="stat-label">Damage Received per Game:</span><span class="stat-value">${damageReceivedPerGame}</span></div>
                    <div class="stat-row"><span class="stat-label">Total Headshots:</span><span class="stat-value">${totalHeadshots.toLocaleString()}</span></div>
                    <div class="stat-row"><span class="stat-label">Headshots per Game:</span><span class="stat-value">${headshotsPerGame}</span></div>
                    <div class="stat-row"><span class="stat-label">Headshots per Kill:</span><span class="stat-value">${headshotsPerKill}</span></div>
                </div>
                <div>
                    <div class="stat-row"><span class="stat-label">Shots Fired (Unzoomed):</span><span class="stat-value">${totalShotsFiredUnzoomed.toLocaleString()}</span></div>
                    <div class="stat-row"><span class="stat-label">Shots Fired (Zoomed):</span><span class="stat-value">${totalShotsFiredZoomed.toLocaleString()}</span></div>
                    <div class="stat-row"><span class="stat-label">Shots Hit (Unzoomed):</span><span class="stat-value">${totalShotsHitUnzoomed.toLocaleString()}</span></div>
                    <div class="stat-row"><span class="stat-label">Shots Hit (Zoomed):</span><span class="stat-value">${totalShotsHitZoomed.toLocaleString()}</span></div>
                    <div class="stat-row"><span class="stat-label">Shots Hit per Fired (Unzoomed):</span><span class="stat-value">${accUnzoomed}</span></div>
                    <div class="stat-row"><span class="stat-label">Shots Hit per Fired (Zoomed):</span><span class="stat-value">${accZoomed}</span></div>
                    <div class="stat-row"><span class="stat-label">Shots Hit per Fired (Both):</span><span class="stat-value">${accBoth}</span></div>
                    <div class="stat-row"><span class="stat-label">Shots Fired per Game:</span><span class="stat-value">${shotsFiredPerGame}</span></div>
                    <div class="stat-row"><span class="stat-label">Shots Hit per Game:</span><span class="stat-value">${shotsHitPerGame}</span></div>
                    <div class="stat-row"><span class="stat-label">Total Jumps:</span><span class="stat-value">${numberOfJumps.toLocaleString()}</span></div>
                    <div class="stat-row"><span class="stat-label">Jumps per Game:</span><span class="stat-value">${jumpsPerGame}</span></div>
                    <div class="stat-row"><span class="stat-label">Jumps per Damage Dealt:</span><span class="stat-value">${jumpsPerDamage}</span></div>
                    <div class="stat-row"><span class="stat-label">Missiles Launched:</span><span class="stat-value">${scudsLaunched.toLocaleString()}</span></div>
                    <div class="stat-row"><span class="stat-label">Missiles Launched per Game:</span><span class="stat-value">${missilesPerGame}</span></div>
                    <div class="stat-row"><span class="stat-label">Missiles Launched per Missile Launch Game:</span><span class="stat-value">${missilesPerMissileLaunchGame}</span></div>
                </div>
            </div>
        </div>
    `;

    const uidKey = String(data.uid || Math.random().toString(36).slice(2));
    const idWeapon = `pie_weapon_${uidKey}`;
    const idVehicle = `pie_vehicle_${uidKey}`;
    const idDeaths = `pie_deaths_${uidKey}`;
    const idWins = `pie_wins_${uidKey}`;
    const idLosses = `pie_losses_${uidKey}`;
    const legWeapon = `legend_weapon_${uidKey}`;
    const legVehicle = `legend_vehicle_${uidKey}`;
    const legDeaths = `legend_deaths_${uidKey}`;
    const legWins = `legend_wins_${uidKey}`;
    const legLosses = `legend_losses_${uidKey}`;
    const sortWeapon = `sort_weapon_${uidKey}`;
    const sortVehicle = `sort_vehicle_${uidKey}`;
    const sortDeaths = `sort_deaths_${uidKey}`;
    const sortWins = `sort_wins_${uidKey}`;
    const sortLosses = `sort_losses_${uidKey}`;
    const resetWeapon = `reset_weapon_${uidKey}`;
    const resetVehicle = `reset_vehicle_${uidKey}`;
    const resetDeaths = `reset_deaths_${uidKey}`;
    const resetWins = `reset_wins_${uidKey}`;
    const resetLosses = `reset_losses_${uidKey}`;

    queuePieCharts([
        { canvasId: idWeapon, legendId: legWeapon, sortId: sortWeapon, resetId: resetWeapon, data: weaponKillsData },
        { canvasId: idVehicle, legendId: legVehicle, sortId: sortVehicle, resetId: resetVehicle, data: data.kills_per_vehicle || {} },
        { canvasId: idDeaths, legendId: legDeaths, sortId: sortDeaths, resetId: resetDeaths, data: data.deaths || {} },
        { canvasId: idWins, legendId: legWins, sortId: sortWins, resetId: resetWins, data: data.wins || {} },
        { canvasId: idLosses, legendId: legLosses, sortId: sortLosses, resetId: resetLosses, data: data.losses || {} }
    ]);

    const chartCard = (title, canvasId, sortId, legendId, resetId) => `
        <div class="graph-card" style="padding:8px;">
            <h4 style="text-align:center;margin:0 0 8px 0;color:${TEXT_COLOR};">${title}</h4>
            <div style="position:relative;height:360px;width:100%;"><canvas id="${canvasId}" style="width:100%;height:100%;"></canvas></div>
            <div class="chart-controls" style="display:flex;align-items:center;gap:8px;justify-content:flex-end;margin:8px 0;">
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

    const graphsHTML = `
        <div class="stat-card">
            <h3>📈 Graphs</h3>
            <div style="display:grid;grid-template-columns:1fr;gap:16px;">
                ${chartCard('Kills per Weapon', idWeapon, sortWeapon, legWeapon, resetWeapon)}
                ${chartCard('Kills per Vehicle', idVehicle, sortVehicle, legVehicle, resetVehicle)}
                ${chartCard('Deaths by Cause', idDeaths, sortDeaths, legDeaths, resetDeaths)}
                ${chartCard('Wins per Game Mode', idWins, sortWins, legWins, resetWins)}
                ${chartCard('Losses per Game Mode', idLosses, sortLosses, legLosses, resetLosses)}
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
                <div class="stat-row"><span class="stat-label">XP Rank:</span><span class="stat-value">Top ${topXpPercent.toFixed(4)}%</span></div>
                <div class="stat-row"><span class="stat-label">Squad:</span>${data.squad?`<a class="stat-value" href="https://didyougetsniped.github.io/squads?squad=${data.squad}">${data.squad}</a>`:`<span class="stat-value">None</span>`}</div>
                <div class="stat-row"><span class="stat-label">Steam:</span><span class="${steamHighlightClass}">${steamText}</span></div>
                <div class="stat-row"><span class="stat-label">Total Games Played:</span><span class="stat-value">${totalGames.toLocaleString()}</span></div>
                <div class="stat-row"><span class="stat-label">Coins:</span><span class="stat-value">${(data.coins || 0).toLocaleString()}</span></div>
                <div class="stat-row"><span class="stat-label">Join Date:</span>
                    <div class="stat-value-container">
                        <div class="date-with-ago" id="full-join-date-text">
                            <span class="stat-value" id="join-date">${formatDateTime(joinTimestamp, timeZone, timeFormat)}</span>
                            <span class="time-ago" id="join-date-ago">${timeAgo(joinTimestamp)}</span>
                        </div>
                        <button class="btn-copy-inline" data-copy="full-join-date-text">Copy</button>
                    </div>
                </div>
                <div class="stat-row"><span class="stat-label">Last Played:</span>
                    <div class="stat-value-container">
                        <div class="date-with-ago" id="full-last-played-text">
                            <span class="stat-value" id="last-played">${formatDateTime(data.time, timeZone, timeFormat)}</span>
                            <span class="time-ago" id="last-played-ago">${timeAgo(data.time)}</span>
                        </div>
                        <button class="btn-copy-inline" data-copy="full-last-played-text">Copy</button>
                    </div>
                </div>
            </div>

            <div class="stat-card">
                <h3>⭐ Broker Performance Rating (BPR) <a href="https://didyougetsniped.github.io/bpr" target="_blank" rel="noopener noreferrer" style="font-size: 0.8em; margin-left: 5px; color: #0d6efd;">(explanation)</a></h3>
                <div class="stat-row" style="margin-bottom: 20px;">
                    <div><span class="stat-label">Score:</span></div>
                    <span class="stat-value highlight">${performanceScoreDisplay}</span>
                </div>
                <h3>🏆 ELO Ratings</h3>
                <div class="stat-row"><span class="stat-label">Kills ELO:</span><span class="stat-value highlight">${(data.killsELO || 0).toFixed(2)}</span></div>
                <div class="stat-row"><span class="stat-label">Kills ELO Rank:</span><span class="stat-value">Top ${topKillsPercent.toFixed(4)}%</span></div>
                <div class="stat-row"><span class="stat-label">Games ELO:</span><span class="stat-value highlight">${(data.gamesELO || 0).toFixed(2)}</span></div>
                <div class="stat-row"><span class="stat-label">Games ELO Rank:</span><span class="stat-value">Top ${topGamesPercent.toFixed(4)}%</span></div>
                <h3 style="margin-top: 10px;">💀 Kills and Deaths</h3>
                <div class="stat-row"><span class="stat-label">K/D Ratio:</span><span class="stat-value highlight">${data.kdr || '0.000'}</span></div>
                ${kdMilestoneHTML}
                <div class="stat-row"><span class="stat-label">Total Kills:</span><span class="stat-value">${totalKills.toLocaleString()}</span></div>
                <div class="stat-row"><span class="stat-label">Total Deaths:</span><span class="stat-value">${totalDeaths.toLocaleString()}</span></div>
            </div>
        </div>

        ${weaponStarsHTML}
        ${weaponStatsHTML}
        
        ${vehicleStarsHTML}
        ${vehicleKillsStatsHTML}
        
        ${deathStatsHTML}

        <div class="dual-stats-grid">
            ${winsStatsHTML}
            ${lossesStatsHTML}
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