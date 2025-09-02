/**
 * A definitive list of vehicles to track for achievements.
 * This list is automatically sorted alphabetically.
 */
const TRACKED_VEHICLES = [
    'APC Lvl 1', 'APC Lvl 2', 'APC Lvl 3',
    'Tank Lvl 1', 'Tank Lvl 2', 'Tank Lvl 3',
    'Heli Lvl 1', 'Heli Lvl 2', 'Heli Lvl 3',
    'Jet 1 Fin', 'Jet 2 Fin',
    'Car', 'Heli (No Weapon)'
].sort();

const vehicleThresholds = {
    // Jets
    'jet 2 fin':        { gold: 2400, silver: 1000, bronze: 200 },
    'jet 1 fin':        { gold: 2400, silver: 1000, bronze: 200 },
    
    // Ground Vehicles
    'tank lvl 1':       { gold: 2400, silver: 1000, bronze: 200 },
    'tank lvl 2':       { gold: 2400, silver: 1000, bronze: 200 },
    'tank lvl 3':       { gold: 2400, silver: 1000, bronze: 200 },
    'apc lvl 1':        { gold: 2400, silver: 1000, bronze: 200 },
    'apc lvl 2':        { gold: 2400, silver: 1000, bronze: 200 },
    'apc lvl 3':        { gold: 2400, silver: 1000, bronze: 200 },
    'car':              { gold: 2400, silver: 1000, bronze: 200 },

    // Helicopters
    'heli lvl 3':       { gold: 2400, silver: 1000, bronze: 200 },
    'heli lvl 2':       { gold: 2400, silver: 1000, bronze: 200 },
    'heli lvl 1':       { gold: 2400, silver: 1000, bronze: 200 },
    'heli (no weapon)': { gold: 50,  silver: 30,  bronze: 10 },   
};

/**
 * Generates the HTML for the Vehicle Achievements section.
 * @param {object} vehicleKillsData - An object where keys are vehicle names and values are kill counts.
 * @returns {string} The HTML string for the achievements section.
 */
export function generateVehicleStarsHTML(vehicleKillsData) {
    if (!vehicleKillsData) return '';

    const playerKillsMap = new Map();
    for (const name in vehicleKillsData) {
        playerKillsMap.set(name.toLowerCase(), vehicleKillsData[name]);
    }

    let vehicleData = TRACKED_VEHICLES.map(vehicleName => {
        const lowerCaseName = vehicleName.toLowerCase();
        const thresholds = vehicleThresholds[lowerCaseName];
        if (!thresholds) return null;

        const kills = playerKillsMap.get(lowerCaseName) || 0;
        let tier = 0; // 0=locked, 1=bronze, 2=silver, 3=gold

        if (kills >= thresholds.gold) tier = 3;
        else if (kills >= thresholds.silver) tier = 2;
        else if (kills >= thresholds.bronze) tier = 1;
        
        return { name: vehicleName, kills, tier, thresholds };
    }).filter(Boolean);

    // Sort by Tier (descending), then alphabetically within each tier
    vehicleData.sort((a, b) => b.tier - a.tier || a.name.localeCompare(b.name));

    const starsHTML = vehicleData.map(data => {
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
            <h3>🚗 Vehicle Achievements</h3>
            <div class="achievements-grid">
                ${starsHTML}
            </div>
        </div>
    `;

}

