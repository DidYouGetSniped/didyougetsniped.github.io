// fetch-player-count.js
import { writeFileSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Fetches JSON from a URL and throws an error if the response is not ok.
 * @param {string} url The URL to fetch.
 * @returns {Promise<any>} The JSON response.
 */
async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetches the current number of players online.
 * @returns {Promise<number>} The number of players online.
 */
async function fetchPlayerCount() {
  try {
    const data = await fetchJson('https://wbapi.wbpjs.com/status/playersOnline');
    return data.playersOnline || 0;
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
    
    console.log(`Players online: ${playerCount}`);
    
    // Load existing data from JSON file
    let dataArray = [];
    const dataFilePath = path.join(__dirname, 'player-tracker-data.json');
    
    try {
      const existingData = readFileSync(dataFilePath, 'utf-8');
      const parsed = JSON.parse(existingData);
      dataArray = parsed.data || [];
    } catch (err) {
      console.log('No existing data file found. Creating new one...');
      dataArray = [];
    }
    
    // Add new data point
    dataArray.push({
      timestamp: timestamp,
      players: playerCount
    });
    
    // Optional: Keep only last 2880 data points (15 min * 2880 = 30 days of data)
    const maxDataPoints = 2880;
    if (dataArray.length > maxDataPoints) {
      dataArray = dataArray.slice(-maxDataPoints);
      console.log(`Trimmed data to last ${maxDataPoints} points (30 days)`);
    }
    
    // Create the final data object with a timestamp and the player data array
    const dataToSave = {
      lastUpdated: timestamp,
      dataPoints: dataArray.length,
      currentPlayers: playerCount,
      data: dataArray
    };
    
    // Save the object to a JSON file, nicely formatted
    writeFileSync(dataFilePath, JSON.stringify(dataToSave, null, 2));
    
    console.log(`Successfully fetched and wrote player data. Total data points: ${dataArray.length}`);
  } catch (error) {
    console.error("An error occurred during the fetch process:", error);
    process.exit(1); // Exit with an error code
  }
}

run();
