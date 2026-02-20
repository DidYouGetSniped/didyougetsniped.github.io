// fetch-player-count.js
import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'fs';
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
const MONTHLY_DATA_SUBDIR = 'player-tracker-data';
const LEGACY_TRACKER_FILES = [
  'player-tracker-data.json',
  'player-tracker-latest.json',
  'player-tracker-index.json'
];

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

function removeFileIfExists(filePath) {
  if (existsSync(filePath)) {
    rmSync(filePath);
  }
}

function cleanupLegacyTrackerFiles(trackerRootPath) {
  for (const fileName of LEGACY_TRACKER_FILES) {
    removeFileIfExists(path.join(trackerRootPath, fileName));
  }
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
    cleanupLegacyTrackerFiles(trackerRootPath);

    let allPoints = loadMonthlyPoints(monthlyDirPath);

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

    console.log(`Successfully fetched and wrote player data. Total data points: ${allPoints.length}`);
  } catch (error) {
    console.error("An error occurred during the fetch process:", error);
    process.exit(1);
  }
}

run();
