import express from 'express';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

// Protected route - get current user
router.get('/me', requireAuth, (req, res) => {
  const { id, name, email, avatar } = req.user;
  res.json({ id, name, email, avatar });
});

export default router;