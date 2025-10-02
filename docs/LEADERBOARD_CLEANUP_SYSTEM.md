# 🧹 Leaderboard Cleanup System Documentation

## Overview

The automated leaderboard cleanup system removes duplicate player entries while keeping only the highest score for each player. It includes comprehensive backup functionality and admin controls for safe operation.

## Features

✅ **Automated Duplicate Removal** - Keeps highest score per player  
✅ **Complete Backup System** - All removed entries backed up before deletion  
✅ **Scheduled Execution** - Runs automatically via cron jobs  
✅ **Admin API Endpoints** - Manual control and monitoring  
✅ **Dry Run Mode** - Test safely without making changes  
✅ **Transaction Safety** - All operations in database transactions  
✅ **Configurable Schedule** - Customizable via environment variables  
✅ **Backup Retention** - Automatic cleanup of old backups  

## Environment Variables

Configure the cleanup system using these Railway environment variables:

### Core Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CLEANUP_SCHEDULE` | `0 2 * * *` | Cron schedule (daily at 2 AM) |
| `CLEANUP_DRY_RUN` | `false` | Set to `true` to enable dry-run mode |
| `BACKUP_RETENTION_DAYS` | `30` | Days to keep backup entries |
| `ADMIN_API_KEY` | *none* | API key for admin endpoints (optional but recommended) |

### Schedule Examples

```bash
# Daily at 2 AM (default)
CLEANUP_SCHEDULE=0 2 * * *

# Every 6 hours
CLEANUP_SCHEDULE=0 */6 * * *

# Weekly on Sunday at 3 AM
CLEANUP_SCHEDULE=0 3 * * 0

# Every hour (for testing)
CLEANUP_SCHEDULE=0 * * * *
```

### Security Configuration

```bash
# Set a secure admin API key
ADMIN_API_KEY=your-secure-random-key-here

# Enable dry run mode for initial testing
CLEANUP_DRY_RUN=true

# Keep backups for 60 days
BACKUP_RETENTION_DAYS=60
```

## Admin API Endpoints

All admin endpoints require authentication via `x-admin-key` header or `adminKey` query parameter (if `ADMIN_API_KEY` is set).

### Base URL
```
https://your-api-domain.railway.app/api/admin/cleanup
```

### Available Endpoints

#### Get Status
```http
GET /api/admin/cleanup/status
```
Returns current leaderboard stats, cleanup configuration, and recent cleanup history.

#### Manual Cleanup
```http
POST /api/admin/cleanup/run
Content-Type: application/json

{
  "dryRun": false,
  "keepRecentDays": null
}
```

#### Dry Run Preview
```http
GET /api/admin/cleanup/dry-run?keepRecentDays=7
```
Shows what would be cleaned without making changes.

#### Backup History
```http
GET /api/admin/cleanup/backups?limit=10
```

#### Restore from Backup
```http
POST /api/admin/cleanup/restore/{runId}
```

#### Prune Old Backups
```http
POST /api/admin/cleanup/prune-backups
Content-Type: application/json

{
  "daysToKeep": 30
}
```

## Database Schema

### Backup Table
```sql
CREATE TABLE player_scores_backup (
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
```

## Railway Deployment

### 1. Add Environment Variables

In Railway dashboard:
1. Go to your API service
2. Click "Variables" tab
3. Add the environment variables:

```bash
CLEANUP_SCHEDULE=0 2 * * *
CLEANUP_DRY_RUN=false
BACKUP_RETENTION_DAYS=30
ADMIN_API_KEY=your-secure-key-here
```

### 2. Deploy Updated Code

The system will automatically:
- Install new dependencies (`node-cron`, `uuid`)
- Create backup table on first run
- Start scheduled cleanup jobs
- Enable admin endpoints

### 3. Verify Deployment

Check Railway logs for:
```
📅 Cleanup scheduled: 0 2 * * * (LIVE MODE)
🗂️ Backup retention: 30 days
```

## Usage Examples

### Testing with Admin API

```bash
# Check system status
curl -H "x-admin-key: your-key" \
  https://your-api.railway.app/api/admin/cleanup/status

# Run dry run to see what would be cleaned
curl -H "x-admin-key: your-key" \
  https://your-api.railway.app/api/admin/cleanup/dry-run

# Manual cleanup
curl -X POST -H "Content-Type: application/json" \
  -H "x-admin-key: your-key" \
  -d '{"dryRun": false}' \
  https://your-api.railway.app/api/admin/cleanup/run
```

### Monitoring Logs

Railway logs will show:
```
🧹 Starting leaderboard cleanup (Run ID: abc-123)
📊 Mode: LIVE RUN
🔍 Found 15 duplicate entries to remove
💾 Backed up 15 entries to backup table
🗑️ Removed 15 duplicate entries from main table
✅ Cleanup completed in 234ms
📈 Current leaderboard size: 150 entries
👥 Unique players: 75
```

## Safety Features

### Transaction Safety
All operations are wrapped in database transactions:
- If backup fails → no deletion occurs
- If verification fails → transaction rolled back
- Any error → complete rollback

### Backup Verification
Before deletion, the system:
- Counts backed up entries
- Verifies count matches expected
- Only proceeds if verification passes

### Dry Run Mode
Test safely without changes:
- Shows what would be cleaned
- No actual modifications
- Perfect for testing queries

### Restore Capability
Every cleanup run can be restored:
- Each run has unique UUID
- All backed up data preserved
- Restore specific cleanup runs
- Full audit trail maintained

## Troubleshooting

### Common Issues

**No duplicates found**
- Normal if no duplicates exist
- Check logs for "Found 0 duplicate entries"

**Backup verification failed**
- Transaction automatically rolled back
- Check database connectivity
- Review backup table permissions

**Admin endpoints return 401**
- Check `ADMIN_API_KEY` environment variable
- Verify header: `x-admin-key: your-key`
- Or use query param: `?adminKey=your-key`

### Performance Considerations

- Cleanup runs during low traffic (default: 2 AM)
- Uses efficient SQL with proper indexes
- Transaction-based for consistency
- Automatic backup table maintenance

## Monitoring & Alerts

### Railway Logs
Monitor these log patterns:
- ✅ Successful cleanup
- ❌ Failed cleanup  
- 🧹 Backup maintenance
- 📊 Statistics updates

### Admin Dashboard
Use `/api/admin/cleanup/status` for:
- Current leaderboard size
- Backup table size
- Recent cleanup history
- Configuration verification

## Security Notes

1. **Admin API Key**: Always set `ADMIN_API_KEY` in production
2. **Rate Limiting**: Admin endpoints use existing rate limits
3. **CORS**: Configured for your game domains
4. **Input Validation**: All admin inputs validated
5. **Error Handling**: No sensitive data in error responses

---

## Summary

The cleanup system provides automated, safe duplicate removal with:
- 🔒 **Safe**: Full backup before any deletion
- 🔄 **Automated**: Scheduled execution with cron
- 🛠 **Configurable**: Environment variable control
- 👨‍💼 **Manageable**: Admin API for manual control
- 📊 **Monitored**: Comprehensive logging and status
- ⚡ **Fast**: Optimized SQL with proper indexing

Your Railway leaderboard now has production-ready duplicate management!
