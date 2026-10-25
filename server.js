import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import configurePassport from './src/config/passport.js';
import authRoutes from './src/routes/auth.js';
import apiRoutes from './src/routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Trust proxy for Render deployment
app.set('trust proxy', 1);

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[SYSTEM] MongoDB connected successfully');
  } catch (error) {
    console.error('[SYSTEM] MongoDB connection failed:', error.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('[SYSTEM] Running in development without MongoDB');
    }
  }
};

await connectDB();

// Helmet with CSP allowing Google Fonts and inline styles
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  },
}));

// Body parser with 10kb limit
app.use(express.json({ limit: '10kb' }));

// Session middleware (must come before passport)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
  }),
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Configure passport strategies
configurePassport(passport);

// Rate limiter for /api and /auth routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);
app.use('/auth', apiLimiter);

// Routes (must come before static files)
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Serve static files from public
app.use(express.static(join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
  });
});

// 404 handler for unmatched /api routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[SYSTEM] Error:', err);
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;
  res.status(500).json({ error: message });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[SYSTEM] Server running on http://localhost:${PORT}`);
});