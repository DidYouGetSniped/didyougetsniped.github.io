const API_BASE_URL = 'https://wbapi.wbpjs.com/players';

export const RATE_LIMIT_CONFIG = {
    maxRequests: 10,
    timeWindow: 60 * 1000 // 60 seconds in milliseconds
};

const WEAPON_NAMES = {
    p09: 'Air Strike', p11: 'BGM', p52: 'Tank Lvl 1', p53: 'APC Lvl 1',
    p54: 'Heli Lvl 1', p55: 'Tank Lvl 2', p56: 'APC Lvl 2', p57: 'Heli Lvl 2',
    p58: 'Tank Lvl 3', p59: 'APC Lvl 3', p60: 'Heli Lvl 3', p61: 'AR Rifle',
    p62: 'AK Rifle', p63: 'Pistol', p64: 'Hunting Rifle', p65: 'RPG',
    p66: 'Shotgun', p67: 'Sniper Rifle', p68: 'SMG', p69: 'Homing',
    p71: 'Grenade', p74: 'Heli Minigun', p75: 'Tank Minigun', p76: 'Knife',
    p78: 'Revolver', p79: 'Minigun', p80: 'Grenade Launcher', p81: 'Smoke Grenade',
    p82: 'Jet 1 Rockets', p83: 'Jet 1 Homing', p84: 'Jet 1 Machine Gun',
    p85: 'Jet 2 Rockets', p86: 'Jet 2 Homing', p87: 'Jet 2 Machine Gun',
    p88: 'Fists', p89: 'VSS', p90: '50 Cal Sniper', p91: 'MG Turret',
    p92: 'Crossbow', p93: 'SCAR', p94: 'Tactical Shotgun', p95: 'VEK',
    p96: 'Desert Eagle', p97: 'Auto Pistol', p98: 'LMG', p99: 'KBAR',
    p100: 'Mace', p101: 'Rubber Chicken', p102: 'Butterfly Knife', p103: 'Chainsaw',
    p104: 'AKSMG', p105: 'Auto Sniper', p106: 'AR3', p107: 'Sawed-Off Shotgun',
    p108: 'Healing Pistol', p109: 'MP7', p110: 'Implosion Grenade', p111: 'Laser Trip Mine',
    p112: 'Concussion Grenade', p126: 'G3A3', p128: "Marksman's Rifle", p129: 'Mutant'
};
const GAMEMODE_NAMES = {
    m00: 'Team Death Match', m01: 'Demolition Derby', m02: 'Protect Leader',
    m03: 'Resource Capture', m04: 'Race', m05: 'Tank Battle', m06: 'Tank King',
    m07: 'Capture Point', m08: 'Vehicle Escort', m09: 'Package Drop',
    m10: 'Missile Launch', m11: 'Battle Royale', m12: 'Competitive',
    m13: 'Lobby (Competitive)', m14: 'Lobby (BR)', m15: 'Count'
};
const VEHICLE_KILL_NAMES = {
    v00: 'Tank Lvl 1', v01: 'Tank Lvl 2', v02: 'Tank Lvl 3',
    v10: 'APC Lvl 1', v11: 'APC Lvl 2', v12: 'APC Lvl 3',
    v13: 'Car', v14: 'Unknown Vehicle (v14)', v15: 'Jet 1 Fin Machine Gun',
    v16: 'Unknown Vehicle (v16)', v17: 'Unknown Vehicle (v17)', v18: 'Unknown Vehicle (v18)',
    v19: 'Unknown Vehicle (v19)', v20: 'Heli Lvl 1', v21: 'Heli Lvl 2',
    v22: 'Heli Lvl 3', v23: 'Heli (No Weapon)', v30: 'Player',
    v40: 'Jet 1 Fin', v41: 'Jet 2 Fin', v50: 'Machine Gun Turret',
    v60: 'Unknown Vehicle (v60)', v110: 'Unknown Vehicle (v110)', v111: 'Unknown Vehicle (v111)',
    v112: 'Unknown Vehicle (v112)', v113: 'Unknown Vehicle (v113)'
};

const DEATH_CAUSE_NAMES = {
    ...WEAPON_NAMES,
    ...GAMEMODE_NAMES
};

const IGNORED_WEAPON_CODES = [
    'p52', 'p53', 'p54', 'p55', 'p56', 'p57', 'p58', 'p59', 'p60',
    'p74', 'p75', 'p82', 'p83', 'p84', 'p85', 'p86', 'p87'
];

const SPECIAL_LINKS = {
    '60d08b15d142afee4b1dfabe': { 
        discord: 'https://discord.com/users/1014162018992914433', 
        youtube: 'https://youtube.com/@DidYouGetSniped' 
    }, // DYGS
    '6011bb49d142afed6b12d43e': { 
        discord: 'https://discord.com/users/643617634419474432', 
        youtube: 'https://youtube.com/@paperclipFPS' 
    }, // Paperclip
    '65b99682d142af8101fc7025': { 
        discord: 'https://discord.com/users/1133760136897380356', 
        youtube: 'https://www.youtube.com/channel/UC3WathZqJpuFuGOuDBZ-jCQ' 
    }, // Imagine Dying
    '6449c8acd142afb66d07f776': { 
        discord: 'https://discord.com/users/1093985963014889552' 
    } // Invis
};

const PLAYER_BIOGRAPHIES = {
    '60d08b15d142afee4b1dfabe': "Howdy! Welcome to my stats profile. <br> I am the creator of this website. " +
    "I first started playing War Brokers back in 2017. In 2021 I created a YouTube channel. Sometimes I make edits" + 
    " on the <a href='https://war-brokers.fandom.com/wiki/War_Brokers_Wiki' target='_blank' class='no-link-style'>War Brokers Wiki</a>.",

    '614cdc8bd142af3e0f3f8370': "HM: iffypedia - goat of sniping",

    '6449c8acd142afb66d07f776': "Hi there. My name is Invis. I am a retired warbrokers player who was well known for his sniping. " +
    "I have been in 3 squads, CAESAR, UMS, and AI. You can always talk to me on discord. " +
    "Thanks for stopping by my stats! :)"
};

async function fetchData(url, options = {}, errorValue = null) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            if (errorValue !== null) {
                console.warn(`API request to ${url} failed with status ${response.status}. Returning default value.`);
                return errorValue;
            }
            throw new Error(`API request to ${url} failed with status ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching from ${url}:`, error);
        if (errorValue !== null) return errorValue;
        throw error;
    }
}

function remapObjectKeys(dataObject, map) {
    if (!dataObject) return {};
    const remapped = {};
    for (const code in dataObject) {
        if (Object.prototype.hasOwnProperty.call(dataObject, code)) {
            const name = map[code] || `Unknown Code (${code})`;
            remapped[name] = dataObject[code];
        }
    }
    return remapped;
}

function processPlayerData(rawPlayerData) {
    const processed = { ...rawPlayerData };
    const raw_kills_per_weapon = rawPlayerData.kills_per_weapon || {};
    const raw_kills_per_vehicle = rawPlayerData.kills_per_vehicle || {};
    const raw_deaths = rawPlayerData.deaths || {};
    const raw_self_destructs = rawPlayerData.self_destructs || {};
    const weaponKillsTotal = Object.entries(raw_kills_per_weapon)
        .filter(([key]) => !IGNORED_WEAPON_CODES.includes(key))
        .reduce((sum, [, value]) => sum + value, 0);
    const vehicleKillsTotal = Object.entries(raw_kills_per_vehicle)
        .filter(([key]) => key !== 'v30')
        .reduce((sum, [, value]) => sum + value, 0);
    processed.totalKills = weaponKillsTotal + vehicleKillsTotal;
processed.weaponKillsTotal = weaponKillsTotal;  // ADD THIS LINE
processed.vehicleKillsTotal = vehicleKillsTotal; // ADD THIS LINE
    const weaponDeathsTotal = Object.values(raw_deaths).reduce((sum, val) => sum + val, 0);
    const selfDestructDeathsTotal = Object.values(raw_self_destructs).reduce((sum, val) => sum + val, 0);
    processed.totalDeaths = weaponDeathsTotal + selfDestructDeathsTotal;
    processed.kdr = processed.totalDeaths > 0
        ? (processed.totalKills / processed.totalDeaths).toFixed(3)
        : processed.totalKills.toFixed(3);
    processed.wins = remapObjectKeys(rawPlayerData.wins, GAMEMODE_NAMES);
    processed.losses = remapObjectKeys(rawPlayerData.losses, GAMEMODE_NAMES);
    const filtered_raw_kills_per_vehicle = { ...raw_kills_per_vehicle };
    delete filtered_raw_kills_per_vehicle.v30;
    processed.kills_per_vehicle = remapObjectKeys(filtered_raw_kills_per_vehicle, VEHICLE_KILL_NAMES);
    processed.deaths = remapObjectKeys(raw_deaths, DEATH_CAUSE_NAMES);
    const filterIgnoredWeapons = (dataObject) => {
        if (!dataObject) return {};
        const filtered = {};
        for (const code in dataObject) {
            if (!IGNORED_WEAPON_CODES.includes(code)) {
                filtered[code] = dataObject[code];
            }
        }
        return filtered;
    };
    const filtered_raw_kills = filterIgnoredWeapons(raw_kills_per_weapon);
    const filtered_raw_headshots = filterIgnoredWeapons(rawPlayerData.headshots);
    const filtered_raw_damage = filterIgnoredWeapons(rawPlayerData.damage_dealt);
    const filtered_raw_shots_unzoomed = filterIgnoredWeapons(rawPlayerData.shots_fired_unzoomed);
    const filtered_raw_shots_zoomed = filterIgnoredWeapons(rawPlayerData.shots_fired_zoomed);
    const filtered_raw_hits_unzoomed = filterIgnoredWeapons(rawPlayerData.shots_hit_unzoomed);
    const filtered_raw_hits_zoomed = filterIgnoredWeapons(rawPlayerData.shots_hit_zoomed);
    const kills_per_weapon = remapObjectKeys(filtered_raw_kills, WEAPON_NAMES);
    const headshots = remapObjectKeys(filtered_raw_headshots, WEAPON_NAMES);
    const damage_dealt = remapObjectKeys(filtered_raw_damage, WEAPON_NAMES);
    const shots_fired_unzoomed = remapObjectKeys(filtered_raw_shots_unzoomed, WEAPON_NAMES);
    const shots_fired_zoomed = remapObjectKeys(filtered_raw_shots_zoomed, WEAPON_NAMES);
    const shots_hit_unzoomed = remapObjectKeys(filtered_raw_hits_unzoomed, WEAPON_NAMES);
    const shots_hit_zoomed = remapObjectKeys(filtered_raw_hits_zoomed, WEAPON_NAMES);
    processed.weaponStats = {};
    const allWeaponNames = new Set(Object.keys(kills_per_weapon));
    for (const weaponName of allWeaponNames) {
        const kills = kills_per_weapon[weaponName] || 0;
        const deathsByWeapon = processed.deaths[weaponName] || 0;
        const totalHeadshots = headshots[weaponName] || 0;
        const totalDamage = damage_dealt[weaponName] || 0;
        const shotsFired = (shots_fired_unzoomed[weaponName] || 0) + (shots_fired_zoomed[weaponName] || 0);
        const shotsHit = (shots_hit_unzoomed[weaponName] || 0) + (shots_hit_zoomed[weaponName] || 0);
        const kdr = deathsByWeapon > 0 ? (kills / deathsByWeapon) : kills;
        const accuracy = shotsFired > 0 ? (shotsHit / shotsFired) * 100 : 0;
        const headshotRate = kills > 0 ? (totalHeadshots / kills) * 100 : 0;
        const damagePerKill = kills > 0 ? (totalDamage / kills) : 0;
        const damagePerHit = shotsHit > 0 ? (totalDamage / shotsHit) : 0;
        processed.weaponStats[weaponName] = {
            kills, deaths: deathsByWeapon, headshots: totalHeadshots,
            damage: parseFloat(totalDamage.toFixed(0)),
            kdr: kdr.toFixed(3),
            accuracy: parseFloat(accuracy.toFixed(2)),
            headshotRate: parseFloat(headshotRate.toFixed(2)),
            damagePerKill: parseFloat(damagePerKill.toFixed(0)),
            damagePerHit: parseFloat(damagePerHit.toFixed(2)),
            shotsFired, shotsHit
        };
    }
    if (SPECIAL_LINKS[rawPlayerData.uid]) {
        processed.socialLinks = SPECIAL_LINKS[rawPlayerData.uid];
    }
    if (PLAYER_BIOGRAPHIES[rawPlayerData.uid]) {
        processed.biography = PLAYER_BIOGRAPHIES[rawPlayerData.uid];
    }
    delete processed.kills_per_weapon;
    delete processed.damage_dealt;
    delete processed.damage_received;
    delete processed.shots_fired_unzoomed;
    delete processed.shots_fired_zoomed;
    delete processed.shots_hit_unzoomed;
    delete processed.shots_hit_zoomed;
    delete processed.headshots;
    return processed;
}

export async function fetchFullPlayerData(uid) {
    const playerUrl = `${API_BASE_URL}/getPlayer?uid=${uid}`;
    const killsPercentileUrl = `${API_BASE_URL}/percentile/killsElo?uid=${uid}`;
    const gamesPercentileUrl = `${API_BASE_URL}/percentile/gamesElo?uid=${uid}`;
    const xpPercentileUrl = `${API_BASE_URL}/percentile/xp?uid=${uid}`;

    const rawPlayerData = await fetchData(playerUrl);
    if (!rawPlayerData) {
        throw new Error('Player data not found or API error.');
    }

    const playerData = processPlayerData(rawPlayerData);

     const [killsPercentile, gamesPercentile, xpPercentile] = await Promise.all([
        fetchData(killsPercentileUrl, {}, 0),
        fetchData(gamesPercentileUrl, {}, 0),
        fetchData(xpPercentileUrl, {}, 0) 
    ]);

    if (killsPercentile === 0 || gamesPercentile === 0) {
        console.warn('Could not fetch all percentile data. Some values may be defaulted to 0.');
    }

    return { rawPlayerData, playerData, killsPercentile, gamesPercentile, xpPercentile };
}

export async function searchPlayerByName(query) {
    const searchUrl = `${API_BASE_URL}/searchByName?query=${encodeURIComponent(query)}`;
    const searchResults = await fetchData(searchUrl, {}, []);
    return searchResults;
}


