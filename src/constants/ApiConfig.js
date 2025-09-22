// API Configuration with dynamic environment detection
function getApiBaseUrl() {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3001';
    } else if (hostname.includes('bugfix')) {
        return 'https://leaderboard-api-bugfix.up.railway.app';
    } else {
        // Default to production for main domain and production environment
        return 'https://leaderboard-api-production-c84c.up.railway.app';
    }
}

export const API_CONFIG = {
    baseUrl: getApiBaseUrl(),
    endpoints: {
        submitScore: '/api/scores',
        globalLeaderboard: '/api/leaderboard/global',
        recentScores: '/api/leaderboard/recent',
        playerStats: '/api/player/{name}/best',
        health: '/api/health'
    }
};
