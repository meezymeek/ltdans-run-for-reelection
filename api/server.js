const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const { body, validationResult, param } = require('express-validator');
const cron = require('node-cron');
const LeaderboardCleaner = require('./cleanup-duplicates');
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

// CORS configuration - allow specific origins
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://rerun.delta8denton.com',
      'https://ltdans-run-for-reelection-production.up.railway.app',
      'http://localhost:3000',
      'http://localhost:8080',
      'file://', // For local file access
      'null' // For local file:// protocol
    ];
    
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin) || origin === 'null') {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for now to ensure it works
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));

// Rate limiting with JSON responses
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many API requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const scoreSubmissionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // increased from 10 to 15 for better gameplay experience
  message: {
    error: 'Rate limit exceeded', 
    message: 'Too many score submissions, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
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

// Initialize cleanup system
const cleaner = new LeaderboardCleaner(pool);

// Configure cleanup schedule (default: daily at 2 AM)
const cleanupSchedule = process.env.CLEANUP_SCHEDULE || '0 2 * * *';
const backupRetentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
const cleanupDryRun = process.env.CLEANUP_DRY_RUN === 'true';

// Schedule automated cleanup
cron.schedule(cleanupSchedule, async () => {
  console.log('🔄 Starting scheduled duplicate cleanup...');
  
  try {
    const result = await cleaner.runCleanup({
      dryRun: cleanupDryRun,
      verbose: true
    });
    
    if (result.success) {
      console.log(`✅ Cleanup completed successfully:`);
      console.log(`   - Run ID: ${result.runId}`);
      console.log(`   - Duplicates found: ${result.duplicatesFound}`);
      console.log(`   - Entries backed up: ${result.entriesBackedUp}`);
      console.log(`   - Entries removed: ${result.entriesRemoved}`);
      console.log(`   - Execution time: ${result.executionTime}ms`);
      if (result.currentStats) {
        console.log(`   - Current leaderboard size: ${result.currentStats.totalEntries} entries`);
        console.log(`   - Unique players: ${result.currentStats.uniquePlayers}`);
      }
    } else {
      console.error(`❌ Cleanup failed: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Scheduled cleanup error:', error);
  }
});

// Weekly backup maintenance (Sunday at 3 AM)
cron.schedule('0 3 * * 0', async () => {
  console.log('🧹 Starting backup table maintenance...');
  
  try {
    const result = await cleaner.pruneOldBackups(backupRetentionDays);
    console.log(`✅ Backup maintenance completed: removed ${result.entriesRemoved} old backup entries`);
  } catch (error) {
    console.error('❌ Backup maintenance error:', error);
  }
});

console.log(`📅 Cleanup scheduled: ${cleanupSchedule} (${cleanupDryRun ? 'DRY RUN MODE' : 'LIVE MODE'})`);
console.log(`🗂️ Backup retention: ${backupRetentionDays} days`);

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

// Helper functions - simplified validation
function isValidGameDuration(duration) {
  // Just ensure reasonable time range
  return duration >= 5 && duration <= 7200; // 5 seconds to 2 hours
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'RERUN: Danny Boy Leaderboard API' });
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

    // Basic validation - just ensure reasonable game duration
    if (!isValidGameDuration(gameDuration)) {
      return res.status(400).json({ 
        error: 'Invalid game duration',
        message: 'Game duration must be between 5 seconds and 2 hours'
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

// Admin endpoints for cleanup management
const adminApiKey = process.env.ADMIN_API_KEY;

// Middleware to check admin authorization
const requireAdminAuth = (req, res, next) => {
  if (adminApiKey) {
    const providedKey = req.headers['x-admin-key'] || req.query.adminKey;
    if (providedKey !== adminApiKey) {
      return res.status(401).json({ error: 'Unauthorized - Invalid admin key' });
    }
  }
  next();
};

// Get cleanup status and history
app.get('/api/admin/cleanup/status', requireAdminAuth, async (req, res) => {
  try {
    const history = await cleaner.getBackupHistory(5);
    
    // Get current leaderboard stats
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_entries,
        COUNT(DISTINCT player_name) as unique_players,
        MAX(submitted_at) as latest_submission
      FROM player_scores
    `);

    // Get backup table size
    const backupStats = await pool.query('SELECT COUNT(*) as backup_entries FROM player_scores_backup');

    res.json({
      success: true,
      currentStats: {
        totalEntries: parseInt(stats.rows[0].total_entries),
        uniquePlayers: parseInt(stats.rows[0].unique_players),
        latestSubmission: stats.rows[0].latest_submission,
        backupEntries: parseInt(backupStats.rows[0].backup_entries)
      },
      cleanupConfig: {
        schedule: cleanupSchedule,
        dryRunMode: cleanupDryRun,
        backupRetentionDays
      },
      recentCleanups: history
    });
  } catch (error) {
    console.error('Admin status error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Manually trigger cleanup
app.post('/api/admin/cleanup/run', requireAdminAuth, async (req, res) => {
  try {
    const { dryRun = false, keepRecentDays = null } = req.body;
    
    console.log('🔧 Manual cleanup triggered by admin');
    
    const result = await cleaner.runCleanup({
      dryRun,
      keepRecentDays,
      verbose: true
    });
    
    res.json({
      success: result.success,
      ...result
    });
  } catch (error) {
    console.error('Manual cleanup error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Preview what would be cleaned (dry run)
app.get('/api/admin/cleanup/dry-run', requireAdminAuth, async (req, res) => {
  try {
    const keepRecentDays = req.query.keepRecentDays ? parseInt(req.query.keepRecentDays) : null;
    
    const result = await cleaner.runCleanup({
      dryRun: true,
      keepRecentDays,
      verbose: false
    });
    
    res.json({
      success: true,
      preview: {
        duplicatesFound: result.duplicatesFound,
        wouldBeRemoved: result.duplicatesFound,
        currentStats: result.currentStats,
        executionTime: result.executionTime
      }
    });
  } catch (error) {
    console.error('Dry run error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get backup history
app.get('/api/admin/cleanup/backups', requireAdminAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const history = await cleaner.getBackupHistory(limit);
    
    res.json({
      success: true,
      backups: history
    });
  } catch (error) {
    console.error('Backup history error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Restore from backup
app.post('/api/admin/cleanup/restore/:runId', requireAdminAuth, async (req, res) => {
  try {
    const { runId } = req.params;
    
    console.log(`🔄 Manual restore triggered by admin for run: ${runId}`);
    
    const result = await cleaner.restoreFromBackup(runId);
    
    res.json(result);
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Prune old backups
app.post('/api/admin/cleanup/prune-backups', requireAdminAuth, async (req, res) => {
  try {
    const { daysToKeep = 30 } = req.body;
    
    console.log(`🧹 Manual backup pruning triggered by admin (keeping ${daysToKeep} days)`);
    
    const result = await cleaner.pruneOldBackups(daysToKeep);
    
    res.json(result);
  } catch (error) {
    console.error('Backup pruning error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
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
      console.log(`RERUN: Danny Boy Leaderboard API running on port ${port}`);
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
