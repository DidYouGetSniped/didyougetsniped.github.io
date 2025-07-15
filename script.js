document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Caching ---
    const themeToggle = document.getElementById('theme-toggle');
    const uidInput = document.getElementById('uid-input');
    const fetchBtn = document.getElementById('fetch-btn');
    const timezoneSelect = document.getElementById('timezone-select');
    const timeFormatSelect = document.getElementById('time-format');
    const loader = document.getElementById('loader');
    const messageContainer = document.getElementById('message-container');
    const playerInfoContainer = document.getElementById('player-info');
    const requestsRemainingEl = document.getElementById('requests-remaining');
    const countdownEl = document.getElementById('countdown');

    // --- State & Constants ---
    const API_BASE_URL = 'https://wbapi.wbpjs.com/players';
    const RATE_LIMIT = { maxRequests: 10, timeWindow: 60 * 1000, requests: [] };
    let currentPlayerUID = null;
    let currentRawData = null; 
    let sortByKills = true; 
    let sortByDeaths = true;
    let countdownInterval = null;
    let timeAgoInterval = null;

    const WEAPON_NAMES = {
        p09: 'Air Strike', p11: 'BGM', p52: 'Tank Lvl 1', p53: 'APC Lvl 1',
        p54: 'Heli Lvl 1', p55: 'Tank Lvl 2', p56: 'APC Lvl 2', p57: 'Heli Lvl 2',
        p58: 'Tank Lvl 3', p59: 'APC Lvl 3', p60: 'Heli Lvl 3', p61: 'AR Rifle',
        p62: 'AK Rifle', p63: 'Pistol', p64: 'Hunting Rifle', p65: 'RPG',
        p66: 'Shotgun', p67: 'Sniper Rifle', p68: 'SMG', p69: 'Homing',
        p71: 'Grenade', p74: 'Heli Minigun', p75: 'Tank Minigun', p76: 'Knife',
        p78: 'Revolver', p79: 'Minigun', p80: 'Grenade Launcher', p81: 'Smoke Grenade',
        p82: 'Jet 1 Rockets', p83: 'Jet 1 Homing', p84: 'Jet 1 Machine Gun',
        p85: 'Jet 2 Rockets', p86: 'Jet 2 Homing', p87: 'Jet 2 Machine Gun',
        p88: 'Fists', p89: 'VSS', p90: '50 Cal Sniper', p91: 'MG Turret',
        p92: 'Crossbow', p93: 'SCAR', p94: 'Tactical Shotgun', p95: 'VEK',
        p96: 'Desert Eagle', p97: 'Auto Shotgun', p98: 'LMG', p99: 'KBAR',
        p100: 'Mace', p101: 'Rubber Chicken', p102: 'Butterfly Knife', p103: 'Chainsaw',
        p104: 'AKSMG', p105: 'Auto Sniper', p106: 'AR3', p107: 'Sawed-Off Shotgun',
        p108: 'Healing Pistol', p109: 'MP7', p110: 'Implosion Grenade', p111: 'Laser Trip Mine',
        p112: 'Concussion Grenade', p126: 'G3A3', p128: "Marksman's Rifle", p129: 'Mutant',
        v00: 'Humvee', v01: 'APC', v02: 'Tank', v10: 'Heli', v11: 'Jet',
        v12: 'Speedboat', v13: 'Attack Boat', v20: 'Buggy', v21: 'Mustang', v22: 'Police Car',
        v23: 'Van', v30: 'Motorbike', v40: 'Plane', v41: 'A-10 Warthog', v50: 'Hovercraft',
        v60: 'Drone', m00: 'Battle Royale', m07: 'Vehicle Escort', m08: 'Package Scramble',
        m09: 'Team Deathmatch', m10: 'Street Royale', m11: 'Arms Race'
    };

    // --- Theme Switcher ---
    const setTheme = (isDark) => {
        document.body.classList.toggle('dark-mode', isDark);
        themeToggle.checked = isDark;
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    };
    const savedTheme = localStorage.getItem('theme');
    setTheme(savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches);

    // --- Event Listeners ---
    themeToggle.addEventListener('change', (e) => setTheme(e.target.checked));
    fetchBtn.addEventListener('click', fetchPlayerInfo);
    uidInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') fetchPlayerInfo(); });
    timezoneSelect.addEventListener('change', updateDisplayedDates);
    timeFormatSelect.addEventListener('change', updateDisplayedDates);

    playerInfoContainer.addEventListener('click', (e) => {
        const target = e.target;
        if (target.matches('[data-copy]')) {
            const textToCopy = target.dataset.copy === 'raw'
                ? document.getElementById('raw-json-content').textContent
                : document.getElementById(target.dataset.copy).textContent;
            copyToClipboard(textToCopy, target);
        } else if (target.id === 'weapon-sort-toggle') {
            sortByKills = target.checked;
            rerenderWeaponStats();
        } else if (target.id === 'death-sort-toggle') {
            sortByDeaths = target.checked;
            rerenderDeathStats();
        }
    });

    // --- Utility Functions ---
    const displayMessage = (message, type = 'error') => { messageContainer.innerHTML = `<div class="message ${type}">${message}</div>`; };
    const clearMessages = () => { messageContainer.innerHTML = ''; };
    const copyToClipboard = (text, buttonElement) => {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = buttonElement.textContent;
            buttonElement.textContent = 'Copied!';
            buttonElement.classList.add('copied');
            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.classList.remove('copied');
            }, 2000);
        }).catch(err => { console.error('Failed to copy:', err); displayMessage('Failed to copy text.', 'error'); });
    };
    const formatDateTime = (timestamp) => {
        if (!timestamp) return "Unknown";
        const date = new Date(timestamp * 1000);
        const options = {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: timeFormatSelect.value === '12'
        };
        const timezone = timezoneSelect.value;
        if (timezone !== 'local') options.timeZone = timezone;
        return date.toLocaleString(undefined, options);
    };
    const timeAgo = (timestamp) => {
        if (!timestamp) return "";
        const seconds = Math.floor((new Date() - new Date(timestamp * 1000)) / 1000);
        if (seconds < 10) return "(just now)";
        const intervals = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 };
        for (const unit in intervals) {
            const counter = Math.floor(seconds / intervals[unit]);
            if (counter > 0) return `(${counter} ${unit}${counter !== 1 ? 's' : ''} ago)`;
        }
        return `(${Math.floor(seconds)} second${Math.floor(seconds) !== 1 ? 's' : ''} ago)`;
    };
    const getJoinDateFromUID = (uid) => parseInt(uid.substring(0, 8), 16);
    const extractUID = (input) => (input.match(/[a-f0-9]{24}/i) || [null])[0];

    // --- Rate Limiting Logic ---
    const updateRateLimitDisplay = () => {
        const now = Date.now();
        RATE_LIMIT.requests = RATE_LIMIT.requests.filter(time => now - time < RATE_LIMIT.timeWindow);
        const remaining = RATE_LIMIT.maxRequests - RATE_LIMIT.requests.length;
        requestsRemainingEl.textContent = `Requests: ${remaining}/${RATE_LIMIT.maxRequests}`;
        if (countdownInterval) clearInterval(countdownInterval);
        if (RATE_LIMIT.requests.length > 0) {
            const oldestRequest = Math.min(...RATE_LIMIT.requests);
            let timeUntilReset = Math.ceil((RATE_LIMIT.timeWindow - (now - oldestRequest)) / 1000);
            countdownInterval = setInterval(() => {
                if (timeUntilReset > 0) {
                    countdownEl.textContent = `(Reset in ${timeUntilReset}s)`;
                    timeUntilReset--;
                } else {
                    countdownEl.textContent = '';
                    clearInterval(countdownInterval);
                    updateRateLimitDisplay();
                }
            }, 1000);
        } else {
            countdownEl.textContent = '';
        }
    };

    // --- Core Application Logic ---
    async function fetchPlayerInfo() {
        if (timeAgoInterval) clearInterval(timeAgoInterval);
        clearMessages();
        const uid = extractUID(uidInput.value);
        if (!uid) { displayMessage('No valid UID found. UIDs are 24 hex characters.'); return; }
        const now = Date.now();
        RATE_LIMIT.requests = RATE_LIMIT.requests.filter(time => now - time < RATE_LIMIT.timeWindow);
        if (RATE_LIMIT.requests.length >= RATE_LIMIT.maxRequests) {
            const oldestRequest = Math.min(...RATE_LIMIT.requests);
            const seconds = Math.ceil((RATE_LIMIT.timeWindow - (now - oldestRequest)) / 1000);
            displayMessage(`Rate limit exceeded. Please wait ${seconds} seconds.`);
            return;
        }
        loader.style.display = 'block';
        playerInfoContainer.style.display = 'none';
        fetchBtn.disabled = true;

        try {
            RATE_LIMIT.requests.push(Date.now());
            updateRateLimitDisplay();
            const playerRes = await fetch(`${API_BASE_URL}/getPlayer?uid=${uid}`);
            if (!playerRes.ok) throw new Error(`Player data not found or API error (Status: ${playerRes.status})`);
            const playerData = await playerRes.json();
            const [killsPercentileRes, gamesPercentileRes] = await Promise.all([
                fetch(`${API_BASE_URL}/percentile/killsElo?uid=${uid}`),
                fetch(`${API_BASE_URL}/percentile/gamesElo?uid=${uid}`)
            ]);
            const killsPercentile = killsPercentileRes.ok ? await killsPercentileRes.json() : 0;
            const gamesPercentile = gamesPercentileRes.ok ? await gamesPercentileRes.json() : 0;
            if (!killsPercentileRes.ok || !gamesPercentileRes.ok) displayMessage('Could not fetch all percentile data.', 'warning');
            
            currentPlayerUID = uid;
            currentRawData = playerData;
            displayPlayerInfo(playerData, killsPercentile, gamesPercentile);
        } catch (error) {
            displayMessage(`Error: ${error.message}`);
        } finally {
            loader.style.display = 'none';
            fetchBtn.disabled = false;
        }
    }

    // --- HTML Generation Functions ---

    function generateWeaponRowsHTML(killsData) {
        if (!killsData || Object.keys(killsData).length === 0) return '';
        const killsArray = Object.entries(killsData);
        if (sortByKills) killsArray.sort(([, a], [, b]) => b - a);
        else killsArray.sort(([idA], [idB]) => (WEAPON_NAMES[idA] || `z${idA}`).localeCompare(WEAPON_NAMES[idB] || `z${idB}`));
        return killsArray.map(([id, kills]) => `<div class="stat-row"><span class="stat-label">${WEAPON_NAMES[id] || `Unknown (${id})`}</span><span class="stat-value">${kills.toLocaleString()}</span></div>`).join('');
    }

    function generateDeathRowsHTML(deathsData) {
        if (!deathsData || Object.keys(deathsData).length === 0) return '';
        const deathsArray = Object.entries(deathsData);
        if (sortByDeaths) deathsArray.sort(([, a], [, b]) => b - a);
        else deathsArray.sort(([idA], [idB]) => (WEAPON_NAMES[idA] || `z${idA}`).localeCompare(WEAPON_NAMES[idB] || `z${idB}`));
        return deathsArray.map(([id, deaths]) => `<div class="stat-row"><span class="stat-label">${WEAPON_NAMES[id] || `Unknown (${id})`}</span><span class="stat-value">${deaths.toLocaleString()}</span></div>`).join('');
    }
    
    function createWeaponStatsHTML(killsData) {
        if (!killsData || Object.keys(killsData).length === 0) return '<div class="stat-card"><h3>🔫 Kills per Weapon</h3><p>No kill data available.</p></div>';
        const weaponRows = generateWeaponRowsHTML(killsData);
        return `<div class="stat-card">
            <div class="weapon-stats-header"><h3>🔫 Kills per Weapon</h3><div class="sort-toggle"><span>Alphabetical</span><label class="switch"><input type="checkbox" id="weapon-sort-toggle" ${sortByKills ? 'checked' : ''}><span class="slider"></span></label><span>By Count</span></div></div>
            <div class="weapon-stats-grid" id="weapon-stats-grid">${weaponRows}</div>
        </div>`;
    }

    function createDeathStatsHTML(deathsData) {
        if (!deathsData || Object.keys(deathsData).length === 0) return '<div class="stat-card"><h3>💀 Deaths by Cause</h3><p>No death data available.</p></div>';
        const deathRows = generateDeathRowsHTML(deathsData);
        return `<div class="stat-card">
            <div class="weapon-stats-header"><h3>💀 Deaths by Cause</h3><div class="sort-toggle"><span>Alphabetical</span><label class="switch"><input type="checkbox" id="death-sort-toggle" ${sortByDeaths ? 'checked' : ''}><span class="slider"></span></label><span>By Count</span></div></div>
            <div class="weapon-stats-grid" id="death-stats-grid">${deathRows}</div>
        </div>`;
    }

    // --- Re-rendering Functions ---
    function rerenderWeaponStats() {
        const grid = document.getElementById('weapon-stats-grid');
        if (grid && currentRawData) grid.innerHTML = generateWeaponRowsHTML(currentRawData.kills_per_weapon);
    }
    
    function rerenderDeathStats() {
        const grid = document.getElementById('death-stats-grid');
        // CHANGED: Access data.deaths instead of data.deaths_per_weapon
        if (grid && currentRawData) grid.innerHTML = generateDeathRowsHTML(currentRawData.deaths);
    }

    // --- Main Display Function ---
    function displayPlayerInfo(data, killsPercentile, gamesPercentile) {
        const joinTimestamp = getJoinDateFromUID(data.uid);
        const weaponStatsHTML = createWeaponStatsHTML(data.kills_per_weapon);
        // CHANGED: Access data.deaths instead of data.deaths_per_weapon
        const deathStatsHTML = createDeathStatsHTML(data.deaths);

        playerInfoContainer.innerHTML = `
            <div class="player-header">
                <div class="player-name">${data.nick || 'Unknown Player'}</div>
                <div class="player-uid">UID: ${data.uid}</div>
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
                    <div class="stat-row"><span class="stat-label">Join Date:</span><div class="stat-value-container"><div class="date-with-ago"><span class="stat-value" id="join-date">${formatDateTime(joinTimestamp)}</span><span class="time-ago" id="join-date-ago">${timeAgo(joinTimestamp)}</span></div><button class="btn-copy-inline" data-copy="join-date">Copy</button></div></div>
                    <div class="stat-row"><span class="stat-label">Last Played:</span><div class="stat-value-container"><div class="date-with-ago"><span class="stat-value" id="last-played">${formatDateTime(data.time)}</span><span class="time-ago" id="last-played-ago">${timeAgo(data.time)}</span></div><button class="btn-copy-inline" data-copy="last-played">Copy</button></div></div>
                </div>
                <div class="stat-card">
                    <h3>🏆 ELO Ratings</h3>
                    <div class="stat-row"><span class="stat-label">Kills ELO:</span><span class="stat-value highlight">${(data.killsELO || 0).toFixed(2)}</span></div>
                    <div class="stat-row"><span class="stat-label">Kills ELO Percentile:</span><span class="stat-value">${(killsPercentile || 0).toFixed(4)}%</span></div>
                    <div class="stat-row"><span class="stat-label">Games ELO:</span><span class="stat-value highlight">${(data.gamesELO || 0).toFixed(2)}</span></div>
                    <div class="stat-row"><span class="stat-label">Games ELO Percentile:</span><span class="stat-value">${(gamesPercentile || 0).toFixed(4)}%</span></div>
                </div>
            </div>
            
            <div class="dual-stats-grid">
                ${weaponStatsHTML}
                ${deathStatsHTML}
            </div>

            <div class="raw-json">
                <div class="json-header"><h3>📋 Raw JSON Data</h3><button class="btn btn-copy" data-copy="raw">Copy JSON</button></div>
                <pre id="raw-json-content">${JSON.stringify(data, null, 2)}</pre>
            </div>
        `;
        playerInfoContainer.style.display = 'block';
        
        const updateTimeAgoDisplays = () => {
            const joinDateAgoEl = document.getElementById('join-date-ago');
            const lastPlayedAgoEl = document.getElementById('last-played-ago');
            if (joinDateAgoEl) joinDateAgoEl.textContent = timeAgo(joinTimestamp);
            if (lastPlayedAgoEl) lastPlayedAgoEl.textContent = timeAgo(data.time);
        };
        if (timeAgoInterval) clearInterval(timeAgoInterval);
        timeAgoInterval = setInterval(updateTimeAgoDisplays, 30000);
    }

    function updateDisplayedDates() {
        if (!currentPlayerUID || !currentRawData) return;
        const joinDateEl = document.getElementById('join-date');
        const lastPlayedEl = document.getElementById('last-played');
        if (joinDateEl) joinDateEl.textContent = formatDateTime(getJoinDateFromUID(currentPlayerUID));
        if (lastPlayedEl) lastPlayedEl.textContent = formatDateTime(currentRawData.time);
    }

    // --- Initial Setup ---
    timezoneSelect.value = 'local';
    updateRateLimitDisplay();
});
