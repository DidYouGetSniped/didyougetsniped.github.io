// fetch-data.js - Optimized version with proper rate limiting and comprehensive stats

import { writeFileSync, readFileSync, existsSync } from 'fs';

// Configuration
const CONFIG = {
  rateLimit: 18,           // Safe limit under 20/min
  rateWindowMs: 60 * 1000, // 60 seconds
  batchSize: 3,            // Process 3 squads at a time (reduced for safety)
  batchDelayMs: 10000,     // 10 second delay = 3 calls per 10s = 18 calls/min ✅
  maxRetries: 3,
  retryDelayMs: 2000,
  cacheFile: 'squad-data.json',
  cacheDurationHours: 12,
  failedSquadsFile: 'failed-squads.json' // Track failed squads for priority retry
};

// Track API calls
let requestTimestamps = [];
let totalApiCalls = 0;
let failedSquads = [];

/**
 * Load previously failed squads for priority processing
 */
function loadFailedSquads() {
  if (!existsSync(CONFIG.failedSquadsFile)) {
    return [];
  }
  
  try {
    const data = JSON.parse(readFileSync(CONFIG.failedSquadsFile, 'utf-8'));
    const failedNames = data.failed || [];
    console.log(`📋 Found ${failedNames.length} previously failed squads - will retry these first\n`);
    return failedNames;
  } catch (error) {
    console.warn(`⚠️  Could not load failed squads list: ${error.message}\n`);
    return [];
  }
}

/**
 * Save failed squads for next run
 */
function saveFailedSquads() {
  try {
    const failedNames = failedSquads.map(s => s.name);
    writeFileSync(CONFIG.failedSquadsFile, JSON.stringify({ 
      failed: failedNames,
      lastUpdated: new Date().toISOString(),
      count: failedNames.length
    }, null, 2));
    console.log(`💾 Saved ${failedNames.length} failed squads for priority retry next time\n`);
  } catch (error) {
    console.warn(`⚠️  Could not save failed squads list: ${error.message}\n`);
  }
}

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
    const waitTime = CONFIG.rateWindowMs - (now - oldestRequest) + 1000; // Add 1s buffer
    
    console.log(`⏳ Rate limit reached (${requestTimestamps.length}/${CONFIG.rateLimit}). Waiting ${Math.ceil(waitTime / 1000)}s...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    // Clear old timestamps after waiting
    requestTimestamps = requestTimestamps.filter(
      timestamp => Date.now() - timestamp < CONFIG.rateWindowMs
    );
  }
  
  // Record this request
  requestTimestamps.push(Date.now());
  totalApiCalls++;
}

/**
 * Fetches JSON from a URL with retry logic
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
 * Load previous squad data for fallback only
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
    console.log(`   Will fetch fresh data (cache only used as error fallback)\n`);
    
    if (Array.isArray(previousData.squads)) {
      previousData.squads.forEach(squad => {
        cache.set(squad.name, squad);
      });
    }
    
    return cache;
  } catch (error) {
    console.warn(`⚠️  Could not load previous data: ${error.message}\n`);
    return cache;
  }
}

/**
 * Fetches the member count and stats for a single squad
 */
async function fetchSquadData(squadName, cache) {
  try {
    const members = await fetchJsonWithRetry(
      `https://wbapi.wbpjs.com/squad/getSquadMembers?squadName=${encodeURIComponent(squadName)}`
    );
    
    const count = Array.isArray(members) ? members.length : 0;
    
    // Calculate member statistics if there are members
    let memberStats = null;
    if (count > 0 && Array.isArray(members)) {
      let totalKillsELO = 0;
      let totalGamesELO = 0;
      let totalLevel = 0;
      let steamCount = 0;
      let validMembers = 0;
      
      members.forEach(member => {
        if (member && typeof member === 'object') {
          validMembers++;
          totalKillsELO += member.killsELO || 0;
          totalGamesELO += member.gamesELO || 0;
          totalLevel += member.level || 0;
          // steam can be true, false, or null - only count if explicitly true
          if (member.steam === true) steamCount++;
        }
      });
      
      if (validMembers > 0) {
        memberStats = {
          avgKillsELO: totalKillsELO / validMembers,
          avgGamesELO: totalGamesELO / validMembers,
          avgLevel: totalLevel / validMembers,
          steamCount: steamCount,
          totalMembers: validMembers
        };
      }
    }
    
    return {
      name: squadName,
      count: count,
      memberStats: memberStats
    };
  } catch (err) {
    console.error(`  ❌ Failed to fetch ${squadName}: ${err.message}`);
    failedSquads.push({ name: squadName, error: err.message });
    
    // Return cached data if available, otherwise return 0
    const cached = cache.get(squadName);
    if (cached) {
      console.log(`  ℹ️  Using stale cached data for ${squadName}: ${cached.count} members`);
      return cached;
    }
    
    return { name: squadName, count: 0, memberStats: null };
  }
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Estimate remaining time
 */
function estimateTimeRemaining(currentBatch, totalBatches, startTime) {
  if (currentBatch === 0) return "calculating...";
  
  const elapsed = Date.now() - startTime;
  const avgTimePerBatch = elapsed / currentBatch;
  const remainingBatches = totalBatches - currentBatch;
  const remainingMs = avgTimePerBatch * remainingBatches;
  
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  
  return `~${minutes}m ${seconds}s`;
}

/**
 * Process squads in batches to respect rate limits
 */
async function fetchSquadsInBatches(squadList, cache) {
  const results = [];
  const totalSquads = squadList.length;
  const totalBatches = Math.ceil(squadList.length / CONFIG.batchSize);
  const batchStartTime = Date.now();
  
  console.log("=".repeat(60));
  console.log(`Processing ${totalSquads} squads in batches of ${CONFIG.batchSize}`);
  console.log(`Total batches: ${totalBatches}`);
  console.log(`Estimated total time: ~${Math.ceil((totalBatches * CONFIG.batchDelayMs) / 60000)} minutes`);
  console.log("=".repeat(60));
  
  for (let i = 0; i < squadList.length; i += CONFIG.batchSize) {
    const batch = squadList.slice(i, i + CONFIG.batchSize);
    const batchNumber = Math.floor(i / CONFIG.batchSize) + 1;
    
    const eta = estimateTimeRemaining(batchNumber - 1, totalBatches, batchStartTime);
    
    console.log(`\n📦 Batch ${batchNumber}/${totalBatches} (Squads ${i + 1}-${Math.min(i + CONFIG.batchSize, totalSquads)}) | ETA: ${eta}`);
    
    // Process batch in parallel
    const batchPromises = batch.map(async (name) => {
      const data = await fetchSquadData(name, cache);
      console.log(`  🆕 ${name}: ${data.count} members`);
      return data;
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Progress indicator
    const progress = Math.min(((i + CONFIG.batchSize) / totalSquads * 100), 100).toFixed(1);
    console.log(`  📊 Progress: ${Math.min(i + CONFIG.batchSize, totalSquads)}/${totalSquads} (${progress}%) | API calls: ${totalApiCalls}`);
    
    // Wait between batches (except for the last one)
    if (i + CONFIG.batchSize < squadList.length) {
      console.log(`  ⏸️  Waiting ${CONFIG.batchDelayMs / 1000}s before next batch...`);
      await sleep(CONFIG.batchDelayMs);
    }
  }
  
  return results;
}

/**
 * Calculate overall statistics across all squads
 */
function calculateOverallStats(squads) {
  let totalKillsELO = 0;
  let totalGamesELO = 0;
  let totalLevel = 0;
  let totalSteamCount = 0;
  let totalPlayers = 0;
  let squadsWithStats = 0;
  
  squads.forEach(squad => {
    if (squad.memberStats && squad.memberStats.totalMembers > 0) {
      // Weight by squad size
      const memberCount = squad.memberStats.totalMembers;
      totalKillsELO += squad.memberStats.avgKillsELO * memberCount;
      totalGamesELO += squad.memberStats.avgGamesELO * memberCount;
      totalLevel += squad.memberStats.avgLevel * memberCount;
      totalSteamCount += squad.memberStats.steamCount;
      totalPlayers += memberCount;
      squadsWithStats++;
    }
  });
  
  if (totalPlayers === 0) {
    return {
      avgKillsELO: 0,
      avgGamesELO: 0,
      avgLevel: 0,
      steamCount: 0,
      steamPercent: 0,
      totalPlayers: 0
    };
  }
  
  return {
    avgKillsELO: totalKillsELO / totalPlayers,
    avgGamesELO: totalGamesELO / totalPlayers,
    avgLevel: totalLevel / totalPlayers,
    steamCount: totalSteamCount,
    steamPercent: parseFloat(((totalSteamCount / totalPlayers) * 100).toFixed(1)),
    totalPlayers: totalPlayers
  };
}

/**
 * Main function to run the data fetching process
 */
async function run() {
  console.log("\n" + "=".repeat(60));
  console.log("🎯 SQUAD DATA FETCH - STARTING");
  console.log("=".repeat(60));
  console.log(`Started at: ${new Date().toLocaleString()}`);
  console.log(`Rate limit: ${CONFIG.rateLimit} requests per ${CONFIG.rateWindowMs / 1000}s`);
  console.log(`Batch size: ${CONFIG.batchSize} squads`);
  console.log(`Batch delay: ${CONFIG.batchDelayMs / 1000}s`);
  
  const startTime = Date.now();
  
  try {
    // Load previous data for fallback only
    const cache = loadPreviousData();
    
    // Load previously failed squads
    const previouslyFailedSquads = loadFailedSquads();
    
    // Fetch the list of all squads
    console.log("📋 Fetching squad list...");
    const squadList = await fetchJsonWithRetry('https://wbapi.wbpjs.com/squad/getSquadList');
    console.log(`   ✓ Found ${squadList.length} squads\n`);
    
    // Prioritize previously failed squads
    const prioritizedList = [];
    const remainingList = [];
    
    squadList.forEach(squadName => {
      if (previouslyFailedSquads.includes(squadName)) {
        prioritizedList.push(squadName);
      } else {
        remainingList.push(squadName);
      }
    });
    
    const orderedSquadList = [...prioritizedList, ...remainingList];
    
    if (prioritizedList.length > 0) {
      console.log(`🔄 Prioritizing ${prioritizedList.length} previously failed squads\n`);
    }
    
    // Fetch member counts in batches
    const squads = await fetchSquadsInBatches(orderedSquadList, cache);
    
    // Sort squads by member count (descending)
    squads.sort((a, b) => b.count - a.count);
    
    // Calculate statistics
    const totalMembers = squads.reduce((sum, s) => sum + s.count, 0);
    // Empty squads = squads with 0 or 1 members
    const emptySquads = squads.filter(s => s.count <= 1).length;
    // Active squads = squads with more than 1 member
    const activeSquads = squads.filter(s => s.count > 1).length;
    // Average members only counts active squads (more than 1 member)
    const avgMembers = activeSquads > 0 
      ? squads.filter(s => s.count > 1).reduce((sum, s) => sum + s.count, 0) / activeSquads 
      : 0;
    
    // Calculate overall player statistics
    const overallStats = calculateOverallStats(squads);
    
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
      overallStats: {
        avgKillsELO: parseFloat(overallStats.avgKillsELO.toFixed(2)),
        avgGamesELO: parseFloat(overallStats.avgGamesELO.toFixed(2)),
        avgLevel: parseFloat(overallStats.avgLevel.toFixed(2)),
        steamCount: overallStats.steamCount,
        steamPercent: overallStats.steamPercent,
        totalPlayers: overallStats.totalPlayers
      },
      fetchInfo: {
        totalApiCalls: totalApiCalls,
        failedFetches: failedSquads.length,
        duration: ((Date.now() - startTime) / 1000).toFixed(1) + 's'
      },
      squads: squads
    };

    // Save the data
    writeFileSync(CONFIG.cacheFile, JSON.stringify(dataToSave, null, 2));
    
    // Save failed squads for next run
    if (failedSquads.length > 0) {
      saveFailedSquads();
    } else if (existsSync(CONFIG.failedSquadsFile)) {
      // Clear the failed squads file if all succeeded
      writeFileSync(CONFIG.failedSquadsFile, JSON.stringify({ 
        failed: [],
        lastUpdated: new Date().toISOString(),
        count: 0
      }, null, 2));
      console.log(`✅ All squads fetched successfully - cleared failed squads list\n`);
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    const minutes = Math.floor(duration / 60);
    const seconds = (duration % 60).toFixed(1);
    
    // Final report
    console.log("\n" + "=".repeat(60));
    console.log("✅ SQUAD DATA FETCH - COMPLETED");
    console.log("=".repeat(60));
    console.log(`📊 Squad Statistics:`);
    console.log(`   Total squads: ${squads.length}`);
    console.log(`   Active squads (>1 member): ${activeSquads} (${(activeSquads / squads.length * 100).toFixed(1)}%)`);
    console.log(`   Empty squads (≤1 member): ${emptySquads} (${(emptySquads / squads.length * 100).toFixed(1)}%)`);
    console.log(`   Total members: ${totalMembers.toLocaleString()}`);
    console.log(`   Average members (active squads only): ${avgMembers.toFixed(2)}`);
    console.log(`\n📊 Player Statistics:`);
    console.log(`   Total players: ${overallStats.totalPlayers.toLocaleString()}`);
    console.log(`   Average Kills ELO: ${overallStats.avgKillsELO.toFixed(2)}`);
    console.log(`   Average Games ELO: ${overallStats.avgGamesELO.toFixed(2)}`);
    console.log(`   Average Level: ${overallStats.avgLevel.toFixed(2)}`);
    console.log(`   Steam users: ${overallStats.steamCount.toLocaleString()} (${overallStats.steamPercent}%)`);
    console.log(`\n⚡ Performance:`);
    console.log(`   Total time: ${minutes}m ${seconds}s`);
    console.log(`   API calls made: ${totalApiCalls}`);
    console.log(`   Failed fetches: ${failedSquads.length}`);
    console.log(`   Avg time/squad: ${(parseFloat(duration) / squads.length).toFixed(2)}s`);
    console.log(`   Avg requests/min: ${((totalApiCalls / parseFloat(duration)) * 60).toFixed(2)}`);
    
    if (failedSquads.length > 0) {
      console.log(`\n⚠️  Failed squads (${failedSquads.length}) - will retry first next time:`);
      failedSquads.slice(0, 10).forEach(s => console.log(`   - ${s.name}: ${s.error}`));
      if (failedSquads.length > 10) {
        console.log(`   ... and ${failedSquads.length - 10} more`);
      }
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