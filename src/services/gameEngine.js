/**
 * Game Engine - Pure functions for game logic
 * Mutates passed objects but does NOT save to DB
 * Routes/jobs are responsible for calling .save()
 */

import gameConfig from '../config/gameConfig.js';
import { getRankForLevel } from '../config/gameConfig.js';

/**
 * Calculate XP needed for next level
 * @param {number} level - current level
 * @returns {number} XP required
 */
export function xpForNextLevel(level) {
  if (!Number.isInteger(level) || level < 1) level = 1;
  return level * gameConfig.xpPerLevelBase;
}

/**
 * Get rank for a given level
 * @param {number} level
 * @returns {string} rank letter
 */
export function rankForLevel(level) {
  if (!Number.isInteger(level) || level < 1) level = 1;
  return getRankForLevel(level);
}

/**
 * Build daily quest items from config defaults
 * @param {object} hunter - hunter document (for future scaling)
 * @returns {array} fresh items array
 */
export function buildDailyQuestItems(hunter) {
  // TODO: scale targets based on hunter level/rank
  // For now, return config defaults with progress=0, done=false
  return gameConfig.defaultQuestItems.map(item => ({
    key: item.key,
    label: item.label,
    target: item.target,
    progress: 0,
    unit: item.unit,
    done: false,
  }));
}

/**
 * Grant XP to hunter, handling multiple level-ups
 * @param {object} hunter - hunter document (mutated)
 * @param {number} amount - XP to grant (must be >= 0)
 * @returns {object} { leveledUp, rankedUp, newLevel, newRank }
 */
export function grantXp(hunter, amount) {
  if (!hunter || typeof amount !== 'number' || amount < 0) {
    return { leveledUp: false, rankedUp: false, newLevel: hunter?.level ?? 1, newRank: hunter?.rank ?? 'E' };
  }

  const oldLevel = hunter.level;
  const oldRank = hunter.rank;
  let leveledUp = false;
  let rankedUp = false;

  hunter.xp += amount;

  // Handle multiple level-ups
  while (hunter.xp >= xpForNextLevel(hunter.level)) {
    hunter.xp -= xpForNextLevel(hunter.level);
    hunter.level += 1;
    leveledUp = true;

    const newRank = rankForLevel(hunter.level);
    if (newRank !== hunter.rank) {
      hunter.rank = newRank;
      rankedUp = true;
    }
  }

  return {
    leveledUp,
    rankedUp,
    newLevel: hunter.level,
    newRank: hunter.rank,
  };
}

/**
 * Apply progress to a quest item, awarding XP appropriately
 * @param {object} hunter - hunter document (mutated)
 * @param {object} questLog - questLog document (mutated)
 * @param {string} itemKey - key of the item to progress
 * @param {number} amount - progress amount (must be >= 0)
 * @returns {object} result describing what happened
 */
export function applyProgress(hunter, questLog, itemKey, amount) {
  if (!hunter || !questLog || typeof amount !== 'number' || amount < 0) {
    return {
      xpGained: 0,
      itemCompleted: false,
      questCompleted: false,
      leveledUp: false,
      rankedUp: false,
      newLevel: hunter?.level ?? 1,
      newRank: hunter?.rank ?? 'E',
    };
  }

  const item = questLog.items.find(i => i.key === itemKey);
  if (!item) {
    return {
      xpGained: 0,
      itemCompleted: false,
      questCompleted: false,
      leveledUp: false,
      rankedUp: false,
      newLevel: hunter.level,
      newRank: hunter.rank,
    };
  }

  let xpGained = 0;
  let itemCompleted = false;
  let questCompleted = false;

  // Update progress, clamp at target
  const newProgress = Math.min(item.progress + amount, item.target);
  const wasDone = item.done;
  item.progress = newProgress;

  if (!wasDone && item.progress >= item.target) {
    item.done = true;
    itemCompleted = true;

    // Award partial XP the first time this item becomes done
    xpGained += gameConfig.xpPerPartialItem;

    // Check if ALL items are now done
    const allDone = questLog.items.every(i => i.done);
    const wasQuestCompleted = questLog.completed;

    if (allDone && !wasQuestCompleted) {
      questLog.completed = true;
      questCompleted = true;

      // Award full completion bonus XP
      xpGained += gameConfig.xpPerFullCompletion;

      // Grant XP and handle level/rank ups
      const grantResult = grantXp(hunter, xpGained);

      // Apply stat gains
      for (const [stat, gain] of Object.entries(gameConfig.statGainsOnCompletion)) {
        hunter.stats[stat] = (hunter.stats[stat] || gameConfig.initialStats[stat]) + gain;
      }

      // Update streak and totals
      hunter.streak += 1;
      if (hunter.streak > hunter.bestStreak) {
        hunter.bestStreak = hunter.streak;
      }
      hunter.totalQuestsCompleted += 1;

      return {
        xpGained,
        itemCompleted,
        questCompleted,
        leveledUp: grantResult.leveledUp,
        rankedUp: grantResult.rankedUp,
        newLevel: grantResult.newLevel,
        newRank: grantResult.newRank,
      };
    }
  }

  // If only item completed but not full quest
  if (itemCompleted && xpGained > 0) {
    const grantResult = grantXp(hunter, xpGained);
    return {
      xpGained,
      itemCompleted,
      questCompleted: false,
      leveledUp: grantResult.leveledUp,
      rankedUp: grantResult.rankedUp,
      newLevel: grantResult.newLevel,
      newRank: grantResult.newRank,
    };
  }

  return {
    xpGained: 0,
    itemCompleted: false,
    questCompleted: false,
    leveledUp: false,
    rankedUp: false,
    newLevel: hunter.level,
    newRank: hunter.rank,
  };
}

/**
 * Apply penalty for missed day
 * @param {object} hunter - hunter document (mutated)
 * @param {string} date - date string (YYYY-MM-DD)
 * @returns {object} summary of penalty applied
 */
export function applyPenalty(hunter, date) {
  if (!hunter) {
    return { xpLost: 0, streakLost: 0, leveledDown: false };
  }

  const oldStreak = hunter.streak;
  const oldXp = hunter.xp;

  // Calculate XP loss (never below 0)
  const xpLoss = Math.min(gameConfig.penaltyXpLoss, hunter.xp);
  hunter.xp = Math.max(0, hunter.xp - gameConfig.penaltyXpLoss);

  // XP is floored at 0, level never decreases
  // (The while-loop in grantXp only goes up, never down)

  // Reset streak
  hunter.streak = 0;

  return {
    xpLost: xpLoss,
    streakLost: oldStreak,
    leveledDown: false, // never changes level downward
  };
}

export default {
  xpForNextLevel,
  rankForLevel,
  buildDailyQuestItems,
  grantXp,
  applyProgress,
  applyPenalty,
};