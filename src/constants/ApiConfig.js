// API Configuration
export const API_CONFIG = {
    baseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3001'  // Development
        : 'https://leaderboard-api-production-c84c.up.railway.app', // Production
    endpoints: {
        submitScore: '/api/scores',
        globalLeaderboard: '/api/leaderboard/global',
        recentScores: '/api/leaderboard/recent',
        playerStats: '/api/player/{name}/best',
        health: '/api/health'
    }
};
