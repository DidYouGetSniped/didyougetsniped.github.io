import { setRandomBackground } from '/background.js';
import { fetchFullPlayerData, searchPlayerByName, RATE_LIMIT_CONFIG } from '/api.js';
import { copyToClipboard, extractUID, formatDateTime, getJoinDateFromUID, timeAgo } from '/utils.js';
import { renderPlayerInfo, renderSearchResults, displayMessage, updateMetaTags, resetMetaTags } from '/ui.js';
import { applyRawOverrides, applyProcessedOverrides, applyPercentileOverrides } from '/custom-stats.js';

document.addEventListener('DOMContentLoaded', () => {
    const rateLimitChannel = new BroadcastChannel('war-brokers-rate-limit');

    const storedRequests = localStorage.getItem('rateLimitRequests');
    const storedResetTime = localStorage.getItem('rateLimitResetTime');

    const initialRequests = storedRequests ? JSON.parse(storedRequests) : [];
    const RATE_LIMIT = { ...RATE_LIMIT_CONFIG, requests: initialRequests };

    if (storedResetTime) {
        RATE_LIMIT.resetTime = parseInt(storedResetTime, 10);
    } else {
        RATE_LIMIT.resetTime = null;
    }

    let currentPlayerUID = null;
    let currentPlayerdata = null;
    let rawPlayerData = null;
    let percentilesData = null;

    let sortByKills = true, sortByDeaths = true, sortByVehicleKills = true, sortByWins = true, sortByLosses = true;
    
    let timeAgoInterval = null;

    const themeToggle = document.getElementById('theme-toggle');
    const uidInput = document.getElementById('uid-input');
    const fetchBtn = document.getElementById('fetch-btn');
    const timezoneSelect = document.getElementById('timezone-select');
    const timeFormatSelect = document.getElementById('time-format');
    const loader = document.getElementById('loader');
    const messageContainer = document.getElementById('message-container');
    const playerInfoContainer = document.getElementById('player-info');

    rateLimitChannel.onmessage = (event) => {
        if (event.data.type === 'update-rate-limit') {
            RATE_LIMIT.requests = event.data.payload.requests;
            RATE_LIMIT.resetTime = event.data.payload.resetTime;
            localStorage.setItem('rateLimitRequests', JSON.stringify(RATE_LIMIT.requests));
            if (RATE_LIMIT.resetTime) {
                localStorage.setItem('rateLimitResetTime', RATE_LIMIT.resetTime);
            } else {
                localStorage.removeItem('rateLimitResetTime');
            }
        }
    };

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

        // Clean up old requests
        RATE_LIMIT.requests = RATE_LIMIT.requests.filter(time => now - time < RATE_LIMIT.timeWindow);
        localStorage.setItem('rateLimitRequests', JSON.stringify(RATE_LIMIT.requests));

        // Check rate limit
        if (RATE_LIMIT.requests.length >= RATE_LIMIT.maxRequests) {
            const oldestRequest = Math.min(...RATE_LIMIT.requests);
            const waitTime = Math.ceil((oldestRequest + RATE_LIMIT.timeWindow - now) / 1000);
            displayMessage(messageContainer, `⚠️ Rate limit exceeded. Please wait ${waitTime} second${waitTime !== 1 ? 's' : ''}.`, 'error');
            return;
        }

        loader.style.display = 'block';
        playerInfoContainer.style.display = 'none';
        fetchBtn.disabled = true;

        try {
            const stateData = uid ? { uid } : { name: searchInput };
            const stateUrl = uid ? `?uid=${uid}` : `?name=${encodeURIComponent(searchInput)}`;
            if (pushState) history.pushState(stateData, '', stateUrl);

            if (uid) {
                const { rawPlayerData: rawData, playerData, killsPercentile, gamesPercentile, xpPercentile, fromCache } = await fetchFullPlayerData(uid);
                
                // Apply custom stat overrides
                const rawDataWithOverrides = applyRawOverrides(uid, rawData);
                const playerDataWithOverrides = applyProcessedOverrides(uid, playerData);
                const percentilesWithOverrides = applyPercentileOverrides(uid, {
                    killsPercentile,
                    gamesPercentile,
                    xpPercentile
                });
                
                // Only count against rate limit if NOT from cache
                if (!fromCache) {
                    RATE_LIMIT.requests.push(now);
                    RATE_LIMIT.resetTime = Math.min(...RATE_LIMIT.requests) + RATE_LIMIT.timeWindow;
                    localStorage.setItem('rateLimitRequests', JSON.stringify(RATE_LIMIT.requests));
                    localStorage.setItem('rateLimitResetTime', RATE_LIMIT.resetTime);
                    rateLimitChannel.postMessage({
                        type: 'update-rate-limit',
                        payload: { requests: RATE_LIMIT.requests, resetTime: RATE_LIMIT.resetTime }
                    });
                } else {
                    console.log('Data loaded from cache - not counted against rate limit');
                }
                
                currentPlayerUID = uid;
                currentPlayerdata = playerDataWithOverrides;
                rawPlayerData = rawDataWithOverrides;
                percentilesData = percentilesWithOverrides;
                updateMetaTags(playerDataWithOverrides);
                displayFullPlayerInfo();
            } else {
                const { results: searchResults, fromCache } = await searchPlayerByName(searchInput);
                
                // Only count against rate limit if NOT from cache
                if (!fromCache) {
                    RATE_LIMIT.requests.push(now);
                    RATE_LIMIT.resetTime = Math.min(...RATE_LIMIT.requests) + RATE_LIMIT.timeWindow;
                    localStorage.setItem('rateLimitRequests', JSON.stringify(RATE_LIMIT.requests));
                    localStorage.setItem('rateLimitResetTime', RATE_LIMIT.resetTime);
                    rateLimitChannel.postMessage({
                        type: 'update-rate-limit',
                        payload: { requests: RATE_LIMIT.requests, resetTime: RATE_LIMIT.resetTime }
                    });
                } else {
                    console.log('Search results loaded from cache - not counted against rate limit');
                }
                
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

    function displayFullPlayerInfo() {
        if (!currentPlayerdata || !rawPlayerData || !percentilesData) return;

        const sortStates = { 
            kills: sortByKills, 
            deaths: sortByDeaths, 
            vehicleKills: sortByVehicleKills, 
            wins: sortByWins, 
            losses: sortByLosses,
        };
        const timePrefs = { timeZone: timezoneSelect.value, timeFormat: timeFormatSelect.value };

        playerInfoContainer.innerHTML = renderPlayerInfo(currentPlayerdata, rawPlayerData, percentilesData, sortStates, timePrefs);
        playerInfoContainer.style.display = 'block';

        if (timeAgoInterval) clearInterval(timeAgoInterval);
        timeAgoInterval = setInterval(updateTimeAgoDisplays, 30000);
    }

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
    }

    function setupEventListeners() {
        fetchBtn.addEventListener('click', () => fetchPlayerInfo());
        uidInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') fetchPlayerInfo(); });
        timezoneSelect.addEventListener('change', updateDisplayedDates);
        timeFormatSelect.addEventListener('change', updateDisplayedDates);

        playerInfoContainer.addEventListener('click', (e) => {
            const target = e.target;

            if (target.closest('.search-result-item')) {
                uidInput.value = target.closest('.search-result-item').dataset.uid;
                fetchPlayerInfo();
            } else if (target.matches('[data-copy]')) {
                const text = document.getElementById(target.dataset.copy).textContent;
                copyToClipboard(text, target);
            } else if (target.id === 'weapon-sort-toggle') { sortByKills = target.checked; displayFullPlayerInfo(); }
            else if (target.id === 'death-sort-toggle') { sortByDeaths = target.checked; displayFullPlayerInfo(); }
            else if (target.id === 'vehicle-sort-toggle') { sortByVehicleKills = target.checked; displayFullPlayerInfo(); }
            else if (target.id === 'wins-sort-toggle') { sortByWins = target.checked; displayFullPlayerInfo(); }
            else if (target.id === 'losses-sort-toggle') { sortByLosses = target.checked; displayFullPlayerInfo(); }
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
        setRandomBackground();
        setupEventListeners();
        timezoneSelect.value = 'local';

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