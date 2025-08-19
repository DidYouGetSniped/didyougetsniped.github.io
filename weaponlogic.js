/**
 * A definitive list of weapon names to track for achievements.
 * This list is automatically sorted alphabetically.
 */
const TRACKED_WEAPONS = [
    '50 Cal Sniper', 'Air Strike', 'AK Rifle', 'AKSMG', 'AR Rifle', 'AR3', 'Auto Pistol',
    'Auto Sniper', 'BGM', 'Butterfly Knife', 'Chainsaw', 'Concussion Grenade',
    'Crossbow', 'Desert Eagle', 'Fists', 'G3A3', 'Grenade', 'Grenade Launcher',
    'Homing', 'Hunting Rifle', 'Implosion Grenade', 'KBAR', 'Knife',
    'Laser Trip Mine', 'LMG', "Marksman's Rifle", 'Mace', 'MG Turret', 'Minigun',
    'MP7', 'Mutant', 'Pistol', 'Revolver', 'RPG', 'Rubber Chicken', 'Sawed-Off Shotgun',
    'SCAR', 'Shotgun', 'SMG', 'Sniper Rifle', 'Tactical Shotgun', 'VEK', 'VSS'
].sort();

const weaponThresholds = {
    // High-Usage Primaries
    'ar rifle':          { gold: 11000, silver: 6000, bronze: 750 },
    'ak rifle':          { gold: 11000, silver: 6000, bronze: 750 },
    'ar3':               { gold: 11000, silver: 6000, bronze: 750 },
    'smg':               { gold: 11000, silver: 6000, bronze: 750 },
    'mp7':               { gold: 11000, silver: 6000, bronze: 750 },
    'sniper rifle':      { gold: 11000, silver: 6000, bronze: 750 },
    'mutant':            { gold: 6000, silver: 4000, bronze: 500 },

    // Powerful/Popular Weapons
    'vss':               { gold: 6000, silver: 4000, bronze: 500 },
    '50 cal sniper':     { gold: 6000, silver: 4000, bronze: 500 },
    'lmg':               { gold: 5000, silver: 2500, bronze: 300 },
    'scar':              { gold: 6000, silver: 4000, bronze: 500 },
    'vek':               { gold: 6000, silver: 4000, bronze: 500 },

    // Situational & Secondary Weapons
    'tactical shotgun':  { gold: 5000, silver: 2500, bronze: 300 },
    'shotgun':           { gold: 6000, silver: 4000, bronze: 500 },
    'sawed-off shotgun': { gold: 4000, silver: 2000, bronze: 250 },
    'aksmg':             { gold: 6000, silver: 4000, bronze: 500 },
    'auto sniper':       { gold: 6000, silver: 4000, bronze: 500 },
    'marksman\'s rifle': { gold: 3000, silver: 1500, bronze: 200 },
    'g3a3':              { gold: 3000, silver: 1500, bronze: 200 },
    'kbar':              { gold: 3000, silver: 1500, bronze: 200 },
    'hunting rifle':     { gold: 2500, silver: 1200, bronze: 150 },
    
    // Sidearms
    'revolver':          { gold: 2000, silver: 1000, bronze: 400 },
    'desert eagle':      { gold: 2000, silver: 1000, bronze: 300 },
    'auto pistol':       { gold: 1500, silver: 750,  bronze: 75 },
    'pistol':            { gold: 1500, silver: 750,  bronze: 75 },

    // Explosives & Heavy Weapons
    'rpg':               { gold: 1500, silver: 700,  bronze: 120 },
    'bgm':               { gold: 1500, silver: 700, bronze: 120 },
    'minigun':           { gold: 5000, silver: 2500, bronze: 300 },
    'grenade launcher':  { gold: 1500, silver: 750,  bronze: 75 },
    'grenade':           { gold: 1500, silver: 750,  bronze: 75 },
    'homing':            { gold: 1000, silver: 500,  bronze: 50 },
    'air strike':        { gold: 1500, silver: 700,  bronze: 120 },
    'laser trip mine':   { gold: 1000, silver: 500,  bronze: 50 },

    // Melee & Meme Weapons
    'crossbow':          { gold: 2000, silver: 1000, bronze: 100 },
    'rubber chicken':    { gold: 500,  silver: 200,  bronze: 25 },
    'knife':             { gold: 500,  silver: 200,  bronze: 25 },
    'mace':              { gold: 500,  silver: 200,  bronze: 25 },
    'butterfly knife':   { gold: 250,  silver: 100,  bronze: 10 },
    'chainsaw':          { gold: 100,  silver: 40,   bronze: 5 },
    'fists':             { gold: 1000,  silver: 500,   bronze: 50 },

    // Utility & Placeables
    'mg turret':         { gold: 200,  silver: 75,   bronze: 10 },
    'implosion grenade': { gold: 100,  silver: 40,   bronze: 5 },
    'concussion grenade':{ gold: 100,  silver: 40,   bronze: 5 },
};

/**
 * Generates the HTML for the Weapon Achievements section.
 * @param {object} weaponKillsData - An object where keys are weapon names and values are kill counts.
 * @returns {string} The HTML string for the achievements section.
 */
export function generateWeaponStarsHTML(weaponKillsData) {
    if (!weaponKillsData) return '';

    const playerKillsMap = new Map();
    for (const name in weaponKillsData) {
        playerKillsMap.set(name.toLowerCase(), weaponKillsData[name]);
    }

    let weaponData = TRACKED_WEAPONS.map(weaponName => {
        const lowerCaseName = weaponName.toLowerCase();
        const thresholds = weaponThresholds[lowerCaseName];
        if (!thresholds) {
            console.warn(`No threshold defined for weapon: ${weaponName}`);
            return null;
        }

        const kills = playerKillsMap.get(lowerCaseName) || 0;
        let tier = 0; // 0=locked, 1=bronze, 2=silver, 3=gold

        if (kills >= thresholds.gold) tier = 3;
        else if (kills >= thresholds.silver) tier = 2;
        else if (kills >= thresholds.bronze) tier = 1;
        
        return { name: weaponName, kills, tier, thresholds };
    }).filter(Boolean);

    // Sort by Tier (descending), then alphabetically within each tier
    weaponData.sort((a, b) => b.tier - a.tier || a.name.localeCompare(b.name));

    const starsHTML = weaponData.map(data => {
        let starColorClass = 'locked';
        if (data.tier === 3) starColorClass = 'gold';
        else if (data.tier === 2) starColorClass = 'silver';
        else if (data.tier === 1) starColorClass = 'bronze';
        
        const tooltipText = `Bronze: ${data.thresholds.bronze.toLocaleString()} | Silver: ${data.thresholds.silver.toLocaleString()} | Gold: ${data.thresholds.gold.toLocaleString()}`;

        return `
            <div class="achievement-star-card" data-tooltip="${tooltipText}">
                <div class="achievement-name">${data.name}</div>
                <div class="stars">
                    <span class="star ${starColorClass}">★</span>
                </div>
            </div>
        `;
    }).join('');

    if (!starsHTML) return '';

    return `
        <div class="achievements-section">
            <h3>🏆 Weapon Achievements</h3>
            <div class="achievements-grid">
                ${starsHTML}
            </div>
        </div>
    `;

}
