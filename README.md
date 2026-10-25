# ARISE

A gamified health tracker styled like the "System" from Solo Leveling. Become a Hunter — complete Daily Quests, earn XP, level up, and rank from E to S.

## Stack
- **Backend**: Node.js 20+, Express, MongoDB (Mongoose), Passport.js (Google OAuth)
- **Frontend**: Plain HTML/CSS/JS (no build step)
- **Deploy**: Render Web Service

## Local Setup
```bash
# 1. Clone the repository
git clone https://github.com/vaibhava-shrivastav/Arise.git
cd Arise

# 2. Install dependencies
npm install

# 3. Copy environment template and fill in your values
cp .env.example .env
# Edit .env with your MONGO_URI (required), SESSION_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BASE_URL, PORT, ADMIN_SECRET

# 4. Start development server (with file watching)
npm run dev
```

## Project Structure
```
/server.js           # Entry point
/src                 # Backend source
  /config            # DB, passport, env config
  /models            # Mongoose models
  /routes            # Express routes
  /middleware        # Auth, validation, error handling
  /services          # Game logic (XP, ranks, penalties)
  /jobs              # Cron jobs
/public              # Frontend (served statically)
/design              # Stitch design exports (reference)
/docs                # Documentation
/tests               # Tests
```

## Game Rules Summary
- **Stats**: Strength, Agility, Vitality, Intelligence, Sense (start at 10)
- **XP Formula**: `level * 100` for next level
- **Ranks**: E (1-7) → D (8-14) → C (15-24) → B (25-34) → A (35-49) → S (50+)
- **Daily Quest**: 100 push-ups, 100 sit-ups, 100 squats, 10 km run
- **Full Clear**: +150 XP, +1 streak, +1 to Str/Agi/Vit
- **Partial**: +10 XP per item
- **Missed Day**: Streak → 0, -50 XP (floor 0, no level loss), Penalty recorded
- **Extra Logs**: Sleep, Water, Meditation (once/day each)
- **Timezone**: User's stored timezone (default Asia/Kolkata)

## License
MIT