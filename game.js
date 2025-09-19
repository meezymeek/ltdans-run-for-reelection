// Lt. Dan's Run for Re-Election - Mobile Endless Runner Game

// Ragdoll Physics System for crash animations
class RagdollSystem {
    constructor(initialPosition, skinImages) {
        this.gravity = 0.5;
        this.friction = 0.98;
        this.bounce = 0.6;
        this.skinImages = skinImages;
        
        // Initialize body parts with physics properties
        const x = initialPosition.x + initialPosition.width / 2;
        const y = initialPosition.y;
        
        this.parts = {
            head: {
                x: x, y: y + 10,
                vx: Math.random() * 4 - 2, vy: -Math.random() * 5,
                width: 32, height: 20,
                angle: 0, angleVel: Math.random() * 0.3 - 0.15,
                mass: 0.8
            },
            torso: {
                x: x, y: y + 30,
                vx: Math.random() * 3 - 1.5, vy: -Math.random() * 3,
                width: 30, height: 20,
                angle: 0, angleVel: Math.random() * 0.2 - 0.1,
                mass: 1.2
            },
            leftUpperArm: {
                x: x - 5, y: y + 32,
                vx: Math.random() * 5 - 2.5, vy: -Math.random() * 4,
                width: 8, height: 12,
                angle: 0, angleVel: Math.random() * 0.4 - 0.2,
                mass: 0.3
            },
            leftForearm: {
                x: x - 8, y: y + 42,
                vx: Math.random() * 6 - 3, vy: -Math.random() * 3,
                width: 6, height: 10,
                angle: 0, angleVel: Math.random() * 0.5 - 0.25,
                mass: 0.2
            },
            rightUpperArm: {
                x: x + 5, y: y + 32,
                vx: Math.random() * 5 - 2.5, vy: -Math.random() * 4,
                width: 8, height: 12,
                angle: 0, angleVel: Math.random() * 0.4 - 0.2,
                mass: 0.3
            },
            rightForearm: {
                x: x + 8, y: y + 42,
                vx: Math.random() * 6 - 3, vy: -Math.random() * 3,
                width: 6, height: 10,
                angle: 0, angleVel: Math.random() * 0.5 - 0.25,
                mass: 0.2
            },
            leftThigh: {
                x: x - 5, y: y + 50,
                vx: Math.random() * 4 - 2, vy: -Math.random() * 2,
                width: 10, height: 15,
                angle: 0, angleVel: Math.random() * 0.3 - 0.15,
                mass: 0.5
            },
            leftShin: {
                x: x - 7, y: y + 63,
                vx: Math.random() * 5 - 2.5, vy: -Math.random() * 2,
                width: 8, height: 12,
                angle: 0, angleVel: Math.random() * 0.4 - 0.2,
                mass: 0.3
            },
            rightThigh: {
                x: x + 5, y: y + 50,
                vx: Math.random() * 4 - 2, vy: -Math.random() * 2,
                width: 10, height: 15,
                angle: 0, angleVel: Math.random() * 0.3 - 0.15,
                mass: 0.5
            },
            rightShin: {
                x: x + 7, y: y + 63,
                vx: Math.random() * 5 - 2.5, vy: -Math.random() * 2,
                width: 8, height: 12,
                angle: 0, angleVel: Math.random() * 0.4 - 0.2,
                mass: 0.3
            }
        };
        
        // Define joint connections (for constraint solving)
        this.joints = [
            { partA: 'head', partB: 'torso', length: 15, stiffness: 0.7 },
            { partA: 'torso', partB: 'leftUpperArm', length: 12, stiffness: 0.5 },
            { partA: 'leftUpperArm', partB: 'leftForearm', length: 10, stiffness: 0.4 },
            { partA: 'torso', partB: 'rightUpperArm', length: 12, stiffness: 0.5 },
            { partA: 'rightUpperArm', partB: 'rightForearm', length: 10, stiffness: 0.4 },
            { partA: 'torso', partB: 'leftThigh', length: 15, stiffness: 0.6 },
            { partA: 'leftThigh', partB: 'leftShin', length: 12, stiffness: 0.4 },
            { partA: 'torso', partB: 'rightThigh', length: 15, stiffness: 0.6 },
            { partA: 'rightThigh', partB: 'rightShin', length: 12, stiffness: 0.4 }
        ];
        
        this.groundY = initialPosition.groundY;
    }
    
    applyImpulse(forceX, forceY) {
        // Apply initial crash force to all parts with some variation
        for (const part of Object.values(this.parts)) {
            part.vx += forceX * (0.5 + Math.random() * 0.5) / part.mass;
            part.vy += forceY * (0.5 + Math.random() * 0.5) / part.mass;
            part.angleVel += (Math.random() - 0.5) * 0.8;
        }
    }
    
    update() {
        // Apply physics to each part
        for (const part of Object.values(this.parts)) {
            // Apply gravity
            part.vy += this.gravity;
            
            // Apply friction
            part.vx *= this.friction;
            part.vy *= this.friction;
            part.angleVel *= 0.99;
            
            // Update position
            part.x += part.vx;
            part.y += part.vy;
            part.angle += part.angleVel;
            
            // Ground collision
            const bottomY = part.y + part.height / 2;
            if (bottomY > this.groundY) {
                part.y = this.groundY - part.height / 2;
                part.vy *= -this.bounce;
                part.vx *= 0.8; // Extra friction on ground
                part.angleVel *= 0.7;
                
                // Stop tiny bounces
                if (Math.abs(part.vy) < 0.5) {
                    part.vy = 0;
                }
            }
            
            // Screen bounds
            if (part.x < part.width / 2) {
                part.x = part.width / 2;
                part.vx *= -0.5;
            }
            if (part.x > window.innerWidth - part.width / 2) {
                part.x = window.innerWidth - part.width / 2;
                part.vx *= -0.5;
            }
        }
        
        // Apply joint constraints (simple distance constraints)
        for (let i = 0; i < 3; i++) { // Multiple iterations for stability
            for (const joint of this.joints) {
                const partA = this.parts[joint.partA];
                const partB = this.parts[joint.partB];
                
                const dx = partB.x - partA.x;
                const dy = partB.y - partA.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0) {
                    const diff = (joint.length - dist) / dist * joint.stiffness * 0.5;
                    const offsetX = dx * diff;
                    const offsetY = dy * diff;
                    
                    partA.x -= offsetX;
                    partA.y -= offsetY;
                    partB.x += offsetX;
                    partB.y += offsetY;
                }
            }
        }
    }
    
    render(ctx) {
        // Render each body part with rotation
        for (const [name, part] of Object.entries(this.parts)) {
            ctx.save();
            ctx.translate(part.x, part.y);
            ctx.rotate(part.angle);
            
            // Map part names to skin images
            let skinImage = null;
            if (this.skinImages) {
                if (name === 'head') skinImage = this.skinImages['head'];
                else if (name === 'torso') skinImage = this.skinImages['torso'];
                else if (name.includes('Arm')) skinImage = name.includes('Upper') ? 
                    this.skinImages['upper_arm'] : this.skinImages['forearm'];
                else if (name.includes('Thigh')) skinImage = this.skinImages['thigh'];
                else if (name.includes('Shin')) skinImage = this.skinImages['shin'];
            }
            
            if (skinImage && skinImage.complete) {
                ctx.drawImage(
                    skinImage,
                    -part.width / 2,
                    -part.height / 2,
                    part.width,
                    part.height
                );
            } else {
                // Fallback to colored rectangles
                ctx.fillStyle = name === 'head' ? '#ff6b6b' : 
                               name === 'torso' ? '#cc5858' : '#ff8080';
                ctx.fillRect(
                    -part.width / 2,
                    -part.height / 2,
                    part.width,
                    part.height
                );
            }
            
            ctx.restore();
        }
    }
    
    isSettled() {
        // Check if ragdoll has mostly stopped moving
        for (const part of Object.values(this.parts)) {
            if (Math.abs(part.vx) > 0.5 || Math.abs(part.vy) > 0.5) {
                return false;
            }
        }
        return true;
    }
}

// Leaderboard API Configuration
const API_CONFIG = {
    baseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3001'  // Development
        : 'https://leaderboard-api-production-c84c.up.railway.app', // Production - FIXED URL
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
        
        // Initialize Sound Manager
        this.soundManager = new SoundManager();
        this.soundManager.loadSettings();
        
        // Skin system
        this.currentSkin = 'default';
        this.skinImages = {};
        this.skinsLoaded = false;
        this.initializeSkins();
        
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
        
        // Pagination state
        this.leaderboardPagination = {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 0,
            totalPages: 1,
            currentData: []
        };

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
            // Speed settings (now with gradual ramping)
            baseGameSpeed: 4,        // Reverted to original speed for playability
            gameSpeed: 4,            // Current game speed
            baseObstacleSpeed: 4,
            obstacleSpeed: 4,
            speedIncreaseRate: 0.0002,  // Slower increase rate
            maxGameSpeed: 8,         // Maximum speed cap
            // Scoring
            scoreMultiplier: 1,      // Modified by effects
            baseScoreMultiplier: 1,
            lowPoints: 10,
            tallPoints: 30,
            // Spawn rates
            obstacleSpawnRate: 180, // increased by 50% (was 120)
            tallSpawnMin: 270, // increased by 50% (was 180)
            tallSpawnMax: 540,  // increased by 50% (was 360)
            minObstacleGapPx: 250, // minimum pixel gap between obstacles
            constituentSpawnRate: 300,  // New: constituents spawn rate
            bribeSpawnRate: 180,        // Increased spacing between bribes
            // Effect modifiers
            constituentSpeedMod: 0.85,   // 15% slower when stomping constituent
            constituentScoreMod: 0.8,    // 20% less points when affected
            bribeSpeedMod: 1.2,          // 20% faster when taking bribe
            bribeScoreMod: 1.5,          // 50% more points when affected
            effectDuration: 5000,        // Effects last 5 seconds
            bribeDuration: 7000          // Bribe effects last 7 seconds
        };
        
        this.tallSpawnCounter = 0;
        this.nextTallSpawn = this.randomInt(this.config.tallSpawnMin, this.config.tallSpawnMax);
        
        // Game state
        this.gameState = 'start'; // 'start', 'playing', 'paused', 'crashing', 'gameOver'
        this.score = 0;
        this.gameFrame = 0;
        this.lastScoreUpdate = 0;
        this.soundInitialized = false;
        this.top5Threshold = 100; // Default threshold if API fails
        
        // Delta time tracking for frame-independent updates
        this.lastFrameTime = performance.now();
        this.deltaTime = 0;
        
        // Ragdoll system
        this.ragdoll = null;
        this.crashTimer = 0;
        this.crashDuration = 2000; // 2 seconds of crash animation
        this.screenShake = 0;
        this.screenShakeIntensity = 0;
        
        // Player object
        this.player = {
            x: 100,
            y: 0,
            width: 40,
            height: 60,
            velocityY: 0,
            isJumping: false,
            groundY: 0,
            color: '#ff6b6b',
            // Parachute properties
            hasParachute: false,
            parachuteUsedThisJump: false,  // Track if parachute was already used in this jump
            parachuteActivationHeight: 0,
            parachuteTimeLeft: 0,
            parachuteTapping: false,
            lastTapTime: 0,
            // Touch tracking for timer display (with smooth lerp)
            lastTouchX: 0,
            lastTouchY: 0,
            timerX: 0,        // Current timer position
            timerY: 0,        // Current timer position
            timerTargetX: 0,  // Target timer position
            timerTargetY: 0,  // Target timer position
            // Animation properties
            animationFrame: 0,
            runCycle: 0,
            animationSpeed: 0.15,
            // Joint angles for animation
            leftLegAngle: 0,
            rightLegAngle: 0,
            leftKneeAngle: 0,
            rightKneeAngle: 0,
            leftArmAngle: 0,
            rightArmAngle: 0,
            leftElbowAngle: 0,
            rightElbowAngle: 0,
            // Head animation properties (current values)
            headYOffset: 0,
            headXOffset: 0,
            headRotation: 0,
            // Head animation targets (for smooth lerp)
            headYOffsetTarget: 0,
            headXOffsetTarget: 0,
            headRotationTarget: 0,
            // Breathing animation
            breathingCycle: 0,
            isBreathingOut: false
        };
        
        // Obstacles array
        this.obstacles = [];
        
        // Constituents array (stompable enemies)
        this.constituents = [];
        this.constituentSpawnCounter = 0;
        
        // Bribes array (collectible power-ups)
        this.bribes = [];
        this.bribeSpawnCounter = 0;
        this.bribePatternCounter = 0;  // Track when to spawn patterns
        this.nextBribePattern = 250;   // Increased spacing between patterns
        
        // Active effects tracking
        this.activeEffects = {
            constituents: [],     // Array of active constituent effect timers
            bribes: [],          // Array of active bribe effect timers
            currentSpeedMod: 1,  // Combined speed modifier
            currentScoreMod: 1   // Combined score modifier
        };
        
        // Unified spawn tracking for proper spacing
        this.lastSpawnDistance = 0;  // Track distance moved since last spawn
        this.minSpawnGap = 200; // Minimum gap between ANY entities
        
        // Background elements for scrolling effect
        this.backgroundElements = [];
        
        // Floating score popups
        this.popups = [];

        // Debug flags (off by default)
        this.debugHitboxes = false;
        this.showSpeed = false;

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
            <label style="display:block; margin: 10px 0;">
                <input type="checkbox" id="toggleSpeed">
                Show Speed
            </label>
            <button id="closeDevMenu" style="margin-top:10px;">Close</button>
        `;
        document.body.appendChild(this.devMenu);

        this.toggleHitboxesCheckbox = this.devMenu.querySelector('#toggleHitboxes');
        this.toggleSpeedCheckbox = this.devMenu.querySelector('#toggleSpeed');
        this.closeDevMenuButton = this.devMenu.querySelector('#closeDevMenu');

        this.init();
    }

    initializeSkins() {
        // Define body parts that need skins
        const bodyParts = ['head', 'head-open-mouth', 'torso', 'upper_arm', 'forearm', 'thigh', 'shin'];
        
        // Load default placeholder skins (embedded as base64 for now)
        // In production, these would load from skins/default/*.png files
        const placeholderSkins = {
            head: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAATCAYAAAC1L2x7AAAABHNCSVQICAgIfAhkiAAAAGlJREFUSIntlDEKACEMQ1/x/lfWSXAQKVhaaHFoCgmEfEhARACA7l4AMLPWWt/3vu/fOWcppQCAiGBm1FpRa0VEICKYGbXWX+89xhhjjPHee4wxxnjvPUQEM+Occ8455xxzTkQEM6OUspz7AEfzHdK5dpP1AAAAAElFTkSuQmCC',
            'head-open-mouth': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAATCAYAAAC1L2x7AAAABHNCSVQICAgIfAhkiAAAAGlJREFUSIntlDEKACEMQ1/x/lfWSXAQKVhaaHFoCgmEfEhARACA7l4AMLPWWt/3vu/fOWcppQCAiGBm1FpRa0VEICKYGbXWX+89xhhjjPHee4wxxnjvPUQEM+Occ8455xxzTkQEM6OUspz7AEfzHdK5dpP1AAAAAElFTkSuQmCC',
            torso: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAATCAYAAACHrr18AAAABHNCSVQICAgIfAhkiAAAAFxJREFUSIntlDEKACAMAzP//2cHQRAUtINDXSJcIBByiAiICADM7AEAEXnf9/M8z/u+n+d53/fzPE9E5H3fz/M8EZH3fT/P80RE3vf9PM8TEQEAZkZEAGBmRASA7n4BWPMZyr5T/ZIAAAAASUVORK5CYII=',
            upper_arm: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAMCAYAAABfnvydAAAABHNCSVQICAgIfAhkiAAAADRJREFUGJVjZGBg+M/AwMDAxMDAgAOMowqIV8DIwMDAz8DAcImBgYGJgYGBYeTYARMAMAQGS92R5ZQAAAAASUVORK5CYII=',
            forearm: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAKCAYAAACXtdZwAAAABHNCSVQICAgIfAhkiAAAAC1JREFUCB1jZGBg+M/AwMDAxAADjAwMDPwMDAxXGBgYmBgYGBhGqQMEAAP8BgaGcOsXCFgAAAAASUVORK5CYII=',
            thigh: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAMCAYAAABGdnDgAAAABHNCSVQICAgIfAhkiAAAADNJREFUGJVjZGBg+M/AwMDAxAAFjAwMDPwMDAxXGBgYmBgYGBhGRSECAA0AAwP/DAwMVwC2SAYGuTPoCgAAAABJRU5ErkJggg==',
            shin: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAMCAYAAABfnvydAAAABHNCSVQICAgIfAhkiAAAADJJREFUGJVjZGBg+M/AwMDAxAAFjAwMDPwMDAxXGBgYmBgYGBhGFRAAAA0AAwP/DAwMVwCzEgYGv5yITAAAAABJRU5ErkJggg=='
        };
        
        // Parachute skins array (will be populated from skins/parachutes directory)
        this.parachuteSkins = [];
        this.loadedParachuteSkins = [];
        
        // Currently selected parachute skin (will be randomized each deployment)
        this.currentParachuteSkin = null;
        
        // Load parachute skins from directory
        this.loadParachuteSkins();
        
        // Load images
        bodyParts.forEach(part => {
            const img = new Image();
            img.onload = () => {
                console.log(`Loaded skin: ${part}`);
            };
            img.onerror = () => {
                console.log(`Failed to load skin: ${part}, using fallback`);
            };
            
            // Try to load from file first, fallback to embedded base64
            img.src = `skins/${this.currentSkin}/${part}.png`;
            
            // Use placeholder if file doesn't exist
            img.onerror = () => {
                img.src = placeholderSkins[part];
            };
            
            this.skinImages[part] = img;
        });
        
        // Mark skins as loaded after a short delay
        setTimeout(() => {
            this.skinsLoaded = true;
            console.log('All skins loaded');
        }, 100);
    }
    
    loadParachuteSkins() {
        // Define the list of parachute skins to load
        // Easy to modify - just add/remove filenames here!
        const parachuteSkinFiles = [
            'parachute_marlboro.png',
            'parachute_silvereagle.png',
            'parachute_koch.png',        // New Koch parachute
            'parachute_spacex.png'       // New SpaceX parachute
        ];
        
        console.log(`Attempting to load ${parachuteSkinFiles.length} parachute skins`);
        
        // Load each skin from the list
        let loadedCount = 0;
        parachuteSkinFiles.forEach(filename => {
            const img = new Image();
            const skinName = filename.replace('parachute_', '').replace('.png', '');
            
            img.onload = () => {
                console.log(`Loaded parachute skin: ${skinName}`);
                this.loadedParachuteSkins.push({
                    name: skinName,
                    image: img,
                    loaded: true
                });
                loadedCount++;
                
                // Check if all skins attempted loading
                if (loadedCount + (parachuteSkinFiles.length - this.loadedParachuteSkins.length) >= parachuteSkinFiles.length) {
                    this.checkParachuteSkinsFallback();
                }
            };
            
            img.onerror = () => {
                console.log(`Failed to load parachute skin: ${filename}`);
                loadedCount++;
                
                // Check if all skins attempted loading
                if (loadedCount >= parachuteSkinFiles.length) {
                    this.checkParachuteSkinsFallback();
                }
            };
            
            // Try to load from skins/parachutes/ directory
            img.src = `skins/parachutes/${filename}`;
        });
        
        // Set a timeout fallback in case images don't trigger events
        setTimeout(() => {
            this.checkParachuteSkinsFallback();
        }, 1000);
    }
    
    checkParachuteSkinsFallback() {
        // Check if any skins loaded successfully
        if (this.loadedParachuteSkins.length === 0) {
            console.log('No parachute skins loaded, using fallback colors');
            // Fallback to simple colored parachutes if no images load
            this.loadedParachuteSkins = [
                { name: 'red', color: '#FF6B6B', loaded: false },
                { name: 'blue', color: '#6B8FFF', loaded: false },
                { name: 'green', color: '#6BFF8F', loaded: false }
            ];
        } else {
            console.log(`Successfully loaded ${this.loadedParachuteSkins.length} parachute skins`);
        }
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
        // Initialize sound on first user interaction
        const initSound = async () => {
            if (!this.soundInitialized) {
                await this.soundManager.initialize();
                this.soundInitialized = true;
                console.log('Sound initialized, game state:', this.gameState);
                // Start menu music after initialization
                if (this.gameState === 'start') {
                    this.soundManager.playMusic('menu');
                }
            }
        };
        
        // Add event listeners for sound initialization
        const handleFirstInteraction = async (e) => {
            await initSound();
            // Remove all first interaction listeners after initialization
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('touchstart', handleFirstInteraction);
            document.removeEventListener('keydown', handleFirstInteraction);
        };
        
        document.addEventListener('click', handleFirstInteraction);
        document.addEventListener('touchstart', handleFirstInteraction);
        document.addEventListener('keydown', handleFirstInteraction);
        
        // Game button event listeners with sound
        this.startButton.addEventListener('click', () => {
            this.soundManager.playButtonClick();
            this.startGame();
        });
        this.restartButton.addEventListener('click', () => {
            this.soundManager.playButtonClick();
            this.restartGame();
        });
        
        // Leaderboard navigation buttons with sound
        this.leaderboardButton.addEventListener('click', () => {
            this.soundManager.playButtonClick();
            this.showLeaderboard();
        });
        this.viewLeaderboardButton.addEventListener('click', () => {
            this.soundManager.playButtonClick();
            this.showLeaderboard();
        });
        this.backToMenuButton.addEventListener('click', () => {
            this.soundManager.playButtonClick();
            this.showStartScreen();
        });
        this.backToLeaderboardButton.addEventListener('click', () => {
            this.soundManager.playButtonClick();
            this.showLeaderboard();
        });
        
        // Pause and control buttons with sound
        this.pauseButton.addEventListener('click', () => {
            this.soundManager.playButtonClick();
            this.pauseGame();
        });
        this.resumeButton.addEventListener('click', () => {
            this.soundManager.playButtonClick();
            this.resumeGame();
        });
        this.restartFromPauseButton.addEventListener('click', () => {
            this.soundManager.playButtonClick();
            this.restartGame();
        });
        this.mainMenuFromPauseButton.addEventListener('click', () => {
            this.soundManager.playButtonClick();
            this.showStartScreen();
        });
        
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
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            this.handleJump(mouseX, mouseY);
        });
        
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
        
        // Audio control elements
        this.setupAudioControls();
    }
    
    setupAudioControls() {
        // Get audio control elements
        const masterVolume = document.getElementById('masterVolume');
        const masterVolumeValue = document.getElementById('masterVolumeValue');
        const masterMute = document.getElementById('masterMute');
        
        const musicVolume = document.getElementById('musicVolume');
        const musicVolumeValue = document.getElementById('musicVolumeValue');
        const musicMute = document.getElementById('musicMute');
        
        const effectsVolume = document.getElementById('effectsVolume');
        const effectsVolumeValue = document.getElementById('effectsVolumeValue');
        const effectsMute = document.getElementById('effectsMute');
        
        // Load current values from SoundManager
        masterVolume.value = this.soundManager.volumes.master * 100;
        masterVolumeValue.textContent = Math.round(this.soundManager.volumes.master * 100) + '%';
        
        musicVolume.value = this.soundManager.volumes.music * 100;
        musicVolumeValue.textContent = Math.round(this.soundManager.volumes.music * 100) + '%';
        
        effectsVolume.value = this.soundManager.volumes.effects * 100;
        effectsVolumeValue.textContent = Math.round(this.soundManager.volumes.effects * 100) + '%';
        
        // Update mute button states
        masterMute.textContent = this.soundManager.muted.master ? '🔊' : '🔇';
        masterMute.classList.toggle('muted', this.soundManager.muted.master);
        
        musicMute.textContent = this.soundManager.muted.music ? '🔊' : '🔇';
        musicMute.classList.toggle('muted', this.soundManager.muted.music);
        
        effectsMute.textContent = this.soundManager.muted.effects ? '🔊' : '🔇';
        effectsMute.classList.toggle('muted', this.soundManager.muted.effects);
        
        // Master volume control
        masterVolume.addEventListener('input', (e) => {
            const value = e.target.value / 100;
            this.soundManager.setVolume('master', value);
            masterVolumeValue.textContent = Math.round(value * 100) + '%';
        });
        
        masterMute.addEventListener('click', () => {
            this.soundManager.toggleMute('master');
            masterMute.textContent = this.soundManager.muted.master ? '🔊' : '🔇';
            masterMute.classList.toggle('muted', this.soundManager.muted.master);
        });
        
        // Music volume control
        musicVolume.addEventListener('input', (e) => {
            const value = e.target.value / 100;
            this.soundManager.setVolume('music', value);
            musicVolumeValue.textContent = Math.round(value * 100) + '%';
        });
        
        musicMute.addEventListener('click', () => {
            this.soundManager.toggleMute('music');
            musicMute.textContent = this.soundManager.muted.music ? '🔊' : '🔇';
            musicMute.classList.toggle('muted', this.soundManager.muted.music);
        });
        
        // Effects volume control
        effectsVolume.addEventListener('input', (e) => {
            const value = e.target.value / 100;
            this.soundManager.setVolume('effects', value);
            effectsVolumeValue.textContent = Math.round(value * 100) + '%';
        });
        
        effectsMute.addEventListener('click', () => {
            this.soundManager.toggleMute('effects');
            effectsMute.textContent = this.soundManager.muted.effects ? '🔊' : '🔇';
            effectsMute.classList.toggle('muted', this.soundManager.muted.effects);
        });
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        
        if (this.gameState === 'playing') {
            // Capture touch coordinates and set as target
            if (e.touches && e.touches.length > 0) {
                this.player.lastTouchX = e.touches[0].clientX;
                this.player.lastTouchY = e.touches[0].clientY;
                // Set target positions for smooth lerp
                this.player.timerTargetX = e.touches[0].clientX;
                this.player.timerTargetY = e.touches[0].clientY;
                
                // Initialize current position if first tap
                if (this.player.timerX === 0 && this.player.timerY === 0) {
                    this.player.timerX = e.touches[0].clientX;
                    this.player.timerY = e.touches[0].clientY;
                }
            }
            // Jump on touch
            this.handleJump();
        }
    }
    
    handleJump(mouseX, mouseY) {
        if (this.gameState !== 'playing') return;
        
        // Update touch position if mouse coordinates are provided
        if (mouseX !== undefined && mouseY !== undefined) {
            this.player.lastTouchX = mouseX;
            this.player.lastTouchY = mouseY;
            // Set target positions for smooth lerp
            this.player.timerTargetX = mouseX;
            this.player.timerTargetY = mouseY;
            
            // Initialize current position if first tap
            if (this.player.timerX === 0 && this.player.timerY === 0) {
                this.player.timerX = mouseX;
                this.player.timerY = mouseY;
            }
        }
        
        // Only allow parachute tapping if parachute is active AND has time remaining
        if (this.player.hasParachute && this.player.parachuteTimeLeft > 0) {
            // Register tap to maintain parachute and give small upward boost ONLY if time remains
            this.player.lastTapTime = Date.now();
            this.player.velocityY -= 2; // Small upward boost on each tap
        } else if (!this.player.isJumping) {
            // If parachute has expired or doesn't exist, only allow normal jumping from ground
            this.player.velocityY = this.config.jumpPower;
            this.player.isJumping = true;
            this.soundManager.playJump();
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
        
        // Pause the game music
        this.soundManager.pauseMusic();
        this.soundManager.playMusic('pause');
    }
    
    resumeGame() {
        if (this.gameState !== 'paused') return;
        
        this.gameState = 'playing';
        this.updateHUDVisibility();
        this.pauseScreen.classList.add('hidden');
        
        // Resume game music
        this.soundManager.stopMusic();
        this.soundManager.playMusic('game');
    }
    
    showDevMenu() {
        // Open Dev Menu from pause screen
        this.devMenu.classList.remove('hidden');

        // Sync checkboxes with current state
        this.toggleHitboxesCheckbox.checked = this.debugHitboxes;
        this.toggleSpeedCheckbox.checked = this.showSpeed;

        // Event listeners
        this.toggleHitboxesCheckbox.onchange = (e) => {
            this.debugHitboxes = e.target.checked;
        };
        this.toggleSpeedCheckbox.onchange = (e) => {
            this.showSpeed = e.target.checked;
        };
        this.closeDevMenuButton.onclick = () => {
            this.devMenu.classList.add('hidden');
        };
    }
    
    updateHUDVisibility() {
        // Show/hide header and controls based on game state
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            // During gameplay, show controls, hide header and HTML score (using canvas score instead)
            this.gameHeader.classList.remove('show-title');
            this.controlButtons.classList.add('active');
            this.scoreContainer.classList.remove('active');  // Hide HTML score, we render on canvas now
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
    
    async startGame() {
        this.gameState = 'playing';
        this.gameStartTime = Date.now();
        this.hideAllScreens();
        this.updateHUDVisibility();
        this.score = 0;
        this.gameFrame = 0;
        this.obstacles = [];
        this.constituents = [];
        this.bribes = [];
        this.constituentSpawnCounter = 0;
        this.bribeSpawnCounter = 0;
        this.player.y = this.player.groundY - this.player.height;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.height = 60;
        
        // Reset game speed to new slower initial speed
        this.config.gameSpeed = this.config.baseGameSpeed;
        this.config.obstacleSpeed = this.config.baseObstacleSpeed;
        
        // Reset active effects
        this.activeEffects = {
            constituents: [],
            bribes: [],
            currentSpeedMod: 1,
            currentScoreMod: 1
        };
        
        // Fetch top 5 scores to determine victory threshold
        try {
            const data = await this.leaderboard.getGlobalLeaderboard(5);
            if (data.leaderboard && data.leaderboard.length >= 5) {
                // Set threshold to the 5th place score
                this.top5Threshold = data.leaderboard[4].score;
                console.log('Top 5 threshold set to:', this.top5Threshold);
            } else if (data.leaderboard && data.leaderboard.length > 0) {
                // If less than 5 scores, any score beats the leaderboard
                this.top5Threshold = 0;
                console.log('Less than 5 scores on leaderboard, threshold set to 0');
            } else {
                // Empty leaderboard, use default
                this.top5Threshold = 100;
                console.log('Empty leaderboard, using default threshold of 100');
            }
        } catch (error) {
            console.log('Could not fetch leaderboard, using default threshold');
            this.top5Threshold = 100;
        }
        
        // Play game music
        this.soundManager.playMusic('game');
        
        this.updateScore();
    }
    
    restartGame() {
        this.startGame();
    }
    
    triggerCrash(obstacle) {
        if (this.gameState !== 'playing') return;
        
        // Switch to crashing state
        this.gameState = 'crashing';
        this.crashTimer = Date.now();
        
        // Play crash sound
        this.soundManager.playEffect('crash');
        
        // Create ragdoll at player position
        this.ragdoll = new RagdollSystem({
            x: this.player.x,
            y: this.player.y,
            width: this.player.width,
            height: this.player.height,
            groundY: this.player.groundY
        }, this.skinImages);
        
        // Apply impulse based on collision direction
        const collisionForceX = -3 - Math.random() * 2; // Backward force
        const collisionForceY = -8 - Math.random() * 4; // Upward force
        this.ragdoll.applyImpulse(collisionForceX, collisionForceY);
        
        // Start screen shake
        this.screenShakeIntensity = 15;
        this.screenShake = this.screenShakeIntensity;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.gameEndTime = Date.now();
        this.finalScoreElement.textContent = this.score;
        this.updateHUDVisibility();
        
        // Stop game music and always play menu music
        this.soundManager.stopMusic();
        this.soundManager.playMusic('menu');
        
        // If player achieved top 5, play victory fanfare on top
        if (this.score > this.top5Threshold) {
            console.log(`Score ${this.score} beats top 5 threshold of ${this.top5Threshold}! Playing victory fanfare.`);
            this.soundManager.playEffect('victory-fanfare');
            
            // Add a special popup for top 5 achievement
            this.addPopup("TOP 5!", this.canvas.width/2, this.canvas.height * 0.4, {icon: '🏆'});
        } else {
            // Player didn't make top 5, play fail sound
            console.log(`Score ${this.score} didn't beat top 5 threshold of ${this.top5Threshold}. Playing fail sound.`);
            this.soundManager.playEffect('fail');
        }
        
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
        
        // Play menu music if sound is initialized
        if (this.soundInitialized) {
            this.soundManager.stopMusic();
            this.soundManager.playMusic('menu');
        }
    }

    showLeaderboard() {
        this.hideAllScreens();
        this.updateHUDVisibility();
        this.leaderboardScreen.classList.remove('hidden');
        this.showGlobalLeaderboard();
    }

    // Leaderboard Display Methods
    async showGlobalLeaderboard(page = 1) {
        this.setActiveTab('global');
        this.leaderboard.currentView = 'global';
        this.leaderboardPagination.currentPage = page;
        this.showLoadingState();

        try {
            const data = await this.leaderboard.getGlobalLeaderboard(50);
            this.leaderboardPagination.currentData = data.leaderboard || [];
            this.leaderboardPagination.totalItems = this.leaderboardPagination.currentData.length;
            this.leaderboardPagination.totalPages = Math.ceil(this.leaderboardPagination.totalItems / this.leaderboardPagination.itemsPerPage);
            this.renderPaginatedLeaderboard('Global Leaderboard');
        } catch (error) {
            this.showErrorState('Failed to load leaderboard. Please try again.');
        }
    }

    async showRecentScores(page = 1) {
        this.setActiveTab('recent');
        this.leaderboard.currentView = 'recent';
        this.leaderboardPagination.currentPage = page;
        this.showLoadingState();

        try {
            const data = await this.leaderboard.getRecentScores(50);
            this.leaderboardPagination.currentData = data.recentScores || [];
            this.leaderboardPagination.totalItems = this.leaderboardPagination.currentData.length;
            this.leaderboardPagination.totalPages = Math.ceil(this.leaderboardPagination.totalItems / this.leaderboardPagination.itemsPerPage);
            this.renderPaginatedLeaderboard('Recent Scores');
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

    renderPaginatedLeaderboard(title) {
        const { currentPage, itemsPerPage, totalItems, totalPages, currentData } = this.leaderboardPagination;
        
        if (!currentData || currentData.length === 0) {
            this.leaderboardContent.innerHTML = `
                <div style="text-align: center; color: #ffd700; padding: 2rem;">
                    <p>No scores yet!</p>
                    <p>Be the first to set a high score!</p>
                </div>
            `;
            return;
        }

        // Calculate slice indices for pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        const pageEntries = currentData.slice(startIndex, endIndex);

        let html = `<div class="leaderboard-table">`;
        
        // Render the current page entries
        pageEntries.forEach((entry, index) => {
            const actualIndex = startIndex + index;
            const rankDisplay = entry.rank || (actualIndex + 1);
            const medal = rankDisplay === 1 ? '🥇' : rankDisplay === 2 ? '🥈' : rankDisplay === 3 ? '🥉' : '';
            
            html += `
                <div class="leaderboard-entry">
                    <span class="leaderboard-rank">${medal} #${rankDisplay}</span>
                    <span class="leaderboard-name">${this.escapeHtml(entry.player_name || entry.playerName)}</span>
                    <span class="leaderboard-score">${this.leaderboard.formatScore(entry.score)}</span>
                    <span class="leaderboard-date">${this.leaderboard.formatDate(entry.submitted_at || entry.submittedAt)}</span>
                </div>
            `;
        });
        
        html += `</div>`;
        
        // Add pagination controls if there's more than one page
        if (totalPages > 1) {
            html += `<div class="pagination-controls">`;
            html += `<div class="pagination-buttons">`;
            
            // Previous button
            if (currentPage > 1) {
                html += `<button class="pagination-btn" onclick="window.gameInstance.changePage(${currentPage - 1})">&lt; Previous</button>`;
            } else {
                html += `<button class="pagination-btn" disabled>&lt; Previous</button>`;
            }
            
            // Next button
            if (currentPage < totalPages) {
                html += `<button class="pagination-btn" onclick="window.gameInstance.changePage(${currentPage + 1})">Next &gt;</button>`;
            } else {
                html += `<button class="pagination-btn" disabled>Next &gt;</button>`;
            }
            
            html += `</div>`;
            
            // Page indicator
            html += `<div class="pagination-info">Page ${currentPage} of ${totalPages}</div>`;
            
            html += `</div>`;
        }
        
        this.leaderboardContent.innerHTML = html;
    }
    
    changePage(page) {
        // Update page and re-render the leaderboard with the new page
        this.leaderboardPagination.currentPage = page;
        this.renderPaginatedLeaderboard(this.leaderboard.currentView === 'global' ? 'Global Leaderboard' : 'Recent Scores');
    }

    renderLeaderboard(entries, title) {
        // Legacy method kept for compatibility
        this.renderPaginatedLeaderboard(title);
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
        
        // Don't auto-focus to prevent mobile keyboard from popping up
        // Users can tap the input field when they're ready to type
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
        
        // Smoothly animate timer position to target with lerp
        const timerLerpSpeed = 0.18; // Adjust for smoothness (0.05 = very smooth, 0.3 = snappy)
        this.player.timerX += (this.player.timerTargetX - this.player.timerX) * timerLerpSpeed;
        this.player.timerY += (this.player.timerTargetY - this.player.timerY) * timerLerpSpeed;
        
        // Check parachute activation - activate ONLY ONCE per jump when player reaches high altitude
        const highAltitudeThreshold = this.player.groundY * 0.4; // Activate when above 60% of screen height
        if (!this.player.hasParachute && !this.player.parachuteUsedThisJump && this.player.isJumping && this.player.y < highAltitudeThreshold) {
            this.player.hasParachute = true;
            this.player.parachuteUsedThisJump = true;  // Mark that parachute has been used for this jump
            this.player.parachuteTimeLeft = 3000; // 3 seconds maximum
            this.player.lastTapTime = 0; // Initialize to force initial non-tapping state
            this.player.parachuteActivationHeight = this.player.y;
            
            // Randomly select a parachute skin from loaded skins
            if (this.loadedParachuteSkins.length > 0) {
                this.currentParachuteSkin = this.loadedParachuteSkins[Math.floor(Math.random() * this.loadedParachuteSkins.length)];
                console.log('Parachute deployed with skin:', this.currentParachuteSkin.name);
            } else {
                // Fallback if no skins loaded
                this.currentParachuteSkin = { name: 'default', color: '#FF6B6B', loaded: false };
            }
            
            this.addPopup("PARACHUTE!", this.player.x + this.player.width/2, this.player.y - 30, {icon: '🪂'});
        }
        
        // Update parachute state
        if (this.player.hasParachute && this.player.parachuteTimeLeft > 0) {
            // Decrease parachute time using actual delta time
            this.player.parachuteTimeLeft -= this.deltaTime;
            
            // Check if parachute time expired
            if (this.player.parachuteTimeLeft <= 0) {
                // COMPLETELY DISABLE PARACHUTE - clear all states
                this.player.hasParachute = false;
                this.player.parachuteTimeLeft = 0;  // Ensure timer is at zero
                this.player.parachuteTapping = false;  // Reset tapping state immediately
                this.player.lastTapTime = 0;  // Clear tap time
                // Force normal gravity immediately
                this.player.velocityY = Math.max(this.player.velocityY, 2); // Ensure player starts falling
                this.addPopup("PARACHUTE EXPIRED!", this.player.x + this.player.width/2, this.player.y - 20, {icon: '⏰'});
            } else {
                // Only check tapping if parachute still has time
                const now = Date.now();
                const timeSinceLastTap = now - this.player.lastTapTime;
                this.player.parachuteTapping = this.player.lastTapTime > 0 && timeSinceLastTap < 300;
            }
        } else {
            // No parachute or timer expired - ensure all parachute states are cleared
            if (this.player.hasParachute) {
                this.player.hasParachute = false;
            }
            this.player.parachuteTapping = false;
            this.player.lastTapTime = 0;
            this.player.parachuteTimeLeft = 0;
        }
        
        // Apply gravity based on parachute state AND timer
        // Double-check timer to ensure no floating after expiration
        if (this.player.hasParachute && this.player.parachuteTimeLeft > 0) {
            // Parachute active and has time remaining
            if (this.player.parachuteTapping && this.player.velocityY > 0) {
                // Player is actively tapping - counteract gravity to stay afloat
                this.player.velocityY += this.config.gravity * -0.02; // Slight upward force to counteract gravity
                // Add visual feedback when tapping is detected
                if (Math.random() < 0.08) { // Occasional feedback to avoid spam
                    this.addPopup("FLOATING!", this.player.x + this.player.width/2, this.player.y + 20, {icon: '🪂'});
                }
            } else {
                // Player not tapping but has parachute - moderate descent
                this.player.velocityY += this.config.gravity * 0.6; // 40% reduced gravity
            }
        } else {
            // No parachute OR timer expired - always apply normal gravity
            // Clear any remaining parachute states as extra safeguard
            if (this.player.parachuteTapping || this.player.lastTapTime > 0) {
                this.player.parachuteTapping = false;
                this.player.lastTapTime = 0;
            }
            this.player.velocityY += this.config.gravity;
        }
        
        this.player.y += this.player.velocityY;
        
        // Ground collision
        const groundY = this.player.groundY - this.player.height;
            
        if (this.player.y >= groundY) {
            this.player.y = groundY;
            this.player.velocityY = 0;
            this.player.isJumping = false;
            this.player.hasParachute = false; // Remove parachute on landing
            this.player.parachuteUsedThisJump = false; // Reset for next jump
            this.player.parachuteTimeLeft = 0; // Ensure timer is reset
        }
        
        // Update animation
        this.updatePlayerAnimation();
    }
    
    updatePlayerAnimation() {
        if (!this.player.isJumping) {
            // Running animation
            this.player.animationFrame += this.player.animationSpeed;
            const cycle = Math.floor(this.player.animationFrame) % 4;
            
            // Calculate joint angles based on cycle
            const runPhase = (this.player.animationFrame % 4) / 4 * Math.PI * 2;
            
            // Leg animation (opposite legs move in opposite directions)
            // Negative angles move forward, positive backward
            this.player.leftLegAngle = -Math.sin(runPhase) * 30;
            this.player.rightLegAngle = -Math.sin(runPhase + Math.PI) * 30;
            
            // Knee animation - bend when leg is forward
            this.player.leftKneeAngle = Math.max(0, Math.sin(runPhase) * 45);
            this.player.rightKneeAngle = Math.max(0, Math.sin(runPhase + Math.PI) * 45);
            
            // Arm swing (opposite to legs) - asymmetrical swing: more forward, less backward
            // Base angle of 50, swings from 10 (forward) to 85 (backward, not past body)
            const leftSwing = Math.sin(runPhase + Math.PI);
            const rightSwing = Math.sin(runPhase);
            
            // Apply asymmetrical swing: -40 forward, +35 backward from base of 50
            this.player.leftArmAngle = 50 + (leftSwing > 0 ? leftSwing * 35 : leftSwing * 40);
            this.player.rightArmAngle = 50 + (rightSwing > 0 ? rightSwing * 35 : rightSwing * 40);
            
            // Elbow bend - increased bend for more natural running motion
            this.player.leftElbowAngle = -Math.abs(Math.sin(runPhase + Math.PI)) * 85;
            this.player.rightElbowAngle = -Math.abs(Math.sin(runPhase)) * 85;
            
            // Breathing animation - cycle between normal and open-mouth
            this.player.breathingCycle += 0.08; // Faster breathing rate (increased from 0.02)
            // Switch breathing state more frequently
            const breathPhase = Math.sin(this.player.breathingCycle);
            this.player.isBreathingOut = breathPhase > 0.3; // Open mouth 35% of the time
            
            // Head animation - combined natural motion (slowed down, more exaggerated)
            // Calculate target values with increased amplitude
            this.player.headYOffsetTarget = Math.abs(Math.sin(runPhase)) * 3.5;  // Increased from 2
            this.player.headXOffsetTarget = Math.sin(runPhase * 0.5) * 2;      // Increased from 1
            this.player.headRotationTarget = Math.sin(runPhase * 0.5) * 4;     // Increased from ±2 to ±4 degrees
            
            // Apply lerp for smooth transitions
            const lerpFactor = 0.15; // Adjust this value for smoothness (0.05 = very smooth, 0.3 = less smooth)
            this.player.headYOffset += (this.player.headYOffsetTarget - this.player.headYOffset) * lerpFactor;
            this.player.headXOffset += (this.player.headXOffsetTarget - this.player.headXOffset) * lerpFactor;
            this.player.headRotation += (this.player.headRotationTarget - this.player.headRotation) * lerpFactor;
        } else if (this.player.hasParachute) {
            // Parachuting animation - arms reaching up to hold chute lines
            this.player.leftLegAngle = 0;    // Legs hanging straight down
            this.player.rightLegAngle = 0;
            this.player.leftKneeAngle = 0;   // No knee bend while parachuting
            this.player.rightKneeAngle = 0;
            this.player.leftArmAngle = 160;  // Arms reaching up to parachute
            this.player.rightArmAngle = 160;
            this.player.leftElbowAngle = 0;  // Arms fully extended
            this.player.rightElbowAngle = 0;
            
            // Head looking slightly down while parachuting
            this.player.headYOffsetTarget = 1;
            this.player.headXOffsetTarget = 0;
            this.player.headRotationTarget = 3; // Slight downward look
            
            // Apply lerp for smooth transitions
            const parachuteLerpFactor = 0.2;
            this.player.headYOffset += (this.player.headYOffsetTarget - this.player.headYOffset) * parachuteLerpFactor;
            this.player.headXOffset += (this.player.headXOffsetTarget - this.player.headXOffset) * parachuteLerpFactor;
            this.player.headRotation += (this.player.headRotationTarget - this.player.headRotation) * parachuteLerpFactor;
        } else {
            // Regular jumping animation - arms fully extended upwards to the sky
            this.player.leftLegAngle = -15;
            this.player.rightLegAngle = -15;
            this.player.leftKneeAngle = 20;
            this.player.rightKneeAngle = 20;
            this.player.leftArmAngle = 180;  // Arms pointing straight up to the sky
            this.player.rightArmAngle = 180;
            this.player.leftElbowAngle = 0;  // Fully extended (no bend)
            this.player.rightElbowAngle = 0;
            
            // Head animation during jump - slight backward tilt
            this.player.headYOffsetTarget = -2;
            this.player.headXOffsetTarget = 0;
            this.player.headRotationTarget = -5; // Looking upward
            
            // Apply lerp for smooth transitions (faster lerp for jumping)
            const jumpLerpFactor = 0.25;
            this.player.headYOffset += (this.player.headYOffsetTarget - this.player.headYOffset) * jumpLerpFactor;
            this.player.headXOffset += (this.player.headXOffsetTarget - this.player.headXOffset) * jumpLerpFactor;
            this.player.headRotation += (this.player.headRotationTarget - this.player.headRotation) * jumpLerpFactor;
        }
    }
    
    drawPlayerLimb(startX, startY, angle1, length1, angle2, length2, width) {
        this.ctx.save();
        this.ctx.lineWidth = width;
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = this.player.color;
        
        // Upper limb
        this.ctx.translate(startX, startY);
        this.ctx.rotate(angle1 * Math.PI / 180);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, length1);
        this.ctx.stroke();
        
        // Lower limb
        this.ctx.translate(0, length1);
        this.ctx.rotate(angle2 * Math.PI / 180);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, length2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawPlayerLimb(startX, startY, angle1, length1, angle2, length2, width, upperSkin, lowerSkin) {
        this.ctx.save();
        
        // Upper limb
        this.ctx.translate(startX, startY);
        this.ctx.rotate(angle1 * Math.PI / 180);
        
        if (this.skinsLoaded && upperSkin && upperSkin.complete) {
            // Draw skinned upper limb
            this.ctx.drawImage(upperSkin, -width/2, 0, width, length1);
        } else {
            // Fallback to line drawing
            this.ctx.lineWidth = width;
            this.ctx.lineCap = 'round';
            this.ctx.strokeStyle = this.player.color;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(0, length1);
            this.ctx.stroke();
        }
        
        // Lower limb
        this.ctx.translate(0, length1);
        this.ctx.rotate(angle2 * Math.PI / 180);
        
        if (this.skinsLoaded && lowerSkin && lowerSkin.complete) {
            // Draw skinned lower limb
            this.ctx.drawImage(lowerSkin, -width/2, 0, width, length2);
        } else {
            // Fallback to line drawing
            this.ctx.lineWidth = width;
            this.ctx.lineCap = 'round';
            this.ctx.strokeStyle = this.player.color;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(0, length2);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawArticulatedPlayer() {
        const centerX = this.player.x + this.player.width / 2;
        const topY = this.player.y;
        
        // Body proportions
        const headHeight = this.player.height * 0.33;
        const torsoHeight = this.player.height * 0.33;
        const legHeight = this.player.height * 0.34;
        
        // Save context
        this.ctx.save();
        
        // Draw layers in correct z-order for side profile
        const hipY = topY + headHeight + torsoHeight;
        const thighLength = legHeight * 0.5;
        const shinLength = legHeight * 0.5;
        
        // 1. Draw right leg FIRST (behind torso)
        this.drawPlayerLimb(
            centerX + 5,
            hipY,
            this.player.rightLegAngle,
            thighLength,
            this.player.rightKneeAngle,
            shinLength,
            10,
            this.skinImages.thigh,
            this.skinImages.shin
        );
        
        // 2. Draw torso (center)
        const torsoY = topY + headHeight;
        if (this.skinsLoaded && this.skinImages.torso && this.skinImages.torso.complete) {
            this.ctx.drawImage(
                this.skinImages.torso,
                centerX - this.player.width/2 + 5,
                torsoY,
                this.player.width - 10,
                torsoHeight
            );
        } else {
            this.ctx.fillStyle = '#cc5858';
            this.ctx.fillRect(
                centerX - this.player.width/2 + 5,
                torsoY,
                this.player.width - 10,
                torsoHeight
            );
        }
        
        // 3. Draw head (shifted right for side profile with animation)
        const headOffset = 8;
        
        // Save context for head transformation
        this.ctx.save();
        
        // Apply head animation transformations
        const headX = centerX - this.player.width/2 + headOffset + this.player.headXOffset;
        const headY = topY - this.player.headYOffset; // Negative because Y offset lifts the head up
        
        // Apply rotation around the head center
        const headCenterX = headX + (this.player.width - headOffset) / 2;
        const headCenterY = headY + headHeight / 2;
        this.ctx.translate(headCenterX, headCenterY);
        this.ctx.rotate(this.player.headRotation * Math.PI / 180);
        this.ctx.translate(-headCenterX, -headCenterY);
        
        // Choose which head to use based on jumping or breathing state
        const useOpenMouth = this.player.isJumping || this.player.isBreathingOut;
        const headImage = useOpenMouth ? this.skinImages['head-open-mouth'] : this.skinImages.head;
        
        if (this.skinsLoaded && headImage && headImage.complete) {
            this.ctx.drawImage(
                headImage,
                headX,
                headY,
                this.player.width - headOffset,
                headHeight
            );
        } else {
            this.ctx.fillStyle = this.player.color;
            this.ctx.fillRect(
                headX,
                headY,
                this.player.width - headOffset,
                headHeight
            );
        }
        
        // 4. Draw face features only if not using skins
        if (!this.skinsLoaded || !this.skinImages.head || !this.skinImages.head.complete) {
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(headX + headOffset + 8, headY + 5, 5, 5);
            
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(headX + headOffset + 11, headY + 13);
            this.ctx.lineTo(headX + headOffset + 17, headY + 16);
            this.ctx.stroke();
        }
        
        // Restore context after head transformation
        this.ctx.restore();
        
        // 5. Draw arm
        const shoulderY = torsoY + 4;
        const armLength = torsoHeight * 0.5;
        
        // Single arm for side profile
        this.drawPlayerLimb(
            centerX,
            shoulderY,
            this.player.leftArmAngle,
            armLength,
            this.player.leftElbowAngle,
            armLength * 0.8,
            8,
            this.skinImages.upper_arm,
            this.skinImages.forearm
        );
        
        // 6. Draw left leg LAST (in front)
        this.drawPlayerLimb(
            centerX - 5,
            hipY,
            this.player.leftLegAngle,
            thighLength,
            this.player.leftKneeAngle,
            shinLength,
            10,
            this.skinImages.thigh,
            this.skinImages.shin
        );
        
        this.ctx.restore();
    }
    
    canSpawnEntity() {
        // Check if enough distance has passed since last spawn
        return this.lastSpawnDistance >= this.minSpawnGap;
    }
    
    spawnObstacle() {
        // Check unified spawn spacing first
        if (!this.canSpawnEntity()) return;
        
        const lastObstacle = this.obstacles[this.obstacles.length - 1];
        const canSpawn = !lastObstacle || 
            (this.canvas.width + 50 - (lastObstacle.x + lastObstacle.width)) >= this.config.minObstacleGapPx;

        // Low obstacle spawn (fixed interval)
        if (canSpawn && this.gameFrame % this.config.obstacleSpawnRate === 0) {
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
            this.lastSpawnDistance = 0;  // Reset spawn distance
        }

        // Tall obstacle spawn (random interval)
        this.tallSpawnCounter++;
        if (canSpawn && this.tallSpawnCounter >= this.nextTallSpawn && this.canSpawnEntity()) {
            const tallHeight = this.computeTallHeight();
            const obstacle = {
                x: this.canvas.width + 50,
                y: this.player.groundY - tallHeight,
                width: 35,
                height: tallHeight,
                speed: this.config.obstacleSpeed,
                type: 'tall',
                color: '#5C2E0E'
            };
            this.obstacles.push(obstacle);
            this.tallSpawnCounter = 0;
            this.nextTallSpawn = this.randomInt(this.config.tallSpawnMin, this.config.tallSpawnMax);
            this.lastSpawnDistance = 0;  // Reset spawn distance
        }
    }
    
    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= obstacle.speed;
            
            // Remove obstacles that have gone off screen
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
                if (obstacle.type === 'tall') {
                    this.score += this.config.tallPoints;
                    this.updateScore();
                    this.addPopup("+" + this.config.tallPoints, 
                                  this.player.x + this.player.width/2, this.player.y - 20);
                    this.soundManager.playPointTall();
                } else {
                    this.score += this.config.lowPoints;
                    this.updateScore();
                    this.addPopup("+" + this.config.lowPoints, 
                                  this.player.x + this.player.width/2, this.player.y - 20);
                    this.soundManager.playPointLow();
                }
            }

            // Collision detection
            if (this.checkCollision(this.player, obstacle)) {
                this.triggerCrash(obstacle);
                return;
            }
        }
    }
    
    spawnConstituent() {
        // Check unified spawn spacing first
        if (!this.canSpawnEntity()) return;
        
        // Spawn constituents periodically
        this.constituentSpawnCounter++;
        if (this.constituentSpawnCounter >= this.config.constituentSpawnRate) {
            const constituent = {
                x: this.canvas.width + 50,
                y: this.player.groundY - 60,  // Same height as player
                width: 40,  // Same width as player
                height: 60, // Same height as player
                originalWidth: 40,  // Store original dimensions
                originalHeight: 60,
                speed: this.config.obstacleSpeed * 0.8, // Slower than obstacles
                animationFrame: Math.random() * 4,
                walkDirection: 1,
                color: '#ff4444',  // Red color
                
                // Squash and stretch animation state
                isBeingStomped: false,
                stompAnimationTime: 0,
                scaleX: 1,      // Width multiplier
                scaleY: 1,      // Height multiplier
                targetScaleX: 1,  // Target width for lerp
                targetScaleY: 1,  // Target height for lerp
                
                // Launch physics
                launchVelocityX: 0,
                launchVelocityY: 0,
                rotation: 0,
                rotationSpeed: 0,
                opacity: 1
            };
            this.constituents.push(constituent);
            this.constituentSpawnCounter = 0;
            this.lastSpawnDistance = 0;  // Reset spawn distance
        }
    }
    
    updateConstituents() {
        for (let i = this.constituents.length - 1; i >= 0; i--) {
            const constituent = this.constituents[i];
            
            // Check if animating
            if (constituent.isBeingStomped) {
                // Update animation
                this.updateConstituentAnimation(constituent);
                
                // Remove when animation complete and off-screen
                if (constituent.stompAnimationTime > 800 && 
                    (constituent.x < -100 || constituent.x > this.canvas.width + 100 ||
                     constituent.y < -200 || constituent.opacity <= 0)) {
                    this.constituents.splice(i, 1);
                }
                continue;
            }
            
            // Normal movement
            constituent.x -= constituent.speed;
            
            // Walking animation
            constituent.animationFrame += 0.1;
            
            // Remove if off screen
            if (constituent.x + constituent.width < 0) {
                this.constituents.splice(i, 1);
                continue;
            }
            
            // Check if player is stomping on constituent
            const isStomping = this.checkStomp(this.player, constituent);
            if (isStomping && !constituent.isBeingStomped) {
                // Trigger animation instead of immediate removal
                constituent.isBeingStomped = true;
                constituent.stompAnimationTime = 0;
                
                // Reduce score by 25 points
                const penalty = 25;
                this.score = Math.max(0, this.score - penalty);  // Prevent negative scores
                this.updateScore();
                
                // Play stomp sound (use jump sound for now)
                this.soundManager.playJump();
                
                // Reset parachute flag for this new launch
                this.player.parachuteUsedThisJump = false;
                
                // Launch player high in the air like a jump pad
                // Adjusted to land just below the score UI (approximately 160px from top)
                this.player.velocityY = -25;  // Reduced boost to stay below score UI
                this.player.isJumping = true;
            }
        }
    }
    
    updateConstituentAnimation(constituent) {
        // Update animation time
        constituent.stompAnimationTime += this.deltaTime;
        const t = constituent.stompAnimationTime;
        
        // Lerp speed for smooth transitions - FASTER!
        const lerpSpeed = 0.25; // Much snappier transitions (was 0.12)
        
        if (t < 120) {
            // Phase 1: SQUASHING (0-120ms) - FASTER!
            const progress = t / 120;
            const ease = this.easeOutQuad(progress);
            
            // Set target values for squash
            constituent.targetScaleY = 1 - (ease * 0.75);  // Compress to 25% of original height
            constituent.targetScaleX = 1 + (ease * 0.75);   // Expand to 175% of original width
            
        } else if (t < 250) {
            // Phase 2: STRETCHING (120-250ms) - FASTER!
            const progress = (t - 120) / 130;
            const ease = this.easeOutElastic(progress);
            
            // Set target values for spring up
            constituent.targetScaleY = 0.25 + (ease * 1.25);  // Spring to 150% height
            constituent.targetScaleX = 1.75 - (ease * 1.15);   // Contract to 60% width
            
            // Prepare launch velocities late in the phase
            if (t >= 220 && constituent.launchVelocityX === 0) {
                constituent.launchVelocityX = -8;  // Faster launch
                constituent.launchVelocityY = -24;  // Higher launch
                constituent.rotationSpeed = (Math.random() - 0.5) * 0.4;  // More spin
            }
            
        } else {
            // Phase 3: LAUNCHING (250-500ms) - FASTER!
            const progress = Math.min((t - 250) / 250, 1);
            
            // Maintain stretched proportions as targets
            constituent.targetScaleY = 1.5;
            constituent.targetScaleX = 0.6;
            
            // Apply launch physics
            constituent.launchVelocityY += 0.6; // Gravity
            constituent.x += constituent.launchVelocityX;
            constituent.y += constituent.launchVelocityY;
            
            // Spin dramatically
            constituent.rotation += constituent.rotationSpeed;
            
            // Fade out
            constituent.opacity = Math.max(0, 1 - (progress * 0.8));
        }
        
        // Apply lerp to smoothly transition scale values
        constituent.scaleY += (constituent.targetScaleY - constituent.scaleY) * lerpSpeed;
        constituent.scaleX += (constituent.targetScaleX - constituent.scaleX) * lerpSpeed;
        
        // Apply dimensions based on lerped scale values
        constituent.height = constituent.originalHeight * constituent.scaleY;
        constituent.width = constituent.originalWidth * constituent.scaleX;
        
        // Position constituent based on phase
        if (t < 120) {
            // Keep grounded during squash
            constituent.y = this.player.groundY - constituent.height;
        } else if (t < 250) {
            // Lift off ground during stretch
            const progress = (t - 120) / 130;
            const liftAmount = this.easeOutElastic(progress) * 12;  // Slightly more lift
            constituent.y = this.player.groundY - constituent.height - liftAmount;
        }
        // Phase 3 position is handled by launch physics above
    }
    
    // Easing functions
    easeOutQuad(t) {
        return t * (2 - t);
    }
    
    easeOutElastic(t) {
        if (t === 0 || t === 1) return t;
        const p = 0.3;
        return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    }
    
    spawnBribe() {
        // Check for pattern spawning
        this.bribePatternCounter++;
        if (this.bribePatternCounter >= this.nextBribePattern) {
            this.spawnBribePattern();
            this.bribePatternCounter = 0;
            this.nextBribePattern = 200 + Math.random() * 300; // Much more spacing between patterns
            return;
        }
        
        // Regular single bribe spawning
        this.bribeSpawnCounter++;
        if (this.bribeSpawnCounter >= this.config.bribeSpawnRate) {
            // Check unified spawn spacing
            if (!this.canSpawnEntity()) return;
            
            // Define height levels - now going much higher!
            const heights = [
                this.player.groundY - 80,   // Low (easy jump)
                this.player.groundY - 140,  // Mid (high jump)
                this.player.groundY - 200,  // High (needs good timing)
                this.player.groundY - 260,  // Very high (parachute recommended)
                this.player.groundY - 320,  // Super high (parachute essential)
                this.player.groundY - 380,  // Sky high
                this.player.groundY - 440   // Near space!
            ];
            
            // Choose random height
            const chosenHeight = heights[Math.floor(Math.random() * heights.length)];
            
            const bribe = {
                x: this.canvas.width + 50,
                y: chosenHeight + (Math.random() * 20 - 10),  // Add small variation
                width: 30,
                height: 30,
                speed: this.config.obstacleSpeed,
                animationFrame: Math.random() * Math.PI * 2,
                collected: false,
                color: '#ffd700'  // Gold color
            };
            this.bribes.push(bribe);
            this.bribeSpawnCounter = 0;
            this.lastSpawnDistance = 0;  // Reset spawn distance
        }
    }
    
    spawnBribePattern() {
        const patterns = ['arch', 'wave', 'diagonal', 'cluster', 'stairs'];
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        const startX = this.canvas.width + 50;
        const baseSpeed = this.config.obstacleSpeed;
        
        switch(pattern) {
            case 'arch':
                // Create an arch of 5 bribes
                const archHeight = this.player.groundY - 180;
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 4) * Math.PI; // 0 to PI
                    const height = Math.sin(angle) * 60; // Arc height variation
                    this.bribes.push({
                        x: startX + i * 60,  // Increased spacing from 40 to 60
                        y: archHeight - height,
                        width: 30,
                        height: 30,
                        speed: baseSpeed,
                        animationFrame: i * 0.5,
                        collected: false,
                        color: '#ffd700'
                    });
                }
                break;
                
            case 'wave':
                // Create a sine wave of bribes
                for (let i = 0; i < 6; i++) {
                    const waveY = this.player.groundY - 140 + Math.sin(i * 0.8) * 50;
                    this.bribes.push({
                        x: startX + i * 55,  // Increased spacing from 35 to 55
                        y: waveY,
                        width: 30,
                        height: 30,
                        speed: baseSpeed,
                        animationFrame: i * 0.4,
                        collected: false,
                        color: '#ffd700'
                    });
                }
                break;
                
            case 'diagonal':
                // Rising or falling diagonal line
                const rising = Math.random() > 0.5;
                for (let i = 0; i < 4; i++) {
                    const diagY = rising ? 
                        this.player.groundY - 80 - i * 40 :
                        this.player.groundY - 200 + i * 40;
                    this.bribes.push({
                        x: startX + i * 70,  // Increased spacing from 45 to 70
                        y: diagY,
                        width: 30,
                        height: 30,
                        speed: baseSpeed,
                        animationFrame: i * 0.6,
                        collected: false,
                        color: '#ffd700'
                    });
                }
                break;
                
            case 'cluster':
                // Random cluster of 3 bribes at varying heights
                const clusterBase = this.player.groundY - 100 - Math.random() * 100;
                for (let i = 0; i < 3; i++) {
                    this.bribes.push({
                        x: startX + i * 45 + Math.random() * 20,  // Increased spacing from 25 to 45
                        y: clusterBase + (Math.random() * 60 - 30),
                        width: 30,
                        height: 30,
                        speed: baseSpeed,
                        animationFrame: Math.random() * Math.PI * 2,
                        collected: false,
                        color: '#ffd700'
                    });
                }
                break;
                
            case 'stairs':
                // Staircase pattern going up then down
                for (let i = 0; i < 6; i++) {
                    const stairY = i < 3 ?
                        this.player.groundY - 80 - i * 35 :
                        this.player.groundY - 185 + (i - 3) * 35;
                    this.bribes.push({
                        x: startX + i * 55,  // Increased spacing from 35 to 55
                        y: stairY,
                        width: 30,
                        height: 30,
                        speed: baseSpeed,
                        animationFrame: i * 0.3,
                        collected: false,
                        color: '#ffd700'
                    });
                }
                break;
        }
    }
    
    updateBribes() {
        for (let i = this.bribes.length - 1; i >= 0; i--) {
            const bribe = this.bribes[i];
            
            // Move bribe
            bribe.x -= bribe.speed;
            
            // Floating animation
            bribe.animationFrame += 0.1;
            bribe.y += Math.sin(bribe.animationFrame) * 0.5;
            
            // Remove if off screen
            if (bribe.x + bribe.width < 0) {
                this.bribes.splice(i, 1);
                continue;
            }
            
            // Check collision with player
            if (this.checkCollision(this.player, bribe)) {
                // Remove bribe
                this.bribes.splice(i, 1);
                
                // Add 5 votes to score
                this.score += 5;
                this.updateScore();
                
                // Visual feedback
                this.addPopup("+5 VOTES!", bribe.x, bribe.y, {icon: '💰'});
                
                // Play collect sound (use point sound for now)
                this.soundManager.playPointTall();
            }
        }
    }
    
    checkStomp(player, constituent) {
        // Check if player is above and falling onto constituent
        return player.x < constituent.x + constituent.width &&
               player.x + player.width > constituent.x &&
               player.y + player.height > constituent.y &&
               player.y + player.height < constituent.y + constituent.height / 2 &&
               player.velocityY > 0;  // Must be falling
    }
    

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    computeTallHeight() {
        // Fixed height for tall obstacles
        return 80;
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
                this.soundManager.playMilestone();
                this.addPopup("MILESTONE!", this.canvas.width/2, this.canvas.height * 0.3, {icon: '🎯'});
            }
        }
        
        // Gradually increase game speed
        if (this.score > 0 && this.score % 100 === 0) {
            this.config.gameSpeed = Math.min(this.config.gameSpeed + 0.2, 8);
            this.config.obstacleSpeed = Math.min(this.config.obstacleSpeed + 0.2, 8);
            this.soundManager.playSpeedUp();
        }
    }
    
    animateScoreBadge() {
        // Add the shake class for the milestone animation
        this.scoreBadge.classList.add('shake');
        setTimeout(() => {
            this.scoreBadge.classList.remove('shake');
        }, 600); // Match the animation duration
    }
    
    renderScoreUI() {
        // Only render score UI during gameplay
        if (this.gameState !== 'playing' && this.gameState !== 'paused') return;
        
        // Save context for score UI rendering
        this.ctx.save();
        
        // Center positions on screen
        const centerX = this.canvas.width / 2;
        const topY = 40;
        
        // Draw "VOTES" label with block black shadow (bigger and yellow)
        this.ctx.font = 'bold 32px Tiny5';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        // Black shadow offset
        this.ctx.fillStyle = '#000000';
        this.ctx.fillText('VOTES', centerX + 3, topY + 3);
        // Yellow text on top
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillText('VOTES', centerX, topY);
        
        // Draw score number with block black shadow (centered, even bigger)
        this.ctx.font = 'bold 80px Tiny5';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        // Black shadow offset
        this.ctx.fillStyle = '#000000';
        this.ctx.fillText(this.score.toString(), centerX + 4, topY + 74);
        // White text on top
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(this.score.toString(), centerX, topY + 70);
        
        // Add milestone animation effect (centered)
        if (this.score > 0 && this.score % 100 === 0) {
            const time = Date.now() % 600;
            if (time < 300) {
                // Pulse effect around the score
                const scale = 1 + (Math.sin(time / 300 * Math.PI) * 0.15);
                this.ctx.save();
                this.ctx.translate(centerX, topY + 60);
                this.ctx.scale(scale, scale);
                this.ctx.strokeStyle = '#ffd700';
                this.ctx.lineWidth = 3;
                this.ctx.globalAlpha = 0.6;
                this.ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
                this.ctx.shadowBlur = 8;
                // Draw a circle around the score instead of rectangle
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 80, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.restore();
            }
        }
        
        this.ctx.restore();
    }
    
    render() {
        // Apply screen shake if active
        this.ctx.save();
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(shakeX, shakeY);
        }
        
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
        
        // Draw Score UI FIRST (before player and other entities)
        this.renderScoreUI();
        
        // Draw player or ragdoll depending on state
        if (this.gameState === 'crashing' && this.ragdoll) {
            // Draw ragdoll
            this.ragdoll.render(this.ctx);
        } else if (this.gameState === 'playing') {
            // Draw articulated player (Lt. Dan)
            this.drawArticulatedPlayer();
            
            // Draw parachute if active AND has time remaining
            if (this.player.hasParachute && this.player.parachuteTimeLeft > 0) {
                this.ctx.save();
                
                // Draw parachute above player
                const chuteCenterX = this.player.x + this.player.width / 2;
                const chuteY = this.player.y - 40;
                
                // Draw parachute with selected skin
                if (this.currentParachuteSkin && this.currentParachuteSkin.loaded && this.currentParachuteSkin.image) {
                    // Use loaded image for parachute
                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.arc(chuteCenterX, chuteY, 35, Math.PI, 2 * Math.PI, false);
                    this.ctx.closePath();
                    this.ctx.clip();
                    
                    // Draw the parachute skin image
                    this.ctx.drawImage(
                        this.currentParachuteSkin.image,
                        chuteCenterX - 35,
                        chuteY - 35,
                        70,
                        70
                    );
                    
                    this.ctx.restore();
                } else {
                    // Fallback to solid color if no image loaded
                    const fallbackColor = this.currentParachuteSkin?.color || '#FF6B6B';
                    this.ctx.fillStyle = fallbackColor;
                    this.ctx.beginPath();
                    this.ctx.arc(chuteCenterX, chuteY, 35, Math.PI, 2 * Math.PI, false);
                    this.ctx.closePath();
                    this.ctx.fill();
                }
                
                // Parachute outline
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(chuteCenterX, chuteY, 35, Math.PI, 2 * Math.PI, false);
                this.ctx.stroke();
                
                // Parachute lines to player
                this.ctx.strokeStyle = '#333333'; // Dark gray
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                // Multiple lines for realistic look
                this.ctx.moveTo(chuteCenterX - 25, chuteY);
                this.ctx.lineTo(chuteCenterX - 8, this.player.y + 10);
                this.ctx.moveTo(chuteCenterX - 12, chuteY);
                this.ctx.lineTo(chuteCenterX - 4, this.player.y + 10);
                this.ctx.moveTo(chuteCenterX, chuteY);
                this.ctx.lineTo(chuteCenterX, this.player.y + 10);
                this.ctx.moveTo(chuteCenterX + 12, chuteY);
                this.ctx.lineTo(chuteCenterX + 4, this.player.y + 10);
                this.ctx.moveTo(chuteCenterX + 25, chuteY);
                this.ctx.lineTo(chuteCenterX + 8, this.player.y + 10);
                this.ctx.stroke();
                
                this.ctx.restore();
                
                // Draw parachute timer at smoothly animated position (if player has tapped)
                if (this.player.timerX && this.player.timerY) {
                    this.ctx.save();
                    
                    // Position timer above the smoothly animated position with bounds checking
                    const timerWidth = 120;
                    const timerHeight = 50;
                    const padding = 10;
                    
                    // Calculate initial position
                    let timerX = this.player.timerX - timerWidth / 2;
                    let timerY = this.player.timerY - timerHeight - 40;
                    
                    // Ensure timer stays within screen bounds
                    timerX = Math.max(padding, Math.min(timerX, this.canvas.width - timerWidth - padding));
                    timerY = Math.max(padding, Math.min(timerY, this.canvas.height - timerHeight - padding));
                    
                    // Timer background with transparency
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    this.ctx.fillRect(timerX, timerY, timerWidth, timerHeight);
                    
                    // Timer border
                    this.ctx.strokeStyle = '#ffd700';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(timerX, timerY, timerWidth, timerHeight);
                    
                    // Timer bar
                    const timePercent = Math.max(0, this.player.parachuteTimeLeft / 3000);
                    const barColor = timePercent > 0.5 ? '#44ff88' : timePercent > 0.2 ? '#ffaa44' : '#ff4444';
                    this.ctx.fillStyle = barColor;
                    this.ctx.fillRect(timerX + 6, timerY + 28, (timerWidth - 12) * timePercent, 10);
                    
                    // Timer text
                    this.ctx.font = 'bold 12px Tiny5';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillStyle = '#ffffff';
                    const timeLeft = Math.ceil(this.player.parachuteTimeLeft / 1000);
                    this.ctx.fillText(`CHUTE: ${timeLeft}s`, timerX + timerWidth/2, timerY + 18);
                    
                    // Flashing TAP! indicator - flash continuously while parachute is active
                    const flashSpeed = 200; // Flash cycle duration in milliseconds (faster flashing)
                    const shouldShowTap = Math.floor(Date.now() / flashSpeed) % 2 === 0;
                    
                    if (shouldShowTap) {
                        // Change color based on whether player is actually tapping
                        this.ctx.fillStyle = this.player.parachuteTapping ? '#44ff88' : '#ffaa44';
                        this.ctx.font = 'bold 10px Tiny5';
                        this.ctx.fillText('TAP!', timerX + timerWidth/2, timerY + 45);
                    }
                    
                    this.ctx.restore();
                }
                
                this.ctx.restore();
            }
        }
        
        // Draw constituents (red walking enemies - same size as player)
        for (let constituent of this.constituents) {
            this.ctx.save();
            
            // Apply opacity for fade out during launch
            if (constituent.opacity < 1) {
                this.ctx.globalAlpha = constituent.opacity;
            }
            
            // Apply rotation and scaling if being stomped
            if (constituent.isBeingStomped) {
                // Translate to center for rotation
                const centerX = constituent.x + constituent.width / 2;
                const centerY = constituent.y + constituent.height / 2;
                this.ctx.translate(centerX, centerY);
                this.ctx.rotate(constituent.rotation);
                this.ctx.translate(-centerX, -centerY);
            }
            
            // Simple walking figure with scaling applied
            this.ctx.fillStyle = constituent.color;
            
            // Calculate actual dimensions based on scale
            const actualWidth = constituent.width;
            const actualHeight = constituent.height;
            
            // Head (scaled proportionally)
            const headWidth = actualWidth * 0.6;
            const headHeight = actualHeight * 0.3;
            const headX = constituent.x + (actualWidth - headWidth) / 2;
            const headY = constituent.y + actualHeight * 0.03;
            this.ctx.fillRect(headX, headY, headWidth, headHeight);
            
            // Body (scaled proportionally)
            const bodyWidth = actualWidth * 0.75;
            const bodyHeight = actualHeight * 0.47;
            const bodyX = constituent.x + (actualWidth - bodyWidth) / 2;
            const bodyY = constituent.y + actualHeight * 0.37;
            this.ctx.fillRect(bodyX, bodyY, bodyWidth, bodyHeight);
            
            // Legs animation (scaled proportionally) - only if not being stomped
            if (!constituent.isBeingStomped) {
                const legPhase = Math.sin(constituent.animationFrame) * 8;
                const legWidth = actualWidth * 0.15;
                const legHeight = actualHeight * 0.25;
                const leg1X = constituent.x + actualWidth * 0.3;
                const leg2X = constituent.x + actualWidth * 0.55;
                const legY = constituent.y + actualHeight * 0.83;
                
                this.ctx.fillRect(leg1X, legY, legWidth, legHeight);
                this.ctx.fillRect(leg2X, legY, legWidth, legHeight - legPhase * (actualHeight / 60));
            } else if (constituent.stompAnimationTime < 200) {
                // During squash phase, draw compressed legs
                const legWidth = actualWidth * 0.15;
                const legHeight = actualHeight * 0.1; // Much shorter during squash
                const legY = constituent.y + actualHeight * 0.9;
                this.ctx.fillRect(constituent.x + actualWidth * 0.2, legY, legWidth, legHeight);
                this.ctx.fillRect(constituent.x + actualWidth * 0.65, legY, legWidth, legHeight);
            }
            
            // Add angry face (scaled proportionally) - only if not launching
            if (constituent.stompAnimationTime < 400) {
                this.ctx.fillStyle = 'white';
                const eyeSize = actualWidth * 0.1;
                const eye1X = constituent.x + actualWidth * 0.35;
                const eye2X = constituent.x + actualWidth * 0.55;
                const eyeY = constituent.y + actualHeight * 0.13;
                
                // During squash, make eyes wider
                if (constituent.isBeingStomped && constituent.stompAnimationTime < 200) {
                    // Surprised expression during squash
                    this.ctx.fillRect(eye1X - eyeSize/2, eyeY, eyeSize * 1.5, eyeSize);
                    this.ctx.fillRect(eye2X - eyeSize/2, eyeY, eyeSize * 1.5, eyeSize);
                } else {
                    // Normal angry eyes
                    this.ctx.fillRect(eye1X, eyeY, eyeSize, eyeSize);
                    this.ctx.fillRect(eye2X, eyeY, eyeSize, eyeSize);
                }
            }
            
            this.ctx.restore();
        }
        
        // Draw bribes (gold floating money)
        for (let bribe of this.bribes) {
            this.ctx.save();
            
            // Floating animation
            const floatY = Math.sin(bribe.animationFrame) * 3;
            
            // Set font and alignment
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const centerX = bribe.x + bribe.width/2;
            const centerY = bribe.y + bribe.height/2 + floatY;
            
            // Draw black drop shadow first (same as score/votes text)
            this.ctx.fillStyle = '#000000';
            this.ctx.fillText('$', centerX + 3, centerY + 3);
            
            // Draw gold dollar sign on top
            this.ctx.fillStyle = bribe.color;
            this.ctx.fillText('$', centerX, centerY);
            
            this.ctx.restore();
        }
        
        // Draw obstacles (keep them visible during crash)
        for (let obstacle of this.obstacles) {
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Add simple pattern to obstacles
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, 3);
        }
        
        
        // Debug: draw hitboxes
        if (this.debugHitboxes && this.gameState === 'playing') {
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
        
        // Debug: show speed
        if (this.showSpeed && this.gameState === 'playing') {
            this.ctx.save();
            
            // Larger retro-style background with border
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(10, 10, 280, 100);
            
            // Golden border
            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(10, 10, 280, 100);
            
            // Larger retro pixel font (no outline)
            this.ctx.font = 'bold 20px Tiny5';
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = '#ffffff';
            
            // Game Speed
            this.ctx.fillText(`SPEED: ${this.config.gameSpeed.toFixed(2)}`, 25, 40);
            
            // Base Speed
            this.ctx.fillText(`BASE: ${this.config.baseGameSpeed}`, 25, 65);
            
            // Max Speed
            this.ctx.fillText(`MAX: ${this.config.maxGameSpeed}`, 25, 90);
            
            this.ctx.restore();
        }
        
        // Restore context after screen shake
        this.ctx.restore();
    }
    
    gameLoop() {
        // Calculate delta time for frame-independent updates
        const currentTime = performance.now();
        this.deltaTime = Math.min(currentTime - this.lastFrameTime, 100); // Cap at 100ms to prevent huge jumps
        this.lastFrameTime = currentTime;
        
        if (this.gameState === 'playing') {
            this.gameFrame++;
            
            // Track distance moved since last spawn
            this.lastSpawnDistance += this.config.obstacleSpeed;
            
            this.updatePlayer();
            this.spawnObstacle();
            this.spawnConstituent();
            this.spawnBribe();
            this.updateObstacles();
            this.updateConstituents();
            this.updateBribes();
            this.updateBackground();
            this.updatePopups();
            
            // Continuous scoring
            if (this.gameFrame % 10 === 0) {
                this.score += 1;
                this.updateScore();
            }
        } else if (this.gameState === 'crashing') {
            // Update ragdoll physics during crash
            if (this.ragdoll) {
                this.ragdoll.update();
            }
            
            // Update background (keeps scrolling during crash)
            this.updateBackground();
            this.updatePopups();
            
            // Update screen shake
            if (this.screenShake > 0) {
                this.screenShake *= 0.9; // Decay shake
                if (this.screenShake < 0.5) this.screenShake = 0;
            }
            
            // Check if crash animation is complete
            const now = Date.now();
            if (now - this.crashTimer > this.crashDuration) {
                this.gameOver();
            }
        } else if (this.gameState === 'gameOver') {
            // Keep background moving even after game over
            this.updateBackground();
            
            // Continue ragdoll physics in game over screen
            if (this.ragdoll) {
                this.ragdoll.update();
            }
            
            // Continue updating popups
            this.updatePopups();
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
    
}

// Initialize game when DOM is loaded
// Orientation Detection and Management
class OrientationManager {
    constructor() {
        this.orientationWarning = document.getElementById('orientationWarning');
        this.gameContainer = document.querySelector('.game-container');
        this.checkOrientation = this.checkOrientation.bind(this);
        this.init();
    }
    
    init() {
        // Listen for orientation changes
        window.addEventListener('orientationchange', () => {
            // Delay check to allow browser to update orientation
            setTimeout(this.checkOrientation, 100);
        });
        
        // Listen for resize events (covers more cases)
        window.addEventListener('resize', this.checkOrientation);
        
        // Initial check
        this.checkOrientation();
    }
    
    checkOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;
        const isMobile = window.innerWidth <= 1024; // Consider tablets as mobile too
        
        if (isLandscape && isMobile) {
            // Show warning and hide game
            this.showOrientationWarning();
        } else {
            // Hide warning and show game
            this.hideOrientationWarning();
        }
    }
    
    showOrientationWarning() {
        this.orientationWarning.classList.remove('hidden');
        this.gameContainer.style.display = 'none';
        
        // Pause game if it's running
        if (window.gameInstance && window.gameInstance.gameState === 'playing') {
            window.gameInstance.pauseGame();
        }
    }
    
    hideOrientationWarning() {
        this.orientationWarning.classList.add('hidden');
        this.gameContainer.style.display = 'flex';
    }
    
    // Add haptic feedback if available
    vibrate(pattern = [100]) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }
}

// Enhanced Touch Feedback
class TouchFeedbackManager {
    constructor() {
        this.init();
    }
    
    init() {
        // Add touch feedback to all buttons
        document.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Add visual feedback classes
        this.addTouchStyles();
    }
    
    handleTouchStart(e) {
        const button = e.target.closest('button');
        if (button) {
            button.classList.add('touch-active');
            this.vibrate([50]); // Light haptic feedback
        }
    }
    
    handleTouchEnd(e) {
        const button = e.target.closest('button');
        if (button) {
            // Remove the class after a short delay to allow for visual feedback
            setTimeout(() => {
                button.classList.remove('touch-active');
            }, 150);
        }
    }
    
    addTouchStyles() {
        // Add styles for touch feedback if not already added
        if (!document.querySelector('#touch-feedback-styles')) {
            const style = document.createElement('style');
            style.id = 'touch-feedback-styles';
            style.textContent = `
                button.touch-active {
                    transform: scale(0.95) !important;
                    box-shadow: 1px 1px 0 var(--px-shadow) !important;
                    transition: all 0.1s ease !important;
                }
                
                .control-btn.touch-active {
                    transform: scale(0.9) !important;
                    filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.8)) !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    vibrate(pattern) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize orientation management
    window.orientationManager = new OrientationManager();
    
    // Initialize touch feedback
    window.touchFeedbackManager = new TouchFeedbackManager();
    
    // Initialize game
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
