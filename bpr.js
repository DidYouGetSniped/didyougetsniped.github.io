export function calculatePerformanceScore(totalKills, damageDealt, totalDeaths, damageReceived, killsEloRank, gamesEloRank, totalGames, numSelfDestructs, xp) {
    try {
        if (totalDeaths === 0 || damageReceived === 0 || killsEloRank === 0 || gamesEloRank === 0 || totalGames === 0) {
            return null;
        }

        const selfDestructPercentage = numSelfDestructs / totalDeaths;
        const combatRatio = (totalKills * damageDealt) / (totalDeaths * damageReceived);
        const killsEloBonus = Math.pow(1 / killsEloRank, 1 / 4) / 6.2;
        const factorA = Math.sqrt(combatRatio) + killsEloBonus;
        const avgDamageImpact = damageDealt / (8250 * totalGames);
        const gamesEloBonus = Math.pow(1 / gamesEloRank, 1 / 4) / 13.2;
        const resilience = (damageReceived * (1 - selfDestructPercentage)) / (660 * totalDeaths);
        const factorB = avgDamageImpact + gamesEloBonus + resilience;
        const corePerformanceScore = Math.sqrt(factorA * factorB);
        const experienceBonus = Math.pow(xp, 1 / 4) / 62;
        const overallScore = (corePerformanceScore + experienceBonus) * 100;

        if (Number.isNaN(overallScore) || !Number.isFinite(overallScore)) {
            return null;
        }

        return overallScore;
    } catch {
        return null;
    }
}

export function roundPerformanceScore(score) {
    if (score === null || score === undefined) {
        return null;
    }

    return Number(Number(score).toFixed(3));
}
