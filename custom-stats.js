// custom-stats.js
// This file allows you to override specific stats for individual players

const CUSTOM_PLAYER_STATS = {
    // Add player UIDs and their custom stats here
    // Example: 'player_uid_here': { ... }
    
    '66580d0dbfea71c10f5d54fe': {
        rawOverrides: {
            steam: false,
        },
    },
    
    /*
    'PLAYER_UID_HERE': {
        rawOverrides: {
            nick: '',
            level: 0,
            xp: 0,
            coins: 0,
            squad: '',
            steam: false,
            killsELO: 0,
            gamesELO: 0,
            time: 0,
        },
        processedOverrides: {
            totalKills: 0,
            totalDeaths: 0,
            weaponKillsTotal: 0,
            vehicleKillsTotal: 0,
            kdr: '0.000',
        },
        percentileOverrides: {
            killsPercentile: 0,
            gamesPercentile: 0,
            xpPercentile: 0,
        },
        weaponStatsOverrides: {
            'Weapon Name Here': {
                kills: 0,
                deaths: 0,
                headshots: 0,
                damage: 0,
                damageReceived: 0,
                kdr: '0.000',
                accuracy: 0,
                headshotRate: 0,
                damagePerKill: 0,
                damagePerHit: 0,
                shotsFired: 0,
                shotsHit: 0,
            }
        },
        winsOverrides: {
            'Team Death Match': 0,
            'Demolition Derby': 0,
            'Protect Leader': 0,
            'Resource Capture': 0,
            'Race': 0,
            'Tank Battle': 0,
            'Tank King': 0,
            'Capture Point': 0,
            'Vehicle Escort': 0,
            'Package Drop': 0,
            'Missile Launch': 0,
            'Battle Royale': 0,
            'Competitive': 0,
        },
        lossesOverrides: {
            'Team Death Match': 0,
            'Demolition Derby': 0,
            'Protect Leader': 0,
            'Resource Capture': 0,
            'Race': 0,
            'Tank Battle': 0,
            'Tank King': 0,
            'Capture Point': 0,
            'Vehicle Escort': 0,
            'Package Drop': 0,
            'Missile Launch': 0,
            'Battle Royale': 0,
            'Competitive': 0,
        },
        killsPerVehicleOverrides: {
            'Tank Lvl 1': 0,
            'Tank Lvl 2': 0,
            'Tank Lvl 3': 0,
            'APC Lvl 1': 0,
            'APC Lvl 2': 0,
            'APC Lvl 3': 0,
            'Car': 0,
            'Heli Lvl 1': 0,
            'Heli Lvl 2': 0,
            'Heli Lvl 3': 0,
            'Heli (No Weapon)': 0,
            'Jet 1 Fin': 0,
            'Jet 2 Fin': 0,
            'MG Turret': 0,
        },
        deathsOverrides: {
            'Air Strike': 0,
            'BGM': 0,
            'AR Rifle': 0,
            'AK Rifle': 0,
            'Pistol': 0,
            'Hunting Rifle': 0,
            'RPG': 0,
            'Shotgun': 0,
            'Sniper Rifle': 0,
            'SMG': 0,
            'Homing': 0,
            'Grenade': 0,
            'Knife': 0,
            'Revolver': 0,
            'Minigun': 0,
            'Grenade Launcher': 0,
            'Smoke Grenade': 0,
            'Fists': 0,
            'VSS': 0,
            '50 Cal Sniper': 0,
            'MG Turret': 0,
            'Crossbow': 0,
            'SCAR': 0,
            'Tactical Shotgun': 0,
            'VEK': 0,
            'Desert Eagle': 0,
            'Auto Pistol': 0,
            'LMG': 0,
            'KBAR': 0,
            'Mace': 0,
            'Rubber Chicken': 0,
            'Butterfly Knife': 0,
            'Chainsaw': 0,
            'AKSMG': 0,
            'Auto Sniper': 0,
            'AR3': 0,
            'Sawed-Off Shotgun': 0,
            'Healing Pistol': 0,
            'MP7': 0,
            'Implosion Grenade': 0,
            'Laser Trip Mine': 0,
            'Concussion Grenade': 0,
            'G3A3': 0,
            "Marksman's Rifle": 0,
            'Mutant': 0,
        }
    },
    */
};

/**
 * Apply custom overrides to raw player data
 * @param {string} uid - Player UID
 * @param {Object} rawData - Raw player data from API
 * @returns {Object} - Modified raw data
 */
export function applyRawOverrides(uid, rawData) {
    if (!CUSTOM_PLAYER_STATS[uid] || !CUSTOM_PLAYER_STATS[uid].rawOverrides) {
        return rawData;
    }

    const overrides = CUSTOM_PLAYER_STATS[uid].rawOverrides;
    return { ...rawData, ...overrides };
}

/**
 * Apply custom overrides to processed player data
 * @param {string} uid - Player UID
 * @param {Object} processedData - Processed player data
 * @returns {Object} - Modified processed data
 */
export function applyProcessedOverrides(uid, processedData) {
    if (!CUSTOM_PLAYER_STATS[uid]) {
        return processedData;
    }

    const customStats = CUSTOM_PLAYER_STATS[uid];
    let modified = { ...processedData };

    // Apply basic processed overrides
    if (customStats.processedOverrides) {
        modified = { ...modified, ...customStats.processedOverrides };
    }

    // Apply weapon stats overrides
    if (customStats.weaponStatsOverrides && modified.weaponStats) {
        modified.weaponStats = { ...modified.weaponStats };
        for (const weaponName in customStats.weaponStatsOverrides) {
            if (modified.weaponStats[weaponName]) {
                modified.weaponStats[weaponName] = {
                    ...modified.weaponStats[weaponName],
                    ...customStats.weaponStatsOverrides[weaponName]
                };
            } else {
                modified.weaponStats[weaponName] = customStats.weaponStatsOverrides[weaponName];
            }
        }
    }

    // Apply wins overrides
    if (customStats.winsOverrides && modified.wins) {
        modified.wins = { ...modified.wins, ...customStats.winsOverrides };
    }

    // Apply losses overrides
    if (customStats.lossesOverrides && modified.losses) {
        modified.losses = { ...modified.losses, ...customStats.lossesOverrides };
    }

    // Apply kills per vehicle overrides
    if (customStats.killsPerVehicleOverrides && modified.kills_per_vehicle) {
        modified.kills_per_vehicle = { ...modified.kills_per_vehicle, ...customStats.killsPerVehicleOverrides };
    }

    // Apply deaths overrides
    if (customStats.deathsOverrides && modified.deaths) {
        modified.deaths = { ...modified.deaths, ...customStats.deathsOverrides };
    }

    return modified;
}

/**
 * Apply custom overrides to percentile data
 * @param {string} uid - Player UID
 * @param {Object} percentiles - Percentile data
 * @returns {Object} - Modified percentile data
 */
export function applyPercentileOverrides(uid, percentiles) {
    if (!CUSTOM_PLAYER_STATS[uid] || !CUSTOM_PLAYER_STATS[uid].percentileOverrides) {
        return percentiles;
    }

    const overrides = CUSTOM_PLAYER_STATS[uid].percentileOverrides;
    return { ...percentiles, ...overrides };
}

/**
 * Check if a player has custom overrides
 * @param {string} uid - Player UID
 * @returns {boolean}
 */
export function hasCustomStats(uid) {
    return uid in CUSTOM_PLAYER_STATS;
}

/**
 * Get all custom stat UIDs
 * @returns {Array<string>}
 */
export function getCustomStatUIDs() {
    return Object.keys(CUSTOM_PLAYER_STATS);
}

// Export the main configuration for direct access if needed
export { CUSTOM_PLAYER_STATS };