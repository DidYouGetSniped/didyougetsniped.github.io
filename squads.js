import { setRandomBackground } from './background.js';
import { squadDB } from './squaddb.js';
import { progressBar } from './progressbar.js';

// Squad wars data will be loaded dynamically
let squadWarsData = {};

document.addEventListener('DOMContentLoaded', () => {
    const rateLimitChannel = new BroadcastChannel('war-brokers-rate-limit');

    const storedRequests = localStorage.getItem('squadRateLimitRequests');
    let requestTimestamps = storedRequests ? JSON.parse(storedRequests) : [];

    rateLimitChannel.onmessage = (event) => {
        if (event.data.type === 'update-rate-limit') {
            const { requests } = event.data.payload;
            requestTimestamps = requests;
            localStorage.setItem('squadRateLimitRequests', JSON.stringify(requestTimestamps));
            updateRateLimiterUI();
        }
    };

    setRandomBackground();

    // Load squad wars data
    async function loadSquadWarsData() {
        try {
            const response = await fetch('./squadwars.json');
            if (response.ok) {
                squadWarsData = await response.json();
            } else {
                console.warn('Could not load squad wars data');
            }
        } catch (error) {
            console.error('Error loading squad wars data:', error);
        }
    }
    loadSquadWarsData();

    const squadInput = document.getElementById('squad-input');
    const fetchBtn = document.getElementById('fetch-btn');
    const tzSelect = document.getElementById('timezone-select');
    const fmtSelect = document.getElementById('time-format');
    const squadDisplaySection = document.getElementById('squad-display-section');
    const squadNameDisplay = document.getElementById('squad-name-display');
    const squadDiscordLink = document.getElementById('squad-discord-link');
    const squadBio = document.getElementById('squad-bio');
    const badge = document.getElementById('status-badge');
    const statsGrid = document.getElementById('stats-grid');
    const tableSec = document.getElementById('table-section');
    const tbody = document.querySelector('#squad-table tbody');
    const headers = document.querySelectorAll('#squad-table th');
    const rateLimitAlert = document.getElementById('rate-limit-alert');
    const alertTimer = document.getElementById('alert-timer');
    const warHistorySection = document.getElementById('war-history-section');
    const warHistoryToggle = document.getElementById('war-history-toggle');
    const warHistoryContent = document.getElementById('war-history-content');

    let data = [],
        sortKey = null,
        sortDir = 'asc';

    const RATE_LIMIT_COUNT = 18; // Updated to 18 to be safe
    const RATE_LIMIT_WINDOW_MS = 60 * 1000;
    const BATCH_SIZE = 3; // Process 3 requests at a time
    const BATCH_DELAY = 500; // 500ms delay between batches

    // Simple cache for player data
    const playerCache = new Map();
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    function getCachedPlayer(uid) {
        const cached = playerCache.get(uid);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > CACHE_TTL) {
            playerCache.delete(uid);
            return null;
        }
        
        return cached.data;
    }

    function setCachedPlayer(uid, data) {
        playerCache.set(uid, {
            data,
            timestamp: Date.now()
        });
    }

    // Cleanup old timestamps periodically
    setInterval(() => {
        const now = Date.now();
        if (requestTimestamps.length > 0) {
            const oldestRequestTime = requestTimestamps[0];
            if (now - oldestRequestTime >= RATE_LIMIT_WINDOW_MS) {
                requestTimestamps = [];
                localStorage.setItem('squadRateLimitRequests', JSON.stringify(requestTimestamps));
            }
        }
    }, 1000);

    const diff = (s) => {
        if (s < 60) return s + 's';
        const m = s / 60 | 0;
        if (m < 60) return m + 'm';
        const h = m / 60 | 0;
        if (h < 24) return h + 'h';
        return (h / 24 | 0) + 'd';
    };

    const fmtDate = (t) => new Intl.DateTimeFormat('en-US', {
        timeZone: tzSelect.value === 'local' ? Intl.DateTimeFormat().resolvedOptions().timeZone : tzSelect.value,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: fmtSelect.value === '12'
    }).format(new Date(t * 1000));

    function fillTable() {
        tbody.innerHTML = '';
        const now = Date.now() / 1000 | 0;
        data.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td><a href="https://didyougetsniped.github.io/wbinfo?uid=${p.uid}" target="_blank">${p.nick}</a></td>
                            <td>${p.uid}</td>
                            <td>${fmtDate(p.time)}</td>
                            <td>${diff(now - p.time)} ago</td>
                            <td>${p.level || 0}</td>
                            <td>${(p.xp || 0).toLocaleString()}</td>
                            <td>${(p.killsELO || 0).toFixed(2)}</td>
                            <td>${(p.gamesELO || 0).toFixed(2)}</td>
                            <td>${(p.coins || 0).toLocaleString()}</td>
                            <td>${p.steam ? 'Yes' : 'No'}</td>`;
            tbody.appendChild(tr);
        });
    }

    function updateStats() {
        const now = Date.now() / 1000 | 0,
            th = 60 * 60 * 24 * 60;
        let inactive = 0,
            steam = 0,
            xp = 0,
            lvl = 0,
            kE = 0,
            gE = 0,
            coins = 0;
        data.forEach(p => {
            if (now - p.time > th) inactive++;
            if (p.steam) steam++;
            xp += p.xp || 0;
            lvl += p.level || 0;
            kE += p.killsELO || 0;
            gE += p.gamesELO || 0;
            coins += p.coins || 0;
        });
        const total = data.length,
            inPct = total > 0 ? inactive / total : 0;
        badge.textContent = `Status: ${inPct >= .80 ? 'Inactive' : 'Active'} (${Math.round(inPct * 100)}% inactive)`;
        badge.className = 'status-badge ' + (inPct >= .80 ? 'inactive' : 'active');
        badge.style.display = 'block';

        const avgLevel = total > 0 ? (lvl / total).toFixed(1) : 0;
        const avgKillsELO = total > 0 ? (kE / total).toFixed(2) : 0;
        const avgGamesELO = total > 0 ? (gE / total).toFixed(2) : 0;
        const steamPct = total > 0 ? (steam / total * 100).toFixed(1) : 0;
        const avgCoins = total > 0 ? (coins / total).toLocaleString(undefined, {
            maximumFractionDigits: 0
        }) : '0';

        statsGrid.innerHTML = `
            <div class="stat-card"><div class="stat-row"><span class="stat-label">Average Level</span><span class="stat-value">${avgLevel}</span></div></div>
            <div class="stat-card"><div class="stat-row"><span class="stat-label">Avg. Kills ELO</span><span class="stat-value">${avgKillsELO}</span></div></div>
            <div class="stat-card"><div class="stat-row"><span class="stat-label">Avg. Games ELO</span><span class="stat-value">${avgGamesELO}</span></div></div>
            <div class="stat-card"><div class="stat-row"><span class="stat-label">Players with Steam</span><span class="stat-value">${steamPct}%</span></div></div>
            <div class="stat-card"><div class="stat-row"><span class="stat-label">Total Level</span><span class="stat-value">${lvl.toLocaleString()}</span></div></div>
            <div class="stat-card"><div class="stat-row"><span class="stat-label">Total XP</span><span class="stat-value">${xp.toLocaleString()}</span></div></div>
            <div class="stat-card"><div class="stat-row"><span class="stat-label">Total Coins</span><span class="stat-value">${coins.toLocaleString()}</span></div></div>
            <div class="stat-card"><div class="stat-row"><span class="stat-label">Average Coins</span><span class="stat-value">${avgCoins}</span></div></div>
        `;
        statsGrid.style.display = 'grid';
    }

    function sortData(k, d) {
        data.sort((a, b) => {
            let A = a[k],
                B = b[k];
            if (k === 'steam') {
                A = A ? 'Yes' : 'No';
                B = B ? 'Yes' : 'No';
            }
            if (typeof A === 'string') {
                return d === 'asc' ? A.localeCompare(B) : B.localeCompare(A);
            }
            A = A || 0;
            B = B || 0;
            return d === 'asc' ? A - B : B - A;
        });
    }

    headers.forEach(h => {
        h.addEventListener('click', () => {
            const k = h.dataset.k;
            if (!k) return;
            sortDir = (sortKey === k && sortDir === 'asc') ? 'desc' : 'asc';
            sortKey = k;
            headers.forEach(x => x.classList.remove('sort-asc', 'sort-desc'));
            h.classList.add('sort-' + sortDir);
            sortData(k, sortDir);
            fillTable();
        });
    });

    // War history toggle handler
    warHistoryToggle.addEventListener('click', () => {
        const isExpanded = warHistoryContent.classList.contains('expanded');
        if (isExpanded) {
            warHistoryContent.classList.remove('expanded');
            warHistoryToggle.classList.remove('expanded');
        } else {
            warHistoryContent.classList.add('expanded');
            warHistoryToggle.classList.add('expanded');
        }
    });

    // Function to display war history
    function displayWarHistory(squadName) {
        const wars = squadWarsData[squadName];
        
        if (!wars || wars.length === 0) {
            warHistorySection.style.display = 'none';
            return;
        }

        // Sort wars by date (oldest first)
        const sortedWars = [...wars].sort((a, b) => {
            // If neither has a date, maintain original order
            if (!a.date && !b.date) return 0;
            // Wars without dates go to the end
            if (!a.date) return 1;
            if (!b.date) return -1;
            
            // Parse dates - format is like "9th May 2020" or "20th Feb 2022"
            const parseDate = (dateStr) => {
                const months = {
                    'jan': 0, 'january': 0,
                    'feb': 1, 'february': 1,
                    'mar': 2, 'march': 2,
                    'apr': 3, 'april': 3,
                    'may': 4,
                    'jun': 5, 'june': 5,
                    'jul': 6, 'july': 6,
                    'aug': 7, 'august': 7,
                    'sep': 8, 'september': 8,
                    'oct': 9, 'october': 9,
                    'nov': 10, 'november': 10,
                    'dec': 11, 'december': 11
                };
                
                // Match pattern like "9th May 2020"
                const match = dateStr.match(/(\d+)(?:st|nd|rd|th)?\s+(\w+)\s+(\d{4})/i);
                if (!match) return new Date(0); // Invalid date goes to start
                
                const day = parseInt(match[1]);
                const month = months[match[2].toLowerCase()];
                const year = parseInt(match[3]);
                
                return new Date(year, month, day);
            };
            
            const dateA = parseDate(a.date);
            const dateB = parseDate(b.date);
            
            return dateA - dateB; // Ascending order (oldest first)
        });

        // Calculate statistics
        let wins = 0;
        let losses = 0;
        
        sortedWars.forEach(war => {
            const result = war.result.toLowerCase();
            if (result === 'win' || (result.includes('-') && parseInt(result.split('-')[0]) > parseInt(result.split('-')[1]))) {
                wins++;
            } else if (result === 'loss' || (result.includes('-') && parseInt(result.split('-')[0]) < parseInt(result.split('-')[1]))) {
                losses++;
            }
        });

        const totalWars = wars.length;
        const winRate = totalWars > 0 ? ((wins / totalWars) * 100).toFixed(1) : 0;

        // Update war record in toggle button
        const warRecordSpan = warHistoryToggle.querySelector('.war-record');
        warRecordSpan.textContent = `(${wins}W - ${losses}L)`;

        // Create stats HTML
        const statsHTML = `
            <div class="war-stat-card">
                <div class="war-stat-label">Total Wars</div>
                <div class="war-stat-value">${totalWars}</div>
            </div>
            <div class="war-stat-card">
                <div class="war-stat-label">Wins</div>
                <div class="war-stat-value wins">${wins}</div>
            </div>
            <div class="war-stat-card">
                <div class="war-stat-label">Losses</div>
                <div class="war-stat-value losses">${losses}</div>
            </div>
            <div class="war-stat-card">
                <div class="war-stat-label">Win Rate</div>
                <div class="war-stat-value">${winRate}%</div>
            </div>
        `;

        // Create wars list HTML
        const warsListHTML = sortedWars.map(war => {
            const result = war.result.toLowerCase();
            let isWin = false;
            let resultClass = '';
            let displayResult = war.result;

            if (result === 'win' || (result.includes('-') && parseInt(result.split('-')[0]) > parseInt(result.split('-')[1]))) {
                isWin = true;
                resultClass = 'win';
            } else if (result === 'loss' || (result.includes('-') && parseInt(result.split('-')[0]) < parseInt(result.split('-')[1]))) {
                isWin = false;
                resultClass = 'loss';
            }

            return `
                <div class="war-item ${resultClass}">
                    <div class="war-opponent">vs ${war.opponent}</div>
                    <div class="war-details">
                        ${war.date ? `<div class="war-date">${war.date}</div>` : ''}
                        <div class="war-result ${resultClass}">${displayResult}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Update the DOM
        const statsContainer = warHistoryContent.querySelector('.war-history-stats');
        const listContainer = warHistoryContent.querySelector('.war-history-list');
        
        statsContainer.innerHTML = statsHTML;
        listContainer.innerHTML = warsListHTML;
        
        warHistorySection.style.display = 'block';
    }

    async function fetchPlayersBatched(members) {
        const results = [];
        
        for (let i = 0; i < members.length; i += BATCH_SIZE) {
            const batch = members.slice(i, i + BATCH_SIZE);
            
            // Check rate limit before each batch
            if (requestTimestamps.length + batch.length > RATE_LIMIT_COUNT) {
                const now = Date.now();
                const oldestRequestTime = requestTimestamps[0];
                const timePassed = now - oldestRequestTime;
                const timeToWait = RATE_LIMIT_WINDOW_MS - timePassed;
                
                if (timeToWait > 0) {
                    console.log(`Rate limit reached, waiting ${timeToWait}ms`);
                    await new Promise(resolve => setTimeout(resolve, timeToWait + 100));
                    // Clear old timestamps after waiting
                    requestTimestamps = [];
                    localStorage.setItem('squadRateLimitRequests', JSON.stringify(requestTimestamps));
                }
            }
            
            // Fetch batch with caching
            const batchPromises = batch.map(async (member) => {
                // Check cache first
                const cached = getCachedPlayer(member.uid);
                if (cached) {
                    console.log(`Cache hit for ${member.nick}`);
                    return cached;
                }
                
                try {
                    // Track request
                    requestTimestamps.push(Date.now());
                    localStorage.setItem('squadRateLimitRequests', JSON.stringify(requestTimestamps));
                    rateLimitChannel.postMessage({
                        type: 'update-rate-limit',
                        payload: { requests: requestTimestamps }
                    });
                    // UI update removed
                    
                    const playerRes = await fetch(`https://wbapi.wbpjs.com/players/getPlayer?uid=${member.uid}`);
                    if (playerRes.ok) {
                        const playerData = await playerRes.json();
                        setCachedPlayer(member.uid, playerData);
                        return playerData;
                    }
                    return null;
                } catch (err) {
                    console.warn(`Failed to fetch details for UID ${member.uid}`, err);
                    return null;
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // Update progress
            progressBar.update(
                results.length, 
                members.length, 
                members[Math.min(i + BATCH_SIZE - 1, members.length - 1)].nick || `UID: ${members[Math.min(i + BATCH_SIZE - 1, members.length - 1)].uid}`
            );
            
            // Delay between batches (except for the last one)
            if (i + BATCH_SIZE < members.length) {
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
            }
        }
        
        return results;
    }

    async function fetchSquadData(squadName) {
        // Rate limit check happens in background
        
        const squad = squadName.trim();
        if (!squad) {
            rateLimitAlert.style.display = 'none';
            alert('Please enter a squad name.');
            return;
        }

        rateLimitAlert.style.display = 'none';

        // Track the squad members request
        requestTimestamps.push(Date.now());
        localStorage.setItem('squadRateLimitRequests', JSON.stringify(requestTimestamps));

        rateLimitChannel.postMessage({
            type: 'update-rate-limit',
            payload: {
                requests: requestTimestamps,
                remaining: RATE_LIMIT_COUNT - requestTimestamps.length,
                resetTime: requestTimestamps.length > 0 ? requestTimestamps[0] + RATE_LIMIT_WINDOW_MS : null
            }
        });

        const url = new URL(window.location);
        url.searchParams.set('squad', squad);
        history.pushState({}, '', url);

        fetchBtn.disabled = true;
        fetchBtn.textContent = 'Fetching...';
        squadDisplaySection.style.display = 'none';
        squadDiscordLink.style.display = 'none';
        squadBio.style.display = 'none';
        warHistorySection.style.display = 'none';
        warHistoryContent.classList.remove('expanded');
        warHistoryToggle.classList.remove('expanded');
        badge.style.display = 'none';
        statsGrid.style.display = 'none';
        tableSec.style.display = 'none';
        tbody.innerHTML = '';
        data = [];

        progressBar.show();

        try {
            const res = await fetch(`https://wbapi.wbpjs.com/squad/getSquadMembers?squadName=${encodeURIComponent(squad)}`);
            if (!res.ok) throw new Error(`Squad not found or API error (${res.status})`);

            const members = await res.json();
            if (!members.length) {
                alert('No members found for this squad.');
                progressBar.hide();
                return;
            }

            progressBar.update(0, members.length, 'Starting batch fetch...');

            // Use batched fetching
            const memberDetails = await fetchPlayersBatched(members);
            data = memberDetails.filter(Boolean);

            if (!data.length) {
                alert('Could not fetch details for any squad members.');
                return;
            }

            progressBar.update(members.length, members.length, 'Done!');

            squadNameDisplay.textContent = squad;

            const squadInfo = squadDB[squad];
            if (squadInfo) {
                if (squadInfo.discordLink) {
                    squadDiscordLink.href = squadInfo.discordLink;
                    squadDiscordLink.style.display = 'inline-block';
                }
                let bioContent = "";
                if (squadInfo.sections) {
                    squadInfo.sections.forEach(section => {
                        bioContent += section.title ? `<h2>${section.title}</h2><p>${section.content}</p><hr>` : `<p>${section.content}</p><hr>`;
                    });
                } else if (squadInfo.bio) {
                    bioContent = `<p>${squadInfo.bio}</p>`;
                }
                if (bioContent) {
                    squadBio.innerHTML = bioContent;
                    squadBio.style.display = 'block';
                }
            }

            // Display war history
            displayWarHistory(squad);

            squadDisplaySection.style.display = 'flex';
            sortKey = null;
            headers.forEach(x => x.classList.remove('sort-asc', 'sort-desc'));
            fillTable();
            updateStats();
            tableSec.style.display = 'block';

        } catch (err) {
            console.error(err);
            rateLimitAlert.style.display = 'none';
            alert('Error fetching data. Check the squad name or try again later.');
        } finally {
            setTimeout(() => {
                progressBar.hide();
            }, 500);

            fetchBtn.disabled = false;
            fetchBtn.textContent = 'Fetch Data';
        }
    }

    fetchBtn.addEventListener('click', () => {
        fetchSquadData(squadInput.value);
    });
    squadInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            fetchBtn.click();
        }
    });

    const params = new URLSearchParams(window.location.search);
    const squadFromUrl = params.get('squad');
    if (squadFromUrl) {
        squadInput.value = squadFromUrl;
        fetchSquadData(squadFromUrl);
    }
});