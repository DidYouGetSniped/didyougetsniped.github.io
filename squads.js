import { setRandomBackground } from './background.js';
import { squadDB } from './squaddb.js';
import { progressBar } from './progressbar.js';

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

    let data = [],
        sortKey = null,
        sortDir = 'asc';

    const RATE_LIMIT_COUNT = 5;
    const RATE_LIMIT_WINDOW_MS = 60 * 1000;

    const requestCountEl = document.getElementById('request-count');
    const resetInfoEl = document.getElementById('reset-info');
    const resetTimerEl = document.getElementById('reset-timer');

    function updateRateLimiterUI() {
        const now = Date.now();

        // Check if the reset window has passed since the *first* request was made
        if (requestTimestamps.length > 0) {
            const oldestRequestTime = requestTimestamps[0];
            if (now - oldestRequestTime >= RATE_LIMIT_WINDOW_MS) {
                // Timer is up. Reset all requests from the window at once.
                requestTimestamps = [];
                localStorage.setItem('squadRateLimitRequests', JSON.stringify(requestTimestamps));
            }
        }

        // Now, update the UI based on the current state of requestTimestamps
        const usedCount = requestTimestamps.length;
        const remainingCount = RATE_LIMIT_COUNT - usedCount;
        requestCountEl.textContent = remainingCount;

        if (usedCount > 0) {
            // Display the countdown timer based on the oldest request
            const oldestRequestTime = requestTimestamps[0];
            const timePassed = now - oldestRequestTime;
            const timeLeft = Math.ceil((RATE_LIMIT_WINDOW_MS - timePassed) / 1000);

            resetTimerEl.textContent = Math.max(0, timeLeft); // Ensure timer doesn't show a negative number
            resetInfoEl.style.display = 'inline';
        } else {
            // No requests are in the queue, so hide the timer info
            resetInfoEl.style.display = 'none';
        }
    }


    setInterval(updateRateLimiterUI, 1000);
    updateRateLimiterUI();

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
        badge.textContent = `Status: ${inPct >= .85 ? 'Inactive' : 'Active'} (${Math.round(inPct * 100)}% inactive)`;
        badge.className = 'status-badge ' + (inPct >= .85 ? 'inactive' : 'active');
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

    tzSelect.onchange = fmtSelect.onchange = () => {
        if (data.length) fillTable();
    };

    async function fetchSquadData(squadName) {
        updateRateLimiterUI();
        if (requestTimestamps.length >= RATE_LIMIT_COUNT) {
            const now = Date.now();
            const oldestRequestTime = requestTimestamps[0];
            const timePassed = now - oldestRequestTime;
            const timeLeft = Math.ceil((RATE_LIMIT_WINDOW_MS - timePassed) / 1000);

            alertTimer.textContent = timeLeft;
            rateLimitAlert.style.display = 'block';

            setTimeout(() => {
                rateLimitAlert.style.display = 'none';
            }, timeLeft * 1000 + 500);
            return;
        }

        const squad = squadName.trim();
        if (!squad) {
            rateLimitAlert.style.display = 'none';
            alert('Please enter a squad name.');
            return;
        }

        rateLimitAlert.style.display = 'none';

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

        updateRateLimiterUI();
        const url = new URL(window.location);
        url.searchParams.set('squad', squad);
        history.pushState({}, '', url);

        fetchBtn.disabled = true;
        fetchBtn.textContent = 'Fetching...';
        squadDisplaySection.style.display = 'none';
        squadDiscordLink.style.display = 'none';
        squadBio.style.display = 'none';
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

            let completedFetches = 0;
            const totalMembers = members.length;

            const promises = members.map(async (member) => {
                try {
                    const playerRes = await fetch(`https://wbapi.wbpjs.com/players/getPlayer?uid=${member.uid}`);
                    if (playerRes.ok) {
                        return await playerRes.json();
                    }
                    return null;
                } catch (err) {
                    console.warn(`Failed to fetch details for UID ${member.uid}`, err);
                    return null;
                } finally {
                    completedFetches++;
                    const userLabel = member.nick || `UID: ${member.uid}`;
                    progressBar.update(completedFetches, totalMembers, userLabel);
                }
            });

            const memberDetails = await Promise.all(promises);

            data = memberDetails.filter(Boolean);

            if (!data.length) {
                alert('Could not fetch details for any squad members.');
                return;
            }

            progressBar.update(totalMembers, totalMembers, 'Done!');

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
