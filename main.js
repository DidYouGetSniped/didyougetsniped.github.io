import { setRandomBackground } from '/background.js';
import { fetchFullPlayerData, searchPlayerByName, RATE_LIMIT_CONFIG } from '/api.js';
import { copyToClipboard, extractUID, formatDateTime, getJoinDateFromUID, timeAgo } from '/utils.js';
import { renderPlayerInfo, renderSearchResults, displayMessage, updateMetaTags, resetMetaTags } from '/ui.js';

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

    let countdownInterval = null;
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
    const requestsRemainingEl = document.getElementById('requests-remaining');
    const countdownEl = document.getElementById('countdown');

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
            updateRateLimitDisplay();
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

        RATE_LIMIT.requests = RATE_LIMIT.requests.filter(time => now - time < RATE_LIMIT.timeWindow);
        localStorage.setItem('rateLimitRequests', JSON.stringify(RATE_LIMIT.requests));

        if (RATE_LIMIT.requests.length >= RATE_LIMIT.maxRequests) {
            const seconds = Math.ceil((RATE_LIMIT.resetTime - now) / 1000);
            displayMessage(messageContainer, `Rate limit exceeded. Please wait ${seconds} seconds.`, 'error');
            return;
        }

        loader.style.display = 'block';
        playerInfoContainer.style.display = 'none';
        fetchBtn.disabled = true;

        try {
            RATE_LIMIT.requests.push(now);
            RATE_LIMIT.resetTime = Math.min(...RATE_LIMIT.requests) + RATE_LIMIT.timeWindow;
            localStorage.setItem('rateLimitRequests', JSON.stringify(RATE_LIMIT.requests));
            localStorage.setItem('rateLimitResetTime', RATE_LIMIT.resetTime);
            rateLimitChannel.postMessage({
                type: 'update-rate-limit',
                payload: { requests: RATE_LIMIT.requests, resetTime: RATE_LIMIT.resetTime }
            });
            updateRateLimitDisplay();

            const stateData = uid ? { uid } : { name: searchInput };
            const stateUrl = uid ? `?uid=${uid}` : `?name=${encodeURIComponent(searchInput)}`;
            if (pushState) history.pushState(stateData, '', stateUrl);

            if (uid) {
                const { rawPlayerData: rawData, playerData, killsPercentile, gamesPercentile, xpPercentile } = await fetchFullPlayerData(uid);
                currentPlayerUID = uid;
                currentPlayerdata = playerData;
                rawPlayerData = rawData;
                percentilesData = { killsPercentile, gamesPercentile, xpPercentile };
                updateMetaTags(playerData);
                displayFullPlayerInfo();
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

    const updateRateLimitDisplay = () => {
        const now = Date.now();
        RATE_LIMIT.requests = RATE_LIMIT.requests.filter(time => now - time < RATE_LIMIT.timeWindow);

        if (RATE_LIMIT.requests.length > 0) {
            RATE_LIMIT.resetTime = Math.min(...RATE_LIMIT.requests) + RATE_LIMIT.timeWindow;
            localStorage.setItem('rateLimitResetTime', RATE_LIMIT.resetTime);
        } else {
            if (RATE_LIMIT.resetTime && now >= RATE_LIMIT.resetTime) {
                RATE_LIMIT.requests = [];
                RATE_LIMIT.resetTime = null;
                localStorage.removeItem('rateLimitRequests');
                localStorage.removeItem('rateLimitResetTime');
                rateLimitChannel.postMessage({ type: 'update-rate-limit', payload: { requests: [], resetTime: null } });
            }
        }

        const remaining = RATE_LIMIT.maxRequests - RATE_LIMIT.requests.length;
        requestsRemainingEl.textContent = `Requests: ${remaining}/${RATE_LIMIT.maxRequests}`;

        if (countdownInterval) clearInterval(countdownInterval);

        if (RATE_LIMIT.resetTime) {
            let timeUntilReset = Math.ceil((RATE_LIMIT.resetTime - now) / 1000);
            countdownInterval = setInterval(() => {
                if (timeUntilReset > 0) {
                    countdownEl.textContent = `(Reset in ${timeUntilReset}s)`;
                    timeUntilReset--;
                } else {
                    countdownEl.textContent = '';
                    clearInterval(countdownInterval);
                    RATE_LIMIT.requests = [];
                    RATE_LIMIT.resetTime = null;
                    localStorage.removeItem('rateLimitRequests');
                    localStorage.removeItem('rateLimitResetTime');
                    rateLimitChannel.postMessage({ type: 'update-rate-limit', payload: { requests: [], resetTime: null } });
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

            if (target.closest('.search-result-item')) {
                uidInput.value = target.closest('.search-result-item').dataset.uid;
                fetchPlayerInfo();
            } else if (target.matches('[data-copy]')) {
                const text = target.dataset.copy === 'raw'
                    ? document.getElementById('raw-json-content').textContent
                    : document.getElementById(target.dataset.copy).textContent;
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