import { calculateDisplayConstants } from '/uiconst.js';

export const MAX_COMPARE_PLAYERS = 5;

const STORAGE_KEY = 'wbPlayerComparisonBin';
const DEFAULT_OPTIONS = {
    metric: 'bpr',
    category: 'weaponDetails',
    weaponStat: 'kills'
};

const SORT_STATES = {
    kills: true,
    deaths: true,
    vehicleKills: true,
    wins: true,
    losses: true
};

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7'];
const CHART_BORDER = '#0f172a';
const CHART_GRID = 'rgba(148, 163, 184, 0.18)';
const CHART_TEXT = '#f8fafc';

const metricDefinitions = [
    { id: 'bpr', label: 'BPR', category: 'Ratings', format: 'decimal3', get: model => toNumber(model.consts.performanceScoreDisplay) },
    { id: 'killsELO', label: 'Kills ELO', category: 'Ratings', format: 'decimal2', get: model => model.data.killsELO },
    { id: 'killsRank', label: 'Kills ELO Rank', category: 'Ratings', format: 'rankPercent', direction: 'lower', get: model => model.consts.topKillsPercent },
    { id: 'gamesELO', label: 'Games ELO', category: 'Ratings', format: 'decimal2', get: model => model.data.gamesELO },
    { id: 'gamesRank', label: 'Games ELO Rank', category: 'Ratings', format: 'rankPercent', direction: 'lower', get: model => model.consts.topGamesPercent },
    { id: 'xpRank', label: 'XP Rank', category: 'Ratings', format: 'rankPercent', direction: 'lower', get: model => model.consts.topXpPercent },

    { id: 'level', label: 'Level', category: 'Profile', format: 'number', get: model => model.data.level },
    { id: 'xp', label: 'XP', category: 'Profile', format: 'number', get: model => model.data.xp },
    { id: 'coins', label: 'Coins', category: 'Profile', format: 'number', get: model => model.data.coins },
    { id: 'totalGames', label: 'Total Games', category: 'Profile', format: 'number', get: model => model.consts.totalGames },
    { id: 'totalWins', label: 'Total Wins', category: 'Profile', format: 'number', get: model => model.consts.totalWins },
    { id: 'totalLosses', label: 'Total Losses', category: 'Profile', format: 'number', direction: 'lower', get: model => model.consts.totalLosses },
    { id: 'winRate', label: 'Win Rate', category: 'Profile', format: 'percent', get: model => percentage(model.consts.totalWins, model.consts.totalGames) },

    { id: 'kdr', label: 'K/D Ratio', category: 'Combat', format: 'decimal3', get: model => model.data.kdr },
    { id: 'totalKills', label: 'Total Kills', category: 'Combat', format: 'number', get: model => model.consts.totalKills },
    { id: 'totalDeaths', label: 'Total Deaths', category: 'Combat', format: 'number', direction: 'lower', get: model => model.consts.totalDeaths },
    { id: 'weaponKillsTotal', label: 'Weapon Kills', category: 'Combat', format: 'number', get: model => model.consts.weaponKillsTotal },
    { id: 'vehicleKillsTotal', label: 'Vehicle Kills', category: 'Combat', format: 'number', get: model => model.consts.vehicleKillsTotal },
    { id: 'killsPerGame', label: 'Kills per Game', category: 'Combat', format: 'decimal2', get: model => model.consts.killsPerGame },
    { id: 'deathsPerGame', label: 'Deaths per Game', category: 'Combat', format: 'decimal2', direction: 'lower', get: model => model.consts.deathsPerGame },
    { id: 'weaponKillsPerVehicleKill', label: 'Weapon Kills per Vehicle Kill', category: 'Combat', format: 'decimal2', get: model => model.consts.weaponKillsPerVehicleKill },

    { id: 'damageDealt', label: 'Damage Dealt', category: 'Damage', format: 'number', get: model => model.consts.totalDamageDealt },
    { id: 'damageReceived', label: 'Damage Received', category: 'Damage', format: 'number', direction: 'lower', get: model => model.consts.totalDamageReceived },
    { id: 'damageRatio', label: 'Damage Dealt per Received', category: 'Damage', format: 'decimal2', get: model => model.consts.damageRatio },
    { id: 'damagePerKill', label: 'Damage Dealt per Kill', category: 'Damage', format: 'decimal2', get: model => model.consts.damagePerKill },
    { id: 'damagePerDeath', label: 'Damage Received per Death', category: 'Damage', format: 'decimal2', direction: 'lower', get: model => model.consts.damagePerDeath },
    { id: 'damagePerGame', label: 'Damage Dealt per Game', category: 'Damage', format: 'number', get: model => model.consts.damagePerGame },
    { id: 'damageReceivedPerGame', label: 'Damage Received per Game', category: 'Damage', format: 'number', direction: 'lower', get: model => model.consts.damageReceivedPerGame },
    { id: 'damagePerJump', label: 'Damage Dealt per Jump', category: 'Damage', format: 'decimal2', get: model => model.consts.damagePerJump },

    { id: 'headshots', label: 'Headshots', category: 'Accuracy', format: 'number', get: model => model.consts.totalHeadshots },
    { id: 'headshotsPerGame', label: 'Headshots per Game', category: 'Accuracy', format: 'decimal2', get: model => model.consts.headshotsPerGame },
    { id: 'headshotsPerKill', label: 'Headshots per Kill', category: 'Accuracy', format: 'decimal2', get: model => model.consts.headshotsPerKill },
    { id: 'shotsFired', label: 'Shots Fired', category: 'Accuracy', format: 'number', get: model => model.consts.totalShotsFired },
    { id: 'shotsHit', label: 'Shots Hit', category: 'Accuracy', format: 'number', get: model => model.consts.totalShotsHit },
    { id: 'accuracyUnzoomed', label: 'Accuracy Unzoomed', category: 'Accuracy', format: 'percent', get: model => model.consts.accUnzoomed },
    { id: 'accuracyZoomed', label: 'Accuracy Zoomed', category: 'Accuracy', format: 'percent', get: model => model.consts.accZoomed },
    { id: 'accuracyBoth', label: 'Accuracy Both', category: 'Accuracy', format: 'percent', get: model => model.consts.accBoth },
    { id: 'shotsFiredPerGame', label: 'Shots Fired per Game', category: 'Accuracy', format: 'decimal2', get: model => model.consts.shotsFiredPerGame },
    { id: 'shotsHitPerGame', label: 'Shots Hit per Game', category: 'Accuracy', format: 'decimal2', get: model => model.consts.shotsHitPerGame },

    { id: 'jumps', label: 'Jumps', category: 'Extra', format: 'number', get: model => model.consts.numberOfJumps },
    { id: 'jumpsPerGame', label: 'Jumps per Game', category: 'Extra', format: 'decimal2', get: model => model.consts.jumpsPerGame },
    { id: 'missiles', label: 'Missiles Launched', category: 'Extra', format: 'number', get: model => model.consts.scudsLaunched },
    { id: 'missilesPerGame', label: 'Missiles per Game', category: 'Extra', format: 'decimal2', get: model => model.consts.missilesPerGame },
    { id: 'missilesPerMLGame', label: 'Missiles per Missile Launch Game', category: 'Extra', format: 'decimal2', get: model => model.consts.missilesPerMissileLaunchGame },
    { id: 'selfDestructs', label: 'Self Destructs', category: 'Extra', format: 'number', direction: 'lower', get: model => model.consts.totalSelfDestructs },
    { id: 'selfDestructsPerGame', label: 'Self Destructs per Game', category: 'Extra', format: 'decimal2', direction: 'lower', get: model => model.consts.selfDestructsPerGame },
    { id: 'selfDestructPct', label: 'Self Destruct % of Deaths', category: 'Extra', format: 'percent', direction: 'lower', get: model => model.consts.selfDestructPercentage }
];

const weaponStatDefinitions = [
    { id: 'kills', label: 'Kills', format: 'number' },
    { id: 'deaths', label: 'Deaths', format: 'number', direction: 'lower' },
    { id: 'headshots', label: 'Headshots', format: 'number' },
    { id: 'damage', label: 'Damage Dealt', format: 'number' },
    { id: 'damageReceived', label: 'Damage Received', format: 'number', direction: 'lower' },
    { id: 'kdr', label: 'K/D', format: 'decimal3' },
    { id: 'accuracy', label: 'Accuracy', format: 'percent' },
    { id: 'headshotRate', label: 'Headshot Rate', format: 'percent' },
    { id: 'damagePerKill', label: 'Damage per Kill', format: 'number' },
    { id: 'damagePerHit', label: 'Damage per Hit', format: 'decimal2' },
    { id: 'shotsFired', label: 'Shots Fired', format: 'number' },
    { id: 'shotsHit', label: 'Shots Hit', format: 'number' }
];

const categoryDefinitions = {
    weaponDetails: {
        label: 'Weapons',
        itemLabel: 'Weapon',
        getNames: model => Object.keys(model.data.weaponStats || {}),
        getValue: (model, name, options) => {
            const statKey = getWeaponStat(options.weaponStat).id;
            return toNumber(model.data.weaponStats?.[name]?.[statKey]);
        },
        getFormat: options => getWeaponStat(options.weaponStat).format,
        getDirection: options => getWeaponStat(options.weaponStat).direction || 'higher'
    },
    vehicles: {
        label: 'Vehicles',
        itemLabel: 'Vehicle',
        getNames: model => Object.keys(model.data.kills_per_vehicle || {}),
        getValue: (model, name) => toNumber(model.data.kills_per_vehicle?.[name]),
        getFormat: () => 'number'
    },
    deaths: {
        label: 'Deaths',
        itemLabel: 'Cause',
        getNames: model => Object.keys(model.data.deaths || {}),
        getValue: (model, name) => toNumber(model.data.deaths?.[name]),
        getFormat: () => 'number',
        getDirection: () => 'lower'
    },
    wins: {
        label: 'Wins',
        itemLabel: 'Game Mode',
        getNames: model => Object.keys(model.data.wins || {}),
        getValue: (model, name) => toNumber(model.data.wins?.[name]),
        getFormat: () => 'number'
    },
    losses: {
        label: 'Losses',
        itemLabel: 'Game Mode',
        getNames: model => Object.keys(model.data.losses || {}),
        getValue: (model, name) => toNumber(model.data.losses?.[name]),
        getFormat: () => 'number',
        getDirection: () => 'lower'
    }
};

const radarMetricIds = ['bpr', 'kdr', 'winRate', 'killsPerGame', 'deathsPerGame', 'accuracyBoth', 'damageRatio', 'killsRank', 'gamesRank', 'xpRank', 'damageReceivedPerGame'];
const chartRegistry = {};

export function getDefaultComparisonOptions() {
    return { ...DEFAULT_OPTIONS };
}

export function loadComparisonPlayers() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (!Array.isArray(parsed)) return [];

        const seen = new Set();
        const normalized = [];

        for (const entry of parsed) {
            if (!entry?.uid || !entry?.data || !entry?.rawData) continue;
            const uid = String(entry.uid);
            if (seen.has(uid)) continue;
            seen.add(uid);
            normalized.push({
                uid,
                addedAt: Number(entry.addedAt) || Date.now(),
                data: entry.data,
                rawData: entry.rawData,
                percentiles: entry.percentiles || {}
            });
        }

        return normalized.slice(0, MAX_COMPARE_PLAYERS);
    } catch (error) {
        console.warn('Could not load comparison bin:', error);
        return [];
    }
}

export function saveComparisonPlayers(players) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(players.slice(0, MAX_COMPARE_PLAYERS)));
    } catch (error) {
        console.warn('Could not save comparison bin:', error);
    }
}

export function createComparisonEntry(uid, data, rawData, percentiles) {
    return {
        uid,
        addedAt: Date.now(),
        data: { ...data },
        rawData: { ...rawData },
        percentiles: { ...percentiles }
    };
}

export function addComparisonPlayer(players, entry) {
    const normalizedUid = String(entry.uid);
    const existingIndex = players.findIndex(player => String(player.uid) === normalizedUid);

    if (existingIndex >= 0) {
        const updated = [...players];
        updated[existingIndex] = { ...entry, addedAt: players[existingIndex].addedAt || Date.now() };
        return { players: updated, status: 'updated' };
    }

    if (players.length >= MAX_COMPARE_PLAYERS) {
        return { players, status: 'full' };
    }

    return { players: [...players, entry], status: 'added' };
}

export function removeComparisonPlayer(players, uid) {
    return players.filter(player => String(player.uid) !== String(uid));
}

export function clearComparisonPlayers() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.warn('Could not clear comparison bin:', error);
    }
}

export function renderComparisonBin(players) {
    const emptySlots = Math.max(0, MAX_COMPARE_PLAYERS - players.length);
    const slotHTML = [
        ...players.map(renderPlayerSlot),
        ...Array.from({ length: emptySlots }, () => `
            <div class="comparison-slot is-empty">
                <span class="comparison-slot-empty">Empty</span>
            </div>
        `)
    ].join('');

    return `
        <div class="comparison-bin">
            <div class="comparison-bin-head">
                <div>
                    <span class="comparison-kicker">Comparison Bin</span>
                    <h2>Player Comparison</h2>
                </div>
                <div class="comparison-bin-actions">
                    <span class="comparison-count">${players.length}/${MAX_COMPARE_PLAYERS}</span>
                    <button type="button" class="comparison-clear-btn" data-compare-clear ${players.length ? '' : 'disabled'}>Clear</button>
                </div>
            </div>
            <div class="comparison-slots">
                ${slotHTML}
            </div>
        </div>
    `;
}

export function renderComparisonDashboard(players, rawOptions = {}) {
    if (players.length < 2) return '';

    const options = normalizeOptions(rawOptions);
    const models = buildModels(players);
    const metric = getMetric(options.metric);
    const category = getCategory(options.category);
    const weaponStat = getWeaponStat(options.weaponStat);

    return `
        <div class="comparison-dashboard">
            <div class="comparison-dashboard-head">
                <h2>Compare Players</h2>
                <div class="comparison-controls">
                    <label for="compare-metric">Metric</label>
                    <select id="compare-metric" data-compare-option="metric">
                        ${renderMetricOptions(options.metric)}
                    </select>

                    <label for="compare-category">Breakdown</label>
                    <select id="compare-category" data-compare-option="category">
                        ${renderCategoryOptions(options.category)}
                    </select>

                    ${options.category === 'weaponDetails' ? `
                        <label for="compare-weapon-stat">Weapon Stat</label>
                        <select id="compare-weapon-stat" data-compare-option="weaponStat">
                            ${weaponStatDefinitions.map(stat => `
                                <option value="${stat.id}" ${stat.id === options.weaponStat ? 'selected' : ''}>${escapeHTML(stat.label)}</option>
                            `).join('')}
                        </select>
                    ` : ''}
                </div>
            </div>

            <div class="comparison-chart-grid">
                <div class="comparison-card">
                    <h3>${escapeHTML(metric.label)}</h3>
                    <div class="comparison-chart-frame">
                        <canvas id="comparison-metric-chart"></canvas>
                    </div>
                </div>
                <div class="comparison-card">
                    <h3>Core Shape</h3>
                    <div class="comparison-chart-frame">
                        <canvas id="comparison-radar-chart"></canvas>
                    </div>
                </div>
                <div class="comparison-card comparison-wide">
                    <h3>${escapeHTML(category.label)} ${options.category === 'weaponDetails' ? `- ${escapeHTML(weaponStat.label)}` : ''}</h3>
                    <div class="comparison-chart-frame is-wide">
                        <canvas id="comparison-category-chart"></canvas>
                    </div>
                </div>
            </div>

            <div class="comparison-card comparison-wide">
                <h3>Stats</h3>
                ${renderMetricTable(models)}
            </div>

            <div class="comparison-card comparison-wide">
                <h3>${escapeHTML(category.label)} Table</h3>
                ${renderCategoryTable(models, options)}
            </div>
        </div>
    `;
}

export function queueComparisonCharts(players, rawOptions = {}) {
    const options = normalizeOptions(rawOptions);
    const models = buildModels(players);

    if (models.length < 2) {
        destroyAllComparisonCharts();
        return;
    }

    requestAnimationFrame(() => {
        ensureChartJs()
            .then(() => {
                drawMetricChart(models, options);
                drawRadarChart(models);
                drawCategoryChart(models, options);
            })
            .catch(error => console.warn('Comparison charts could not load:', error));
    });
}

function renderPlayerSlot(player) {
    const model = buildModel(player);
    const name = displayName(model);
    const kdr = formatValue(getMetric('kdr').get(model), 'decimal3');
    const games = formatValue(model.consts.totalGames, 'number');

    return `
        <div class="comparison-slot">
            <div class="comparison-slot-main">
                <span class="comparison-slot-name" title="${escapeHTML(name)}">${escapeHTML(name)}</span>
                <span class="comparison-slot-meta">Lvl ${formatValue(model.data.level, 'number')} | K/D ${kdr} | ${games} games</span>
            </div>
            <div class="comparison-slot-actions">
                <button type="button" data-compare-open="${escapeHTML(model.uid)}">Open</button>
                <button type="button" data-compare-remove="${escapeHTML(model.uid)}" aria-label="Remove ${escapeHTML(name)}">x</button>
            </div>
        </div>
    `;
}

function buildModels(players) {
    return players.map(buildModel);
}

function buildModel(player) {
    const percentiles = player.percentiles || {};
    const data = { ...(player.data || {}) };
    const rawData = { ...(player.rawData || {}) };

    data.weaponStats = data.weaponStats || {};
    data.kills_per_vehicle = data.kills_per_vehicle || {};
    data.deaths = data.deaths || {};
    data.wins = data.wins || {};
    data.losses = data.losses || {};

    const consts = calculateDisplayConstants(data, rawData, percentiles, SORT_STATES);

    return {
        uid: String(player.uid || data.uid || ''),
        addedAt: player.addedAt,
        data,
        rawData,
        percentiles,
        consts
    };
}

function renderMetricOptions(selectedMetric) {
    const grouped = metricDefinitions.reduce((acc, metric) => {
        if (!acc[metric.category]) acc[metric.category] = [];
        acc[metric.category].push(metric);
        return acc;
    }, {});

    return Object.entries(grouped).map(([group, metrics]) => `
        <optgroup label="${escapeHTML(group)}">
            ${metrics.map(metric => `
                <option value="${metric.id}" ${metric.id === selectedMetric ? 'selected' : ''}>${escapeHTML(metric.label)}</option>
            `).join('')}
        </optgroup>
    `).join('');
}

function renderCategoryOptions(selectedCategory) {
    return Object.entries(categoryDefinitions).map(([id, category]) => `
        <option value="${id}" ${id === selectedCategory ? 'selected' : ''}>${escapeHTML(category.label)}</option>
    `).join('');
}

function renderMetricTable(models) {
    const playerHeaders = models.map(model => `<th>${escapeHTML(displayName(model))}</th>`).join('');
    let currentCategory = '';
    const rows = [];

    for (const metric of metricDefinitions) {
        if (metric.category !== currentCategory) {
            currentCategory = metric.category;
            rows.push(`<tr class="comparison-group-row"><th colspan="${models.length + 1}">${escapeHTML(currentCategory)}</th></tr>`);
        }

        const values = models.map(model => toNumber(metric.get(model)));
        const bestValue = getBestValue(values, metric.direction);
        const cells = values.map(value => {
            const isLeader = isBestValue(value, bestValue);
            return `<td class="${isLeader ? 'comparison-leader' : ''}">${formatValue(value, metric.format)}</td>`;
        }).join('');

        rows.push(`
            <tr>
                <th>${escapeHTML(metric.label)}</th>
                ${cells}
            </tr>
        `);
    }

    return `
        <div class="comparison-table-wrap">
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Stat</th>
                        ${playerHeaders}
                    </tr>
                </thead>
                <tbody>
                    ${rows.join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderCategoryTable(models, options) {
    const category = getCategory(options.category);
    const format = category.getFormat(options);
    const direction = getCategoryDirection(category, options);
    const rows = getCategoryRows(models, options);

    if (!rows.length) {
        return '<p class="comparison-empty-text">No data</p>';
    }

    const playerHeaders = models.map(model => `<th>${escapeHTML(displayName(model))}</th>`).join('');
    const body = rows.map(row => {
        const bestValue = getBestValue(row.values, direction);
        const cells = row.values.map(value => {
            const isLeader = isBestValue(value, bestValue);
            return `<td class="${isLeader ? 'comparison-leader' : ''}">${formatValue(value, format)}</td>`;
        }).join('');

        return `
            <tr>
                <th>${escapeHTML(row.name)}</th>
                ${cells}
                <td>${formatValue(row.total, format)}</td>
            </tr>
        `;
    }).join('');

    return `
        <div class="comparison-table-wrap">
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>${escapeHTML(category.itemLabel)}</th>
                        ${playerHeaders}
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${body}
                </tbody>
            </table>
        </div>
    `;
}

function getCategoryRows(models, options) {
    const category = getCategory(options.category);
    const names = new Set();

    for (const model of models) {
        category.getNames(model).forEach(name => names.add(name));
    }

    return Array.from(names).map(name => {
        const values = models.map(model => category.getValue(model, name, options));
        const total = values.reduce((sum, value) => sum + (value || 0), 0);
        return { name, values, total };
    }).filter(row => row.total > 0)
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

function drawMetricChart(models, options) {
    const canvas = document.getElementById('comparison-metric-chart');
    if (!canvas) return;

    const metric = getMetric(options.metric);
    const labels = models.map(displayName);
    const values = models.map(model => toNumber(metric.get(model)) || 0);

    destroyComparisonChart('metric');
    chartRegistry.metric = new window.Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: metric.label,
                data: values,
                backgroundColor: CHART_COLORS.slice(0, labels.length),
                borderColor: CHART_BORDER,
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: baseChartOptions({
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: context => `${metric.label}: ${formatValue(context.raw, metric.format)}`
                    }
                }
            },
            scales: comparisonScales()
        })
    });
}

function drawRadarChart(models) {
    const canvas = document.getElementById('comparison-radar-chart');
    if (!canvas) return;

    const metrics = radarMetricIds.map(getMetric);
    const rawValuesByMetric = metrics.map(metric => models.map(model => toNumber(metric.get(model))));
    const scoreValuesByMetric = rawValuesByMetric.map((values, metricIndex) => normalizeForRadar(values, metrics[metricIndex].direction));

    destroyComparisonChart('radar');
    chartRegistry.radar = new window.Chart(canvas.getContext('2d'), {
        type: 'radar',
        data: {
            labels: metrics.map(metric => metric.label),
            datasets: models.map((model, index) => {
                const color = CHART_COLORS[index % CHART_COLORS.length];
                return {
                    label: displayName(model),
                    data: metrics.map((metric, metricIndex) => scoreValuesByMetric[metricIndex][index]),
                    borderColor: color,
                    backgroundColor: withAlpha(color, 0.18),
                    pointBackgroundColor: color,
                    pointBorderColor: '#ffffff',
                    borderWidth: 2
                };
            })
        },
        options: baseChartOptions({
            plugins: {
                legend: {
                    labels: { color: CHART_TEXT }
                },
                tooltip: {
                    callbacks: {
                        label: context => {
                            const metric = metrics[context.dataIndex];
                            const model = models[context.datasetIndex];
                            const rawValue = toNumber(metric.get(model));
                            return `${context.dataset.label}: ${context.raw}% score (${formatValue(rawValue, metric.format)})`;
                        }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: CHART_TEXT,
                        backdropColor: 'transparent'
                    },
                    pointLabels: { color: CHART_TEXT },
                    grid: { color: CHART_GRID },
                    angleLines: { color: CHART_GRID }
                }
            }
        })
    });
}

function drawCategoryChart(models, options) {
    const canvas = document.getElementById('comparison-category-chart');
    if (!canvas) return;

    const category = getCategory(options.category);
    const format = category.getFormat(options);
    const rows = getCategoryRows(models, options);
    const frame = canvas.closest('.comparison-chart-frame');
    if (frame) {
        frame.style.height = `${Math.max(420, Math.min(1800, rows.length * 34 + 120))}px`;
    }

    destroyComparisonChart('category');
    chartRegistry.category = new window.Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: rows.map(row => row.name),
            datasets: models.map((model, index) => {
                const color = CHART_COLORS[index % CHART_COLORS.length];
                return {
                    label: displayName(model),
                    data: rows.map(row => row.values[index] || 0),
                    backgroundColor: withAlpha(color, 0.75),
                    borderColor: color,
                    borderWidth: 1,
                    borderRadius: 6
                };
            })
        },
        options: baseChartOptions({
            indexAxis: 'y',
            plugins: {
                legend: {
                    labels: { color: CHART_TEXT }
                },
                tooltip: {
                    callbacks: {
                        label: context => `${context.dataset.label}: ${formatValue(context.raw, format)}`
                    }
                }
            },
            scales: comparisonScales()
        })
    });
}

function baseChartOptions(extra = {}) {
    const pluginOptions = extra.plugins || {};
    const legendOptions = pluginOptions.legend || {};
    const tooltipOptions = pluginOptions.tooltip || {};

    return {
        responsive: true,
        maintainAspectRatio: false,
        ...extra,
        plugins: {
            ...pluginOptions,
            legend: {
                ...legendOptions,
                labels: {
                    color: CHART_TEXT,
                    ...(legendOptions.labels || {})
                }
            },
            tooltip: {
                bodyColor: CHART_TEXT,
                titleColor: CHART_TEXT,
                ...tooltipOptions
            }
        }
    };
}

function comparisonScales() {
    return {
        x: {
            beginAtZero: true,
            ticks: { color: CHART_TEXT },
            grid: { color: CHART_GRID }
        },
        y: {
            ticks: { color: CHART_TEXT },
            grid: { color: CHART_GRID }
        }
    };
}

function destroyComparisonChart(key) {
    if (chartRegistry[key]) {
        chartRegistry[key].destroy();
        delete chartRegistry[key];
    }
}

function destroyAllComparisonCharts() {
    Object.keys(chartRegistry).forEach(destroyComparisonChart);
}

function ensureChartJs() {
    if (window.Chart) return Promise.resolve(window.Chart);
    if (window.__wbChartLoading) return window.__wbChartLoading;

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
    script.async = true;

    window.__wbChartLoading = new Promise((resolve, reject) => {
        script.onload = () => resolve(window.Chart);
        script.onerror = () => reject(new Error('Chart.js failed to load'));
    });

    document.head.appendChild(script);
    return window.__wbChartLoading;
}

function normalizeOptions(rawOptions) {
    const options = { ...DEFAULT_OPTIONS, ...(rawOptions || {}) };

    if (!metricDefinitions.some(metric => metric.id === options.metric)) options.metric = DEFAULT_OPTIONS.metric;
    if (!categoryDefinitions[options.category]) options.category = DEFAULT_OPTIONS.category;
    if (!weaponStatDefinitions.some(stat => stat.id === options.weaponStat)) options.weaponStat = DEFAULT_OPTIONS.weaponStat;

    return options;
}

function getMetric(id) {
    return metricDefinitions.find(metric => metric.id === id) || metricDefinitions[0];
}

function getCategory(id) {
    return categoryDefinitions[id] || categoryDefinitions[DEFAULT_OPTIONS.category];
}

function getWeaponStat(id) {
    return weaponStatDefinitions.find(stat => stat.id === id) || weaponStatDefinitions[0];
}

function getCategoryDirection(category, options) {
    if (typeof category.getDirection === 'function') {
        return category.getDirection(options);
    }

    return 'higher';
}

function displayName(model) {
    return model.data.nick || model.uid || 'Unknown';
}

function percentage(part, whole) {
    const numPart = toNumber(part);
    const numWhole = toNumber(whole);
    if (!numWhole) return null;
    return (numPart / numWhole) * 100;
}

function toNumber(value) {
    if (value === null || value === undefined || value === 'N/A') return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string') {
        const cleaned = value.replace(/,/g, '').replace(/%/g, '').replace(/^Top\s+/i, '').trim();
        if (!cleaned || cleaned === 'N/A') return null;
        const number = Number(cleaned);
        return Number.isFinite(number) ? number : null;
    }
    return null;
}

function getBestValue(values, direction = 'higher') {
    const numbers = values.filter(value => value !== null && Number.isFinite(value));
    if (!numbers.length) return null;

    return direction === 'lower' ? Math.min(...numbers) : Math.max(...numbers);
}

function isBestValue(value, bestValue) {
    return bestValue !== null && value !== null && Number.isFinite(value) && value === bestValue;
}

function normalizeForRadar(values, direction = 'higher') {
    const cleanValues = values.map(value => value !== null && Number.isFinite(value) ? value : null);
    const numbers = cleanValues.filter(value => value !== null);

    if (!numbers.length) return cleanValues.map(() => 0);

    const best = direction === 'lower' ? Math.min(...numbers) : Math.max(...numbers);

    return cleanValues.map(value => {
        if (value === null) return 0;

        if (direction === 'lower') {
            if (value === best) return 100;
            if (best <= 0) return 0;
            return Math.max(0, Math.min(100, Math.round((best / value) * 100)));
        }

        if (best <= 0) return 0;
        const normalized = (value / best) * 100;
        return Math.max(0, Math.min(100, Math.round(normalized)));
    });
}

function formatValue(value, format = 'number') {
    const number = toNumber(value);
    if (number === null) return '-';

    if (format === 'percent') return `${number.toFixed(2)}%`;
    if (format === 'rankPercent') return `Top ${number.toFixed(4)}%`;
    if (format === 'decimal3') return number.toFixed(3);
    if (format === 'decimal2') return number.toFixed(2);
    if (format === 'number') return Math.round(number).toLocaleString();

    return number.toLocaleString();
}

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function withAlpha(hexColor, alpha) {
    const value = hexColor.replace('#', '');
    const r = parseInt(value.substring(0, 2), 16);
    const g = parseInt(value.substring(2, 4), 16);
    const b = parseInt(value.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
