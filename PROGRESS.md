# PROGRESS.md - Project Progress Tracking

## Phase Checklist

- [x] **Phase 1: Setup** - Initialize npm, install dependencies, create folder structure, basic server.js with Express, MongoDB connection, trust proxy, helmet, rate-limit, session config
- [ ] **Phase 2: Auth** - Google OAuth with Passport, login/logout/callback routes, session handling, protected route middleware, user model with Google profile fields
- [ ] **Phase 3: Models and Game Engine** - User, Quest, QuestLog, Penalty, Notification models; game logic in /src/services (XP calc, level/rank, stats, streak, penalty logic)
- [ ] **Phase 4: API** - REST routes for: get profile, get today's quest, submit quest progress, get history, get leaderboard, get notifications, extra logs (sleep/water/meditation)
- [ ] **Phase 5: Frontend from Stitch Designs** - HTML/CSS/JS in /public implementing System UI: dashboard, quest page, history, leaderboard, profile, notifications; typewriter effect, scanlines, glow animations
- [ ] **Phase 6: Penalty Cron and Notifications** - node-cron job at midnight user timezone: check missed quests, apply penalties, create Penalty records, create Notification records
- [ ] **Phase 7: Polish and PWA** - Service worker, manifest.json, offline caching, install prompt, meta tags, Lighthouse audit, responsive fixes
- [ ] **Phase 8: Deploy to Render** - render.yaml, production env vars, MongoDB Atlas connection, health check endpoint, custom domain ready

## Decisions
- **Rate limiting**: 100 requests per 15 minutes per IP for /api and /auth routes
- **Body parser limit**: 10kb for express.json()
- **Helmet CSP**: Allows Google Fonts (fonts.googleapis.com, fonts.gstatic.com) and inline styles for Stitch exports
- **Module type**: "module" (ESM) for all JS files
- **Dev script**: Uses Node's built-in `--watch` flag (no nodemon needed for dev)
- **MongoDB failure handling**: Exit process in production, warn only in development
- **Trust proxy**: Set to 1 for Render deployment behind proxy

## Known Bugs
- (Add known bugs here as they are discovered)