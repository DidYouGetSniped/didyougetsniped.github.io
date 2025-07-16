function setRandomBackground() {
    const backgroundImages = [
        'backgrounds/image.png',
        'backgrounds/image1.png',
        'backgrounds/image2.png',
        'backgrounds/image3.png',
        'backgrounds/image4.png',
        'backgrounds/image5.png',
        'backgrounds/image6.png',
        'backgrounds/image7.png',
        'backgrounds/image8.png'
    ];

    // 1. Get the last image used from session storage
    const lastImage = sessionStorage.getItem('lastBackgroundImage');

    // 2. Create a list of available images (all images except the last one)
    let availableImages = backgroundImages.filter(img => img !== lastImage);

    // 3. If the filter resulted in an empty list, fall back to the full list.
    if (availableImages.length === 0) {
        availableImages = backgroundImages;
    }

    // 4. Pick a random image from the available list
    const randomIndex = Math.floor(Math.random() * availableImages.length);
    let selectedImage = availableImages[randomIndex];

    // 5. [ROBUSTNESS CHECK] If for any reason our selection is invalid,
    //    default to the first image in the main list to guarantee a background.
    if (!selectedImage) {
        selectedImage = backgroundImages[0];
    }

    // 6. Apply the chosen image as the background of the page
    document.body.style.backgroundImage = `url('${selectedImage}')`;

    // 7. Save the newly selected image to session storage for the next refresh
    sessionStorage.setItem('lastBackgroundImage', selectedImage);
}

import { fetchFullPlayerData, searchPlayerByName } from '/api.js';
import { RATE_LIMIT_CONFIG, WEAPON_NAMES, GAMEMODE_NAMES, VEHICLE_KILL_NAMES, DEATH_CAUSE_NAMES } from '/constants.js';
import { copyToClipboard, extractUID, formatDateTime, getJoinDateFromUID, timeAgo } from '/utils.js';
import { renderPlayerInfo, renderSearchResults, generateRowsHTML, displayMessage } from '/ui.js';

document.addEventListener('DOMContentLoaded', () => {
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
    let currentRawData = null;
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
    }

    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    async function fetchPlayerInfo(pushState = true) {
        if (timeAgoInterval) clearInterval(timeAgoInterval);
        playerInfoContainer.innerHTML = '';
        messageContainer.innerHTML = '';
        
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
            RATE_LIMIT.requests.push(Date.now());
            updateRateLimitDisplay();

            if (uid) {
                if (pushState) history.pushState({ uid }, '', `?uid=${uid}`);
                const { playerData, killsPercentile, gamesPercentile } = await fetchFullPlayerData(uid);
                currentPlayerUID = uid;
                currentRawData = playerData;
                displayFullPlayerInfo(playerData, { killsPercentile, gamesPercentile });
            } else {
                if (pushState) history.pushState({ name: searchInput }, '', `?name=${encodeURIComponent(searchInput)}`);
                const searchResults = await searchPlayerByName(searchInput);
                if (searchResults.length === 0) {
                    displayMessage(messageContainer, `No players found with the name "${searchInput}".`, 'info');
                } else if (searchResults.length === 1) {
                    uidInput.value = searchResults[0].uid;
                    await fetchPlayerInfo(pushState);
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
    
    function displayFullPlayerInfo(data, percentiles) {
        const sortStates = { kills: sortByKills, deaths: sortByDeaths, vehicleKills: sortByVehicleKills, wins: sortByWins, losses: sortByLosses };
        const timePrefs = { timeZone: timezoneSelect.value, timeFormat: timeFormatSelect.value };
        playerInfoContainer.innerHTML = renderPlayerInfo(data, percentiles, sortStates, timePrefs);
        playerInfoContainer.style.display = 'block';

        if (timeAgoInterval) clearInterval(timeAgoInterval);
        timeAgoInterval = setInterval(updateTimeAgoDisplays, 30000);
    }

    const rerenderWeaponStats = () => document.getElementById('weapon-stats-grid').innerHTML = generateRowsHTML(currentRawData.kills_per_weapon, sortByKills, WEAPON_NAMES);
    const rerenderDeathStats = () => document.getElementById('death-stats-grid').innerHTML = generateRowsHTML(currentRawData.deaths, sortByDeaths, DEATH_CAUSE_NAMES);
    const rerenderVehicleKillsStats = () => document.getElementById('vehicle-kills-grid').innerHTML = generateRowsHTML(currentRawData.kills_per_vehicle, sortByVehicleKills, VEHICLE_KILL_NAMES);
    const rerenderWinsStats = () => document.getElementById('wins-stats-grid').innerHTML = generateRowsHTML(currentRawData.wins, sortByWins, GAMEMODE_NAMES);
    const rerenderLossesStats = () => document.getElementById('losses-stats-grid').innerHTML = generateRowsHTML(currentRawData.losses, sortByLosses, GAMEMODE_NAMES);
    
    function updateDisplayedDates() {
        if (!currentPlayerUID || !currentRawData) return;
        const timeZone = timezoneSelect.value;
        const timeFormat = timeFormatSelect.value;
        document.getElementById('join-date').textContent = formatDateTime(getJoinDateFromUID(currentPlayerUID), timeZone, timeFormat);
        document.getElementById('last-played').textContent = formatDateTime(currentRawData.time, timeZone, timeFormat);
    }

    function updateTimeAgoDisplays() {
        if (!currentRawData) return;
        const joinDateAgoEl = document.getElementById('join-date-ago');
        const lastPlayedAgoEl = document.getElementById('last-played-ago');
        if (joinDateAgoEl) joinDateAgoEl.textContent = timeAgo(getJoinDateFromUID(currentRawData.uid));
        if (lastPlayedAgoEl) lastPlayedAgoEl.textContent = timeAgo(currentRawData.time);
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
            if (target.closest('.search-result-item')) {
                uidInput.value = target.closest('.search-result-item').dataset.uid;
                fetchPlayerInfo();
            } else if (target.matches('[data-copy]')) {
                const text = target.dataset.copy === 'raw' ? document.getElementById('raw-json-content').textContent : document.getElementById(target.dataset.copy).textContent;
                copyToClipboard(text, target);
            } else if (target.id === 'weapon-sort-toggle') { sortByKills = target.checked; rerenderWeaponStats(); }
              else if (target.id === 'death-sort-toggle') { sortByDeaths = target.checked; rerenderDeathStats(); }
              else if (target.id === 'vehicle-sort-toggle') { sortByVehicleKills = target.checked; rerenderVehicleKillsStats(); }
              else if (target.id === 'wins-sort-toggle') { sortByWins = target.checked; rerenderWinsStats(); }
              else if (target.id === 'losses-sort-toggle') { sortByLosses = target.checked; rerenderLossesStats(); }
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
            fetchPlayerInfo();
        }
    }

    initialize();
});
