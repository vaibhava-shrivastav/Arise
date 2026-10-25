import mongoose from 'mongoose';

const questItemSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  target: { type: Number, required: true, min: 0 },
  progress: { type: Number, default: 0, min: 0 },
  unit: { type: String, required: true },
  done: { type: Boolean, default: false },
}, { _id: false });

const questLogSchema = new mongoose.Schema({
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
  items: {
    type: [questItemSchema],
    required: true,
    validate: {
      validator: function(arr) {
        return arr.length > 0;
      },
      message: 'QuestLog must have at least one item',
    },
  },
  completed: {
    type: Boolean,
    default: false,
  },
  xpAwarded: {
    type: Number,
    default: 0,
    min: 0,
  },
  sleepHours: {
    type: Number,
    default: null,
    min: 0,
  },
  waterGlasses: {
    type: Number,
    default: null,
    min: 0,
  },
  meditationMinutes: {
    type: Number,
    default: null,
    min: 0,
  },
}, {
  timestamps: true,
});

// Compound unique index: one log per hunter per day
questLogSchema.index({ hunterId: 1, date: 1 }, { unique: true });

export default mongoose.model('QuestLog', questLogSchema);