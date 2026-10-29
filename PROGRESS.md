# PROGRESS.md - Project Progress Tracking

## Phase Checklist

- [x] **Phase 1: Setup** - Initialize npm, install dependencies, create folder structure, basic server.js with Express, MongoDB connection, trust proxy, helmet, rate-limit, session config
- [x] **Phase 2: Auth** - Google OAuth with Passport, login/logout/callback routes, session handling, protected route middleware, user model with Google profile fields
- [x] **Phase 3: Models and Game Engine** - User, Quest, QuestLog, Penalty, Notification models; game logic in /src/services (XP calc, level/rank, stats, streak, penalty logic)
- [x] **Phase 4: API** - REST routes for: get profile, get today's quest, submit quest progress, get history, get leaderboard, get notifications, extra logs (sleep/water/meditation)
- [x] **Phase 5: Frontend from Stitch Designs** - HTML/CSS/JS in /public implementing System UI: dashboard, quest page, history, leaderboard, profile, notifications; typewriter effect, scanlines, glow animations
- [ ] **Phase 6: Penalty Cron and Notifications** - node-cron job at midnight user timezone: check missed quests, apply penalties, create Penalty records, create Notification records
- [ ] **Phase 7: Polish and PWA** - Service worker, manifest.json, offline caching, install prompt, meta tags, Lighthouse audit, responsive fixes
- [ ] **Phase 8: Deploy to Render** - render.yaml, production env vars, MongoDB Atlas connection, health check endpoint, custom domain ready

## Decisions
- **Rate limiting**: 100 requests per 15 minutes per IP for /api and /auth routes
- **Body parser limit**: 10kb for express.json()
- **Helmet CSP**: Allows Google Fonts (fonts.googleapis.com, fonts.gstatic.com), Tailwind CDN (cdn.tailwindcss.com), Google avatars (lh3.googleusercontent.com), and inline styles/scripts ('unsafe-inline') for Stitch exports and dynamic System UI
- **Module type**: "module" (ESM) for all JS files
- **Dev script**: Uses Node's built-in `--watch` flag (no nodemon needed for dev)
- **MongoDB failure handling**: Exit process in production, warn only in development
- **Trust proxy**: Set to 1 for Render deployment behind proxy
- **Session config**: connect-mongo store, httpOnly cookies, sameSite 'lax', secure only in production, 7-day maxAge
- **Cookie name**: Default 'connect.sid' (express-session default)
- **Passport serialization**: Uses Hunter._id (MongoDB ObjectId)
- **Auth routes**: Mounted at /auth (so routes are /auth/google, /auth/google/callback, /auth/logout)
- **Protected API**: /api/me behind requireAuth middleware
- **Frontend auth flow**: index.html has [ ARISE ] button → /auth/google → Google OAuth → callback → /status.html → fetches /api/me → shows hunter info or redirects to / on 401
- **Game config**: All numbers centralized in src/config/gameConfig.js (single source of truth)
- **Date/timezone**: Uses Intl.DateTimeFormat with 'en-CA' locale for YYYY-MM-DD in user's timezone (no external date library)
- **XP formula**: level * 100 for next level; 150 XP for full quest completion; 10 XP per partial item
- **Rank thresholds**: E 1-7, D 8-14, C 15-24, B 25-34, A 35-49, S 50+
- **Stat gains on completion**: +1 strength, +1 agility, +1 vitality
- **Penalty**: -50 XP (floored at 0, never loses level), streak resets to 0
- **QuestLog**: compound unique index on (hunterId, date) ensures one log per hunter per day
- **applyProgress & applyPenalty**: Pure-ish functions that mutate passed objects but don't save to DB — routes/jobs call .save()
- **grantXp**: Handles multiple level-ups in a while-loop, updates rank automatically
- **Zod validation**: All request bodies/params validated; 400 with clear error details on failure
- **Health log once-per-day**: Enforced by checking if questLog.sleepHours/waterGlasses/meditationMinutes is null before applying; already-set fields returned in `alreadyLogged` response
- **Health log stat bonuses**: Defined in gameConfig.healthLogStatGains (sleep→vitality, water→vitality, meditation→intelligence+sense)
- **Leaderboard privacy**: Only returns name, avatar, level, rank, title — never email or googleId
- **Timezone validation**: Uses Intl.DateTimeFormat try/catch to validate IANA timezone strings
- **Integration testing**: Written using Node's built-in test runner against live MongoDB; mongodb-memory-server not used (uses local test DB instead, documented in test file)
- **Frontend styling & Tailwind CDN**: Preserved Stitch's `<script src="https://cdn.tailwindcss.com">` with matching custom theme extensions across all pages, extracting common design tokens, glow variables, scanline HUD overlays, and modal/toast animations into `/public/css/system.css`
- **API Client & 401 handling**: Centralized fetch wrapper in `/public/js/api.js` (`apiGet`, `apiPost`, `apiPatch`) with credentials inclusion, JSON parsing, and automatic redirect to `/` on 401 unauthorized
- **System UI component library**: `/public/js/system-ui.js` provides reusable `showSystemToast`, `showSystemModal`, and `typewriter` effects matching the Solo Leveling System aesthetic
- **Quest item key mapping**: Mapped the 4 daily quest items directly to gameConfig keys (`pushups`, `situps`, `squats`, `run`), supporting both tap-to-add with custom prompts and automatic completed state styling
- **Auxiliary logs**: Integrated health logs (sleep, hydration, meditation) with `POST /api/log/health` and disable/locked state once logged for the day
- **Leaderboard user identification**: Identified current user in top 20 by matching `_id` against `req.user` / `/api/me.id` (with fallback to name match) to highlight their row and populate the `[ YOU // VESSEL ]` sync card
- **Bottom navigation consistency**: All protected pages link seamlessly across `status.html`, `quests.html`, `history.html`, and `leaderboard.html` with active glow indicator, with "Shadows" reserving future Monarch domain expansion

## Known Bugs
- (Add known bugs here as they are discovered)
- **Note**: Manual browser testing required for full OAuth flow (can't automate browser OAuth). Test steps:
  1. Fill .env with real GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, MONGO_URI, SESSION_SECRET, BASE_URL=http://localhost:3000
  2. Run `npm run dev`
  3. Open http://localhost:3000, click [ ARISE ], complete Google login
  4. Confirm redirect to /status.html shows name and avatar
  5. Confirm GET /api/me works while logged in and returns 401 after logout