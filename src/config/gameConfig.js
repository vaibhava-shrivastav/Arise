/**
 * Game Configuration - Single source of truth for all game numbers
 * All services must read from this config, not redefine numbers
 */

export const gameConfig = {
  // Default daily quest items
  defaultQuestItems: [
    { key: 'pushups', label: 'Push-ups', target: 100, unit: 'reps' },
    { key: 'situps', label: 'Sit-ups', target: 100, unit: 'reps' },
    { key: 'squats', label: 'Squats', target: 100, unit: 'reps' },
    { key: 'run', label: 'Run', target: 10, unit: 'km' },
  ],

  // XP values
  xpPerFullCompletion: 150,
  xpPerPartialItem: 10,
  xpPerLevelBase: 100, // XP needed for next level = level * 100

  // Stat gains on full completion
  statGainsOnCompletion: {
    strength: 1,
    agility: 1,
    vitality: 1,
    intelligence: 0,
    sense: 0,
  },

  // Penalty
  penaltyXpLoss: 50,

  // Rank thresholds (by level)
  rankThresholds: {
    E: { min: 1, max: 7 },
    D: { min: 8, max: 14 },
    C: { min: 15, max: 24 },
    B: { min: 25, max: 34 },
    A: { min: 35, max: 49 },
    S: { min: 50, max: Infinity },
  },

  // Default timezone
  defaultTimezone: 'Asia/Kolkata',

  // Initial stats
  initialStats: {
    strength: 10,
    agility: 10,
    vitality: 10,
    intelligence: 10,
    sense: 10,
  },
};

/**
 * Get rank for a given level
 * @param {number} level
 * @returns {string} rank letter
 */
export function getRankForLevel(level) {
  for (const [rank, range] of Object.entries(gameConfig.rankThresholds)) {
    if (level >= range.min && level <= range.max) {
      return rank;
    }
  }
  return 'S'; // fallback
}

/**
 * Get XP needed for next level
 * @param {number} level
 * @returns {number}
 */
export function getXpForNextLevel(level) {
  return level * gameConfig.xpPerLevelBase;
}

export default gameConfig;