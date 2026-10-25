import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  hunterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hunter',
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['quest', 'levelup', 'rankup', 'penalty', 'system'],
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Notification', notificationSchema);