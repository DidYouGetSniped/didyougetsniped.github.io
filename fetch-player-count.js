// fetch-player-count.js
import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Fetches the current number of players online.
 * @returns {Promise<number>} The number of players online.
 */
async function fetchPlayerCount() {
  try {
    const response = await fetch('https://wbapi.wbpjs.com/status/playersOnline');
    if (!response.ok) {
      throw new Error(`Failed to fetch player count: ${response.statusText}`);
    }

    // The API returns a plain number (like "99"), not an object
    const text = await response.text();
    const count = Number(text.trim());

    if (isNaN(count)) {
      throw new Error(`Unexpected response format: ${text}`);
    }

    return count;
  } catch (err) {
    console.warn('Could not fetch player count:', err.message);
    return 0;
  }
}

const TRACKER_ROOT_DIR = 'playercountinfo';
const LEGACY_DATA_FILE = 'player-tracker-data.json';
const LATEST_DATA_FILE = 'player-tracker-latest.json';
const INDEX_DATA_FILE = 'player-tracker-index.json';
const MONTHLY_DATA_SUBDIR = 'player-tracker-data';
const LATEST_WINDOW_DAYS = 30;

function toMonthKey(timestamp) {
  return timestamp.slice(0, 7);
}

function readJsonIfExists(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function writeJson(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function sortByTimestamp(a, b) {
  if (a.timestamp < b.timestamp) return -1;
  if (a.timestamp > b.timestamp) return 1;
  return 0;
}

function dedupeByTimestamp(points) {
  const seen = new Set();
  const deduped = [];
  for (const point of points) {
    const key = point.timestamp;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(point);
  }
  return deduped;
}

function loadMonthlyPoints(monthlyDirPath) {
  if (!existsSync(monthlyDirPath)) return [];
  const monthFiles = readdirSync(monthlyDirPath)
    .filter(name => /^\d{4}-\d{2}\.json$/.test(name))
    .sort();

  const points = [];
  for (const fileName of monthFiles) {
    const monthPath = path.join(monthlyDirPath, fileName);
    const parsed = readJsonIfExists(monthPath);
    if (parsed && Array.isArray(parsed.data)) {
      points.push(...parsed.data);
    }
  }

  return dedupeByTimestamp(points.sort(sortByTimestamp));
}

function writeMonthlyFilesFromPoints(allPoints, monthlyDirPath) {
  const buckets = new Map();
  for (const point of allPoints) {
    const monthKey = toMonthKey(point.timestamp);
    if (!buckets.has(monthKey)) buckets.set(monthKey, []);
    buckets.get(monthKey).push(point);
  }

  for (const [monthKey, points] of buckets.entries()) {
    const monthPoints = dedupeByTimestamp(points.sort(sortByTimestamp));
    const monthPayload = {
      month: monthKey,
      lastUpdated: monthPoints[monthPoints.length - 1]?.timestamp || null,
      dataPoints: monthPoints.length,
      data: monthPoints
    };
    writeJson(path.join(monthlyDirPath, `${monthKey}.json`), monthPayload);
  }
}

function buildIndex(monthlyDirPath, currentPlayers) {
  const monthFiles = existsSync(monthlyDirPath)
    ? readdirSync(monthlyDirPath).filter(name => /^\d{4}-\d{2}\.json$/.test(name)).sort()
    : [];

  const months = [];
  let totalDataPoints = 0;
  let lastUpdated = null;

  for (const fileName of monthFiles) {
    const monthPath = path.join(monthlyDirPath, fileName);
    const parsed = readJsonIfExists(monthPath);
    if (!parsed || !Array.isArray(parsed.data)) continue;

    const month = fileName.replace('.json', '');
    const dataPoints = parsed.data.length;
    const monthLastUpdated = parsed.data[dataPoints - 1]?.timestamp || parsed.lastUpdated || null;

    months.push({
      month,
      file: `${TRACKER_ROOT_DIR}/${MONTHLY_DATA_SUBDIR}/${fileName}`,
      dataPoints,
      lastUpdated: monthLastUpdated
    });

    totalDataPoints += dataPoints;
    if (monthLastUpdated && (!lastUpdated || monthLastUpdated > lastUpdated)) {
      lastUpdated = monthLastUpdated;
    }
  }

  return {
    lastUpdated,
    currentPlayers,
    totalDataPoints,
    months
  };
}

function writeLatestWindow(allPoints, currentPlayers, nowIso, rootDir) {
  const cutoff = Date.now() - LATEST_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const latestPoints = allPoints.filter(p => new Date(p.timestamp).getTime() >= cutoff);
  const payload = {
    lastUpdated: nowIso,
    dataPoints: latestPoints.length,
    currentPlayers,
    windowDays: LATEST_WINDOW_DAYS,
    data: latestPoints
  };

  writeJson(path.join(rootDir, LATEST_DATA_FILE), payload);
  writeJson(path.join(rootDir, LEGACY_DATA_FILE), payload);
}

/**
 * Main function to run the data fetching process.
 */
async function run() {
  console.log("Starting player count fetch...");
  try {
    const playerCount = await fetchPlayerCount();
    const timestamp = new Date().toISOString();

    const trackerRootPath = path.join(__dirname, TRACKER_ROOT_DIR);
    const monthlyDirPath = path.join(trackerRootPath, MONTHLY_DATA_SUBDIR);
    mkdirSync(trackerRootPath, { recursive: true });
    mkdirSync(monthlyDirPath, { recursive: true });

    const legacyPath = path.join(__dirname, LEGACY_DATA_FILE);
    const trackerLegacyPath = path.join(trackerRootPath, LEGACY_DATA_FILE);
    let allPoints = loadMonthlyPoints(monthlyDirPath);

    // One-time migration path: if monthly data does not exist yet, seed it from legacy data.
    if (allPoints.length === 0) {
      const legacy = readJsonIfExists(trackerLegacyPath) || readJsonIfExists(legacyPath);
      if (legacy && Array.isArray(legacy.data) && legacy.data.length > 0) {
        allPoints = dedupeByTimestamp(legacy.data.sort(sortByTimestamp));
        writeMonthlyFilesFromPoints(allPoints, monthlyDirPath);
      }
    }

    let lastPlayerCount = null;
    if (allPoints.length > 0) {
      lastPlayerCount = allPoints[allPoints.length - 1].players;
    }

    // Compute difference from last known value
    let diffText = "";
    if (lastPlayerCount !== null) {
      const diff = playerCount - lastPlayerCount;
      if (diff > 0) diffText = `(+${diff} since last check)`;
      else if (diff < 0) diffText = `(${diff} since last check)`;
      else diffText = `(no change)`;
    }

    console.log(`Players online: ${playerCount} ${diffText}`);

    // Add new data point
    allPoints.push({
      timestamp: timestamp,
      players: playerCount
    });
    allPoints = dedupeByTimestamp(allPoints.sort(sortByTimestamp));
    console.log(`Total data points: ${allPoints.length}`);

    const currentMonth = toMonthKey(timestamp);
    const currentMonthPath = path.join(monthlyDirPath, `${currentMonth}.json`);
    const currentMonthData = readJsonIfExists(currentMonthPath);
    let monthPoints = Array.isArray(currentMonthData?.data) ? currentMonthData.data.slice() : [];
    monthPoints.push({ timestamp, players: playerCount });
    monthPoints = dedupeByTimestamp(monthPoints.sort(sortByTimestamp));

    writeJson(currentMonthPath, {
      month: currentMonth,
      lastUpdated: timestamp,
      dataPoints: monthPoints.length,
      data: monthPoints
    });

    const index = buildIndex(monthlyDirPath, playerCount);
    index.lastUpdated = timestamp;
    writeJson(path.join(trackerRootPath, INDEX_DATA_FILE), index);

    writeLatestWindow(allPoints, playerCount, timestamp, trackerRootPath);

    console.log(`Successfully fetched and wrote player data. Total data points: ${allPoints.length}`);
  } catch (error) {
    console.error("An error occurred during the fetch process:", error);
    process.exit(1);
  }
}

run();
