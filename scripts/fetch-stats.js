// scripts/fetch-stats.js
// ─────────────────────────────────────────────────────────────────────────────
// Fetches one daily snapshot per tracked UID and appends it to
//   historical-stats/{uid}/snapshots.json
//
// Respects the 20-requests-per-minute API hard limit.
// Re-running on the same date updates that day's entry (idempotent).
// ─────────────────────────────────────────────────────────────────────────────

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TRACKED_UIDS } from './tracked-uids.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT_DIR   = path.resolve(__dirname, '..');

const API_BASE          = 'https://wbapi.wbpjs.com/players';
const MAX_REQ_PER_WINDOW = 19;   // stay under the 20/min hard cap
const WINDOW_MS          = 60_000;

// ── Name maps (kept in sync with api.js) ─────────────────────────────────────

const WEAPON_NAMES = {
    p09:'Air Strike', p11:'BGM', p52:'Tank Lvl 1', p53:'APC Lvl 1',
    p54:'Heli Lvl 1', p55:'Tank Lvl 2', p56:'APC Lvl 2', p57:'Heli Lvl 2',
    p58:'Tank Lvl 3', p59:'APC Lvl 3', p60:'Heli Lvl 3', p61:'AR Rifle',
    p62:'AK Rifle', p63:'Pistol', p64:'Hunting Rifle', p65:'RPG',
    p66:'Shotgun', p67:'Sniper Rifle', p68:'SMG', p69:'Homing',
    p71:'Grenade', p74:'Heli Minigun', p75:'Tank Minigun', p76:'Knife',
    p78:'Revolver', p79:'Minigun', p80:'Grenade Launcher', p81:'Smoke Grenade',
    p82:'Jet 1 Rockets', p83:'Jet 1 Homing', p84:'Jet 1 Machine Gun',
    p85:'Jet 2 Rockets', p86:'Jet 2 Homing', p87:'Jet 2 Machine Gun',
    p88:'Fists', p89:'VSS', p90:'50 Cal Sniper', p91:'MG Turret',
    p92:'Crossbow', p93:'SCAR', p94:'Tactical Shotgun', p95:'VEK',
    p96:'Desert Eagle', p97:'Auto Pistol', p98:'LMG', p99:'KBAR',
    p100:'Mace', p101:'Rubber Chicken', p102:'Butterfly Knife', p103:'Chainsaw',
    p104:'AKSMG', p105:'Auto Sniper', p106:'AR3', p107:'Sawed-Off Shotgun',
    p108:'Healing Pistol', p109:'MP7', p110:'Implosion Grenade', p111:'Laser Trip Mine',
    p112:'Concussion Grenade', p126:'G3A3', p128:"Marksman's Rifle", p129:'Mutant',
};

const VEHICLE_KILL_NAMES = {
    v00:'Tank Lvl 1', v01:'Tank Lvl 2', v02:'Tank Lvl 3',
    v10:'APC Lvl 1', v11:'APC Lvl 2', v12:'APC Lvl 3',
    v13:'Car', v20:'Heli Lvl 1', v21:'Heli Lvl 2',
    v22:'Heli Lvl 3', v23:'Heli (No Weapon)', v30:'Player',
    v40:'Jet 1 Fin', v41:'Jet 2 Fin', v50:'MG Turret',
};

const GAMEMODE_NAMES = {
    m00:'Team Death Match', m01:'Demolition Derby', m02:'Protect Leader',
    m03:'Resource Capture', m04:'Race', m05:'Tank Battle', m06:'Tank King',
    m07:'Capture Point', m08:'Vehicle Escort', m09:'Package Drop',
    m10:'Missile Launch', m11:'Battle Royale', m12:'Competitive',
};

const DEATH_CAUSE_NAMES = { ...WEAPON_NAMES, ...GAMEMODE_NAMES };

// Vehicle-weapon codes that don't count as weapon kills (mirrors api.js)
const IGNORED_WEAPON_CODES = new Set([
    'p52','p53','p54','p55','p56','p57','p58','p59','p60',
    'p74','p75','p82','p83','p84','p85','p86','p87',
]);

// ── Rate limiter ──────────────────────────────────────────────────────────────

const reqTimestamps = [];

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function rateLimitedFetch(url) {
    const now = Date.now();
    // Evict timestamps older than the window
    while (reqTimestamps.length && now - reqTimestamps[0] >= WINDOW_MS) {
        reqTimestamps.shift();
    }

    if (reqTimestamps.length >= MAX_REQ_PER_WINDOW) {
        const waitMs = WINDOW_MS - (Date.now() - reqTimestamps[0]) + 250;
        console.log(`    ⏳ Rate limit reached — waiting ${(waitMs / 1000).toFixed(1)}s...`);
        await sleep(waitMs);
        return rateLimitedFetch(url); // retry after waiting
    }

    // Register this request before the await so concurrent calls see it
    reqTimestamps.push(Date.now());

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.json();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function remapKeys(obj, nameMap) {
    if (!obj) return {};
    const out = {};
    for (const [code, val] of Object.entries(obj)) {
        out[nameMap[code] || code] = val;
    }
    return out;
}

function sumValues(obj) {
    return Object.values(obj || {}).reduce((a, b) => a + b, 0);
}

function sumFiltered(obj, excludeCodes) {
    return Object.entries(obj || {})
        .filter(([k]) => !excludeCodes.has(k))
        .reduce((s, [, v]) => s + v, 0);
}

// ── Snapshot builder ──────────────────────────────────────────────────────────

function buildSnapshot(date, player, killsPct, gamesPct, xpPct) {
    const raw = player;

    // Kills per weapon — exclude vehicle-mounted weapons
    const rawWeaponKills = {};
    for (const [k, v] of Object.entries(raw.kills_per_weapon || {})) {
        if (!IGNORED_WEAPON_CODES.has(k)) rawWeaponKills[k] = v;
    }
    const weaponKillsTotal = sumValues(rawWeaponKills);

    // Vehicle kills — exclude v30 (player kills, not vehicle kills)
    const rawVehicleKills = { ...(raw.kills_per_vehicle || {}) };
    delete rawVehicleKills.v30;
    const vehicleKillsTotal = sumValues(rawVehicleKills);

    const totalKills  = weaponKillsTotal + vehicleKillsTotal;
    const weaponDeaths = sumValues(raw.deaths || {});
    const selfDestructs = sumValues(raw.self_destructs || {});
    const totalDeaths = weaponDeaths + selfDestructs;
    const kdr = totalDeaths > 0
        ? (totalKills / totalDeaths).toFixed(3)
        : totalKills.toFixed(3);

    const totalWins   = sumValues(raw.wins   || {});
    const totalLosses = sumValues(raw.losses || {});

    const totalHeadshots    = sumFiltered(raw.headshots     || {}, IGNORED_WEAPON_CODES);
    const totalDamageDealt  = sumFiltered(raw.damage_dealt  || {}, IGNORED_WEAPON_CODES);
    const totalDamageReceived = sumFiltered(raw.damage_received || {}, IGNORED_WEAPON_CODES);

    const totalShotsFiredUnzoomed = sumFiltered(raw.shots_fired_unzoomed || {}, IGNORED_WEAPON_CODES);
    const totalShotsFiredZoomed   = sumFiltered(raw.shots_fired_zoomed   || {}, IGNORED_WEAPON_CODES);
    const totalShotsHitUnzoomed   = sumFiltered(raw.shots_hit_unzoomed   || {}, IGNORED_WEAPON_CODES);
    const totalShotsHitZoomed     = sumFiltered(raw.shots_hit_zoomed     || {}, IGNORED_WEAPON_CODES);
    const totalShotsFired = totalShotsFiredUnzoomed + totalShotsFiredZoomed;
    const totalShotsHit   = totalShotsHitUnzoomed   + totalShotsHitZoomed;

    return {
        // When / who
        date,
        fetchedAt: new Date().toISOString(),

        // Identity
        nick:  raw.nick  || 'Unknown',
        level: raw.level || 0,
        xp:    raw.xp    || 0,
        coins: raw.coins || 0,
        squad: raw.squad || null,
        steam: raw.steam === true,

        // ELO
        killsELO:  raw.killsELO  || 0,
        gamesELO:  raw.gamesELO  || 0,

        // Percentiles (lower = better rank, so "top X%")
        killsPercentile: killsPct,
        gamesPercentile: gamesPct,
        xpPercentile:    xpPct,

        // Kill / death summary
        totalKills,
        totalDeaths,
        kdr,
        weaponKillsTotal,
        vehicleKillsTotal,
        selfDestructs,

        // Games
        totalGames:  totalWins + totalLosses,
        totalWins,
        totalLosses,

        // Accuracy / damage
        totalHeadshots,
        totalDamageDealt:     Math.round(totalDamageDealt),
        totalDamageReceived:  Math.round(totalDamageReceived),
        totalShotsFired,
        totalShotsHit,
        totalShotsFiredUnzoomed,
        totalShotsFiredZoomed,
        totalShotsHitUnzoomed,
        totalShotsHitZoomed,

        // Named breakdowns (ready for charts — no code→name lookup needed in browser)
        kills_per_weapon:  remapKeys(rawWeaponKills,         WEAPON_NAMES),
        kills_per_vehicle: remapKeys(rawVehicleKills,        VEHICLE_KILL_NAMES),
        deaths:            remapKeys(raw.deaths || {},       DEATH_CAUSE_NAMES),
        wins:              remapKeys(raw.wins   || {},       GAMEMODE_NAMES),
        losses:            remapKeys(raw.losses || {},       GAMEMODE_NAMES),
    };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    if (!TRACKED_UIDS.length) {
        console.log('ℹ️  No UIDs configured in scripts/tracked-uids.js — nothing to do.');
        console.log('   Add entries to TRACKED_UIDS and re-run.');
        return;
    }

    // YYYY-MM-DD in UTC (consistent across time zones on the runner)
    const today = new Date().toISOString().slice(0, 10);
    console.log(`📅 Snapshot date: ${today}`);
    console.log(`👥 Players to track: ${TRACKED_UIDS.length}`);

    for (const { uid, label } of TRACKED_UIDS) {
        console.log(`\n▶ ${label || uid} (${uid})`);
        try {
            // Fire all 4 requests; each is registered with the rate limiter
            // before its fetch resolves, so concurrent slots are accounted for.
            const [player, killsPct, gamesPct, xpPct] = await Promise.all([
                rateLimitedFetch(`${API_BASE}/getPlayer?uid=${uid}`),
                rateLimitedFetch(`${API_BASE}/percentile/killsElo?uid=${uid}`).catch(() => { console.warn('  ⚠ killsElo percentile failed, defaulting to 0'); return 0; }),
                rateLimitedFetch(`${API_BASE}/percentile/gamesElo?uid=${uid}`).catch(() => { console.warn('  ⚠ gamesElo percentile failed, defaulting to 0'); return 0; }),
                rateLimitedFetch(`${API_BASE}/percentile/xp?uid=${uid}`)     .catch(() => { console.warn('  ⚠ xp percentile failed, defaulting to 0');       return 0; }),
            ]);

            const snapshot = buildSnapshot(today, player, killsPct, gamesPct, xpPct);
            console.log(`  ✔ Built snapshot — ${snapshot.nick} | KDR: ${snapshot.kdr} | Kills ELO: ${snapshot.killsELO.toFixed(2)}`);

            // Load existing snapshots (or start fresh)
            const dir  = path.join(ROOT_DIR, 'historical-stats', uid);
            const file = path.join(dir, 'snapshots.json');
            fs.mkdirSync(dir, { recursive: true });

            let snapshots = [];
            if (fs.existsSync(file)) {
                try {
                    snapshots = JSON.parse(fs.readFileSync(file, 'utf8'));
                } catch {
                    console.warn('  ⚠ Existing snapshots.json was unreadable — starting fresh.');
                }
            }

            // Replace today's snapshot if it already exists (safe re-run)
            const existingIdx = snapshots.findIndex(s => s.date === today);
            if (existingIdx >= 0) {
                snapshots[existingIdx] = snapshot;
                console.log(`  ↻ Replaced existing snapshot for ${today}`);
            } else {
                snapshots.push(snapshot);
                console.log(`  + Added new snapshot for ${today} (total: ${snapshots.length})`);
            }

            // Always keep sorted chronologically (oldest → newest)
            snapshots.sort((a, b) => a.date.localeCompare(b.date));

            fs.writeFileSync(file, JSON.stringify(snapshots, null, 2));
            console.log(`  💾 Saved → historical-stats/${uid}/snapshots.json`);
        } catch (err) {
            // Log the error but keep going so one bad UID doesn't kill the whole run
            console.error(`  ✖ Failed for ${label || uid}: ${err.message}`);
        }
    }

    console.log('\n✅ Done.');
}

main();
