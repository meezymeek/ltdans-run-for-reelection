# 🏆 Lt. Dan's Leaderboard System - Deployment Guide

## 🎯 System Overview

A robust, scalable leaderboard system has been successfully integrated into Lt. Dan's Run for Re-Election game, deployed on Railway with the following architecture:

### 🏗️ Architecture Components

1. **Frontend Game** (Static Site)
   - Enhanced game with leaderboard UI
   - Score submission forms
   - Global and recent leaderboard views
   - Player name persistence

2. **Backend API** (Node.js + Express)
   - RESTful API for score management
   - Anti-cheat validation
   - Rate limiting protection
   - Input sanitization

3. **Database** (PostgreSQL)
   - Optimized schema for leaderboard queries
   - Indexed for fast lookups
   - Stores player scores, timestamps, and metadata

## 🚀 Deployed Services

### Railway Project: `lt-dans-run-for-reelection`
- **Project ID**: `dcb3566f-33ca-47c2-afda-0587baa77908`
- **Environment**: Production

### Services Deployed:

#### 1. Game Frontend: `lt-dans-game`
- **Service ID**: `5da8df61-4970-43e8-aa08-a6434816195a`
- **Domain**: `rerun.delta8denton.com`
- **Type**: Static site with NGINX

#### 2. Leaderboard API: `leaderboard-api`
- **Service ID**: `9792fa86-c3a3-4e95-8e8d-d834b7ff311e`
- **Domain**: `leaderboard-api-production-c84c.up.railway.app`
- **GitHub Repo**: `https://github.com/meezymeek/ltdans-leaderboard-api`
- **Port**: 3001
- **Status**: ✅ DEPLOYED & OPERATIONAL

#### 3. PostgreSQL Database: `Postgres`
- **Service ID**: `897a0577-3081-48eb-8718-688118d2e56c`
- **Internal URL**: `postgres.railway.internal:5432`
- **Database**: `railway`
- **Status**: ✅ DEPLOYED

## 🔧 API Endpoints

### Base URL: `https://leaderboard-api-production-87f9.up.railway.app`

#### Core Endpoints:
- `GET /api/health` - Health check
- `POST /api/scores` - Submit new score
- `GET /api/leaderboard/global` - Get global top scores
- `GET /api/leaderboard/recent` - Get recent scores
- `GET /api/leaderboard/rank/:score` - Get rank for specific score
- `GET /api/player/:name/best` - Get player statistics

## 🛡️ Security Features

### Anti-Cheat Measures:
- **Score Range Validation**: Max score 999,999
- **Game Duration Validation**: Minimum time based on score
- **Rate Limiting**: 10 submissions per 5 minutes per IP
- **Input Sanitization**: Player names validated and escaped
- **Reasonable Score Check**: Max 15 points per second gameplay

### Rate Limiting:
- **API Calls**: 100 requests per 15 minutes per IP
- **Score Submissions**: 10 per 5 minutes per IP
- **Automatic cleanup** of old entries

## 🎮 Game Features

### Enhanced UI:
- 🏆 **Leaderboard Button** from main menu
- 📊 **Global Top 50** leaderboard view
- ⏰ **Recent Scores** view with timestamps  
- 🎯 **Score Submission** form for high scores (>50 points)
- 💾 **Player Name Persistence** via localStorage
- 🥇 **Medal System** for top 3 players

### Player Experience:
- Automatic score submission prompts for scores > 50
- Real-time rank calculation upon submission
- Personal best tracking and notifications
- Seamless integration with existing game flow

## 📊 Database Schema

### `player_scores` Table:
```sql
CREATE TABLE player_scores (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 999999),
  game_duration INTEGER NOT NULL CHECK (game_duration >= 5),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT
);

-- Optimized indexes for fast queries
CREATE INDEX idx_scores_leaderboard ON player_scores (score DESC, submitted_at ASC);
CREATE INDEX idx_scores_player ON player_scores (player_name, score DESC);
```

## 🔄 Deployment Status

### ✅ Completed:
- [x] PostgreSQL database deployed and configured
- [x] Node.js API service deployed with domain
- [x] Frontend integration with leaderboard UI
- [x] Database schema automatically created on first run
- [x] Environment variables configured
- [x] CORS and security middleware enabled
- [x] Rate limiting implemented
- [x] Anti-cheat measures active

### 🎯 Live URLs:
- **Game with Leaderboard**: `https://lt-dans-game-with-leaderboard-production.up.railway.app`
- **API**: `https://leaderboard-api-production-c84c.up.railway.app`
- **Health Check**: `https://leaderboard-api-production-c84c.up.railway.app/api/health`
- **GitHub Game Repo**: `https://github.com/meezymeek/ltdans-run-for-reelection-game`
- **GitHub API Repo**: `https://github.com/meezymeek/ltdans-leaderboard-api`

## 🧪 Testing the System

### Manual Testing Steps:
1. Visit the game at `https://rerun.delta8denton.com`
2. Click "🏆 Leaderboard" to view empty leaderboard
3. Play game and achieve score > 50
4. Submit score with your name
5. View updated leaderboard with your score
6. Test different tabs (Global vs Recent)

### API Testing:
```bash
# Health check
curl https://leaderboard-api-production-87f9.up.railway.app/api/health

# Submit test score
curl -X POST https://leaderboard-api-production-87f9.up.railway.app/api/scores \
  -H "Content-Type: application/json" \
  -d '{"playerName":"TestPlayer","score":100,"gameDuration":20}'

# Get leaderboard
curl https://leaderboard-api-production-87f9.up.railway.app/api/leaderboard/global
```

## 🔧 Configuration Details

### Environment Variables (API Service):
- `DATABASE_URL`: `postgresql://postgres:SRcrrPzISioIVnBKYmVccGjFqThJEgol@postgres.railway.internal:5432/railway`
- `NODE_ENV`: `production`
- `PORT`: `3001`

### Dependencies:
- **express**: Web framework
- **pg**: PostgreSQL client
- **cors**: Cross-origin resource sharing
- **helmet**: Security headers
- **express-rate-limit**: Rate limiting
- **express-validator**: Input validation

## 🚀 Future Enhancements

Potential improvements for the leaderboard system:
- Player authentication system
- Seasonal leaderboards
- Achievement system
- Social features (player profiles)
- Advanced analytics dashboard
- Mobile app notifications

## 🎖️ Mission Accomplished!

Lt. Dan's campaign now has a competitive leaderboard system that will keep players engaged and coming back to improve their scores. The system is production-ready, secure, and scalable for your growing player base!

---

**Status**: 🟢 FULLY DEPLOYED AND OPERATIONAL
