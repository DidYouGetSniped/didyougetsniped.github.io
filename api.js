// api.js

const API_BASE_URL = 'https://wbapi.wbpjs.com/players';

/**
 * Fetches data from a given URL and handles the response.
 * @param {string} url - The URL to fetch from.
 * @param {object} options - Fetch options.
 * @param {any} errorValue - The value to return on a non-ok response.
 * @returns {Promise<any>} The JSON response or the errorValue.
 */
async function fetchData(url, options = {}, errorValue = null) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            // For percentile, a failure isn't critical, so we return a default.
            // For other calls, the caller will handle the error based on the response status.
            if (errorValue !== null) {
                console.warn(`API request to ${url} failed with status ${response.status}. Returning default value.`);
                return errorValue;
            }
            // If no errorValue is provided, throw an error to be caught by the caller.
            throw new Error(`API request failed with status ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching from ${url}:`, error);
        if (errorValue !== null) return errorValue;
        throw error; // Re-throw the error if it's critical
    }
}

/**
 * Fetches the complete dataset for a single player by their UID.
 * This includes main player data and percentile rankings.
 * @param {string} uid - The player's unique identifier.
 * @returns {Promise<{playerData: object, killsPercentile: number, gamesPercentile: number}>} An object containing all player data.
 */
export async function fetchFullPlayerData(uid) {
    const playerUrl = `${API_BASE_URL}/getPlayer?uid=${uid}`;
    const killsPercentileUrl = `${API_BASE_URL}/percentile/killsElo?uid=${uid}`;
    const gamesPercentileUrl = `${API_BASE_URL}/percentile/gamesElo?uid=${uid}`;

    // Fetch the main player data first, as it's the most critical part.
    const playerData = await fetchData(playerUrl);
    if (!playerData) {
        throw new Error('Player data not found or API error.');
    }

    // Fetch percentile data concurrently. If they fail, default to 0.
    const [killsPercentile, gamesPercentile] = await Promise.all([
        fetchData(killsPercentileUrl, {}, 0),
        fetchData(gamesPercentileUrl, {}, 0)
    ]);
    
    // Check if percentile calls returned a warning and add a note if needed.
    if (killsPercentile === 0 || gamesPercentile === 0) {
        console.warn('Could not fetch all percentile data. Some values may be defaulted to 0.');
    }

    return { playerData, killsPercentile, gamesPercentile };
}

/**
 * Searches for players by their in-game name.
 * @param {string} query - The name (or partial name) to search for.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of player objects.
 */
export async function searchPlayerByName(query) {
    const searchUrl = `${API_BASE_URL}/searchByName?query=${encodeURIComponent(query)}`;
    const searchResults = await fetchData(searchUrl, {}, []); // Default to empty array on failure
    return searchResults;
}