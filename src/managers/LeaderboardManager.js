// Leaderboard Manager Class
import { API_CONFIG } from '../constants/ApiConfig.js';

export class LeaderboardManager {
    constructor() {
        this.isSubmitting = false;
        this.currentView = 'global';
    }

    async submitScore(playerName, score, gameDuration, deviceId = null) {
        if (this.isSubmitting) return null;
        
        try {
            this.isSubmitting = true;
            
            const requestBody = {
                playerName: playerName.trim(),
                score: Math.floor(score),
                gameDuration: Math.floor(gameDuration)
            };
            
            // Include device ID if provided
            if (deviceId) {
                requestBody.deviceId = deviceId;
            }
            
            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.submitScore}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to submit score');
            }

            // Save player name to localStorage for future games
            localStorage.setItem('rerun_player_name', playerName.trim());
            
            return data;
        } catch (error) {
            console.error('Score submission error:', error);
            throw error;
        } finally {
            this.isSubmitting = false;
        }
    }

    async getGlobalLeaderboard(limit = 50) {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.globalLeaderboard}?limit=${limit}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch leaderboard');
            }
            
            return data;
        } catch (error) {
            console.error('Leaderboard fetch error:', error);
            throw error;
        }
    }

    async getRecentScores(limit = 20) {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.recentScores}?limit=${limit}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch recent scores');
            }
            
            return data;
        } catch (error) {
            console.error('Recent scores fetch error:', error);
            throw error;
        }
    }

    async getPlayerStats(playerName) {
        try {
            const endpoint = API_CONFIG.endpoints.playerStats.replace('{name}', encodeURIComponent(playerName));
            const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch player stats');
            }
            
            return data;
        } catch (error) {
            console.error('Player stats fetch error:', error);
            throw error;
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatScore(score) {
        return score.toLocaleString();
    }

    getSavedPlayerName() {
        return localStorage.getItem('rerun_player_name') || '';
    }

    async checkAPIHealth() {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.health}`);
            return response.ok;
        } catch (error) {
            console.error('API health check failed:', error);
            return false;
        }
    }
}
