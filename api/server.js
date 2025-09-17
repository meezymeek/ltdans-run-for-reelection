const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const { body, validationResult, param } = require('express-validator');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow for Railway deployment
}));
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many API requests, please try again later.'
});

const scoreSubmissionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 score submissions per 5 minutes
  message: 'Too many score submissions, please slow down.'
});

app.use('/api/', apiLimiter);

// Database initialization
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS player_scores (
        id SERIAL PRIMARY KEY,
        player_name VARCHAR(50) NOT NULL,
        score INTEGER NOT NULL CHECK (score >= 0 AND score <= 999999),
        game_duration INTEGER NOT NULL CHECK (game_duration >= 5),
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ip_address INET,
        user_agent TEXT
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_scores_leaderboard 
      ON player_scores (score DESC, submitted_at ASC);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_scores_player 
      ON player_scores (player_name, score DESC);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Validation middleware
const validateScoreSubmission = [
  body('playerName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z0-9\s\-_.!]+$/)
    .withMessage('Player name must be 1-50 characters and contain only letters, numbers, spaces, and basic punctuation'),
  body('score')
    .isInt({ min: 0, max: 999999 })
    .withMessage('Score must be a number between 0 and 999,999'),
  body('gameDuration')
    .isInt({ min: 5, max: 7200 })
    .withMessage('Game duration must be between 5 and 7200 seconds')
];

const validatePlayerName = [
  param('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z0-9\s\-_.!]+$/)
    .withMessage('Invalid player name format')
];

// Helper functions
function calculateMinimumGameTime(score) {
  // Minimum reasonable time based on score (anti-cheat measure)
  return Math.max(5, Math.floor(score / 50)); // At least 1 second per 50 points
}

function isReasonableScore(score, duration) {
  const maxPointsPerSecond = 15; // Maximum reasonable points per second
  return score <= (duration * maxPointsPerSecond);
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'Lt Dans Leaderboard API' });
});

// Submit a new score
app.post('/api/scores', scoreSubmissionLimiter, validateScoreSubmission, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input', details: errors.array() });
    }

    const { playerName, score, gameDuration } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';

    // Anti-cheat validations
    const minGameTime = calculateMinimumGameTime(score);
    if (gameDuration < minGameTime) {
      return res.status(400).json({ 
        error: 'Invalid game duration for score achieved',
        message: 'Game completed too quickly for the score reported'
      });
    }

    if (!isReasonableScore(score, gameDuration)) {
      return res.status(400).json({ 
        error: 'Unreasonable score',
        message: 'Score is too high for the game duration'
      });
    }

    // Insert score into database
    const result = await pool.query(
      `INSERT INTO player_scores (player_name, score, game_duration, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, submitted_at`,
      [playerName, score, gameDuration, clientIp, userAgent]
    );

    // Get player's rank
    const rankResult = await pool.query(
      'SELECT COUNT(*) + 1 as rank FROM player_scores WHERE score > $1',
      [score]
    );

    // Get player's personal best
    const personalBestResult = await pool.query(
      'SELECT MAX(score) as best_score FROM player_scores WHERE player_name = $1',
      [playerName]
    );

    const isPersonalBest = personalBestResult.rows[0].best_score <= score;

    res.status(201).json({
      success: true,
      id: result.rows[0].id,
      submittedAt: result.rows[0].submitted_at,
      globalRank: parseInt(rankResult.rows[0].rank),
      isPersonalBest,
      message: isPersonalBest ? 'New personal best!' : 'Score submitted successfully'
    });

  } catch (error) {
    console.error('Score submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get global leaderboard
app.get('/api/leaderboard/global', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 100);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    const result = await pool.query(
      `SELECT 
        ROW_NUMBER() OVER (ORDER BY score DESC, submitted_at ASC) as rank,
        player_name,
        score,
        submitted_at
       FROM player_scores 
       ORDER BY score DESC, submitted_at ASC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM player_scores');
    const totalEntries = parseInt(countResult.rows[0].count);

    res.json({
      leaderboard: result.rows,
      pagination: {
        limit,
        offset,
        totalEntries,
        hasMore: offset + limit < totalEntries
      }
    });

  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent scores
app.get('/api/leaderboard/recent', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    const result = await pool.query(
      `SELECT 
        player_name,
        score,
        submitted_at
       FROM player_scores 
       ORDER BY submitted_at DESC 
       LIMIT $1`,
      [limit]
    );

    res.json({
      recentScores: result.rows
    });

  } catch (error) {
    console.error('Recent scores fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get rank for a specific score
app.get('/api/leaderboard/rank/:score', async (req, res) => {
  try {
    const score = parseInt(req.params.score);
    if (isNaN(score) || score < 0) {
      return res.status(400).json({ error: 'Invalid score parameter' });
    }

    const result = await pool.query(
      'SELECT COUNT(*) + 1 as rank FROM player_scores WHERE score > $1',
      [score]
    );

    const totalResult = await pool.query('SELECT COUNT(*) as total FROM player_scores');
    const total = parseInt(totalResult.rows[0].total);

    res.json({
      score,
      rank: parseInt(result.rows[0].rank),
      total,
      percentile: total > 0 ? Math.round((1 - (result.rows[0].rank - 1) / total) * 100) : 0
    });

  } catch (error) {
    console.error('Rank fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get player's personal best and stats
app.get('/api/player/:name/best', validatePlayerName, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid player name', details: errors.array() });
    }

    const playerName = req.params.name;

    const result = await pool.query(
      `SELECT 
        MAX(score) as best_score,
        COUNT(*) as total_games,
        AVG(score) as average_score,
        MIN(submitted_at) as first_played,
        MAX(submitted_at) as last_played
       FROM player_scores 
       WHERE player_name = $1`,
      [playerName]
    );

    const stats = result.rows[0];

    if (!stats.best_score) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Get rank of best score
    const rankResult = await pool.query(
      'SELECT COUNT(*) + 1 as rank FROM player_scores WHERE score > $1',
      [stats.best_score]
    );

    res.json({
      playerName,
      bestScore: parseInt(stats.best_score),
      bestScoreRank: parseInt(rankResult.rows[0].rank),
      totalGames: parseInt(stats.total_games),
      averageScore: Math.round(parseFloat(stats.average_score)),
      firstPlayed: stats.first_played,
      lastPlayed: stats.last_played
    });

  } catch (error) {
    console.error('Player stats fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(port, () => {
      console.log(`Lt. Dan's Leaderboard API running on port ${port}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

startServer();
