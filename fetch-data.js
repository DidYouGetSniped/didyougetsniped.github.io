// fetch-data.js

import { writeFileSync } from 'fs';

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
 * Fetches the member count for a single squad.
 * @param {string} squadName The name of the squad.
 * @returns {Promise<number>} The number of members.
 */
async function fetchMemberCount(squadName) {
  try {
    const members = await fetchJson(`https://wbapi.wbpjs.com/squad/getSquadMembers?squadName=${encodeURIComponent(squadName)}`);
    return Array.isArray(members) ? members.length : 0;
  } catch (err) {
    console.warn(`Could not fetch members for ${squadName}:`, err.message);
    return 0; // Return 0 if a specific squad fails
  }
}

/**
 * Main function to run the data fetching process.
 */
async function run() {
  console.log("Starting squad data fetch...");
  try {
    const squadList = await fetchJson('https://wbapi.wbpjs.com/squad/getSquadList');
    console.log(`Found ${squadList.length} squads. Fetching member counts...`);

    const squadDataPromises = squadList.map(async (name) => {
      const count = await fetchMemberCount(name);
      return { name, count };
    });

    const squads = await Promise.all(squadDataPromises);
    
    // Create the final data object with a timestamp and the squad array
    const dataToSave = {
      lastUpdated: new Date().toISOString(), // Adds a standard UTC timestamp
      squads: squads
    };

    // Save the object to a JSON file, nicely formatted
    writeFileSync('squad-data.json', JSON.stringify(dataToSave, null, 2));
    
    console.log(`Successfully fetched and wrote data for ${squads.length} squads to squad-data.json`);
  } catch (error) {
    console.error("An error occurred during the fetch process:", error);
    process.exit(1); // Exit with an error code to fail the GitHub Action
  }
}

run();
