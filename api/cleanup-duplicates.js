const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

class LeaderboardCleaner {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Main cleanup function that backs up and removes duplicate player entries
   * @param {Object} options - Configuration options
   * @param {boolean} options.dryRun - If true, only reports what would be done
   * @param {number} options.keepRecentDays - Only clean up entries older than X days
   * @param {boolean} options.verbose - Enable detailed logging
   * @returns {Object} Cleanup results and statistics
   */
  async runCleanup(options = {}) {
    const {
      dryRun = false,
      keepRecentDays = null,
      verbose = true
    } = options;

    const startTime = Date.now();
    const runId = uuidv4();
    let client;

    try {
      client = await this.pool.connect();
      
      if (verbose) {
        console.log(`🧹 Starting leaderboard cleanup (Run ID: ${runId})`);
        console.log(`📊 Mode: ${dryRun ? 'DRY RUN' : 'LIVE RUN'}`);
        if (keepRecentDays) {
          console.log(`📅 Only processing entries older than ${keepRecentDays} days`);
        }
      }

      // Begin transaction for safety
      await client.query('BEGIN');

      // Create backup table if it doesn't exist
      await this.ensureBackupTable(client);

      // Find duplicates to be removed
      const duplicatesToRemove = await this.findDuplicates(client, keepRecentDays);
      
      if (verbose) {
        console.log(`🔍 Found ${duplicatesToRemove.length} duplicate entries to remove`);
      }

      if (duplicatesToRemove.length === 0) {
        await client.query('ROLLBACK');
        return {
          success: true,
          runId,
          duplicatesFound: 0,
          entriesBackedUp: 0,
          entriesRemoved: 0,
          executionTime: Date.now() - startTime,
          message: 'No duplicates found'
        };
      }

      let entriesBackedUp = 0;
      let entriesRemoved = 0;

      if (!dryRun) {
        // Backup duplicates before deletion
        entriesBackedUp = await this.backupDuplicates(client, duplicatesToRemove, runId);
        
        if (verbose) {
          console.log(`💾 Backed up ${entriesBackedUp} entries to backup table`);
        }

        // Verify backup was successful
        const backupVerified = await this.verifyBackup(client, runId, entriesBackedUp);
        if (!backupVerified) {
          throw new Error('Backup verification failed - aborting cleanup');
        }

        // Remove duplicates from main table
        entriesRemoved = await this.removeDuplicates(client, duplicatesToRemove);
        
        if (verbose) {
          console.log(`🗑️ Removed ${entriesRemoved} duplicate entries from main table`);
        }
      }

      // Get final statistics
      const stats = await this.getCleanupStats(client);
      
      if (dryRun) {
        await client.query('ROLLBACK');
      } else {
        await client.query('COMMIT');
      }

      const executionTime = Date.now() - startTime;
      
      if (verbose) {
        console.log(`✅ Cleanup completed in ${executionTime}ms`);
        console.log(`📈 Current leaderboard size: ${stats.totalEntries} entries`);
        console.log(`👥 Unique players: ${stats.uniquePlayers}`);
      }

      return {
        success: true,
        runId,
        duplicatesFound: duplicatesToRemove.length,
        entriesBackedUp,
        entriesRemoved,
        currentStats: stats,
        executionTime,
        dryRun
      };

    } catch (error) {
      if (client) {
        await client.query('ROLLBACK');
      }
      
      console.error('❌ Cleanup failed:', error.message);
      
      return {
        success: false,
        runId,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Creates backup table if it doesn't exist
   */
  async ensureBackupTable(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS player_scores_backup (
        id SERIAL PRIMARY KEY,
        original_id INTEGER NOT NULL,
        player_name VARCHAR(50) NOT NULL,
        score INTEGER NOT NULL,
        game_duration INTEGER NOT NULL,
        submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
        ip_address INET,
        user_agent TEXT,
        backed_up_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        cleanup_run_id UUID NOT NULL,
        reason VARCHAR(100) DEFAULT 'duplicate_cleanup'
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_backup_run_id 
      ON player_scores_backup (cleanup_run_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_backup_date 
      ON player_scores_backup (backed_up_at);
    `);
  }

  /**
   * Finds duplicate entries that should be removed (keeps highest score per player)
   */
  async findDuplicates(client, keepRecentDays) {
    let dateFilter = '';
    let queryParams = [];

    if (keepRecentDays) {
      dateFilter = 'AND submitted_at < CURRENT_TIMESTAMP - INTERVAL $1 days';
      queryParams = [keepRecentDays];
    }

    const query = `
      SELECT id, player_name, score, game_duration, submitted_at, ip_address, user_agent
      FROM player_scores ps1
      WHERE EXISTS (
        SELECT 1 FROM player_scores ps2
        WHERE ps2.player_name = ps1.player_name
        AND (ps2.score > ps1.score 
             OR (ps2.score = ps1.score AND ps2.submitted_at > ps1.submitted_at))
        ${dateFilter}
      )
      ${dateFilter}
      ORDER BY player_name, score DESC, submitted_at DESC;
    `;

    const result = await client.query(query, queryParams);
    return result.rows;
  }

  /**
   * Backs up duplicate entries to backup table
   */
  async backupDuplicates(client, duplicates, runId) {
    if (duplicates.length === 0) return 0;

    const values = duplicates.map((dup, index) => {
      const baseIndex = index * 8;
      return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8})`;
    }).join(', ');

    const params = duplicates.flatMap(dup => [
      dup.id,
      dup.player_name,
      dup.score,
      dup.game_duration,
      dup.submitted_at,
      dup.ip_address,
      dup.user_agent,
      runId
    ]);

    const query = `
      INSERT INTO player_scores_backup 
      (original_id, player_name, score, game_duration, submitted_at, ip_address, user_agent, cleanup_run_id)
      VALUES ${values};
    `;

    const result = await client.query(query, params);
    return result.rowCount;
  }

  /**
   * Verifies backup was successful
   */
  async verifyBackup(client, runId, expectedCount) {
    const result = await client.query(
      'SELECT COUNT(*) as count FROM player_scores_backup WHERE cleanup_run_id = $1',
      [runId]
    );
    
    const actualCount = parseInt(result.rows[0].count);
    return actualCount === expectedCount;
  }

  /**
   * Removes duplicate entries from main table
   */
  async removeDuplicates(client, duplicates) {
    if (duplicates.length === 0) return 0;

    const ids = duplicates.map(dup => dup.id);
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
    
    const result = await client.query(
      `DELETE FROM player_scores WHERE id IN (${placeholders})`,
      ids
    );
    
    return result.rowCount;
  }

  /**
   * Gets current leaderboard statistics
   */
  async getCleanupStats(client) {
    const totalResult = await client.query('SELECT COUNT(*) as count FROM player_scores');
    const uniqueResult = await client.query('SELECT COUNT(DISTINCT player_name) as count FROM player_scores');
    
    return {
      totalEntries: parseInt(totalResult.rows[0].count),
      uniquePlayers: parseInt(uniqueResult.rows[0].count)
    };
  }

  /**
   * Restores entries from a specific backup run
   */
  async restoreFromBackup(runId) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get backup entries
      const backupResult = await client.query(
        'SELECT * FROM player_scores_backup WHERE cleanup_run_id = $1',
        [runId]
      );
      
      if (backupResult.rows.length === 0) {
        throw new Error(`No backup found for run ID: ${runId}`);
      }
      
      // Restore entries
      const values = backupResult.rows.map((row, index) => {
        const baseIndex = index * 6;
        return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`;
      }).join(', ');

      const params = backupResult.rows.flatMap(row => [
        row.player_name,
        row.score,
        row.game_duration,
        row.submitted_at,
        row.ip_address,
        row.user_agent
      ]);

      await client.query(`
        INSERT INTO player_scores (player_name, score, game_duration, submitted_at, ip_address, user_agent)
        VALUES ${values}
      `, params);
      
      await client.query('COMMIT');
      
      return {
        success: true,
        entriesRestored: backupResult.rows.length,
        runId
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Removes old backup entries
   */
  async pruneOldBackups(daysToKeep = 30) {
    const result = await this.pool.query(
      'DELETE FROM player_scores_backup WHERE backed_up_at < CURRENT_TIMESTAMP - INTERVAL $1 days',
      [daysToKeep]
    );
    
    return {
      success: true,
      entriesRemoved: result.rowCount
    };
  }

  /**
   * Gets backup history
   */
  async getBackupHistory(limit = 10) {
    const result = await this.pool.query(`
      SELECT 
        cleanup_run_id,
        COUNT(*) as entries_backed_up,
        MIN(backed_up_at) as backup_time,
        STRING_AGG(DISTINCT player_name, ', ' ORDER BY player_name) as players_affected
      FROM player_scores_backup 
      GROUP BY cleanup_run_id, backed_up_at
      ORDER BY backup_time DESC 
      LIMIT $1
    `, [limit]);
    
    return result.rows;
  }
}

module.exports = LeaderboardCleaner;
