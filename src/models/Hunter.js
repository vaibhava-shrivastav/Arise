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
  // Game fields (level, xp, stats, streak, rank, etc.) will be added in Phase 3
});

export default mongoose.model('Hunter', hunterSchema);