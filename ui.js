// ui.js
import { WEAPON_NAMES, GAMEMODE_NAMES, VEHICLE_KILL_NAMES, DEATH_CAUSE_NAMES, SPECIAL_LINKS } from '/constants.js';
import { formatDateTime, timeAgo, getJoinDateFromUID } from '/utils.js';

// --- HTML Generation ---

export function generateRowsHTML(data, sortByCount, nameMap) {
    if (!data || Object.keys(data).length === 0) return '<p>No data available.</p>';
    
    const dataArray = Object.entries(data);
    
    if (sortByCount) {
        dataArray.sort(([, a], [, b]) => b - a);
    } else {
        dataArray.sort(([idA], [idB]) => (nameMap[idA] || `z${idA}`).localeCompare(nameMap[idB] || `z${idB}`));
    }
    
    return dataArray.map(([id, count]) => 
        `<div class="stat-row">
            <span class="stat-label">${nameMap[id] || `Unknown (${id})`}</span>
            <span class="stat-value">${count.toLocaleString()}</span>
        </div>`
    ).join('');
}

function createStatsCardHTML(title, data, rowGenerator, sortState, toggleId, gridId, stackedHeader = false) {
    if (!data || Object.keys(data).length === 0) {
        return `<div class="stat-card"><h3>${title}</h3><p>No data available.</p></div>`;
    }
    const rows = rowGenerator(data);
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

export function renderPlayerInfo(data, percentiles, sortStates, timePrefs) {
    const { kills, deaths, vehicleKills, wins, losses } = sortStates;
    const { timeZone, timeFormat } = timePrefs;

    const joinTimestamp = getJoinDateFromUID(data.uid);

    const createWeaponStatsHTML = (d) => createStatsCardHTML('🔫 Kills per Weapon', d, (d) => generateRowsHTML(d, kills, WEAPON_NAMES), kills, 'weapon-sort-toggle', 'weapon-stats-grid');
    const createVehicleKillsStatsHTML = (d) => createStatsCardHTML('🚗 Kills per Vehicle', d, (d) => generateRowsHTML(d, vehicleKills, VEHICLE_KILL_NAMES), vehicleKills, 'vehicle-sort-toggle', 'vehicle-kills-grid');
    const createDeathStatsHTML = (d) => createStatsCardHTML('💀 Deaths by Cause', d, (d) => generateRowsHTML(d, deaths, DEATH_CAUSE_NAMES), deaths, 'death-sort-toggle', 'death-stats-grid');
    const createWinsStatsHTML = (d) => createStatsCardHTML('🏆 Wins per Game Mode', d, (d) => generateRowsHTML(d, wins, GAMEMODE_NAMES), wins, 'wins-sort-toggle', 'wins-stats-grid', true);
    const createLossesStatsHTML = (d) => createStatsCardHTML('👎 Losses per Game Mode', d, (d) => generateRowsHTML(d, losses, GAMEMODE_NAMES), losses, 'losses-sort-toggle', 'losses-stats-grid', true);

    let specialLogoHTML = '';
    const playerLinks = SPECIAL_LINKS[data.uid];
    if (playerLinks) {
        if (playerLinks.discord) specialLogoHTML += `<a href="${playerLinks.discord}" target="_blank" rel="noopener noreferrer" title="Join Discord Server"><img src="/discord.png" alt="Discord Logo" class="player-name-logo"></a>`;
        if (playerLinks.youtube) specialLogoHTML += `<a href="${playerLinks.youtube}" target="_blank" rel="noopener noreferrer" title="Visit YouTube Channel"><img src="/youtube.png" alt="YouTube Logo" class="player-name-logo"></a>`;
    }

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
                <div class="stat-row"><span class="stat-label">Coins:</span><span class="stat-value">${(data.coins || 0).toLocaleString()}</span></div>
                <div class="stat-row"><span class="stat-label">Squad:</span><span class="stat-value">${data.squad || 'None'}</span></div>
                <div class="stat-row"><span class="stat-label">Steam:</span><span class="stat-value ${data.steam ? 'success' : 'danger'}">${data.steam ? 'Yes' : 'No'}</span></div>
                <div class="stat-row"><span class="stat-label">Banned:</span><span class="stat-value ${data.banned ? 'danger' : 'success'}">${data.banned ? 'Yes' : 'No'}</span></div>
                <div class="stat-row"><span class="stat-label">Join Date:</span><div class="stat-value-container"><div class="date-with-ago" id="full-join-date-text"><span class="stat-value" id="join-date">${formatDateTime(joinTimestamp, timeZone, timeFormat)}</span> <span class="time-ago" id="join-date-ago">${timeAgo(joinTimestamp)}</span></div><button class="btn-copy-inline" data-copy="full-join-date-text">Copy</button></div></div>
                <div class="stat-row"><span class="stat-label">Last Played:</span><div class="stat-value-container"><div class="date-with-ago" id="full-last-played-text"><span class="stat-value" id="last-played">${formatDateTime(data.time, timeZone, timeFormat)}</span> <span class="time-ago" id="last-played-ago">${timeAgo(data.time)}</span></div><button class="btn-copy-inline" data-copy="full-last-played-text">Copy</button></div></div>
            </div>
            <div class="stat-card">
                <h3>🏆 ELO Ratings</h3>
                <div class="stat-row"><span class="stat-label">Kills ELO:</span><span class="stat-value highlight">${(data.killsELO || 0).toFixed(2)}</span></div>
                <div class="stat-row"><span class="stat-label">Kills ELO Percentile:</span><span class="stat-value">${(percentiles.killsPercentile || 0).toFixed(4)}%</span></div>
                <div class="stat-row"><span class="stat-label">Games ELO:</span><span class="stat-value highlight">${(data.gamesELO || 0).toFixed(2)}</span></div>
                <div class="stat-row"><span class="stat-label">Games ELO Percentile:</span><span class="stat-value">${(percentiles.gamesPercentile || 0).toFixed(4)}%</span></div>
            </div>
        </div>

        ${createWeaponStatsHTML(data.kills_per_weapon)}
        ${createVehicleKillsStatsHTML(data.kills_per_vehicle)}
        
        ${createDeathStatsHTML(data.deaths)}
        
        <div class="dual-stats-grid">
            ${createWinsStatsHTML(data.wins)}
            ${createLossesStatsHTML(data.losses)}
        </div>
        <div class="raw-json">
            <div class="json-header"><h3>📋 Raw JSON Data</h3><button class="btn btn-copy" data-copy="raw">Copy JSON</button></div>
            <pre id="raw-json-content">${JSON.stringify(data, null, 2)}</pre>
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
