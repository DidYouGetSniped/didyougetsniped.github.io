:root {
    /* Light Theme Variables */
    --bg-body: #f4f7fc;
    --bg-container: white;
    --bg-input-section: #f8f9fa;
    --bg-input: white;
    --bg-stat-card: white;
    --bg-message-error: #fee;
    --bg-message-warning: #fff3cd;
    --bg-raw-json: #2c3e50;
    --bg-highlight: linear-gradient(135deg, #ffeaa7, #fdcb6e);
    --header-bg: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
    --btn-bg: linear-gradient(135deg, #3498db, #2980b9);
    --btn-copy-bg: linear-gradient(135deg, #28a745, #20c997);

    --text-primary: #2c3e50;
    --text-secondary: #495057;
    --text-input: #212529;
    --text-highlight: #2d3436;
    --text-message-error: #d63384;
    --text-message-warning: #856404;
    --text-raw-json: #ecf0f1;

    --border-color-light: #e9ecef;
    --border-color-medium: #dee2e6;
    --border-color-focus: #3498db;
    --box-shadow: 0 10px 30px rgba(0,0,0,0.07);
}

body.dark-mode {
    /* Dark Theme Variables */
    --bg-body: #1a1a2e;
    --bg-container: #242933;
    --bg-input-section: #1e2229;
    --bg-input: #3a3f4b;
    --bg-stat-card: #1e2229;
    --bg-message-error: #4c1d2e;
    --bg-message-warning: #5c450c;
    --bg-raw-json: #161a20;
    --bg-highlight: linear-gradient(135deg, #4e54c8, #8f94fb);
    
    --text-primary: #f9fafb;
    --text-secondary: #9ca3af;
    --text-input: #f3f4f6;
    --text-highlight: white;
    --text-message-error: #fecdd3;
    --text-message-warning: #fef08a;
    --text-raw-json: #d1d5db;

    --border-color-light: #2c303a;
    --border-color-medium: #4b5563;
    --box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: var(--bg-body);
    min-height: 100vh;
    padding: 20px;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    background: var(--bg-container);
    border-radius: 15px;
    box-shadow: var(--box-shadow);
    overflow: hidden;
}

.header {
    background: var(--header-bg);
    color: white;
    padding: 30px;
    text-align: center;
    position: relative;
}

.theme-switcher {
    position: absolute; top: 15px; left: 15px;
}
.theme-switcher label {
    display: flex; align-items: center; justify-content: space-between;
    width: 50px; height: 26px; background-color: #4b5563;
    border-radius: 50px; position: relative; cursor: pointer; padding: 5px;
}
.theme-switcher .ball {
    position: absolute; width: 18px; height: 18px;
    background-color: white; border-radius: 50%;
    top: 4px; left: 4px; transition: transform 0.2s ease-in-out;
}
.theme-switcher input[type="checkbox"] { display: none; }
.theme-switcher input:checked + label .ball { transform: translateX(24px); }
.theme-switcher input:checked + label { background-color: #3498db; }
.theme-switcher .icon { width: 14px; height: 14px; }
.theme-switcher .icon path { fill: #f6e05e; }
.theme-switcher input:checked + label .icon:first-of-type path { fill: #f0f0f0; }


.logo {
    max-width: 190px; height: auto; margin-bottom: 10px;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}
.header h1 {
    font-size: 2.2em; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.rate-limit-info {
    position: absolute; top: 15px; right: 15px;
    background: rgba(255,255,255,0.1); padding: 8px 12px;
    border-radius: 20px; font-size: 0.9em; backdrop-filter: blur(10px);
}

.input-section {
    padding: 30px; background: var(--bg-input-section);
    border-bottom: 1px solid var(--border-color-light);
}
.input-group, .time-options {
    display: flex; gap: 15px; align-items: center;
    justify-content: center; flex-wrap: wrap;
}
.input-group { margin-bottom: 20px; }
.input-group label, .time-option label {
    font-weight: 600; color: var(--text-secondary);
}
.input-group input, .input-group select, .time-option select {
    flex: 1; max-width: 400px; padding: 12px 16px;
    border: 2px solid var(--border-color-medium); border-radius: 8px;
    font-size: 1em; background-color: var(--bg-input); color: var(--text-input);
}
body.dark-mode .input-group input::placeholder { color: #9ca3af; }
.input-group input:focus, .input-group select:focus, .time-option select:focus {
    outline: none; border-color: var(--border-color-focus);
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}
.time-option { display: flex; align-items: center; gap: 10px; }
.time-option select { max-width: 200px; }

.btn {
    padding: 12px 24px; background: var(--btn-bg);
    color: white; border: none; border-radius: 8px;
    font-size: 1em; font-weight: 600; cursor: pointer;
    transition: all 0.3s ease; position: relative;
}
.btn:hover {
    transform: translateY(-2px); box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.btn-copy {
    background: var(--btn-copy-bg);
    font-size: 0.9em; padding: 8px 16px; margin-top: 10px;
}
.btn-copy:hover { filter: brightness(1.1); }
.btn-copy.copied { background: linear-gradient(135deg, #6c757d, #5a6268); }

.loading { text-align: center; padding: 40px; color: var(--text-secondary); }
.spinner {
    border: 4px solid #f3f3f3; border-top: 4px solid var(--border-color-focus);
    border-radius: 50%; width: 40px; height: 40px;
    animation: spin 1s linear infinite; margin: 0 auto 20px;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.message {
    padding: 15px 20px; margin: 20px; border-radius: 8px;
    border-left-width: 4px; border-left-style: solid;
}
.message.error {
    background-color: var(--bg-message-error); color: var(--text-message-error);
    border-left-color: #d63384;
}
.message.warning {
    background-color: var(--bg-message-warning); color: var(--text-message-warning);
    border-left-color: #ffc107;
}

.player-info { padding: 30px; }
.player-header {
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white; padding: 25px; border-radius: 10px;
    margin-bottom: 30px; text-align: center;
}
.player-name {
    font-size: 2.2em; font-weight: bold; margin-bottom: 10px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}
.player-uid { font-size: 1.1em; opacity: 0.9; font-family: monospace; }

.stats-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 25px; margin-bottom: 30px;
}
.stat-card {
    background: var(--bg-stat-card); border-radius: 10px; padding: 25px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.05); border: 1px solid var(--border-color-light);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.stat-card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
.stat-card h3 {
    color: var(--text-primary); margin-bottom: 15px; font-size: 1.3em;
    border-bottom: 2px solid var(--border-color-focus); padding-bottom: 8px;
}
.stat-row {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid var(--border-color-light);
}
.stat-row:last-child { border-bottom: none; }
.stat-label { font-weight: 600; color: var(--text-secondary); }
.stat-value { font-weight: bold; color: var(--text-primary); }
.stat-value-container { display: flex; align-items: center; gap: 10px; }
.btn-copy-inline {
    background: #6c757d; color: white; border: none;
    border-radius: 5px; padding: 4px 8px; font-size: 0.8em; cursor: pointer;
    transition: background-color 0.2s ease;
}
.btn-copy-inline:hover { background: #5a6268; }
.btn-copy-inline.copied { background: #28a745; }

.highlight, .danger, .success { padding: 3px 8px; border-radius: 4px; color: white; }
.highlight { background: var(--bg-highlight); color: var(--text-highlight); }
.danger { background: linear-gradient(135deg, #ff7675, #e17055); }
.success { background: linear-gradient(135deg, #00b894, #00cec9); }

.raw-json {
    background: var(--bg-raw-json); color: var(--text-raw-json);
    padding: 20px; border-radius: 10px; margin-top: 30px;
    font-family: 'Courier New', monospace; font-size: 0.9em;
    line-height: 1.4; overflow-x: auto; white-space: pre-wrap;
}
.raw-json h3 {
    color: var(--border-color-focus); margin-bottom: 15px;
    font-family: 'Segoe UI', sans-serif;
}
.json-header {
    display: flex; justify-content: space-between;
    align-items: center; margin-bottom: 15px;
}
.countdown { font-size: 0.8em; color: #95a5a6; margin-left: 10px; }

/* --- NEW --- Weapon Stats List */
.weapon-stats-list {
    max-height: 250px; /* Limits the height of the list */
    overflow-y: auto;   /* Adds a vertical scrollbar only if content overflows */
    padding-right: 10px;/* Adds space between text and scrollbar */
    margin-right: -10px;/* Compensates for padding to maintain alignment */
}

/* Optional: Custom scrollbar for a more polished look in WebKit browsers */
.weapon-stats-list::-webkit-scrollbar {
    width: 8px;
}
.weapon-stats-list::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
}
.weapon-stats-list::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
}
.weapon-stats-list::-webkit-scrollbar-thumb:hover {
    background: #555;
}

@media (max-width: 768px) {
    .header { padding-top: 70px; }
    .input-group { flex-direction: column; }
    .input-group input, .input-group select { max-width: 100%; }
    .stats-grid { grid-template-columns: 1fr; }
    .rate-limit-info { position: static; margin-top: 15px; display: inline-block; }
}

```

---

### Final JavaScript File

This is the complete, final JavaScript that generates the "Weapon Kills" card and uses the new `.weapon-stats-list` class.

```javascript
export enum Weapon {
    AirStrike = "p09",
    BGM = "p11",
    TankLvl1 = "p52",
    APCLvl1 = "p53",
    HeliLvl1 = "p54",
    TankLvl2 = "p55",
    APCLvl2 = "p56",
    HeliLvl2 = "p57",
    TankLvl3 = "p58",
    APCLvl3 = "p59",
    HeliLvl3 = "p60",
    ARRifle = "p61",
    AKRifle = "p62",
    Pistol = "p63",
    HuntingRifle = "p64",
    RPG = "p65",
    Shotgun = "p66",
    SniperRifle = "p67",
    SMG = "p68",
    Homing = "p69",
    Grenade = "p71",
    HeliMinigun = "p74",
    TankMinigun = "p75",
    Knife = "p76",
    Revolver = "p78",
    Minigun = "p79",
    GrenadeLauncher = "p80",
    SmokeGrenade = "p81",
    Jet1Rockets = "p82",
    Jet1Homing = "p83",
    Jet1MachineGun = "p84",
    Jet2Rockets = "p85",
    Jet2Homing = "p86",
    Jet2MachineGun = "p87",
    Fists = "p88",
    VSS = "p89",
    FiftyCalSniper = "p90",
    MGTurret = "p91",
    Crossbow = "p92",
    SCAR = "p93",
    TacticalShotgun = "p94",
    VEK = "p95",
    Desert = "p96",
    Auto = "p97",
    LMG = "p98",
    KBAR = "p99",
    Mace = "p100",
    RubberChicken = "p101",
    Butterfly = "p102",
    Chainsaw = "p103",
    AKSMG = "p104",
    AutoSniper = "p105",
    AR3 = "p106",
    SawedOff = "p107",
    HealingPistol = "p108",
    MP7 = "p109",
    ImplosionGrenade = "p110",
    LaserTripMine = "p111",
    ConcussionGrenade = "p112",
    G3A3 = "p126",
    MarksmansRifle = "p128",
    Mutant = "p129",
}

// Create a reverse map for easy lookup of weapon names from their IDs
const weaponIdToName = Object.fromEntries(Object.entries(Weapon).map(([name, id]) => [id, name]));


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
    let countdownInterval = null;

    // --- Theme Switcher ---
    const setTheme = (isDark) => {
        document.body.classList.toggle('dark-mode', isDark);
        themeToggle.checked = isDark;
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    };

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setTheme(savedTheme === 'dark');
    } else {
        setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    // --- Event Listeners ---
    themeToggle.addEventListener('change', (e) => setTheme(e.target.checked));
    fetchBtn.addEventListener('click', fetchPlayerInfo);
    uidInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') fetchPlayerInfo();
    });
    timezoneSelect.addEventListener('change', updateDisplayedDates);
    timeFormatSelect.addEventListener('change', updateDisplayedDates);

    // Use event delegation for dynamically added copy buttons
    playerInfoContainer.addEventListener('click', (e) => {
        const target = e.target;
        if (target.matches('[data-copy]')) {
            const textToCopy = target.dataset.copy === 'raw'
                ? document.getElementById('raw-json-content').textContent
                : document.getElementById(target.dataset.copy).textContent;
            copyToClipboard(textToCopy, target);
        }
    });
    
    // --- Utility Functions ---
    const displayMessage = (message, type = 'error') => {
        messageContainer.innerHTML = `<div class="message ${type}">${message}</div>`;
    };

    const clearMessages = () => {
        messageContainer.innerHTML = '';
    };

    const copyToClipboard = (text, buttonElement) => {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = buttonElement.textContent;
            buttonElement.textContent = 'Copied!';
            buttonElement.classList.add('copied');
            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
            displayMessage('Failed to copy text.', 'error');
        });
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
        if (timezone !== 'local') {
            options.timeZone = timezone;
        }
        return date.toLocaleString(undefined, options);
    };

    const getJoinDateFromUID = (uid) => parseInt(uid.substring(0, 8), 16);

    const extractUID = (input) => {
        const match = input.match(/[a-f0-9]{24}/i);
        return match ? match[0] : null;
    };

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
        clearMessages();
        const uid = extractUID(uidInput.value);

        if (!uid) {
            displayMessage('No valid UID found. UIDs are 24 hex characters.');
            return;
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
            
            if (!killsPercentileRes.ok || !gamesPercentileRes.ok) {
                displayMessage('Could not fetch all percentile data.', 'warning');
            }
            
            currentPlayerUID = uid;
            displayPlayerInfo(playerData, killsPercentile, gamesPercentile);

        } catch (error) {
            displayMessage(`Error: ${error.message}`);
        } finally {
            loader.style.display = 'none';
            fetchBtn.disabled = false;
        }
    }

    function displayPlayerInfo(data, killsPercentile, gamesPercentile) {
        const joinTimestamp = getJoinDateFromUID(data.uid);

        // --- Generate Weapon Stats HTML ---
        const getWeaponStatsHtml = (killsByWeapon) => {
            // Return nothing if the kills_by_weapon property doesn't exist
            if (!killsByWeapon || typeof killsByWeapon !== 'object') {
                return '';
            }

            const sortedWeapons = Object.entries(killsByWeapon)
                .map(([id, kills]) => ({
                    name: weaponIdToName[id] || id, // Use name from map, or ID as fallback
                    kills: kills
                }))
                .filter(weapon => weapon.kills > 0) // Only include weapons with kills
                .sort((a, b) => b.kills - a.kills); // Sort by kills descending

            // If after filtering, there are no weapons with kills, show a message
            if (sortedWeapons.length === 0) {
                return `
                    <div class="stat-card">
                        <h3>🔫 Weapon Kills</h3>
                        <div class="stat-row">
                            <span class="stat-value">No weapon kills recorded.</span>
                        </div>
                    </div>`;
            }
            
            // Generate an HTML row for each weapon
            const weaponRows = sortedWeapons.map(weapon => `
                <div class="stat-row">
                    <span class="stat-label">${weapon.name}:</span>
                    <span class="stat-value">${weapon.kills.toLocaleString()}</span>
                </div>
            `).join('');

            // Return the full card HTML
            return `
                <div class="stat-card">
                    <h3>🔫 Weapon Kills</h3>
                    <div class="weapon-stats-list">
                        ${weaponRows}
                    </div>
                </div>
            `;
        };

        const weaponStatsCardHtml = getWeaponStatsHtml(data.kills_by_weapon);

        // --- Main Player Info HTML ---
        playerInfoContainer.innerHTML = `
            <div class="player-header">
                <div class="player-name">${data.nick || 'Unknown Player'}</div>
                <div class="player-uid">UID: ${data.uid}</div>
            </div>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>📊 Basic Information</h3>
                    <div class="stat-row">
                        <span class="stat-label">Level:</span>
                        <span class="stat-value highlight">${(data.level || 0).toLocaleString()}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">XP:</span>
                        <span class="stat-value">${(data.xp || 0).toLocaleString()}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Coins:</span>
                        <span class="stat-value">${(data.coins || 0).toLocaleString()}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Squad:</span>
                        <span class="stat-value">${data.squad || 'None'}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Steam:</span>
                        <span class="stat-value ${data.steam ? 'success' : 'danger'}">${data.steam ? 'Yes' : 'No'}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Banned:</span>
                        <span class="stat-value ${data.banned ? 'danger' : 'success'}">${data.banned ? 'Yes' : 'No'}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Join Date:</span>
                        <div class="stat-value-container">
                            <span class="stat-value" id="join-date">${formatDateTime(joinTimestamp)}</span>
                            <button class="btn-copy-inline" data-copy="join-date">Copy</button>
                        </div>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Last Played:</span>
                        <div class="stat-value-container">
                            <span class="stat-value" id="last-played">${formatDateTime(data.time)}</span>
                            <button class="btn-copy-inline" data-copy="last-played">Copy</button>
                        </div>
                    </div>
                </div>
                <div class="stat-card">
                    <h3>🏆 ELO Ratings</h3>
                    <div class="stat-row">
                        <span class="stat-label">Kills ELO:</span>
                        <span class="stat-value highlight">${(data.killsELO || 0).toFixed(2)}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Kills ELO Percentile:</span>
                        <span class="stat-value">${(killsPercentile || 0).toFixed(8)}%</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Games ELO:</span>
                        <span class="stat-value highlight">${(data.gamesELO || 0).toFixed(2)}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Games ELO Percentile:</span>
                        <span class="stat-value">${(gamesPercentile || 0).toFixed(8)}%</span>
                    </div>
                </div>
                <!-- Weapon Stats Card is inserted here -->
                ${weaponStatsCardHtml}
            </div>
            <div class="raw-json">
                <div class="json-header">
                    <h3>📋 Raw JSON Data</h3>
                    <button class="btn btn-copy" data-copy="raw">Copy JSON</button>
                </div>
                <pre id="raw-json-content">${JSON.stringify(data, null, 2)}</pre>
            </div>
        `;
        playerInfoContainer.style.display = 'block';
    }
    
    function updateDisplayedDates() {
        if (!currentPlayerUID) return;

        const joinDateEl = document.getElementById('join-date');
        const lastPlayedEl = document.getElementById('last-played');
        const rawJson = JSON.parse(document.getElementById('raw-json-content').textContent);
        
        if (joinDateEl) {
            joinDateEl.textContent = formatDateTime(getJoinDateFromUID(currentPlayerUID));
        }
        if (lastPlayedEl) {
            lastPlayedEl.textContent = formatDateTime(rawJson.time);
        }
    }

    // --- Initial Setup ---
    timezoneSelect.value = 'local';
    updateRateLimitDisplay();
});
