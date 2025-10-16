// fetch-player-count.js
import { writeFileSync, readFileSync } from 'fs';
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

/**
 * Main function to run the data fetching process.
 */
async function run() {
  console.log("Starting player count fetch...");
  try {
    const playerCount = await fetchPlayerCount();
    const timestamp = new Date().toISOString();
    
    // Load existing data from JSON file
    let dataArray = [];
    const dataFilePath = path.join(__dirname, 'player-tracker-data.json');
    let lastPlayerCount = null;

    try {
      const existingData = readFileSync(dataFilePath, 'utf-8');
      const parsed = JSON.parse(existingData);
      dataArray = parsed.data || [];
      if (dataArray.length > 0) {
        lastPlayerCount = dataArray[dataArray.length - 1].players;
      }
    } catch (err) {
      console.log('No existing data file found. Creating new one...');
      dataArray = [];
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
    dataArray.push({
      timestamp: timestamp,
      players: playerCount
    });

    // Keep all data points - no limit
console.log(`Total data points: ${dataArray.length}`);

    // Prepare data object for saving
    const dataToSave = {
      lastUpdated: timestamp,
      dataPoints: dataArray.length,
      currentPlayers: playerCount,
      data: dataArray
    };

    // Write to JSON file
    writeFileSync(dataFilePath, JSON.stringify(dataToSave, null, 2));

    console.log(`Successfully fetched and wrote player data. Total data points: ${dataArray.length}`);
  } catch (error) {
    console.error("An error occurred during the fetch process:", error);
    process.exit(1);
  }
}

run();
