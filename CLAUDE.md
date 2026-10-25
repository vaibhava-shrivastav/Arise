# CLAUDE.md - Project Memory for ARISE

## 1. PROJECT OVERVIEW
ARISE is a gamified health tracker styled like the "System" from Solo Leveling. The user is a "Hunter" who completes Daily Quests (real health activities), earns XP, levels up, and ranks from E to S. Missing a day's quest triggers a Penalty.

## 2. TECH STACK (do not deviate)
- **Backend**: Node.js v20+, Express, Mongoose (MongoDB Atlas), Passport.js with passport-google-oauth20, express-session + connect-mongo, helmet, express-rate-limit, node-cron, dotenv, zod
- **Frontend**: plain HTML/CSS/vanilla JS served from `/public` (no frameworks, no build step). Initial designs come from Google Stitch exports stored in `/design` (read-only reference)
- **Deploy**: Render Web Service. Must work behind a proxy (trust proxy = 1, secure cookies in production)
- **Auth**: Google OAuth only

## 3. FOLDER STRUCTURE
```
/server.js
/src/config
/src/models
/src/routes
/src/middleware
/src/services    (all game logic)
/src/jobs        (cron)
/public          (html, css, js, assets)
/design          (Stitch exports)
/docs
/tests
```

## 4. GAME RULES (single source of truth)
- **Stats**: strength, agility, vitality, intelligence, sense (all start at 10)
- **XP needed for next level** = level * 100
- **Ranks by level**: E 1-7, D 8-14, C 15-24, B 25-34, A 35-49, S 50+
- **Default Daily Quest**: 100 push-ups, 100 sit-ups, 100 squats, 10 km run
- **Completing all quest items**: +150 XP, +1 streak, +1 to strength/agility/vitality
- **Partial progress**: +10 XP per completed item
- **Missing a whole day**: streak resets to 0, lose 50 XP (never below 0, never lose a level), and a Penalty record is created
- **Extra logs**: sleep hours (affects vitality), water glasses, meditation minutes (affects intelligence/sense), each counted once per day
- **All dates use the user's stored timezone**, default Asia/Kolkata

## 5. UI STYLE GUIDE
- Background `#050816`
- Cyan neon `#00d4ff` glowing borders
- Translucent panels
- Orbitron for headings, Share Tech Mono for body
- `[SYSTEM]` notification boxes
- Typewriter text effect
- Subtle scanline/glow animations
- Mobile-first, max width 480px centered on desktop

## 6. CODING RULES
- Never commit secrets; all config via `.env` and keep `.env.example` updated
- Validate all request input; never trust the client for XP, level, or rank
- All game logic lives in `/src/services`, never in route handlers
- Every route touching user data requires authentication
- Keep functions small and commented

## 7. WORKFLOW RULES
- At the start of every session, read CLAUDE.md and PROGRESS.md
- After finishing any task, update PROGRESS.md (done / in-progress / next / decisions / known bugs)
- Work on only the current phase; don't jump ahead
- Commit after each phase with a clear message