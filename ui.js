import { formatDateTime, timeAgo, getJoinDateFromUID } from '/utils.js';

// --- HTML Generation --- (These functions are correct and unchanged)
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

// --- Full Component Rendering ---

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

    let specialLogoHTML = '';
    const playerLinks = data.socialLinks;
    if (playerLinks) {
        if (playerLinks.discord) specialLogoHTML += `<a href="${playerLinks.discord}" target="_blank" rel="noopener noreferrer" title="Join Discord Server"><img src="/discord.png" alt="Discord Logo" class="player-name-logo"></a>`;
        if (playerLinks.youtube) specialLogoHTML += `<a href="${playerLinks.youtube}" target="_blank" rel="noopener noreferrer" title="Visit YouTube Channel"><img src="/youtube.png" alt="YouTube Logo" class="player-name-logo"></a>`;
    }

    const isSteamUser = data.steam === true;
    const steamText = isSteamUser ? 'Yes' : 'No';
    const steamHighlightClass = isSteamUser ? 'success' : 'danger';

    // --- NEW: Calculate the "Top %" values ---
    const topKillsPercent = 100 - (percentiles.killsPercentile || 0);
    const topGamesPercent = 100 - (percentiles.gamesPercentile || 0);

    return `
        <div class="player-header">
            <div class="player-name-details">
                <div class="player-name">${data.nick || 'Unknown Player'}${specialLogoHTML}</div>
                <div class="player-uid">UID: ${data.uid}</div>
            </div>
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <h3>📊 Basic Information</h3>
                <div class="stat-row"><span class="stat-label">Level:</span><span class="stat-value highlight">${(data.level || 0).toLocaleString()}</span></div>
                <div class="stat-row"><span class="stat-label">XP:</span><span class="stat-value">${(data.xp || 0).toLocaleString()}</span></div>
                <div class="stat-row"><span class="stat-label">Squad:</span><span class="stat-value">${data.squad || 'None'}</span></div>
                <div class="stat-row">
                    <span class="stat-label">Steam:</span>
                    <span class="${steamHighlightClass}">${steamText}</span>
                </div>
                <div class="stat-row"><span class="stat-label">Coins:</span><span class="stat-value">${(data.coins || 0).toLocaleString()}</span></div>
                <div class="stat-row"><span class="stat-label">Join Date:</span><div class="stat-value-container"><div class="date-with-ago" id="full-join-date-text"><span class="stat-value" id="join-date">${formatDateTime(joinTimestamp, timeZone, timeFormat)}</span> <span class="time-ago" id="join-date-ago">${timeAgo(joinTimestamp)}</span></div><button class="btn-copy-inline" data-copy="full-join-date-text">Copy</button></div></div>
                <div class="stat-row"><span class="stat-label">Last Played:</span><div class="stat-value-container"><div class="date-with-ago" id="full-last-played-text"><span class="stat-value" id="last-played">${formatDateTime(data.time, timeZone, timeFormat)}</span> <span class="time-ago" id="last-played-ago">${timeAgo(data.time)}</span></div><button class="btn-copy-inline" data-copy="full-last-played-text">Copy</button></div></div>
            </div>
            <div class="stat-card">
                <h3>🏆 ELO Ratings</h3>
                <div class="stat-row"><span class="stat-label">Kills ELO:</span><span class="stat-value highlight">${(data.killsELO || 0).toFixed(2)}</span></div>
                <!-- CHANGED: Displaying "Top %" for Kills ELO -->
                <div class="stat-row"><span class="stat-label">Kills ELO Rank:</span><span class="stat-value">Top ${topKillsPercent.toFixed(4)}%</span></div>
                
                <div class="stat-row"><span class="stat-label">Games ELO:</span><span class="stat-value highlight">${(data.gamesELO || 0).toFixed(2)}</span></div>
                <!-- CHANGED: Displaying "Top %" for Games ELO -->
                <div class="stat-row"><span class="stat-label">Games ELO Rank:</span><span class="stat-value">Top ${topGamesPercent.toFixed(4)}%</span></div>

                <h3 style="margin-top: 10px;">💀 Kills and Deaths</h3>
                <div class="stat-row"><span class="stat-label">K/D Ratio:</span><span class="stat-value highlight">${data.kdr || '0.00'}</span></div>
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
        <div class="raw-json">
            <div class="json-header"><h3>📋 Raw JSON Data</h3><button class="btn btn-copy" data-copy="raw">Copy JSON</button></div>
            <pre id="raw-json-content">${JSON.stringify(rawData, null, 2)}</pre>
        </div>
    `;
}

// ... (renderSearchResults and displayMessage are unchanged) ...
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