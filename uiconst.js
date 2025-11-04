import { getJoinDateFromUID } from '/utils.js';
import { generateWeaponStarsHTML } from '/weaponlogic.js';
import { generateVehicleStarsHTML } from '/vehiclelogic.js';

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

function generateRowsHTML(data, sortByCount) {
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

function valueForKeyCI(obj, key) {
    if (!obj) return 0;
    const target = key.toLowerCase();
    for (const k of Object.keys(obj)) if (k.toLowerCase() === target) return obj[k] || 0;
    return 0;
}


// --- Main Exported Function ---

export function calculateDisplayConstants(data, rawData, percentiles, sortStates) {
    const { kills, deaths, vehicleKills, wins, losses } = sortStates;

    const weaponKillsData = {};
    if (data.weaponStats) for (const weaponName in data.weaponStats) weaponKillsData[weaponName] = data.weaponStats[weaponName].kills;

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
    const weaponDamageReceivedData = {};
    const totalWins = Object.values(data.wins || {}).reduce((sum, val) => sum + val, 0);
    const totalLosses = Object.values(data.losses || {}).reduce((sum, val) => sum + val, 0);
    const totalGames = totalWins + totalLosses;
    const damageRatio = totalDamageReceived > 0 ? (totalDamageDealt / totalDamageReceived).toFixed(2) : 'N/A';
    const totalKills = data.totalKills || 0;
    const totalDeaths = data.totalDeaths || 0;
    const weaponKillsTotal = data.weaponKillsTotal || 0;  // ADD THIS
    const vehicleKillsTotal = data.vehicleKillsTotal || 0; // ADD THIS
    const weaponKillsPerVehicleKill = vehicleKillsTotal > 0 ? (weaponKillsTotal / vehicleKillsTotal).toFixed(2) : 'N/A';
    const damagePerKill = totalKills > 0 ? (totalDamageDealt / totalKills).toFixed(2) : 'N/A';
    const damagePerDeath = totalDeaths > 0 ? (totalDamageReceived / totalDeaths).toFixed(2) : 'N/A';
    const selfDestructPercentage = totalDeaths > 0 ? ((totalSelfDestructs / totalDeaths) * 100).toFixed(2) : '0.00';
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
        for (const weaponName in data.weaponStats) {
    const stat = data.weaponStats[weaponName];
    if (stat.damageReceived > 0) {
        weaponDamageReceivedData[weaponName] = stat.damageReceived;
    }
}
    const weaponDamageDealtData = {};
for (const weaponName in data.weaponStats) {
    const stat = data.weaponStats[weaponName];
    if (stat.damage > 0) {
        weaponDamageDealtData[weaponName] = stat.damage;
    }
}
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

    return {
    weaponKillsData, weaponStarsHTML, vehicleStarsHTML, weaponStatsHTML, vehicleKillsStatsHTML, deathStatsHTML, winsStatsHTML, lossesStatsHTML,
    totalSelfDestructs, totalDamageDealt, totalDamageReceived, totalHeadshots, totalShotsFiredUnzoomed, totalShotsFiredZoomed,
    totalShotsHitUnzoomed, totalShotsHitZoomed, totalShotsFired, totalShotsHit, numberOfJumps, scudsLaunched, totalWins,
    totalLosses, totalGames, damageRatio, totalKills, totalDeaths, damagePerKill, damagePerDeath, selfDestructPercentage,
    selfDestructsPerGame, damagePerGame, damageReceivedPerGame, killsPerGame, deathsPerGame, accUnzoomed, accZoomed, accBoth,
    shotsFiredPerGame, shotsHitPerGame, jumpsPerGame, jumpsPerDamage, headshotsPerGame, headshotsPerKill, missilesPerGame,
    missileLaunchGames, missilesPerMissileLaunchGame, topKillsPercent, topGamesPercent, topXpPercent, performanceScoreDisplay,
    weaponKillsTotal, vehicleKillsTotal, weaponKillsPerVehicleKill,  weaponDamageReceivedData, weaponDamageDealtData
    };
}