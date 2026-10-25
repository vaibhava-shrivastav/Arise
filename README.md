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

## Google OAuth Setup

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your Project ID

### 2. Configure OAuth Consent Screen
1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type (since app isn't verified yet)
3. Fill in required fields:
   - **App name**: ARISE
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. **Scopes**: Add `.../auth/userinfo.profile` and `.../auth/userinfo.email`
5. **Test users**: Add your Google email(s) as test users (required for unverified apps)
6. Save and continue

### 3. Create OAuth Credentials
1. Navigate to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `ARISE Web Client`
5. **Authorized JavaScript origins**:
   - `http://localhost:3000` (for local dev)
   - `https://your-app.onrender.com` (add later for production)
6. **Authorized redirect URIs**:
   - `http://localhost:3000/auth/google/callback` (for local dev)
   - `https://your-app.onrender.com/auth/google/callback` (add later for production)
7. Click **Create**
4. Copy **Client ID** and **Client Secret** to your `.env` file:
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   BASE_URL=http://localhost:3000
   ```

### 4. Enable Required APIs
1. Navigate to **APIs & Services** → **Library**
2. Search for and enable:
   - Google+ API (or People API)

---

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