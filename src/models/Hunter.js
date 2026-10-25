import mongoose from 'mongoose';

const hunterSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    default: '',
  },
  avatar: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Game fields (added in Phase 3)
  level: {
    type: Number,
    default: 1,
    min: 1,
  },
  xp: {
    type: Number,
    default: 0,
    min: 0,
  },
  rank: {
    type: String,
    default: 'E',
    enum: ['E', 'D', 'C', 'B', 'A', 'S'],
  },
  stats: {
    strength: { type: Number, default: 10, min: 10 },
    agility: { type: Number, default: 10, min: 10 },
    vitality: { type: Number, default: 10, min: 10 },
    intelligence: { type: Number, default: 10, min: 10 },
    sense: { type: Number, default: 10, min: 10 },
  },
  streak: {
    type: Number,
    default: 0,
    min: 0,
  },
  bestStreak: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalQuestsCompleted: {
    type: Number,
    default: 0,
    min: 0,
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata',
  },
  lastActiveDate: {
    type: String,
    default: null,
  },
  lastPenaltyCheckedDate: {
    type: String,
    default: null,
  },
  title: {
    type: String,
    default: 'Newbie Hunter',
  },
});

export default mongoose.model('Hunter', hunterSchema);