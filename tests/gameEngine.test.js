/**
 * Game Engine Unit Tests
 * Run with: node --test tests/gameEngine.test.js
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  xpForNextLevel,
  rankForLevel,
  buildDailyQuestItems,
  grantXp,
  applyProgress,
  applyPenalty,
} from '../src/services/gameEngine.js';
import gameConfig from '../src/config/gameConfig.js';

// Helper to create a mock hunter object
function createMockHunter(overrides = {}) {
  return {
    level: 1,
    xp: 0,
    rank: 'E',
    stats: {
      strength: 10,
      agility: 10,
      vitality: 10,
      intelligence: 10,
      sense: 10,
    },
    streak: 0,
    bestStreak: 0,
    totalQuestsCompleted: 0,
    ...overrides,
  };
}

// Helper to create a mock questLog
function createMockQuestLog(overrides = {}) {
  return {
    items: gameConfig.defaultQuestItems.map(item => ({
      key: item.key,
      label: item.label,
      target: item.target,
      progress: 0,
      unit: item.unit,
      done: false,
    })),
    completed: false,
    xpAwarded: 0,
    ...overrides,
  };
}

describe('xpForNextLevel', () => {
  test('level 1 returns 100', () => {
    assert.equal(xpForNextLevel(1), 100);
  });

  test('level 7 returns 700', () => {
    assert.equal(xpForNextLevel(7), 700);
  });

  test('level 50 returns 5000', () => {
    assert.equal(xpForNextLevel(50), 5000);
  });

  test('handles invalid input gracefully', () => {
    assert.equal(xpForNextLevel(0), 100); // floors to 1
    assert.equal(xpForNextLevel(-5), 100);
    assert.equal(xpForNextLevel(1.5), 100); // floors to 1
  });
});

describe('rankForLevel', () => {
  test('E rank: levels 1-7', () => {
    for (let level = 1; level <= 7; level++) {
      assert.equal(rankForLevel(level), 'E');
    }
  });

  test('D rank: levels 8-14', () => {
    for (let level = 8; level <= 14; level++) {
      assert.equal(rankForLevel(level), 'D');
    }
  });

  test('C rank: levels 15-24', () => {
    for (let level = 15; level <= 24; level++) {
      assert.equal(rankForLevel(level), 'C');
    }
  });

  test('B rank: levels 25-34', () => {
    for (let level = 25; level <= 34; level++) {
      assert.equal(rankForLevel(level), 'B');
    }
  });

  test('A rank: levels 35-49', () => {
    for (let level = 35; level <= 49; level++) {
      assert.equal(rankForLevel(level), 'A');
    }
  });

  test('S rank: level 50+', () => {
    for (let level = 50; level <= 60; level++) {
      assert.equal(rankForLevel(level), 'S');
    }
  });

  test('boundary: level 7 is E, level 8 is D', () => {
    assert.equal(rankForLevel(7), 'E');
    assert.equal(rankForLevel(8), 'D');
  });

  test('boundary: level 14 is D, level 15 is C', () => {
    assert.equal(rankForLevel(14), 'D');
    assert.equal(rankForLevel(15), 'C');
  });

  test('boundary: level 24 is C, level 25 is B', () => {
    assert.equal(rankForLevel(24), 'C');
    assert.equal(rankForLevel(25), 'B');
  });

  test('boundary: level 34 is B, level 35 is A', () => {
    assert.equal(rankForLevel(34), 'B');
    assert.equal(rankForLevel(35), 'A');
  });

  test('boundary: level 49 is A, level 50 is S', () => {
    assert.equal(rankForLevel(49), 'A');
    assert.equal(rankForLevel(50), 'S');
  });

  test('handles invalid input gracefully', () => {
    assert.equal(rankForLevel(0), 'E');
    assert.equal(rankForLevel(-5), 'E');
  });
});

describe('buildDailyQuestItems', () => {
  test('returns 4 items with correct keys', () => {
    const hunter = createMockHunter();
    const items = buildDailyQuestItems(hunter);
    assert.equal(items.length, 4);
    assert.deepEqual(items.map(i => i.key), ['pushups', 'situps', 'squats', 'run']);
  });

  test('items have progress=0, done=false', () => {
    const hunter = createMockHunter();
    const items = buildDailyQuestItems(hunter);
    for (const item of items) {
      assert.equal(item.progress, 0);
      assert.equal(item.done, false);
    }
  });

  test('returns fresh array each call', () => {
    const hunter = createMockHunter();
    const items1 = buildDailyQuestItems(hunter);
    const items2 = buildDailyQuestItems(hunter);
    assert.notStrictEqual(items1, items2);
  });
});

describe('grantXp', () => {
  test('no level-up when XP below threshold', () => {
    const hunter = createMockHunter({ level: 1, xp: 50 });
    const result = grantXp(hunter, 30);
    assert.equal(hunter.xp, 80);
    assert.equal(hunter.level, 1);
    assert.equal(result.leveledUp, false);
  });

  test('exactly one level-up', () => {
    const hunter = createMockHunter({ level: 1, xp: 50 });
    const result = grantXp(hunter, 60); // 110 total, 100 needed for level 2, 10 remainder
    assert.equal(hunter.level, 2);
    assert.equal(hunter.xp, 10);
    assert.equal(result.leveledUp, true);
    assert.equal(result.newLevel, 2);
  });

  test('multiple level-ups from huge XP grant', () => {
    const hunter = createMockHunter({ level: 1, xp: 0 });
    const result = grantXp(hunter, 5000); // should jump many levels
    assert.ok(hunter.level > 1);
    assert.equal(result.leveledUp, true);
    assert.ok(result.newLevel > 1);
  });

  test('rank updates on rank boundary (7->8: E->D)', () => {
    const hunter = createMockHunter({ level: 7, xp: 690 }); // level 7 needs 700 for level 8
    const result = grantXp(hunter, 20); // 710 total -> level 8
    assert.equal(hunter.level, 8);
    assert.equal(hunter.rank, 'D');
    assert.equal(result.rankedUp, true);
    assert.equal(result.newRank, 'D');
  });

  test('rank updates on rank boundary (49->50: A->S)', () => {
    const hunter = createMockHunter({ level: 49, xp: 4890 }); // level 49 needs 4900 for level 50
    const result = grantXp(hunter, 20); // 4910 total -> level 50
    assert.equal(hunter.level, 50);
    assert.equal(hunter.rank, 'S');
    assert.equal(result.rankedUp, true);
    assert.equal(result.newRank, 'S');
  });

  test('never goes negative', () => {
    const hunter = createMockHunter({ level: 1, xp: 0 });
    grantXp(hunter, -100); // negative amount
    assert.equal(hunter.xp, 0);
    assert.equal(hunter.level, 1);
  });

  test('handles invalid hunter gracefully', () => {
    const result = grantXp(null, 100);
    assert.equal(result.leveledUp, false);
  });
});

describe('applyProgress', () => {
  test('partial completion awards partial XP once per item', () => {
    const hunter = createMockHunter({ level: 1, xp: 0 });
    const questLog = createMockQuestLog();

    // First progress on pushups
    const result1 = applyProgress(hunter, questLog, 'pushups', 50);
    assert.equal(result1.xpGained, 0);
    assert.equal(result1.itemCompleted, false);

    // Complete pushups
    const result2 = applyProgress(hunter, questLog, 'pushups', 50);
    assert.equal(result2.xpGained, gameConfig.xpPerPartialItem); // 10
    assert.equal(result2.itemCompleted, true);
    assert.equal(result2.questCompleted, false);

    // Try to complete again - should NOT award again
    const result3 = applyProgress(hunter, questLog, 'pushups', 10);
    assert.equal(result3.xpGained, 0);
    assert.equal(result3.itemCompleted, false);
  });

  test('full completion awards bonus XP once only', () => {
    const hunter = createMockHunter({ level: 1, xp: 0 });
    const questLog = createMockQuestLog();

    // Complete all 4 items
    applyProgress(hunter, questLog, 'pushups', 100);
    applyProgress(hunter, questLog, 'situps', 100);
    applyProgress(hunter, questLog, 'squats', 100);
    const result4 = applyProgress(hunter, questLog, 'run', 100);

    // Last call gives: 10 (partial for run) + 150 (bonus) = 160
    // Total XP granted: 4 * 10 + 150 = 190
    // But 190 XP at level 1 triggers level-up to level 2 (costs 100), leaving 90 XP
    assert.equal(result4.xpGained, 160);
    assert.equal(result4.questCompleted, true);
    assert.equal(questLog.completed, true);
    assert.equal(hunter.totalQuestsCompleted, 1);
    assert.equal(hunter.streak, 1);
    assert.equal(hunter.bestStreak, 1);
    // Check: hunter leveled up to 2, has 90 XP remaining
    assert.equal(hunter.level, 2);
    assert.equal(hunter.xp, 90);

    // Calling again after completed should NOT double-award
    const result5 = applyProgress(hunter, questLog, 'pushups', 10);
    assert.equal(result5.xpGained, 0);
    assert.equal(result5.questCompleted, false);
  });

  test('progress clamps at target', () => {
    const hunter = createMockHunter();
    const questLog = createMockQuestLog();

    applyProgress(hunter, questLog, 'pushups', 150); // over target
    const item = questLog.items.find(i => i.key === 'pushups');
    assert.equal(item.progress, 100); // clamped to target
    assert.equal(item.done, true);
  });

  test('updates stats on full completion', () => {
    const hunter = createMockHunter({ level: 1, xp: 0 });
    const questLog = createMockQuestLog();

    applyProgress(hunter, questLog, 'pushups', 100);
    applyProgress(hunter, questLog, 'situps', 100);
    applyProgress(hunter, questLog, 'squats', 100);
    applyProgress(hunter, questLog, 'run', 100);

    assert.equal(hunter.stats.strength, 11);
    assert.equal(hunter.stats.agility, 11);
    assert.equal(hunter.stats.vitality, 11);
    // intelligence and sense should not change
    assert.equal(hunter.stats.intelligence, 10);
    assert.equal(hunter.stats.sense, 10);
  });

  test('increments streak and bestStreak on full completion', () => {
    const hunter = createMockHunter({ level: 1, xp: 0, streak: 2, bestStreak: 5 });
    const questLog = createMockQuestLog();

    applyProgress(hunter, questLog, 'pushups', 100);
    applyProgress(hunter, questLog, 'situps', 100);
    applyProgress(hunter, questLog, 'squats', 100);
    applyProgress(hunter, questLog, 'run', 100);

    assert.equal(hunter.streak, 3);
    assert.equal(hunter.bestStreak, 5); // unchanged since 3 < 5
  });

  test('updates bestStreak when new record', () => {
    const hunter = createMockHunter({ level: 1, xp: 0, streak: 4, bestStreak: 4 });
    const questLog = createMockQuestLog();

    applyProgress(hunter, questLog, 'pushups', 100);
    applyProgress(hunter, questLog, 'situps', 100);
    applyProgress(hunter, questLog, 'squats', 100);
    applyProgress(hunter, questLog, 'run', 100);

    assert.equal(hunter.streak, 5);
    assert.equal(hunter.bestStreak, 5);
  });

  test('handles invalid input gracefully', () => {
    const hunter = createMockHunter();
    const questLog = createMockQuestLog();

    // invalid item key
    const result = applyProgress(hunter, questLog, 'nonexistent', 10);
    assert.equal(result.xpGained, 0);

    // negative amount
    const result2 = applyProgress(hunter, questLog, 'pushups', -5);
    assert.equal(result2.xpGained, 0);
  });
});

describe('applyPenalty', () => {
  test('deducts penalty XP, floors at 0', () => {
    const hunter = createMockHunter({ level: 1, xp: 30 });
    const result = applyPenalty(hunter, '2024-01-15');
    assert.equal(hunter.xp, 0);
    assert.equal(result.xpLost, 30); // only 30 available to lose
  });

  test('deducts full penalty when enough XP', () => {
    const hunter = createMockHunter({ level: 1, xp: 100 });
    const result = applyPenalty(hunter, '2024-01-15');
    assert.equal(hunter.xp, 50);
    assert.equal(result.xpLost, 50);
  });

  test('always resets streak to 0', () => {
    const hunter = createMockHunter({ level: 1, xp: 100, streak: 10 });
    const result = applyPenalty(hunter, '2024-01-15');
    assert.equal(hunter.streak, 0);
    assert.equal(result.streakLost, 10);
  });

  test('never changes level downward', () => {
    const hunter = createMockHunter({ level: 5, xp: 0 }); // level 5, 0 XP
    const result = applyPenalty(hunter, '2024-01-15');
    assert.equal(hunter.level, 5);
    assert.equal(result.leveledDown, false);
  });

  test('handles high level with low XP', () => {
    const hunter = createMockHunter({ level: 20, xp: 10 }); // level 20, almost no XP
    const result = applyPenalty(hunter, '2024-01-15');
    assert.equal(hunter.xp, 0);
    assert.equal(hunter.level, 20);
    assert.equal(result.leveledDown, false);
  });

  test('handles invalid hunter gracefully', () => {
    const result = applyPenalty(null, '2024-01-15');
    assert.equal(result.xpLost, 0);
    assert.equal(result.streakLost, 0);
  });
});

describe('Integration scenarios', () => {
  test('multiple quest completions increase level and rank correctly', () => {
    const hunter = createMockHunter({ level: 1, xp: 0 });
    const questLog = createMockQuestLog();

    // Complete enough quests to reach level 8 (E->D boundary)
    // Each full quest = 190 XP
    // Level 1 needs 100, level 2 needs 200, ..., level 7 needs 700
    // Total to reach level 8: 100+200+300+400+500+600+700 = 2800 XP
    // 2800 / 190 ≈ 15 quests

    for (let i = 0; i < 15; i++) {
      const ql = createMockQuestLog();
      applyProgress(hunter, ql, 'pushups', 100);
      applyProgress(hunter, ql, 'situps', 100);
      applyProgress(hunter, ql, 'squats', 100);
      applyProgress(hunter, ql, 'run', 100);
    }

    assert.equal(hunter.rank, 'D');
    assert.ok(hunter.level >= 8);
  });

  test('penalty after quest completion preserves level', () => {
    const hunter = createMockHunter({ level: 3, xp: 100 });
    const questLog = createMockQuestLog();

    // Complete a quest
    applyProgress(hunter, questLog, 'pushups', 100);
    applyProgress(hunter, questLog, 'situps', 100);
    applyProgress(hunter, questLog, 'squats', 100);
    applyProgress(hunter, questLog, 'run', 100);

    const levelAfterQuest = hunter.level;
    const xpAfterQuest = hunter.xp;

    // Apply penalty
    applyPenalty(hunter, '2024-01-15');

    assert.equal(hunter.level, levelAfterQuest);
    assert.ok(hunter.xp < xpAfterQuest);
  });
});