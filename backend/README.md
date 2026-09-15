# Mess Food Monitoring System — Setup Guide

## Architecture

```
mess-quality-monitor/
├── login.html        ← Login / Sign-up page (frontend)
├── dashboard.html    ← Main dashboard (frontend)
├── index.html        ← Landing redirect
└── backend/
    ├── server.js     ← Express entry point (serves frontend + API)
    ├── seed.js       ← Seeds MongoDB with demo data + govt user
    ├── env.example   ← Copy to .env before starting
    ├── package.json
    ├── models/
    │   ├── User.js
    │   ├── MealRating.js
    │   ├── DailySummary.js
    │   └── Notice.js
    ├── routes/
    │   ├── auth.js
    │   ├── ratings.js
    │   ├── summary.js
    │   └── notices.js
    ├── middleware/
    │   └── auth.js   ← JWT Bearer token verification
    └── utils/
        └── helpers.js
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/try/download/community) v6+ running locally  
  **or** a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

## Quick Start

### 1. Install dependencies

```bash
cd mess-quality-monitor/backend
npm install
```

### 2. Configure environment

```bash
copy env.example .env
```

Edit `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mfms
JWT_SECRET=change_this_to_a_long_random_secret
```

For MongoDB Atlas, replace `MONGODB_URI` with your connection string:
```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/mfms
```

### 3. Start the server

```bash
npm start
```

The server will:
1. Connect to MongoDB
2. **Auto-seed** the database on first run:
   - Creates the **Government Authority** user (`GOVT-DTE-2024` / `pass123`) — no sign-up option
   - Creates demo student, manager, superintendent for BCE
   - Generates 25 days of synthetic meal ratings for all ~100 hostels
3. Serve the frontend at **http://localhost:5000/login.html**

### 4. Open in browser

```
http://localhost:5000/login.html
```

Use Quick Demo Login buttons or:

| Role | ID | Password |
|------|-----|----------|
| Student | `22BCSE001` | `pass123` |
| Manager | `MGR-BCE-001` | `pass123` |
| Superintendent | `SUP-BCE-001` | `pass123` |
| **Govt. Authority** | `GOVT-DTE-2024` | `pass123` |

> **Note:** Govt. Authority accounts are pre-existing and **cannot be created via Sign Up** — by design.

---

## API Reference

All endpoints require `Authorization: Bearer <token>` except `/api/auth/*`.

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Any | Login, returns JWT |
| POST | `/api/auth/signup` | student/manager/super | Create account (govt blocked) |
| POST | `/api/ratings` | student/super | Submit meal rating |
| GET | `/api/ratings/today` | student/super | Get own ratings for today |
| GET | `/api/summary/today` | student/manager/super | Today's aggregated hostel summary |
| GET | `/api/summary/monthly` | student/manager/super | Last 30 days of summaries |
| GET | `/api/summary/rankings` | All | Monthly avg rankings, all hostels |
| GET | `/api/notices` | All | Get notices (scoped by role) |
| POST | `/api/notices` | govt | Issue a warning/cancellation notice |
| GET | `/api/health` | — | Health check |

## Data persistence

| Data | Storage |
|------|---------|
| User accounts | MongoDB `users` collection (bcrypt-hashed passwords) |
| Meal ratings | MongoDB `mealratings` collection |
| Daily summaries | MongoDB `dailysummaries` collection (recomputed on each rating) |
| Official notices | MongoDB `notices` collection |
| Session token | Browser `localStorage` (JWT, 8h expiry) |

## Development

```bash
npm run dev    # Uses nodemon for auto-reload
```
