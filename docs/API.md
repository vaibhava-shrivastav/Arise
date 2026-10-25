# ARISE API Documentation

**Base URL**: `/api`
**Authentication**: All routes require valid session (Google OAuth). Include `connect.sid` cookie.

---

## GET /api/me

**Description**: Get full hunter profile status.

**Auth**: Required

**Response**: `200 OK`
```json
{
  "id": "ObjectId",
  "name": "Hunter Name",
  "email": "hunter@example.com",
  "avatar": "https://...",
  "level": 5,
  "xp": 230,
  "xpNeeded": 500,
  "rank": "D",
  "stats": {
    "strength": 14,
    "agility": 13,
    "vitality": 15,
    "intelligence": 10,
    "sense": 10
  },
  "streak": 3,
  "bestStreak": 7,
  "totalQuestsCompleted": 12,
  "title": "Newbie Hunter",
  "timezone": "Asia/Kolkata"
}
```

**Example**:
```bash
curl -b cookies.txt http://localhost:3000/api/me
```

---

## GET /api/quest/today

**Description**: Get today's daily quest. Creates a new quest log if none exists for today.

**Auth**: Required

**Response**: `200 OK`
```json
{
  "_id": "ObjectId",
  "hunterId": "ObjectId",
  "date": "2024-01-15",
  "items": [
    { "key": "pushups", "label": "Push-ups", "target": 100, "progress": 50, "unit": "reps", "done": false },
    { "key": "situps", "label": "Sit-ups", "target": 100, "progress": 0, "unit": "reps", "done": false },
    { "key": "squats", "label": "Squats", "target": 100, "progress": 100, "unit": "reps", "done": true },
    { "key": "run", "label": "Run", "target": 10, "progress": 5, "unit": "km", "done": false }
  ],
  "completed": false,
  "xpAwarded": 0,
  "sleepHours": null,
  "waterGlasses": null,
  "meditationMinutes": null,
  "createdAt": "2024-01-15T06:30:00.000Z",
  "updatedAt": "2024-01-15T06:30:00.000Z"
}
```

**Example**:
```bash
curl -b cookies.txt http://localhost:3000/api/quest/today
```

---

## POST /api/quest/progress

**Description**: Submit progress on a quest item.

**Auth**: Required

**Request Body**:
```json
{
  "key": "pushups",
  "amount": 50
}
```

**Validation**:
- `key`: string (required) - must match an item key in today's quest
- `amount`: integer, 1-1000

**Response**: `200 OK`
```json
{
  "questLog": { ... },
  "xpGained": 10,
  "leveledUp": false,
  "rankedUp": false,
  "questCompleted": false,
  "hunter": { ... }  // Full hunter status (same as /api/me)
}
```

**Example**:
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/quest/progress \
  -H "Content-Type: application/json" \
  -d '{"key": "pushups", "amount": 50}'
```

**Notes**:
- Partial completion awards 10 XP per item (once per item)
- Full quest completion awards 150 XP bonus + stat gains
- Creates notifications for level up, rank up, or quest completion

---

## POST /api/log/health

**Description**: Log health metrics (sleep, water, meditation). Each metric can only be logged once per day.

**Auth**: Required

**Request Body** (at least one field required):
```json
{
  "sleepHours": 8,
  "waterGlasses": 6,
  "meditationMinutes": 15
}
```

**Validation**:
- `sleepHours`: number, 0-24 (optional)
- `waterGlasses`: number, 0-30 (optional)
- `meditationMinutes`: number, 0-600 (optional)
- At least one field required

**Response**: `200 OK`
```json
{
  "questLog": { ... },
  "hunter": { ... },
  "alreadyLogged": {
    "sleepHours": "already logged today"  // only present if already set
  }
}
```

**Example**:
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/log/health \
  -H "Content-Type: application/json" \
  -d '{"sleepHours": 8}'
```

**Stat Bonuses** (once per day per metric):
- Sleep → +1 Vitality
- Water → +1 Vitality
- Meditation → +1 Intelligence, +1 Sense

---

## GET /api/quest/history

**Description**: Get quest history for the last N days.

**Auth**: Required

**Query Parameters**:
- `days`: integer, 1-90 (default: 30)

**Response**: `200 OK`
```json
[
  { ...questLog1 },
  { ...questLog2 },
  ...
]
```

**Example**:
```bash
curl -b cookies.txt "http://localhost:3000/api/quest/history?days=14"
```

---

## GET /api/leaderboard

**Description**: Get top 20 hunters by level then XP.

**Auth**: Required

**Response**: `200 OK`
```json
[
  { "name": "Top Hunter", "avatar": "...", "level": 50, "rank": "S", "title": "Shadow Monarch" },
  { "name": "Second", "avatar": "...", "level": 45, "rank": "A", "title": "Veteran Hunter" },
  ...
]
```

**Example**:
```bash
curl -b cookies.txt http://localhost:3000/api/leaderboard
```

**Note**: Never returns email or googleId.

---

## GET /api/notifications

**Description**: Get hunter's notifications.

**Auth**: Required

**Query Parameters**:
- `unreadOnly`: boolean (default: false)

**Response**: `200 OK`
```json
[
  {
    "_id": "ObjectId",
    "hunterId": "ObjectId",
    "type": "levelup",
    "message": "[SYSTEM] LEVEL UP! You are now Level 5",
    "read": false,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  ...
]
```

**Example**:
```bash
curl -b cookies.txt "http://localhost:3000/api/notifications?unreadOnly=true"
```

---

## POST /api/notifications/read-all

**Description**: Mark all notifications as read.

**Auth**: Required

**Response**: `200 OK`
```json
{
  "success": true,
  "updatedCount": 5
}
```

**Example**:
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/notifications/read-all
```

---

## PATCH /api/me/timezone

**Description**: Update hunter's timezone.

**Auth**: Required

**Request Body**:
```json
{
  "timezone": "America/New_York"
}
```

**Validation**: Must be a valid IANA timezone identifier.

**Response**: `200 OK`
```json
{
  "id": "ObjectId",
  "name": "Hunter Name",
  ...
  "timezone": "America/New_York",
  ...
}
```

**Example**:
```bash
curl -b cookies.txt -X PATCH http://localhost:3000/api/me/timezone \
  -H "Content-Type: application/json" \
  -d '{"timezone": "America/New_York"}'
```

---

## Error Responses

All routes may return:

**400 Bad Request** - Validation error:
```json
{
  "error": "Invalid request",
  "details": { ... }
}
```

**401 Unauthorized** - Not authenticated:
```json
{
  "error": "Not authenticated"
}
```

**404 Not Found** - Resource not found:
```json
{
  "error": "Hunter not found"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Failed to fetch hunter"
}
```