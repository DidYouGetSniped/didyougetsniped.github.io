// constants.js

export const WEAPON_NAMES = {
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

export const GAMEMODE_NAMES = {
    m00: 'Team Death Match', m01: 'Demolition Derby', m02: 'Protect Leader',
    m03: 'Resource Capture', m04: 'Race', m05: 'Tank Battle', m06: 'Tank King',
    m07: 'Capture Point', m08: 'Vehicle Escort', m09: 'Package Drop',
    m10: 'Missile Launch', m11: 'Battle Royale', m12: 'Competitive',
    m13: 'Lobby (Competitive)', m14: 'Lobby (BR)', m15: 'Count'
};

export const VEHICLE_KILL_NAMES = {
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

export const VEHICLE_DEATH_NAMES = {
    v00: 'Humvee', v01: 'APC', v02: 'Tank', v10: 'Heli', v11: 'Jet',
    v12: 'Speedboat', v13: 'Attack Boat', v20: 'Buggy', v21: 'Mustang', v22: 'Police Car',
    v23: 'Van', v30: 'Motorbike', v40: 'Plane', v41: 'A-10 Warthog', v50: 'Hovercraft',
    v60: 'Drone'
};

// A comprehensive map for all possible death causes
export const DEATH_CAUSE_NAMES = {
    ...WEAPON_NAMES,
    ...VEHICLE_DEATH_NAMES,
    ...GAMEMODE_NAMES
};

export const SPECIAL_LINKS = {
    '60d08b15d142afee4b1dfabe': {
        discord: 'https://discord.com/users/1014162018992914433',
        youtube: 'https://youtube.com/@DidYouGetSniped'
    },
    '6011bb49d142afed6b12d43e': {
        discord: 'https://discord.com/users/643617634419474432',
        youtube: 'https://youtube.com/@paperclipFPS'
    }
};

export const RATE_LIMIT_CONFIG = {
    maxRequests: 10,
    timeWindow: 60 * 1000 // 60 seconds in milliseconds
};