import { formatDateTime, timeAgo, getJoinDateFromUID } from '/utils.js';

/**
 * Calculates a player's performance score based on the updated complex formula.
 *
 * @param {number} total_kills Total number of kills.
 * @param {number} damage_dealt Total damage dealt to enemies.
 * @param {number} total_deaths Total number of deaths.
 * @param {number} damage_received Total damage received from enemies.
 * @param {number} kills_elo_rank The player's Kills rank as a decimal (e.g., 0.005).
 * @param {number} games_elo_rank The player's Games Played rank as a decimal.
 * @param {number} total_games Total number of games played.
 * @param {number} num_self_destructs The total number of deaths by self-destruct.
 * @param {number} xp Total experience points.
 * @returns {number|null} The calculated overall performance score, or null if an error occurs.
 */
function calculatePerformanceScore(
    total_kills,
    damage_dealt,
    total_deaths,
    damage_received,
    kills_elo_rank,
    games_elo_rank, // New parameter
    total_games,
    num_self_destructs,
    xp
) {
    try {
        // --- Safety checks for division by zero ---
        if (total_deaths === 0 || damage_received === 0 || kills_elo_rank === 0 || games_elo_rank === 0 || total_games === 0) {
            console.error("Performance Score Calculation Error: One or more required stats are zero.", {
                total_deaths,
                damage_received,
                kills_elo_rank,
                games_elo_rank,
                total_games
            });
            return null;
        }

        // --- Calculate self_destruct_percentage ---
        const self_destruct_percentage = num_self_destructs / total_deaths;

        // --- Part 1: Core Performance Score (FORMULA UPDATED) ---

        // --- Factor A: Combat Effectiveness ---
        const combat_ratio = (total_kills * damage_dealt) / (total_deaths * damage_received);
        const kills_elo_bonus = Math.pow(1 / kills_elo_rank, 1 / 4) / 6.2;
        const factor_a = Math.sqrt(combat_ratio) + kills_elo_bonus;

        // --- Factor B: Game Impact & Resilience ---
        const avg_damage_impact = damage_dealt / (8250 * total_games); // Constant updated
        const games_elo_bonus = Math.pow(1 / games_elo_rank, 1 / 4) / 13.2; // New component
        const resilience = (damage_received * (1 - self_destruct_percentage)) / (660 * total_deaths); // Constant updated
        const factor_b = avg_damage_impact + games_elo_bonus + resilience; // Updated sum

        // Combine factors
        const core_performance_score = Math.sqrt(factor_a * factor_b);

        // --- Part 2: Experience Bonus ---
        const experience_bonus = Math.pow(xp, 1 / 4) / 62;

        // --- Final Calculation (UPDATED) ---
        const base_score = core_performance_score + experience_bonus;
        const overall_score = base_score * 100; // Scale final score

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
    if (sortByCount) {
        dataArray.sort(([, a], [, b]) => b - a);
    } else {
        dataArray.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
    }
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
    const headerContent = stackedHeader
        ? `<h3>${title}</h3>${toggleHTML}`
        : `<div class="weapon-stats-header"><h3>${title}</h3>${toggleHTML}</div>`;
    return `
        <div class="stat-card">
            ${headerContent}
            <div class="stats-data-grid" id="${gridId}">${rows}</div>
        </div>`;
}


export function renderPlayerInfo(data, rawData, percentiles, sortStates, timePrefs) {
    const { kills, deaths, vehicleKills, wins, losses } = sortStates;
    const { timeZone, timeFormat } = timePrefs;

    const joinTimestamp = getJoinDateFromUID(data.uid);

    const weaponKillsData = {};
    if (data.weaponStats) {
        for (const weaponName in data.weaponStats) {
            weaponKillsData[weaponName] = data.weaponStats[weaponName].kills;
        }
    }

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
    const numberOfJumps = rawData.number_of_jumps || 0;
    const scudsLaunched = rawData.scuds_launched || 0;
    const totalWins = Object.values(data.wins || {}).reduce((sum, val) => sum + val, 0);
    const totalLosses = Object.values(data.losses || {}).reduce((sum, val) => sum + val, 0);
    const totalGames = totalWins + totalLosses;
    const damageRatio = totalDamageReceived > 0 ? (totalDamageDealt / totalDamageReceived).toFixed(2) : 'N/A';
    const damagePerKill = data.totalKills > 0 ? (totalDamageDealt / data.totalKills).toFixed(2) : 'N/A';
    const damagePerDeath = data.totalDeaths > 0 ? (totalDamageReceived / data.totalDeaths).toFixed(2) : 'N/A';
    const selfDestructPercentage = data.totalDeaths > 0 ? ((totalSelfDestructs / data.totalDeaths) * 100).toFixed(2) :'0.00';
    const selfDestructsPerGame = totalGames > 0 ? (totalSelfDestructs / totalGames).toFixed(2) : 'N/A';
    const damagePerGame = totalGames > 0 ? Math.round(totalDamageDealt / totalGames).toLocaleString() : 'N/A';
    const damageReceivedPerGame = totalGames > 0 ? Math.round(totalDamageReceived / totalGames).toLocaleString() : 'N/A';
    const jumpsPerGame = totalGames > 0 ? (numberOfJumps / totalGames).toFixed(2) : 'N/A';
    const headshotsPerGame = totalGames > 0 ? (totalHeadshots / totalGames).toFixed(2) : 'N/A';
    const topKillsPercent = 100 - (percentiles.killsPercentile || 0);
    const killsEloRankDecimal = topKillsPercent / 100.0;
    const topGamesPercent = 100 - (percentiles.gamesPercentile || 0);
    const gamesEloRankDecimal = topGamesPercent / 100.0;
    const topXpPercent = 100 - (percentiles.xpPercentile || 0);

    const performanceScore = calculatePerformanceScore(
        data.totalKills || 0,
        totalDamageDealt,
        data.totalDeaths || 0,
        totalDamageReceived,
        killsEloRankDecimal,
        gamesEloRankDecimal, // Pass new argument
        totalGames,
        totalSelfDestructs,
        data.xp || 0
    );
    const performanceScoreDisplay = performanceScore !== null ? performanceScore.toFixed(3) : 'N/A';
    let kdMilestoneHTML = ''; // Initialize as an empty string
    const totalKillsForCalc = data.totalKills || 0;
    const totalDeathsForCalc = data.totalDeaths || 0;

    if (totalDeathsForCalc > 0) {
        const current_kd = totalKillsForCalc / totalDeathsForCalc;

        // --- Kills to Rank Up ---
        const next_kd_ratio = (Math.trunc(current_kd * 10) / 10) + 0.1;
        const kills_needed = (next_kd_ratio * totalDeathsForCalc) - totalKillsForCalc;
        const kills_to_rank_up = Math.ceil(kills_needed);

        const rankUpText = kills_to_rank_up > 0
            ? `Need ${kills_to_rank_up.toLocaleString()} kills for ${next_kd_ratio.toFixed(3)} K/D`
            : `Next milestone passed`;

        // --- Deaths to Rank Down ---
        const previous_kd_milestone = (Math.ceil(current_kd * 10) - 1) / 10;
        let rankDownText = '';
        if (previous_kd_milestone > 0) {
            const deaths_needed = (totalKillsForCalc / previous_kd_milestone) - totalDeathsForCalc;
            const deaths_to_rank_down = Math.ceil(deaths_needed);
            rankDownText = `Drop to ${previous_kd_milestone.toFixed(3)} in ${deaths_to_rank_down.toLocaleString()} deaths`;
        } else {
            rankDownText = 'K/D cannot drop further'; // Handles cases where K/D is < 0.1
        }
        
        // --- Assemble the HTML snippet with new classes ---
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
  
    const miscStatsHTML = `
        <div class="stat-card">
            <h3>🔧 Miscellaneous Stats</h3>
            <div class="stat-row">
                <span class="stat-label">Self Destructs:</span>
                <span class="stat-value">${totalSelfDestructs.toLocaleString()}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Self Destructs per Game:</span>
                <span class="stat-value">${selfDestructsPerGame}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Self Destruct % of Deaths:</span>
                <span class="stat-value">${selfDestructPercentage}%</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Damage Dealt:</span>
                <span class="stat-value">${Math.round(totalDamageDealt).toLocaleString()}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Damage Received:</span>
                <span class="stat-value">${Math.round(totalDamageReceived).toLocaleString()}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Damage Dealt per Damage Received:</span>
                <span class="stat-value">${damageRatio}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Damage Dealt per Kill:</span>
                <span class="stat-value">${damagePerKill}</span>
            </div>
             <div class="stat-row">
                <span class="stat-label">Damage Received per Death:</span>
                <span class="stat-value">${damagePerDeath}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Damage Dealt per Game:</span>
                <span class="stat-value">${damagePerGame}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Damage Received per Game:</span>
                <span class="stat-value">${damageReceivedPerGame}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Total Headshots:</span>
                <span class="stat-value">${totalHeadshots.toLocaleString()}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Headshots per Game:</span>
                <span class="stat-value">${headshotsPerGame}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Shots Fired (Unzoomed):</span>
                <span class="stat-value">${totalShotsFiredUnzoomed.toLocaleString()}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Shots Fired (Zoomed):</span>
                <span class="stat-value">${totalShotsFiredZoomed.toLocaleString()}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Shots Hit (Unzoomed):</span>
                <span class="stat-value">${totalShotsHitUnzoomed.toLocaleString()}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Shots Hit (Zoomed):</span>
                <span class="stat-value">${totalShotsHitZoomed.toLocaleString()}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Number of Jumps:</span>
                <span class="stat-value">${numberOfJumps.toLocaleString()}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Jumps per Game:</span>
                <span class="stat-value">${jumpsPerGame}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Missiles Launched:</span>
                <span class="stat-value">${scudsLaunched.toLocaleString()}</span>
            </div>
        </div>
    `;

    let specialLogoHTML = '';
    const playerLinks = data.socialLinks;
    if (playerLinks) {
        if (playerLinks.discord) specialLogoHTML += `<a href="${playerLinks.discord}" target="_blank" rel="noopener noreferrer" title="Discord"><img src="/discord.png" alt="Discord Logo" class="player-name-logo"></a>`;
        if (playerLinks.youtube) specialLogoHTML += `<a href="${playerLinks.youtube}" target="_blank" rel="noopener noreferrer" title="Visit YouTube Channel"><img src="/youtube.png" alt="YouTube Logo" class="player-name-logo"></a>`;
    }

    let biographyHTML = '';
    if (data.biography) {
        biographyHTML = `<div class="player-bio">${data.biography}</div>`;
    }

    const isSteamUser = data.steam === true;
    const steamText = isSteamUser ? 'Yes' : 'No';
    const steamHighlightClass = isSteamUser ? 'success' : 'danger';

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
                <div class="stat-row"><span class="stat-label">XP:</span><span class="stat-value">${(data.xp || 0).toLocaleString()}</span></div>
                <div class="stat-row"><span class="stat-label">XP Rank:</span><span class="stat-value">Top ${topXpPercent.toFixed(4)}%</span></div>
                <div class="stat-row"><span class="stat-label">Squad:</span>${data.squad ? `<a class="stat-value" href="https://didyougetsniped.github.io/squads?squad=${data.squad}" target="_blank" rel="noopener noreferrer">${data.squad}</a>` : `<span class="stat-value">None</span>`}</div>
                <div class="stat-row"><span class="stat-label">Steam:</span><span class="${steamHighlightClass}">${steamText}</span></div>
                <div class="stat-row"><span class="stat-label">Total Games Played:</span><span class="stat-value">${totalGames.toLocaleString()}</span></div>
                <div class="stat-row"><span class="stat-label">Coins:</span><span class="stat-value">${(data.coins || 0).toLocaleString()}</span></div>
                <div class="stat-row"><span class="stat-label">Join Date:</span><div class="stat-value-container"><div class="date-with-ago" id="full-join-date-text"><span class="stat-value" id="join-date">${formatDateTime(joinTimestamp, timeZone, timeFormat)}</span> <span class="time-ago" id="join-date-ago">${timeAgo(joinTimestamp)}</span></div><button class="btn-copy-inline" data-copy="full-join-date-text">Copy</button></div></div>
                <div class="stat-row"><span class="stat-label">Last Played:</span><div class="stat-value-container"><div class="date-with-ago" id="full-last-played-text"><span class="stat-value" id="last-played">${formatDateTime(data.time, timeZone, timeFormat)}</span> <span class="time-ago" id="last-played-ago">${timeAgo(data.time)}</span></div><button class="btn-copy-inline" data-copy="full-last-played-text">Copy</button></div></div>
            </div>
            <div class="stat-card">
                <h3>⭐ Broker Performance Rating (BPR) <a href="https://didyougetsniped.github.io/bpr" target="_blank" rel="noopener noreferrer" style="font-size: 0.8em; margin-left: 5px; color: #0d6efd;">(explanation)</a></h3>
                <div class="stat-row" style="margin-bottom: 20px;">
                    <div>
                        <span class="stat-label">Score:</span>
                    </div>
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
                <div class="stat-row"><span class="stat-label">Total Kills:</span><span class="stat-value">${(data.totalKills || 0).toLocaleString()}</span></div>
                <div class="stat-row"><span class="stat-label">Total Deaths:</span><span class="stat-value">${(data.totalDeaths || 0).toLocaleString()}</span></div>
            </div>
        </div>

        ${weaponStatsHTML}
        ${vehicleKillsStatsHTML}
        
        ${deathStatsHTML}
        
        <div class="dual-stats-grid">
            ${winsStatsHTML}
            ${lossesStatsHTML}
        </div>

        ${miscStatsHTML}

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
    if (ogTitleTag) {
        ogTitleTag.setAttribute('content', `${playerData.nick}'s War Brokers Stats`);
    }

    const ogDescriptionTag = document.querySelector('meta[property="og:description"]');
    if (ogDescriptionTag) {
        const description = `Level: ${playerData.level} | Squad: ${playerData.squad || 'None'} | K/D: ${playerData.kdr} | Kills ELO: ${(playerData.killsELO || 0).toFixed(2)} | Games ELO: ${(playerData.gamesELO || 0).toFixed(2)}`;
        ogDescriptionTag.setAttribute('content', description);
    }
}

export function resetMetaTags() {
    document.title = 'War Brokers Player Stats';

    const ogTitleTag = document.querySelector('meta[property="og:title"]');
    if (ogTitleTag) {
        ogTitleTag.setAttribute('content', 'War Brokers Player Stats');
    }

    const ogDescriptionTag = document.querySelector('meta[property="og:description"]');
    if (ogDescriptionTag) {
        ogDescriptionTag.setAttribute('content', 'Check out your player statistics by name or UID!');
    }

}