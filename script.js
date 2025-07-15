document.addEventListener('DOMContentLoaded', () => {
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

    const API_BASE_URL = 'https://wbapi.wbpjs.com/players';
    const RATE_LIMIT = { maxRequests: 10, timeWindow: 60 * 1000, requests: [] };
    let currentPlayerUID = null;
    let currentRawData = null;
    let sortByKills = true;
    let sortByDeaths = true;
    let sortByVehicleKills = true;
    let sortByWins = true;
    let sortByLosses = true;
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
        p112: 'Concussion Grenade', p126: 'G3A3', p128: "Marksman's Rifle", p129: 'Mutant'
    };
    const GAMEMODE_NAMES = {
        m00: 'Team Death Match', m01: 'Demolition Derby', m02: 'Protect Leader',
        m03: 'Resource Capture', m04: 'Race', m05: 'Tank Battle', m06: 'Tank King',
        m07: 'Capture Point', m08: 'Vehicle Escort', m09: 'Package Drop',
        m10: 'Missile Launch', m11: 'Battle Royale', m12: 'Competitive',
        m13: 'Lobby (Competitive)', m14: 'Lobby (BR)', m15: 'Count'
    };
    const VEHICLE_KILL_NAMES = {
        v00: 'Tank Lvl 1', v01: 'Tank Lvl 2', v02: 'Tank Lvl 3',
        v10: 'APC Lvl 1', v11: 'APC Lvl 2', v12: 'APC Lvl 3',
        v13: 'Car', v14: 'Unknown Vehicle (v14)', v15: 'Jet 1 Fin Machine Gun',
        v16: 'Unknown Vehicle (v16)', v17: 'Unknown Vehicle (v17)', v18: 'Unknown Vehicle (v18)',
        v19: 'Unknown Vehicle (v19)', v20: 'Heli Lvl 1', v21: 'Heli Lvl 2',
        v22: 'Heli Lvl 3', v23: 'Heli (No Weapon)', v30: 'Player',
        v40: 'Jet 1 Fin', v41: 'Jet 2 Fin', v50: 'Machine Gun Turret',
        v60: 'Unknown Vehicle (v60)', v110: 'Unknown Vehicle (v110)', v111: 'Unknown Vehicle (v111)',
        v112: 'Unknown Vehicle (v112)', v113: 'Unknown Vehicle (v113)'
    };
    const VEHICLE_DEATH_NAMES = {
        v00: 'Humvee', v01: 'APC', v02: 'Tank', v10: 'Heli', v11: 'Jet',
        v12: 'Speedboat', v13: 'Attack Boat', v20: 'Buggy', v21: 'Mustang', v22: 'Police Car',
        v23: 'Van', v30: 'Motorbike', v40: 'Plane', v41: 'A-10 Warthog', v50: 'Hovercraft',
        v60: 'Drone'
    };
    const DEATH_CAUSE_NAMES = { ...WEAPON_NAMES, ...VEHICLE_DEATH_NAMES, ...GAMEMODE_NAMES };

    const SPECIAL_LINKS = {
        '60d08b15d142afee4b1dfabe': { 
            discord: 'https://discord.gg/Wb8eTc5HND',
            youtube: 'https://youtube.com/@DidYouGetSniped'
        },
    };

    const setTheme = (isDark) => {
        document.body.classList.toggle('dark-mode', isDark);
        themeToggle.checked = isDark;
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    };
    const savedTheme = localStorage.getItem('theme');
    setTheme(savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches);

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
        } else if (target.id === 'weapon-sort-toggle') { sortByKills = target.checked; rerenderWeaponStats(); }
          else if (target.id === 'death-sort-toggle') { sortByDeaths = target.checked; rerenderDeathStats(); }
          else if (target.id === 'vehicle-sort-toggle') { sortByVehicleKills = target.checked; rerenderVehicleKillsStats(); }
          else if (target.id === 'wins-sort-toggle') { sortByWins = target.checked; rerenderWinsStats(); }
          else if (target.id === 'losses-sort-toggle') { sortByLosses = target.checked; rerenderLossesStats(); }
    });

    window.addEventListener('popstate', (event) => {
        const urlParams = new URLSearchParams(window.location.search);
        const uidFromHistory = urlParams.get('uid');
        if (uidFromHistory) {
            uidInput.value = uidFromHistory;
            fetchPlayerInfo(false);
        } else {
            playerInfoContainer.innerHTML = '';
            playerInfoContainer.style.display = 'none';
            uidInput.value = '';
            clearMessages();
        }
    });

    const displayMessage = (message, type = 'error') => { messageContainer.innerHTML = `<div class="message ${type}">${message}</div>`; };
    const clearMessages = () => { messageContainer.innerHTML = ''; };
    const copyToClipboard = (text, buttonElement) => { navigator.clipboard.writeText(text).then(() => { const originalText = buttonElement.textContent; buttonElement.textContent = 'Copied!'; buttonElement.classList.add('copied'); setTimeout(() => { buttonElement.textContent = originalText; buttonElement.classList.remove('copied'); }, 2000); }).catch(err => { console.error('Failed to copy:', err); displayMessage('Failed to copy text.', 'error'); }); };
    const formatDateTime = (timestamp) => { if (!timestamp) return "Unknown"; const date = new Date(timestamp * 1000); const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: timeFormatSelect.value === '12' }; const timezone = timezoneSelect.value; if (timezone !== 'local') options.timeZone = timezone; return date.toLocaleString(undefined, options); };
    const timeAgo = (timestamp) => { if (!timestamp) return ""; const seconds = Math.floor((new Date() - new Date(timestamp * 1000)) / 1000); if (seconds < 10) return "(just now)"; const intervals = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 }; for (const unit in intervals) { const counter = Math.floor(seconds / intervals[unit]); if (counter > 0) return `(${counter} ${unit}${counter !== 1 ? 's' : ''} ago)`; } return `(${Math.floor(seconds)} second${Math.floor(seconds) !== 1 ? 's' : ''} ago)`; };
    const getJoinDateFromUID = (uid) => parseInt(uid.substring(0, 8), 16);
    const extractUID = (input) => (input.match(/[a-f0-9]{24}/i) || [null])[0];

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

    async function fetchPlayerInfo(pushState = true) {
        if (timeAgoInterval) clearInterval(timeAgoInterval);
        clearMessages();
        const uid = extractUID(uidInput.value);
        if (!uid) { displayMessage('No valid UID found. UIDs are 24 hex characters.'); return; }

        if (pushState) {
            const currentUrl = new URL(window.location);
            currentUrl.searchParams.set('uid', uid);
            window.history.pushState({uid: uid}, '', currentUrl);
        }

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

    function generateRowsHTML(data, sortByCount, nameMap) { if (!data || Object.keys(data).length === 0) return ''; const dataArray = Object.entries(data); if (sortByCount) dataArray.sort(([, a], [, b]) => b - a); else dataArray.sort(([idA], [idB]) => (nameMap[idA] || `z${idA}`).localeCompare(nameMap[idB] || `z${idB}`)); return dataArray.map(([id, count]) => `<div class="stat-row"><span class="stat-label">${nameMap[id] || `Unknown (${id})`}</span><span class="stat-value">${count.toLocaleString()}</span></div>`).join(''); }
    const generateWeaponRowsHTML = (d) => generateRowsHTML(d, sortByKills, WEAPON_NAMES);
    const generateDeathRowsHTML = (d) => generateRowsHTML(d, sortByDeaths, DEATH_CAUSE_NAMES);
    const generateVehicleKillRowsHTML = (d) => generateRowsHTML(d, sortByVehicleKills, VEHICLE_KILL_NAMES);
    const generateWinRowsHTML = (d) => generateRowsHTML(d, sortByWins, GAMEMODE_NAMES);
    const generateLossRowsHTML = (d) => generateRowsHTML(d, sortByLosses, GAMEMODE_NAMES);
    function createStatsCardHTML(title, data, rowGenerator, sortState, toggleId, gridId) { if (!data || Object.keys(data).length === 0) return `<div class="stat-card"><h3>${title}</h3><p>No data available.</p></div>`; const rows = rowGenerator(data); return `<div class="stat-card"><div class="weapon-stats-header"><h3>${title}</h3><div class="sort-toggle"><span>Alphabetical</span><label class="switch"><input type="checkbox" id="${toggleId}" ${sortState ? 'checked' : ''}><span class="slider"></span></label><span>By Count</span></div></div><div class="stats-data-grid" id="${gridId}">${rows}</div></div>`; }
    const createWeaponStatsHTML = (d) => createStatsCardHTML('🔫 Kills per Weapon', d, generateWeaponRowsHTML, sortByKills, 'weapon-sort-toggle', 'weapon-stats-grid');
    const createVehicleKillsStatsHTML = (d) => createStatsCardHTML('🚗 Kills per Vehicle', d, generateVehicleKillRowsHTML, sortByVehicleKills, 'vehicle-sort-toggle', 'vehicle-kills-grid');
    const createDeathStatsHTML = (d) => createStatsCardHTML('💀 Deaths by Cause', d, generateDeathRowsHTML, sortByDeaths, 'death-sort-toggle', 'death-stats-grid');
    const createWinsStatsHTML = (d) => createStatsCardHTML('🏆 Wins per Game Mode', d, generateWinRowsHTML, sortByWins, 'wins-sort-toggle', 'wins-stats-grid');
    const createLossesStatsHTML = (d) => createStatsCardHTML('👎 Losses per Game Mode', d, generateLossRowsHTML, sortByLosses, 'losses-sort-toggle', 'losses-stats-grid');

    const rerenderWeaponStats = () => { if (currentRawData) document.getElementById('weapon-stats-grid').innerHTML = generateWeaponRowsHTML(currentRawData.kills_per_weapon); };
    const rerenderDeathStats = () => { if (currentRawData) document.getElementById('death-stats-grid').innerHTML = generateDeathRowsHTML(currentRawData.deaths); };
    const rerenderVehicleKillsStats = () => { if (currentRawData) document.getElementById('vehicle-kills-grid').innerHTML = generateVehicleKillRowsHTML(currentRawData.kills_per_vehicle); };
    const rerenderWinsStats = () => { if (currentRawData) document.getElementById('wins-stats-grid').innerHTML = generateWinRowsHTML(currentRawData.wins); };
    const rerenderLossesStats = () => { if (currentRawData) document.getElementById('losses-stats-grid').innerHTML = generateLossRowsHTML(currentRawData.losses); };

    function displayPlayerInfo(data, killsPercentile, gamesPercentile) {
        const joinTimestamp = getJoinDateFromUID(data.uid);
        const weaponStatsHTML = createWeaponStatsHTML(data.kills_per_weapon);
        const deathStatsHTML = createDeathStatsHTML(data.deaths);
        const vehicleKillsStatsHTML = createVehicleKillsStatsHTML(data.kills_per_vehicle);
        const winsStatsHTML = createWinsStatsHTML(data.wins);
        const lossesStatsHTML = createLossesStatsHTML(data.losses);

        let specialLogoHTML = '';
        const playerLinks = SPECIAL_LINKS[data.uid];
        if (playerLinks) {
            // Add YouTube logo first if it exists
            if (playerLinks.youtube) {
                specialLogoHTML += `<a href="${playerLinks.youtube}" target="_blank" rel="noopener noreferrer" title="Visit YouTube Channel"><img src="/youtube.png" alt="YouTube Logo" class="player-name-logo"></a>`;
            }
            // Add Discord logo second if it exists
            if (playerLinks.discord) {
                specialLogoHTML += `<a href="${playerLinks.discord}" target="_blank" rel="noopener noreferrer" title="Join Discord Server"><img src="/discord.png" alt="Discord Logo" class="player-name-logo"></a>`;
            }
        }

        playerInfoContainer.innerHTML = `
            <div class="player-header">
                <div class="player-name-details">
                    <div class="player-name">${data.nick || 'Unknown Player'} ${specialLogoHTML}</div>
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
                ${vehicleKillsStatsHTML}
            </div>
            ${deathStatsHTML}
            <div class="dual-stats-grid" style="margin-top: 1.5rem;">
                ${winsStatsHTML}
                ${lossesStatsHTML}
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

    function initialize() {
        timezoneSelect.value = 'local';
        updateRateLimitDisplay();

        const urlParams = new URLSearchParams(window.location.search);
        const initialUID = urlParams.get('uid');
        if (initialUID) {
            uidInput.value = initialUID;
            fetchPlayerInfo();
        }
    }

    initialize();
});
