// fetch-data.js - Advanced version with caching, retry, and better error handling

import { writeFileSync, readFileSync, existsSync } from 'fs';

// Configuration
const CONFIG = {
  rateLimit: 18,           // Safe limit under 20/min
  rateWindowMs: 60 * 1000, // 60 seconds
  batchSize: 5,            // Process 5 squads at a time
  batchDelayMs: 1000,      // 1 second delay between batches
  maxRetries: 3,           // Retry failed requests up to 3 times
  retryDelayMs: 2000,      // Wait 2 seconds before retry
  cacheFile: 'squad-data.json', // Previous data file for caching
  cacheDurationHours: 24   // How old data can be before forcing refresh
};

// Track API calls
let requestTimestamps = [];
let totalApiCalls = 0;
let cachedCount = 0;
let failedSquads = [];

/**
 * Checks if we can make an API call without exceeding rate limit
 * Waits if necessary
 */
async function checkRateLimit() {
  const now = Date.now();
  
  // Remove timestamps older than the rate window
  requestTimestamps = requestTimestamps.filter(
    timestamp => now - timestamp < CONFIG.rateWindowMs
  );
  
  // If we're at the limit, wait until the oldest request expires
  if (requestTimestamps.length >= CONFIG.rateLimit) {
    const oldestRequest = requestTimestamps[0];
    const waitTime = CONFIG.rateWindowMs - (now - oldestRequest) + 100; // Add 100ms buffer
    
    console.log(`⏳ Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    // Clear old timestamps after waiting
    requestTimestamps = [];
  }
  
  // Record this request
  requestTimestamps.push(Date.now());
  totalApiCalls++;
}

/**
 * Fetches JSON from a URL with retry logic
 * @param {string} url The URL to fetch
 * @param {number} attempt Current attempt number
 * @returns {Promise<any>} The JSON response
 */
async function fetchJsonWithRetry(url, attempt = 1) {
  await checkRateLimit();
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    if (attempt < CONFIG.maxRetries) {
      console.warn(`  ⚠️  Attempt ${attempt} failed: ${error.message}`);
      console.log(`  🔄 Retrying in ${CONFIG.retryDelayMs / 1000}s... (Attempt ${attempt + 1}/${CONFIG.maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelayMs));
      return fetchJsonWithRetry(url, attempt + 1);
    }
    throw error;
  }
}

/**
 * Load previous squad data for caching
 * @returns {Map<string, object>} Map of squad name to cached data
 */
function loadPreviousData() {
  const cache = new Map();
  
  if (!existsSync(CONFIG.cacheFile)) {
    console.log("ℹ️  No previous data file found. All squads will be fetched fresh.\n");
    return cache;
  }
  
  try {
    const previousData = JSON.parse(readFileSync(CONFIG.cacheFile, 'utf-8'));
    const lastUpdated = new Date(previousData.lastUpdated);
    const ageHours = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
    
    console.log(`📁 Found previous data from ${lastUpdated.toLocaleString()}`);
    console.log(`   Age: ${ageHours.toFixed(1)} hours`);
    
    if (ageHours < CONFIG.cacheDurationHours && Array.isArray(previousData.squads)) {
      previousData.squads.forEach(squad => {
        cache.set(squad.name, squad);
      });
      console.log(`   ✓ Loaded ${cache.size} cached squad counts\n`);
    } else {
      console.log(`   ⚠️  Data too old (>${CONFIG.cacheDurationHours}h). Will fetch fresh.\n`);
    }
    
    return cache;
  } catch (error) {
    console.warn(`⚠️  Could not load previous data: ${error.message}\n`);
    return cache;
  }
}

/**
 * Fetches the member count for a single squad
 * @param {string} squadName The name of the squad
 * @param {Map} cache Cache of previous data
 * @returns {Promise<object>} Squad data with name and count
 */
async function fetchSquadData(squadName, cache) {
  // Check cache first
  const cached = cache.get(squadName);
  if (cached && cached.count !== undefined) {
    cachedCount++;
    return cached;
  }
  
  try {
    const members = await fetchJsonWithRetry(
      `https://wbapi.wbpjs.com/squad/getSquadMembers?squadName=${encodeURIComponent(squadName)}`
    );
    return {
      name: squadName,
      count: Array.isArray(members) ? members.length : 0
    };
  } catch (err) {
    console.error(`  ❌ Failed to fetch ${squadName}: ${err.message}`);
    failedSquads.push({ name: squadName, error: err.message });
    
    // Return cached data if available, otherwise return 0
    if (cached) {
      console.log(`  ℹ️  Using stale cached data for ${squadName}: ${cached.count} members`);
      return cached;
    }
    
    return { name: squadName, count: 0 };
  }
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Process squads in batches to respect rate limits
 */
async function fetchSquadsInBatches(squadList, cache) {
  const results = [];
  const totalSquads = squadList.length;
  
  console.log("=".repeat(60));
  console.log(`Processing ${totalSquads} squads in batches of ${CONFIG.batchSize}`);
  console.log("=".repeat(60));
  
  for (let i = 0; i < squadList.length; i += CONFIG.batchSize) {
    const batch = squadList.slice(i, i + CONFIG.batchSize);
    const batchNumber = Math.floor(i / CONFIG.batchSize) + 1;
    const totalBatches = Math.ceil(squadList.length / CONFIG.batchSize);
    
    console.log(`\n📦 Batch ${batchNumber}/${totalBatches} (Squads ${i + 1}-${Math.min(i + CONFIG.batchSize, totalSquads)})`);
    
    // Process batch in parallel
    const batchPromises = batch.map(async (name) => {
      const data = await fetchSquadData(name, cache);
      const icon = cache.has(name) && data.count === cache.get(name).count ? '💾' : '🆕';
      console.log(`  ${icon} ${name}: ${data.count} members`);
      return data;
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Progress indicator
    const progress = ((i + CONFIG.batchSize) / totalSquads * 100).toFixed(1);
    console.log(`  Progress: ${Math.min(i + CONFIG.batchSize, totalSquads)}/${totalSquads} (${progress}%)`);
    
    // Wait between batches (except for the last one)
    if (i + CONFIG.batchSize < squadList.length) {
      await sleep(CONFIG.batchDelayMs);
    }
  }
  
  return results;
}

/**
 * Main function to run the data fetching process
 */
async function run() {
  console.log("\n" + "=".repeat(60));
  console.log("🎯 SQUAD DATA FETCH - STARTING");
  console.log("=".repeat(60));
  console.log(`Started at: ${new Date().toLocaleString()}`);
  
  const startTime = Date.now();
  
  try {
    // Load previous data for caching
    const cache = loadPreviousData();
    
    // Fetch the list of all squads
    console.log("📋 Fetching squad list...");
    const squadList = await fetchJsonWithRetry('https://wbapi.wbpjs.com/squad/getSquadList');
    console.log(`   ✓ Found ${squadList.length} squads\n`);
    
    // Fetch member counts in batches
    const squads = await fetchSquadsInBatches(squadList, cache);
    
    // Sort squads by member count (descending) for better readability
    squads.sort((a, b) => b.count - a.count);
    
    // Calculate statistics
    const totalMembers = squads.reduce((sum, s) => sum + s.count, 0);
    const activeSquads = squads.filter(s => s.count > 0).length;
    const emptySquads = squads.filter(s => s.count === 0).length;
    const avgMembers = totalMembers / activeSquads;
    
    // Create the final data object
    const dataToSave = {
      lastUpdated: new Date().toISOString(),
      statistics: {
        totalSquads: squads.length,
        activeSquads: activeSquads,
        emptySquads: emptySquads,
        totalMembers: totalMembers,
        averageMembers: parseFloat(avgMembers.toFixed(2))
      },
      fetchInfo: {
        totalApiCalls: totalApiCalls,
        cachedResults: cachedCount,
        failedFetches: failedSquads.length,
        duration: ((Date.now() - startTime) / 1000).toFixed(1) + 's'
      },
      squads: squads
    };

    // Save the data
    writeFileSync(CONFIG.cacheFile, JSON.stringify(dataToSave, null, 2));
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    
    // Final report
    console.log("\n" + "=".repeat(60));
    console.log("✅ SQUAD DATA FETCH - COMPLETED");
    console.log("=".repeat(60));
    console.log(`📊 Statistics:`);
    console.log(`   Total squads: ${squads.length}`);
    console.log(`   Active squads: ${activeSquads} (${(activeSquads / squads.length * 100).toFixed(1)}%)`);
    console.log(`   Empty squads: ${emptySquads}`);
    console.log(`   Total members: ${totalMembers.toLocaleString()}`);
    console.log(`   Average members: ${avgMembers.toFixed(2)}`);
    console.log(`\n⚡ Performance:`);
    console.log(`   Total time: ${duration}s`);
    console.log(`   API calls made: ${totalApiCalls}`);
    console.log(`   Cached results: ${cachedCount} (${(cachedCount / squads.length * 100).toFixed(1)}%)`);
    console.log(`   Failed fetches: ${failedSquads.length}`);
    console.log(`   Avg time/squad: ${(parseFloat(duration) / squads.length).toFixed(2)}s`);
    
    if (failedSquads.length > 0) {
      console.log(`\n⚠️  Failed squads (${failedSquads.length}):`);
      failedSquads.forEach(s => console.log(`   - ${s.name}: ${s.error}`));
    }
    
    console.log("=".repeat(60));
    console.log(`Completed at: ${new Date().toLocaleString()}\n`);
    
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ FATAL ERROR");
    console.error("=".repeat(60));
    console.error(error);
    console.error("=".repeat(60));
    process.exit(1);
  }
}

run();