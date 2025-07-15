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
                        <span class="stat-value">${(killsPercentile || 0).toFixed(4)}%</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Games ELO:</span>
                        <span class="stat-value highlight">${(data.gamesELO || 0).toFixed(2)}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Games ELO Percentile:</span>
                        <span class="stat-value">${(gamesPercentile || 0).toFixed(4)}%</span>
                    </div>
                </div>
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
