import { setRandomBackground } from '/background.js';
import { fetchFullPlayerData, searchPlayerByName, RATE_LIMIT_CONFIG } from '/api.js';
import { copyToClipboard, extractUID, formatDateTime, getJoinDateFromUID, timeAgo } from '/utils.js';
import { renderPlayerInfo, renderSearchResults, generateRowsHTML, displayMessage, updateMetaTags, resetMetaTags } from '/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // START: BroadcastChannel and Rate Limit Synchronization Logic
    const rateLimitChannel = new BroadcastChannel('war-brokers-rate-limit');

    // Listen for messages from other tabs
    rateLimitChannel.onmessage = (event) => {
        if (event.data.type === 'update-rate-limit') {
            const { requests } = event.data.payload;

            // Overwrite the local rate limit state with the shared state
            RATE_LIMIT.requests = requests;

            // Manually trigger a UI update to reflect the new state
            updateRateLimitDisplay();
        }
    };
    // END: BroadcastChannel and Rate Limit Synchronization Logic

    setRandomBackground();

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

    const RATE_LIMIT = { ...RATE_LIMIT_CONFIG, requests: [] };
    let currentPlayerUID = null;
    let currentPlayerdata = null; 
    let sortByKills = true;
    let sortByDeaths = true;
    let sortByVehicleKills = true;
    let sortByWins = true;
    let sortByLosses = true;
    let countdownInterval = null;
    let timeAgoInterval = null;

    if (themeToggle) {
        const isCurrentlyDark = document.documentElement.classList.contains('dark');
        themeToggle.checked = isCurrentlyDark;
        themeToggle.addEventListener('change', () => {
            document.documentElement.classList.toggle('dark', themeToggle.checked);
            localStorage.setItem('theme', themeToggle.checked ? 'dark' : 'light');
        });
    }

    async function fetchPlayerInfo(pushState = true) {
        if (timeAgoInterval) clearInterval(timeAgoInterval);
        playerInfoContainer.innerHTML = '';
        messageContainer.innerHTML = '';

        resetMetaTags();
        
        const searchInput = uidInput.value.trim();
        if (!searchInput) {
            displayMessage(messageContainer, 'Please enter a player name or UID.', 'info');
            return;
        }

        const uid = extractUID(searchInput);
        
        const now = Date.now();
        RATE_LIMIT.requests = RATE_LIMIT.requests.filter(time => now - time < RATE_LIMIT.timeWindow);
        if (RATE_LIMIT.requests.length >= RATE_LIMIT.maxRequests) {
            const oldestRequest = Math.min(...RATE_LIMIT.requests);
            const seconds = Math.ceil((RATE_LIMIT.timeWindow - (now - oldestRequest)) / 1000);
            displayMessage(messageContainer, `Rate limit exceeded. Please wait ${seconds} seconds.`, 'error');
            return;
        }

        loader.style.display = 'block';
        playerInfoContainer.style.display = 'none';
        fetchBtn.disabled = true;

        try {
            // Add request timestamp
            RATE_LIMIT.requests.push(Date.now());
            
            // Post a message to other tabs when the rate limit changes
            rateLimitChannel.postMessage({
                type: 'update-rate-limit',
                payload: {
                    requests: RATE_LIMIT.requests,
                    remaining: RATE_LIMIT.maxRequests - RATE_LIMIT.requests.length,
                    resetTime: RATE_LIMIT.requests.length > 0 ? Math.min(...RATE_LIMIT.requests) + RATE_LIMIT.timeWindow : null
                }
            });
            updateRateLimitDisplay();

            const stateData = uid ? { uid } : { name: searchInput };
            const stateUrl = uid ? `?uid=${uid}` : `?name=${encodeURIComponent(searchInput)}`;
            if (pushState) history.pushState(stateData, '', stateUrl);

            if (uid) {
                const { rawPlayerData, playerData, killsPercentile, gamesPercentile, xpPercentile } = await fetchFullPlayerData(uid);
                currentPlayerUID = uid;
                currentPlayerdata = playerData;
                updateMetaTags(playerData);
                displayFullPlayerInfo(playerData, rawPlayerData, { killsPercentile, gamesPercentile, xpPercentile });
            } else {
                const searchResults = await searchPlayerByName(searchInput);
                if (searchResults.length === 0) {
                    displayMessage(messageContainer, `No players found with the name "${searchInput}".`, 'info');
                } else if (searchResults.length === 1) {
                    uidInput.value = searchResults[0].uid;
                    await fetchPlayerInfo(true);
                    return;
                } else {
                    playerInfoContainer.innerHTML = renderSearchResults(searchResults);
                    playerInfoContainer.style.display = 'block';
                }
            }
        } catch (error) {
            displayMessage(messageContainer, `Error: ${error.message}`, 'error');
        } finally {
            loader.style.display = 'none';
            fetchBtn.disabled = false;
        }
    }
    
    function displayFullPlayerInfo(processedData, rawData, percentiles) {
        const sortStates = { kills: sortByKills, deaths: sortByDeaths, vehicleKills: sortByVehicleKills, wins: sortByWins, losses: sortByLosses };
        const timePrefs = { timeZone: timezoneSelect.value, timeFormat: timeFormatSelect.value };
        
        playerInfoContainer.innerHTML = renderPlayerInfo(processedData, rawData, percentiles, sortStates, timePrefs);
        playerInfoContainer.style.display = 'block';

        if (timeAgoInterval) clearInterval(timeAgoInterval);
        timeAgoInterval = setInterval(updateTimeAgoDisplays, 30000);
    }

    const rerenderWeaponStats = () => {
        if (!currentPlayerdata || !currentPlayerdata.weaponStats) return;
        const weaponKills = {};
        for (const weaponName in currentPlayerdata.weaponStats) {
            weaponKills[weaponName] = currentPlayerdata.weaponStats[weaponName].kills;
        }
        document.getElementById('weapon-stats-grid').innerHTML = generateRowsHTML(weaponKills, sortByKills);
    };

    const rerenderDeathStats = () => document.getElementById('death-stats-grid').innerHTML = generateRowsHTML(currentPlayerdata.deaths, sortByDeaths);
    const rerenderVehicleKillsStats = () => document.getElementById('vehicle-kills-grid').innerHTML = generateRowsHTML(currentPlayerdata.kills_per_vehicle, sortByVehicleKills);
    const rerenderWinsStats = () => document.getElementById('wins-stats-grid').innerHTML = generateRowsHTML(currentPlayerdata.wins, sortByWins);
    const rerenderLossesStats = () => document.getElementById('losses-stats-grid').innerHTML = generateRowsHTML(currentPlayerdata.losses, sortByLosses);
    
    function updateDisplayedDates() {
        if (!currentPlayerUID || !currentPlayerdata) return;
        const timeZone = timezoneSelect.value;
        const timeFormat = timeFormatSelect.value;
        document.getElementById('join-date').textContent = formatDateTime(getJoinDateFromUID(currentPlayerUID), timeZone, timeFormat);
        document.getElementById('last-played').textContent = formatDateTime(currentPlayerdata.time, timeZone, timeFormat);
    }

    function updateTimeAgoDisplays() {
        if (!currentPlayerdata) return;
        const joinDateAgoEl = document.getElementById('join-date-ago');
        const lastPlayedAgoEl = document.getElementById('last-played-ago');
        if (joinDateAgoEl) joinDateAgoEl.textContent = timeAgo(getJoinDateFromUID(currentPlayerdata.uid));
        if (lastPlayedAgoEl) lastPlayedAgoEl.textContent = timeAgo(currentPlayerdata.time);
    };
    
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

    function setupEventListeners() {
        fetchBtn.addEventListener('click', () => fetchPlayerInfo());
        uidInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') fetchPlayerInfo(); });
        timezoneSelect.addEventListener('change', updateDisplayedDates);
        timeFormatSelect.addEventListener('change', updateDisplayedDates);

        playerInfoContainer.addEventListener('click', (e) => {
            const target = e.target;
            const targetId = target.id;

            if (target.closest('.search-result-item')) {
                uidInput.value = target.closest('.search-result-item').dataset.uid;
                fetchPlayerInfo();
            } else if (target.matches('[data-copy]')) {
                const text = target.dataset.copy === 'raw' ? document.getElementById('raw-json-content').textContent : document.getElementById(target.dataset.copy).textContent;
                copyToClipboard(text, target);
            } else if (targetId === 'weapon-sort-toggle') { sortByKills = target.checked; rerenderWeaponStats(); }
            else if (targetId === 'death-sort-toggle') { sortByDeaths = target.checked; rerenderDeathStats(); }
            else if (targetId === 'vehicle-sort-toggle') { sortByVehicleKills = target.checked; rerenderVehicleKillsStats(); }
            else if (targetId === 'wins-sort-toggle') { sortByWins = target.checked; rerenderWinsStats(); }
            else if (targetId === 'losses-sort-toggle') { sortByLosses = target.checked; rerenderLossesStats(); }
        });

        window.addEventListener('popstate', (event) => {
            const { uid, name } = event.state || {};
            if (uid) { uidInput.value = uid; fetchPlayerInfo(false); }
            else if (name) { uidInput.value = name; fetchPlayerInfo(false); }
            else {
                playerInfoContainer.innerHTML = '';
                messageContainer.innerHTML = '';
                uidInput.value = '';
            }
        });
    }

    function initialize() {
        setupEventListeners();
        timezoneSelect.value = 'local';
        updateRateLimitDisplay();

        const urlParams = new URLSearchParams(window.location.search);
        const initialUID = urlParams.get('uid');
        const initialName = urlParams.get('name');
        if (initialUID || initialName) {
            uidInput.value = initialUID || initialName;
            fetchPlayerInfo(false);
        }
    }

    initialize();
});