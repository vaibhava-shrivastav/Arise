import express from 'express';
import { z } from 'zod';
import requireAuth from '../middleware/requireAuth.js';
import Hunter from '../models/Hunter.js';
import QuestLog from '../models/QuestLog.js';
import Notification from '../models/Notification.js';
import gameEngine from '../services/gameEngine.js';
import dateService from '../services/dateService.js';
import gameConfig from '../config/gameConfig.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Helper to build full hunter response
function buildHunterResponse(hunter) {
  return {
    id: hunter._id,
    name: hunter.name,
    email: hunter.email,
    avatar: hunter.avatar,
    level: hunter.level,
    xp: hunter.xp,
    xpNeeded: gameEngine.xpForNextLevel(hunter.level),
    rank: hunter.rank,
    stats: hunter.stats,
    streak: hunter.streak,
    bestStreak: hunter.bestStreak,
    totalQuestsCompleted: hunter.totalQuestsCompleted,
    title: hunter.title,
    timezone: hunter.timezone,
  };
}

// Helper to get or create today's QuestLog
async function getOrCreateTodaysQuestLog(hunter) {
  const today = dateService.getTodayString(hunter.timezone);
  let questLog = await QuestLog.findOne({ hunterId: hunter._id, date: today });

  if (!questLog) {
    const items = gameEngine.buildDailyQuestItems(hunter);
    questLog = await QuestLog.create({
      hunterId: hunter._id,
      date: today,
      items,
    });
  }
  return questLog;
}

// 1. GET /api/me - Full hunter status
router.get('/me', async (req, res) => {
  try {
    const hunter = await Hunter.findById(req.user._id);
    if (!hunter) {
      return res.status(404).json({ error: 'Hunter not found' });
    }
    res.json(buildHunterResponse(hunter));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hunter' });
  }
});

// 2. GET /api/quest/today - Today's quest
router.get('/quest/today', async (req, res) => {
  try {
    const hunter = await Hunter.findById(req.user._id);
    if (!hunter) {
      return res.status(404).json({ error: 'Hunter not found' });
    }
    const questLog = await getOrCreateTodaysQuestLog(hunter);
    res.json(questLog);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quest' });
  }
});

// 3. POST /api/quest/progress - Submit quest progress
const progressSchema = z.object({
  key: z.string().min(1),
  amount: z.number().int().positive().max(1000),
});

router.post('/quest/progress', async (req, res) => {
  try {
    // Validate request body
    const parseResult = progressSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid request', details: parseResult.error.flatten() });
    }
    const { key, amount } = parseResult.data;

    const hunter = await Hunter.findById(req.user._id);
    if (!hunter) {
      return res.status(404).json({ error: 'Hunter not found' });
    }

    const questLog = await getOrCreateTodaysQuestLog(hunter);

    // Apply progress through game engine
    const result = gameEngine.applyProgress(hunter, questLog, key, amount);

    // Update lastActiveDate
    const today = dateService.getTodayString(hunter.timezone);
    if (hunter.lastActiveDate !== today) {
      hunter.lastActiveDate = today;
    }

    // Save hunter and questLog
    await hunter.save();
    await questLog.save();

    // Create notifications for significant events
    const notifications = [];

    if (result.questCompleted) {
      const notif = await Notification.create({
        hunterId: hunter._id,
        type: 'quest',
        message: '[SYSTEM] DAILY QUEST COMPLETE',
      });
      notifications.push(notif);
    }
    if (result.leveledUp) {
      const notif = await Notification.create({
        hunterId: hunter._id,
        type: 'levelup',
        message: `[SYSTEM] LEVEL UP! You are now Level ${result.newLevel}`,
      });
      notifications.push(notif);
    }
    if (result.rankedUp) {
      const notif = await Notification.create({
        hunterId: hunter._id,
        type: 'rankup',
        message: `[SYSTEM] RANK UP! Welcome, ${result.newRank}-Rank Hunter`,
      });
      notifications.push(notif);
    }

    res.json({
      questLog,
      xpGained: result.xpGained,
      leveledUp: result.leveledUp,
      rankedUp: result.rankedUp,
      questCompleted: result.questCompleted,
      hunter: buildHunterResponse(hunter),
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: err.message });
    }
    res.status(500).json({ error: 'Failed to submit progress' });
  }
});

// 4. POST /api/log/health - Log health metrics
const healthLogSchema = z.object({
  sleepHours: z.number().min(0).max(24).optional(),
  waterGlasses: z.number().min(0).max(30).optional(),
  meditationMinutes: z.number().min(0).max(600).optional(),
}).refine(data => data.sleepHours !== undefined || data.waterGlasses !== undefined || data.meditationMinutes !== undefined, {
  message: 'At least one metric required',
});

router.post('/log/health', async (req, res) => {
  try {
    const parseResult = healthLogSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid request', details: parseResult.error.flatten() });
    }
    const { sleepHours, waterGlasses, meditationMinutes } = parseResult.data;

    const hunter = await Hunter.findById(req.user._id);
    if (!hunter) {
      return res.status(404).json({ error: 'Hunter not found' });
    }

    const questLog = await getOrCreateTodaysQuestLog(hunter);
    const alreadyLogged = {};

    // Apply sleep hours
    if (sleepHours !== undefined) {
      if (questLog.sleepHours !== null) {
        alreadyLogged.sleepHours = 'already logged today';
      } else {
        questLog.sleepHours = sleepHours;
        // Apply stat bonus
        hunter.stats.vitality += gameConfig.healthLogStatGains.sleepHours.vitality;
      }
    }

    // Apply water glasses
    if (waterGlasses !== undefined) {
      if (questLog.waterGlasses !== null) {
        alreadyLogged.waterGlasses = 'already logged today';
      } else {
        questLog.waterGlasses = waterGlasses;
        hunter.stats.vitality += gameConfig.healthLogStatGains.waterGlasses.vitality;
      }
    }

    // Apply meditation minutes
    if (meditationMinutes !== undefined) {
      if (questLog.meditationMinutes !== null) {
        alreadyLogged.meditationMinutes = 'already logged today';
      } else {
        questLog.meditationMinutes = meditationMinutes;
        hunter.stats.intelligence += gameConfig.healthLogStatGains.meditationMinutes.intelligence;
        hunter.stats.sense += gameConfig.healthLogStatGains.meditationMinutes.sense;
      }
    }

    // Update lastActiveDate
    const today = dateService.getTodayString(hunter.timezone);
    if (hunter.lastActiveDate !== today) {
      hunter.lastActiveDate = today;
    }

    await hunter.save();
    await questLog.save();

    res.json({
      questLog,
      hunter: buildHunterResponse(hunter),
      alreadyLogged,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: err.message });
    }
    res.status(500).json({ error: 'Failed to log health metrics' });
  }
});

// 5. GET /api/quest/history - Quest history
const historyQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(90).default(30),
});

router.get('/quest/history', async (req, res) => {
  try {
    const parseResult = historyQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid query', details: parseResult.error.flatten() });
    }
    const { days } = parseResult.data;

    const logs = await QuestLog.find({ hunterId: req.user._id })
      .sort({ date: -1 })
      .limit(days)
      .lean();

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// 6. GET /api/leaderboard - Top 20 hunters
router.get('/leaderboard', async (req, res) => {
  try {
    const topHunters = await Hunter.find()
      .sort({ level: -1, xp: -1 })
      .limit(20)
      .select('name avatar level rank title')
      .lean();

    res.json(topHunters);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// 7. GET /api/notifications - Get notifications
const notificationsQuerySchema = z.object({
  unreadOnly: z.coerce.boolean().default(false),
});

router.get('/notifications', async (req, res) => {
  try {
    const parseResult = notificationsQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid query', details: parseResult.error.flatten() });
    }
    const { unreadOnly } = parseResult.data;

    const query = { hunterId: req.user._id };
    if (unreadOnly) {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// 8. POST /api/notifications/read-all - Mark all as read
router.post('/notifications/read-all', async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { hunterId: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true, updatedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// 9. PATCH /api/me/timezone - Update timezone
const timezoneSchema = z.object({
  timezone: z.string().min(1),
});

router.patch('/me/timezone', async (req, res) => {
  try {
    const parseResult = timezoneSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid request', details: parseResult.error.flatten() });
    }
    const { timezone } = parseResult.data;

    // Validate IANA timezone
    try {
      new Intl.DateTimeFormat('en', { timeZone: timezone });
    } catch {
      return res.status(400).json({ error: 'Invalid timezone' });
    }

    const hunter = await Hunter.findByIdAndUpdate(
      req.user._id,
      { timezone },
      { new: true }
    );

    if (!hunter) {
      return res.status(404).json({ error: 'Hunter not found' });
    }

    res.json(buildHunterResponse(hunter));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update timezone' });
  }
});

export default router;