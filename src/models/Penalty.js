import mongoose from 'mongoose';

const penaltySchema = new mongoose.Schema({
  hunterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hunter',
    required: true,
    index: true,
  },
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/,
  },
  xpLost: {
    type: Number,
    required: true,
    min: 0,
  },
  streakLost: {
    type: Number,
    required: true,
    min: 0,
  },
  reason: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Penalty', penaltySchema);