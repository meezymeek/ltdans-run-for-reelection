// Lt. Dan's Run for Re-Election - Mobile Endless Runner Game

// Leaderboard API Configuration
const API_CONFIG = {
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

// Leaderboard Manager Class
class LeaderboardManager {
    constructor() {
        this.isSubmitting = false;
        this.currentView = 'global';
    }

    async submitScore(playerName, score, gameDuration) {
        if (this.isSubmitting) return null;
        
        try {
            this.isSubmitting = true;
            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.submitScore}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerName: playerName.trim(),
                    score: Math.floor(score),
                    gameDuration: Math.floor(gameDuration)
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to submit score');
            }

            // Save player name to localStorage for future games
            localStorage.setItem('ltdan_player_name', playerName.trim());
            
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
        return localStorage.getItem('ltdan_player_name') || '';
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

class LtDanRunner {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.finalScoreElement = document.getElementById('finalScore');
        
        // UI Screen elements
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.leaderboardScreen = document.getElementById('leaderboardScreen');
        this.playerStatsScreen = document.getElementById('playerStatsScreen');
        
        // Button elements
        this.startButton = document.getElementById('startButton');
        this.restartButton = document.getElementById('restartButton');
        this.leaderboardButton = document.getElementById('leaderboardButton');
        this.viewLeaderboardButton = document.getElementById('viewLeaderboardButton');
        this.backToMenuButton = document.getElementById('backToMenuButton');
        this.backToLeaderboardButton = document.getElementById('backToLeaderboardButton');
        
        // Leaderboard elements
        this.globalTabButton = document.getElementById('globalTabButton');
        this.recentTabButton = document.getElementById('recentTabButton');
        this.refreshLeaderboardButton = document.getElementById('refreshLeaderboardButton');
        this.leaderboardContent = document.getElementById('leaderboardContent');
        
        // Score submission elements
        this.scoreSubmissionForm = document.getElementById('scoreSubmissionForm');
        this.playerNameInput = document.getElementById('playerNameInput');
        this.submitScoreButton = document.getElementById('submitScoreButton');
        this.skipSubmissionButton = document.getElementById('skipSubmissionButton');
        this.scoreResult = document.getElementById('scoreResult');
        
        // Initialize leaderboard manager
        this.leaderboard = new LeaderboardManager();
        
        // Game timing
        this.gameStartTime = 0;
        this.gameEndTime = 0;
        
        // Game configuration (easily adjustable for difficulty scaling)
        this.config = {
            gravity: 0.8,
            jumpPower: -15,
            groundLevel: 0.8,
            gameSpeed: 4,
            obstacleSpawnRate: 120, // frames between obstacles (fixed interval)
            obstacleSpeed: 4,
            scoreMultiplier: 1
        };
        
        // Game state
        this.gameState = 'start'; // 'start', 'playing', 'gameOver'
        this.score = 0;
        this.gameFrame = 0;
        
        // Player object
        this.player = {
            x: 100,
            y: 0,
            width: 40,
            height: 60,
            velocityY: 0,
            isJumping: false,
            groundY: 0,
            color: '#ff6b6b'
        };
        
        // Obstacles array
        this.obstacles = [];
        
        // Background elements for scrolling effect
        this.backgroundElements = [];
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.calculatePositions();
        this.createBackgroundElements();
        this.gameLoop();
    }
    
    setupCanvas() {
        // Make canvas responsive
        const container = this.canvas.parentElement;
        const containerWidth = Math.min(container.clientWidth * 0.95, 800);
        const containerHeight = Math.min(container.clientHeight * 0.7, 600);
        
        this.canvas.width = containerWidth;
        this.canvas.height = containerHeight;
        this.canvas.style.width = containerWidth + 'px';
        this.canvas.style.height = containerHeight + 'px';
    }
    
    calculatePositions() {
        // Calculate positions based on canvas size
        this.player.groundY = this.canvas.height * this.config.groundLevel;
        this.player.y = this.player.groundY - this.player.height;
    }
    
    setupEventListeners() {
        // Game button event listeners
        this.startButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.restartGame());
        
        // Leaderboard navigation buttons
        this.leaderboardButton.addEventListener('click', () => this.showLeaderboard());
        this.viewLeaderboardButton.addEventListener('click', () => this.showLeaderboard());
        this.backToMenuButton.addEventListener('click', () => this.showStartScreen());
        this.backToLeaderboardButton.addEventListener('click', () => this.showLeaderboard());
        
        // Leaderboard tab buttons
        this.globalTabButton.addEventListener('click', () => this.showGlobalLeaderboard());
        this.recentTabButton.addEventListener('click', () => this.showRecentScores());
        this.refreshLeaderboardButton.addEventListener('click', () => this.refreshCurrentView());
        
        // Score submission buttons
        this.submitScoreButton.addEventListener('click', () => this.submitScore());
        this.skipSubmissionButton.addEventListener('click', () => this.skipScoreSubmission());
        
        // Player name input enter key
        this.playerNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submitScore();
            }
        });
        
        // Touch event listeners for mobile controls - just for jumping
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        
        // Mouse events for desktop testing
        this.canvas.addEventListener('click', () => this.handleJump());
        
        // Prevent default touch behaviors
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Window resize handler
        window.addEventListener('resize', () => {
            setTimeout(() => {
                this.setupCanvas();
                this.calculatePositions();
            }, 100);
        });
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        
        if (this.gameState === 'playing') {
            // Jump on touch
            this.handleJump();
        }
    }
    
    handleJump() {
        if (this.gameState !== 'playing') return;
        
        if (!this.player.isJumping) {
            this.player.velocityY = this.config.jumpPower;
            this.player.isJumping = true;
        }
    }
    
    createBackgroundElements() {
        // Create scrolling background elements (clouds, buildings, etc.)
        for (let i = 0; i < 5; i++) {
            this.backgroundElements.push({
                x: Math.random() * this.canvas.width * 2,
                y: Math.random() * this.canvas.height * 0.5,
                width: 60 + Math.random() * 40,
                height: 30 + Math.random() * 20,
                speed: 0.5 + Math.random() * 1,
                color: `rgba(255, 255, 255, ${0.1 + Math.random() * 0.2})`
            });
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.gameStartTime = Date.now();
        this.hideAllScreens();
        this.score = 0;
        this.gameFrame = 0;
        this.obstacles = [];
        this.player.y = this.player.groundY - this.player.height;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.height = 60;
        
        // Reset game speed
        this.config.gameSpeed = 4;
        this.config.obstacleSpeed = 4;
        
        this.updateScore();
    }
    
    restartGame() {
        this.startGame();
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.gameEndTime = Date.now();
        this.finalScoreElement.textContent = this.score;
        
        // Check if this might be a high score worth submitting
        this.checkForHighScore();
        
        this.gameOverScreen.classList.remove('hidden');
    }

    // Screen Management Methods
    hideAllScreens() {
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.leaderboardScreen.classList.add('hidden');
        this.playerStatsScreen.classList.add('hidden');
    }

    showStartScreen() {
        this.hideAllScreens();
        this.startScreen.classList.remove('hidden');
    }

    showLeaderboard() {
        this.hideAllScreens();
        this.leaderboardScreen.classList.remove('hidden');
        this.showGlobalLeaderboard();
    }

    // Leaderboard Display Methods
    async showGlobalLeaderboard() {
        this.setActiveTab('global');
        this.leaderboard.currentView = 'global';
        this.showLoadingState();

        try {
            const data = await this.leaderboard.getGlobalLeaderboard(50);
            this.renderLeaderboard(data.leaderboard, 'Global Top 50');
        } catch (error) {
            this.showErrorState('Failed to load leaderboard. Please try again.');
        }
    }

    async showRecentScores() {
        this.setActiveTab('recent');
        this.leaderboard.currentView = 'recent';
        this.showLoadingState();

        try {
            const data = await this.leaderboard.getRecentScores(20);
            this.renderRecentScores(data.recentScores, 'Recent 20 Scores');
        } catch (error) {
            this.showErrorState('Failed to load recent scores. Please try again.');
        }
    }

    async refreshCurrentView() {
        if (this.leaderboard.currentView === 'global') {
            await this.showGlobalLeaderboard();
        } else {
            await this.showRecentScores();
        }
    }

    setActiveTab(tabName) {
        this.globalTabButton.classList.remove('active');
        this.recentTabButton.classList.remove('active');
        
        if (tabName === 'global') {
            this.globalTabButton.classList.add('active');
        } else {
            this.recentTabButton.classList.add('active');
        }
    }

    showLoadingState() {
        this.leaderboardContent.innerHTML = '<div class="loading">Loading leaderboard</div>';
    }

    showErrorState(message) {
        this.leaderboardContent.innerHTML = `
            <div style="text-align: center; color: #ff6666; padding: 2rem;">
                <p>${message}</p>
                <button onclick="window.gameInstance.refreshCurrentView()" style="margin-top: 1rem;">
                    Try Again
                </button>
            </div>
        `;
    }

    renderLeaderboard(entries, title) {
        if (!entries || entries.length === 0) {
            this.leaderboardContent.innerHTML = `
                <div style="text-align: center; color: #ffd700; padding: 2rem;">
                    <p>No scores yet!</p>
                    <p>Be the first to set a high score!</p>
                </div>
            `;
            return;
        }

        let html = `<div class="leaderboard-table">`;
        
        entries.forEach((entry, index) => {
            const rankDisplay = entry.rank || (index + 1);
            const medal = rankDisplay === 1 ? '🥇' : rankDisplay === 2 ? '🥈' : rankDisplay === 3 ? '🥉' : '';
            
            html += `
                <div class="leaderboard-entry">
                    <span class="leaderboard-rank">${medal} #${rankDisplay}</span>
                    <span class="leaderboard-name">${this.escapeHtml(entry.player_name)}</span>
                    <span class="leaderboard-score">${this.leaderboard.formatScore(entry.score)}</span>
                    <span class="leaderboard-date">${this.leaderboard.formatDate(entry.submitted_at)}</span>
                </div>
            `;
        });
        
        html += `</div>`;
        this.leaderboardContent.innerHTML = html;
    }

    renderRecentScores(entries, title) {
        if (!entries || entries.length === 0) {
            this.leaderboardContent.innerHTML = `
                <div style="text-align: center; color: #ffd700; padding: 2rem;">
                    <p>No recent scores!</p>
                </div>
            `;
            return;
        }

        let html = `<div class="leaderboard-table">`;
        
        entries.forEach((entry, index) => {
            html += `
                <div class="leaderboard-entry">
                    <span class="leaderboard-name">${this.escapeHtml(entry.player_name)}</span>
                    <span class="leaderboard-score">${this.leaderboard.formatScore(entry.score)}</span>
                    <span class="leaderboard-date">${this.leaderboard.formatDate(entry.submitted_at)}</span>
                </div>
            `;
        });
        
        html += `</div>`;
        this.leaderboardContent.innerHTML = html;
    }

    // Score Submission Methods
    checkForHighScore() {
        // Reset submission form state
        this.scoreSubmissionForm.classList.add('hidden');
        this.scoreResult.classList.add('hidden');
        
        // Show submission form for any score > 50
        if (this.score > 50) {
            this.showScoreSubmissionForm();
        }
    }

    showScoreSubmissionForm() {
        const savedName = this.leaderboard.getSavedPlayerName();
        this.playerNameInput.value = savedName;
        this.scoreSubmissionForm.classList.remove('hidden');
        
        // Focus on input if no saved name
        if (!savedName) {
            setTimeout(() => this.playerNameInput.focus(), 100);
        }
    }

    async submitScore() {
        const playerName = this.playerNameInput.value.trim();
        
        if (!playerName) {
            this.showSubmissionResult('Please enter your name!', true);
            this.playerNameInput.focus();
            return;
        }

        if (playerName.length > 50) {
            this.showSubmissionResult('Name is too long (max 50 characters)', true);
            return;
        }

        // Calculate game duration with fallback
        let gameDuration = Math.floor((this.gameEndTime - this.gameStartTime) / 1000);
        
        // Ensure minimum game duration (anti-cheat protection)
        if (gameDuration < 5) {
            gameDuration = Math.max(5, Math.floor(this.score / 10)); // Estimate based on score
        }
        
        // Cap maximum duration to prevent issues
        if (gameDuration > 7200) {
            gameDuration = 7200;
        }

        console.log('Submitting score:', {
            playerName,
            score: this.score,
            gameDuration
        });
        
        // Disable submit button
        this.submitScoreButton.disabled = true;
        this.submitScoreButton.textContent = 'Submitting...';

        try {
            const result = await this.leaderboard.submitScore(playerName, this.score, gameDuration);
            
            if (result) {
                const message = `
                    Score submitted successfully!<br>
                    Global Rank: #${result.globalRank}<br>
                    ${result.isPersonalBest ? '🎉 New personal best!' : ''}
                `;
                this.showSubmissionResult(message, false);
                
                // Hide submission form after successful submit
                setTimeout(() => {
                    this.scoreSubmissionForm.classList.add('hidden');
                }, 3000);
            }
        } catch (error) {
            console.error('Full error details:', error);
            this.showSubmissionResult(`Failed to submit score: ${error.message}`, true);
        } finally {
            // Re-enable submit button
            this.submitScoreButton.disabled = false;
            this.submitScoreButton.textContent = 'Submit Score';
        }
    }

    skipScoreSubmission() {
        this.scoreSubmissionForm.classList.add('hidden');
        this.scoreResult.classList.add('hidden');
    }

    showSubmissionResult(message, isError) {
        this.scoreResult.innerHTML = message;
        this.scoreResult.className = isError ? 'score-result error' : 'score-result';
        this.scoreResult.classList.remove('hidden');
        
        if (isError) {
            setTimeout(() => {
                this.scoreResult.classList.add('hidden');
            }, 5000);
        }
    }

    // Utility Methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getGameDuration() {
        if (this.gameEndTime && this.gameStartTime) {
            return Math.floor((this.gameEndTime - this.gameStartTime) / 1000);
        }
        return 0;
    }
    
    updatePlayer() {
        if (this.gameState !== 'playing') return;
        
        // Apply gravity
        this.player.velocityY += this.config.gravity;
        this.player.y += this.player.velocityY;
        
        // Ground collision
        const groundY = this.player.groundY - this.player.height;
            
        if (this.player.y >= groundY) {
            this.player.y = groundY;
            this.player.velocityY = 0;
            this.player.isJumping = false;
        }
    }
    
    spawnObstacle() {
        if (this.gameFrame % this.config.obstacleSpawnRate === 0) {
            // Only spawn low obstacles that can be jumped over
            const obstacle = {
                x: this.canvas.width + 50,
                y: this.player.groundY - 40,
                width: 30,
                height: 40,
                speed: this.config.obstacleSpeed,
                type: 'low',
                color: '#8B4513'
            };
            this.obstacles.push(obstacle);
        }
    }
    
    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= obstacle.speed;
            
            // Remove obstacles that have gone off screen
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
                this.score += 10;
                this.updateScore();
            }
            
            // Collision detection
            if (this.checkCollision(this.player, obstacle)) {
                this.gameOver();
                return;
            }
        }
    }
    
    checkCollision(player, obstacle) {
        return player.x < obstacle.x + obstacle.width &&
               player.x + player.width > obstacle.x &&
               player.y < obstacle.y + obstacle.height &&
               player.y + player.height > obstacle.y;
    }
    
    updateBackground() {
        for (let element of this.backgroundElements) {
            element.x -= element.speed;
            
            // Reset position when off screen
            if (element.x + element.width < 0) {
                element.x = this.canvas.width + Math.random() * 200;
                element.y = Math.random() * this.canvas.height * 0.5;
            }
        }
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
        
        // Gradually increase game speed
        if (this.score > 0 && this.score % 100 === 0) {
            this.config.gameSpeed = Math.min(this.config.gameSpeed + 0.2, 8);
            this.config.obstacleSpeed = Math.min(this.config.obstacleSpeed + 0.2, 8);
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background elements
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let element of this.backgroundElements) {
            this.ctx.fillStyle = element.color;
            this.ctx.fillRect(element.x, element.y, element.width, element.height);
        }
        
        // Draw ground line
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.player.groundY);
        this.ctx.lineTo(this.canvas.width, this.player.groundY);
        this.ctx.stroke();
        
        // Draw player (Lt. Dan)
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(
            this.player.x, 
            this.player.y, 
            this.player.width, 
            this.player.height
        );
        
        // Add simple face to Lt. Dan
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(this.player.x + 8, this.player.y + 8, 6, 6); // Left eye
        this.ctx.fillRect(this.player.x + 26, this.player.y + 8, 6, 6); // Right eye
        
        // Draw obstacles
        for (let obstacle of this.obstacles) {
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Add simple pattern to obstacles
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, 3);
        }
        
        // Draw UI hints during gameplay
        if (this.gameState === 'playing' && this.gameFrame < 300) {
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
            this.ctx.font = `${Math.max(12, this.canvas.width * 0.02)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                'TAP TO JUMP', 
                this.canvas.width / 2, 
                50
            );
        }
    }
    
    gameLoop() {
        if (this.gameState === 'playing') {
            this.gameFrame++;
            this.updatePlayer();
            this.spawnObstacle();
            this.updateObstacles();
            this.updateBackground();
            
            // Continuous scoring
            if (this.gameFrame % 10 === 0) {
                this.score += 1;
                this.updateScore();
            }
        }
        
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new LtDanRunner();
});

// Prevent scrolling on touch devices
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// Prevent zoom on double tap
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);
