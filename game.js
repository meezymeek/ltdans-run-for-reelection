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
        this.scoreElement = document.getElementById('scoreBadge');
        this.finalScoreElement = document.getElementById('finalScore');
        
        // UI Screen elements
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.leaderboardScreen = document.getElementById('leaderboardScreen');
        this.playerStatsScreen = document.getElementById('playerStatsScreen');
        this.pauseScreen = document.getElementById('pauseScreen');
        
        // Header and control elements
        this.gameHeader = document.querySelector('.game-header');
        this.controlButtons = document.querySelector('.control-buttons');
        this.scoreContainer = document.querySelector('.score-container');
        this.scoreBadge = document.getElementById('scoreBadge');
        
        // Button elements
        this.startButton = document.getElementById('startButton');
        this.restartButton = document.getElementById('restartButton');
        this.leaderboardButton = document.getElementById('leaderboardButton');
        this.viewLeaderboardButton = document.getElementById('viewLeaderboardButton');
        this.backToMenuButton = document.getElementById('backToMenuButton');
        this.backToLeaderboardButton = document.getElementById('backToLeaderboardButton');
        
        // Control buttons
        this.pauseButton = document.getElementById('pauseButton');
        this.resumeButton = document.getElementById('resumeButton');
        this.restartFromPauseButton = document.getElementById('restartFromPauseButton');
        this.mainMenuFromPauseButton = document.getElementById('mainMenuFromPauseButton');
        
        // Leaderboard elements
        this.globalTabButton = document.getElementById('globalTabButton');
        this.recentTabButton = document.getElementById('recentTabButton');
        this.refreshLeaderboardButton = document.getElementById('refreshLeaderboardButton');
        this.leaderboardContent = document.getElementById('leaderboardContent');

        // Add Dev Menu button to pause screen
        this.devMenuButton = document.createElement('div');
        this.devMenuButton.textContent = '⚙️';
        this.devMenuButton.style.position = 'absolute';
        this.devMenuButton.style.bottom = '10px';
        this.devMenuButton.style.right = '10px';
        this.devMenuButton.style.fontSize = '20px';
        this.devMenuButton.style.cursor = 'pointer';
        this.devMenuButton.style.opacity = '0.6';
        this.devMenuButton.style.transition = 'opacity 0.2s';
        this.devMenuButton.onmouseenter = () => this.devMenuButton.style.opacity = '1';
        this.devMenuButton.onmouseleave = () => this.devMenuButton.style.opacity = '0.6';
        this.pauseScreen.style.position = 'relative';
        this.pauseScreen.appendChild(this.devMenuButton);
        
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
        this.gameState = 'start'; // 'start', 'playing', 'paused', 'gameOver'
        this.score = 0;
        this.gameFrame = 0;
        this.lastScoreUpdate = 0;
        
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
        
        // Floating score popups
        this.popups = [];

        // Sound effects (use placeholder beep if files missing)
        this.sfx = {
            point: [this.createBeep()],
            jump: [this.createBeep()]
        };

        // Debug flag for hitboxes (off by default)
        this.debugHitboxes = false;

        // Dev menu element
        this.devMenu = document.createElement('div');
        this.devMenu.className = 'dev-menu hidden';
        this.devMenu.style.position = 'fixed';
        this.devMenu.style.top = '50%';
        this.devMenu.style.left = '50%';
        this.devMenu.style.transform = 'translate(-50%, -50%)';
        this.devMenu.style.background = 'rgba(0,0,0,0.9)';
        this.devMenu.style.color = '#fff';
        this.devMenu.style.padding = '20px';
        this.devMenu.style.border = '2px solid #ffd700';
        this.devMenu.style.zIndex = '9999';
        this.devMenu.style.borderRadius = '8px';
        this.devMenu.innerHTML = `
            <h3 style="margin-top:0;">Dev Menu</h3>
            <label style="display:block; margin: 10px 0;">
                <input type="checkbox" id="toggleHitboxes">
                Show Hitboxes
            </label>
            <button id="closeDevMenu" style="margin-top:10px;">Close</button>
        `;
        document.body.appendChild(this.devMenu);

        this.toggleHitboxesCheckbox = this.devMenu.querySelector('#toggleHitboxes');
        this.closeDevMenuButton = this.devMenu.querySelector('#closeDevMenu');

        this.init();
    }

    createBeep() {
        // Fallback oscillator beep if no audio file is available
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        return {
            paused: true,
            play: () => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "square";
                osc.frequency.value = 880;
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            },
            cloneNode: function() { return this; }
        };
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.calculatePositions();
        this.createBackgroundElements();
        this.gameLoop();
    }
    
    setupCanvas() {
        // Full screen canvas
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
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
        
        // Pause and control buttons
        this.pauseButton.addEventListener('click', () => this.pauseGame());
        this.resumeButton.addEventListener('click', () => this.resumeGame());
        this.restartFromPauseButton.addEventListener('click', () => this.restartGame());
        this.mainMenuFromPauseButton.addEventListener('click', () => this.showStartScreen());
        
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
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Prevent default touch behaviors
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Window resize handler
        window.addEventListener('resize', () => {
            setTimeout(() => {
                this.setupCanvas();
                this.calculatePositions();
            }, 100);
        });

        // Dev Menu button
        this.devMenuButton.addEventListener('click', () => {
            console.log("Dev Menu button clicked");
            this.showDevMenu();
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
    
    handleKeyDown(e) {
        // Pause game with P key or Escape
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
            if (this.gameState === 'playing') {
                this.pauseGame();
            } else if (this.gameState === 'paused') {
                this.resumeGame();
            }
        }
        
        // Space bar to jump
        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            this.handleJump();
        }
    }
    
    pauseGame() {
        if (this.gameState !== 'playing') return;
        
        this.gameState = 'paused';
        this.updateHUDVisibility();
        this.pauseScreen.classList.remove('hidden');
    }
    
    resumeGame() {
        if (this.gameState !== 'paused') return;
        
        this.gameState = 'playing';
        this.updateHUDVisibility();
        this.pauseScreen.classList.add('hidden');
    }
    
    showDevMenu() {
        // Open Dev Menu from pause screen
        this.devMenu.classList.remove('hidden');

        // Sync checkbox with current state
        this.toggleHitboxesCheckbox.checked = this.debugHitboxes;

        // Event listeners
        this.toggleHitboxesCheckbox.onchange = (e) => {
            this.debugHitboxes = e.target.checked;
        };
        this.closeDevMenuButton.onclick = () => {
            this.devMenu.classList.add('hidden');
        };
    }
    
    updateHUDVisibility() {
        // Show/hide header and controls based on game state
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            // During gameplay, show controls and score, hide header
            this.gameHeader.classList.remove('show-title');
            this.controlButtons.classList.add('active');
            this.scoreContainer.classList.add('active');
        } else {
            // In menus, show header and hide controls/score
            this.gameHeader.classList.add('show-title');
            this.controlButtons.classList.remove('active');
            this.scoreContainer.classList.remove('active');
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
        this.updateHUDVisibility();
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
        this.updateHUDVisibility();
        
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
        this.pauseScreen.classList.add('hidden');
    }

    showStartScreen() {
        this.gameState = 'start';
        this.hideAllScreens();
        this.updateHUDVisibility();
        this.startScreen.classList.remove('hidden');
    }

    showLeaderboard() {
        this.hideAllScreens();
        this.updateHUDVisibility();
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
                this.addPopup("+10", this.player.x + this.player.width/2, this.player.y - 20);
                this.playPointSfx();
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
        // Update score with throttling to avoid excessive DOM updates
        const now = Date.now();
        if (now - this.lastScoreUpdate > 50) { // Update every 50ms max
            this.scoreElement.textContent = this.score;
            this.lastScoreUpdate = now;
            
            // Add score animation for significant milestones
            if (this.score > 0 && this.score % 100 === 0) {
                this.animateScoreBadge();
            }
        }
        
        // Gradually increase game speed
        if (this.score > 0 && this.score % 100 === 0) {
            this.config.gameSpeed = Math.min(this.config.gameSpeed + 0.2, 8);
            this.config.obstacleSpeed = Math.min(this.config.obstacleSpeed + 0.2, 8);
        }
    }
    
    animateScoreBadge() {
        // Add the shake class for the milestone animation
        this.scoreBadge.classList.add('shake');
        setTimeout(() => {
            this.scoreBadge.classList.remove('shake');
        }, 600); // Match the animation duration
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
        
        // Removed "TAP TO JUMP" hint text

        // Debug: draw hitboxes
        if (this.debugHitboxes) {
            // Player hitbox
            this.ctx.strokeStyle = 'lime';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(this.player.x, this.player.y, this.player.width, this.player.height);

            // Obstacle hitboxes
            for (let obstacle of this.obstacles) {
                this.ctx.strokeStyle = 'red';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            }
        }
    }
    
    gameLoop() {
        if (this.gameState === 'playing') {
            this.gameFrame++;
            this.updatePlayer();
            this.spawnObstacle();
            this.updateObstacles();
            this.updateBackground();
            this.updatePopups();
            
            // Continuous scoring
            if (this.gameFrame % 10 === 0) {
                this.score += 1;
                this.updateScore();
            }
        } else if (this.gameState === 'paused') {
            // When paused, only render the current frame without updates
        }
        
        this.render();
        this.renderPopups();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    addPopup(text, x, y, opts={}) {
        const now = performance.now();
        this.popups.push({
            text,
            icon: opts.icon || null,
            x, y,
            vx: (Math.random() - 0.5) * 0.25,
            vy: -0.6,
            start: now,
            life: 850,
            scale: 0.6,
            alpha: 1
        });
        if (this.popups.length > 20) this.popups.shift();
    }

    updatePopups() {
        const now = performance.now();
        for (let i = this.popups.length - 1; i >= 0; i--) {
            const p = this.popups[i];
            const t = now - p.start;
            const k = Math.min(t / p.life, 1);

            // Scale in at start
            if (k < 0.18) {
                const u = k / 0.18;
                p.scale = 0.6 + (1.1 - 0.6) * this.easeOutBack(u);
            } else {
                p.scale = 1.0;
            }

            // Animate toward top-center of screen with ramping speed
            const targetX = this.canvas.width / 2;
            const targetY = this.canvas.height * 0.15;
            const linger = 0.25; // linger for first 25% of life
            let speedFactor;
            if (k < linger) {
                speedFactor = 0.002; // very slow drift at start
            } else {
                const u = (k - linger) / (1 - linger);
                speedFactor = 0.01 + 0.18 * u; // then ramp up quickly
            }
            p.x += (targetX - p.x) * speedFactor;
            p.y += (targetY - p.y) * speedFactor;

            // Fade out quicker
            if (k < 0.35) {
                p.alpha = 1;
            } else {
                p.alpha = Math.max(0, 1 - (k - 0.35) / 0.35);
            }

            if (k >= 1) this.popups.splice(i, 1);
        }
    }

    renderPopups() {
        const ctx = this.ctx;
        for (const p of this.popups) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.translate(p.x, p.y);
            ctx.scale(p.scale, p.scale);
            ctx.font = 'bold 28px Tiny5';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#ffd700';
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 6;
            const content = (p.icon ? (p.icon + ' ') : '') + p.text;
            ctx.strokeText(content, 0, 0);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(content, 0, 0);
            ctx.restore();
        }
    }

    easeOutBack(t) {
        const c1 = 1.70158, c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    playPointSfx() {
        const pool = this.sfx.point;
        const a = pool.find(x => x.paused) || pool[0].cloneNode();
        a.playbackRate = 0.98 + Math.random() * 0.04;
        try { a.currentTime = 0; a.play(); } catch {}
    }

    playJumpSfx() {
        const a = this.sfx.jump[0];
        a.playbackRate = 1.0;
        try { a.currentTime = 0; a.play(); } catch {}
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
