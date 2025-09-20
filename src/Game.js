// Main Game Class
import { RagdollSystem } from './physics/RagdollSystem.js';
import { API_CONFIG } from './constants/ApiConfig.js';
import { LeaderboardManager } from './managers/LeaderboardManager.js';
import { SoundManager } from './managers/SoundManager.js';
import { OrientationManager } from './managers/OrientationManager.js';
import { TouchFeedbackManager } from './managers/TouchFeedbackManager.js';
import { GAME_CONFIG } from './constants/GameConfig.js';
import { Player } from './entities/Player.js';
import { Obstacle } from './entities/Obstacle.js';
import { Constituent } from './entities/Constituent.js';
import { Bribe } from './entities/Bribe.js';
import { GameLogic } from './GameLogic.js';
import { GameLoop } from './GameLoop.js';
import { Renderer } from './Renderer.js';
import { initializeScaleManager, getScaleManager } from './utils/ScaleManager.js';

export class LtDanRunner {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('scoreBadge');
        this.finalScoreElement = document.getElementById('finalScore');
        
        // Configuration
        this.config = GAME_CONFIG;
        
        // Initialize Scale Manager for percentage-based coordinates with global zoom
        this.scaleManager = initializeScaleManager(this.canvas, this.config.globalZoom);
        
        // Initialize managers
        this.soundManager = new SoundManager();
        this.soundManager.loadSettings();
        this.leaderboard = new LeaderboardManager();
        
        // Initialize game systems (GameLoop and Renderer use static methods)
        this.gameLogic = new GameLogic(this);
        
        // Initialize entities using percentage coordinates
        this.player = new Player(this.canvas);
        
        // Skin system
        this.currentSkin = 'default';
        this.skinImages = {};
        this.skinsLoaded = false;
        this.loadedParachuteSkins = [];  // Initialize the array here
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
        this.setupDevMenu();
        
        // Score submission elements
        this.scoreSubmissionForm = document.getElementById('scoreSubmissionForm');
        this.playerNameInput = document.getElementById('playerNameInput');
        this.submitScoreButton = document.getElementById('submitScoreButton');
        this.skipSubmissionButton = document.getElementById('skipSubmissionButton');
        this.scoreResult = document.getElementById('scoreResult');
        
        // Game timing
        this.gameStartTime = 0;
        this.gameEndTime = 0;
        
        // Game state
        this.gameState = 'start';
        this.score = 0;
        this.gameFrame = 0;
        this.lastScoreUpdate = 0;
        this.soundInitialized = false;
        this.top5Threshold = 100;
        
        // Delta time tracking
        this.lastFrameTime = performance.now();
        this.deltaTime = 0;
        
        // Ragdoll system
        this.ragdoll = null;
        this.crashTimer = 0;
        this.crashDuration = 2000;
        this.screenShake = 0;
        this.screenShakeIntensity = 0;
        
        // Spawn counters
        this.tallSpawnCounter = 0;
        this.nextTallSpawn = GameLogic.randomInt(this.config.tallSpawnMin, this.config.tallSpawnMax);
        this.constituentSpawnCounter = 0;
        this.bribeSpawnCounter = 0;
        this.bribePatternCounter = 0;
        this.nextBribePattern = 250;
        
        // Collections
        this.obstacles = [];
        this.constituents = [];
        this.bribes = [];
        this.gerrymanderExpresses = [];
        this.trailSegments = [];
        
        // Active effects tracking
        this.activeEffects = {
            constituents: [],
            bribes: [],
            currentSpeedMod: 1,
            currentScoreMod: 1
        };
        
        // Speed lerping for train mode
        this.targetGameSpeed = this.config.gameSpeed;
        this.targetObstacleSpeed = this.config.obstacleSpeed;
        this.speedLerpRate = 0.1; // Smooth transition speed
        this.trainSpeedMultiplier = 2.0;
        
        // Unified spawn tracking
        this.lastSpawnDistance = 0;
        this.minSpawnGap = 200;
        
        // Background elements
        this.backgroundElements = [];
        
        // Floating score popups
        this.popups = [];
        
        // Parachute skins
        this.parachuteSkins = [];
        this.loadedParachuteSkins = [];
        this.currentParachuteSkin = null;
        
        // Debug flags
        this.debugHitboxes = false;
        this.showSpeed = false;
        
        this.init();
    }
    
    setupDevMenu() {
        // Create dev menu button
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
        
        // Create dev menu element
        this.devMenu = document.createElement('div');
        this.devMenu.className = 'dev-menu hidden';
        this.devMenu.style.position = 'fixed';
        this.devMenu.style.top = '50%';
        this.devMenu.style.left = '50%';
        this.devMenu.style.transform = 'translate(-50%, -50%)';
        this.devMenu.style.background = 'rgba(0,0,0,0.95)';
        this.devMenu.style.color = '#fff';
        this.devMenu.style.padding = '15px';
        this.devMenu.style.border = '2px solid #ffd700';
        this.devMenu.style.zIndex = '9999';
        this.devMenu.style.borderRadius = '8px';
        this.devMenu.style.maxWidth = '300px';
        this.devMenu.style.maxHeight = '80vh';
        this.devMenu.style.overflowY = 'auto';
        this.devMenu.style.fontSize = '14px';
        this.devMenu.innerHTML = `
            <h3 style="margin:0 0 10px 0; font-size: 16px; text-align: center;">Dev Menu</h3>
            <label style="display:block; margin: 8px 0; font-size: 12px;">
                <input type="checkbox" id="toggleHitboxes" style="margin-right: 5px;">
                Show Hitboxes
            </label>
            <label style="display:block; margin: 8px 0; font-size: 12px;">
                <input type="checkbox" id="toggleSpeed" style="margin-right: 5px;">
                Show Speed
            </label>
            <div style="margin: 8px 0; padding: 8px; background: rgba(0,255,0,0.1); border-radius: 4px;">
                <div style="font-size: 12px; text-align: center; color: #00ff88;">
                    ✅ Assets scaled to 70%<br>
                    (Baked into percentage values)
                </div>
            </div>
            <button id="closeDevMenu" style="width: 100%; margin-top: 10px; padding: 8px; font-size: 12px;">Close</button>
        `;
        document.body.appendChild(this.devMenu);

        this.toggleHitboxesCheckbox = this.devMenu.querySelector('#toggleHitboxes');
        this.toggleSpeedCheckbox = this.devMenu.querySelector('#toggleSpeed');
        this.closeDevMenuButton = this.devMenu.querySelector('#closeDevMenu');
    }
    
    initializeSkins() {
        const bodyParts = ['head', 'head-open-mouth', 'torso', 'upper_arm', 'forearm', 'thigh', 'shin'];
        
        bodyParts.forEach(part => {
            const img = new Image();
            img.onload = () => {
                console.log(`Loaded skin: ${part}`);
            };
            img.onerror = () => {
                console.log(`Failed to load skin: ${part}, using fallback`);
            };
            
            img.src = `skins/${this.currentSkin}/${part}.png`;
            this.skinImages[part] = img;
        });
        
        setTimeout(() => {
            this.skinsLoaded = true;
            console.log('All skins loaded');
        }, 100);
        
        this.loadParachuteSkins();
    }
    
    loadParachuteSkins() {
        const parachuteSkinFiles = [
            'parachute_marlboro.png',
            'parachute_silvereagle.png',
            'parachute_koch.png',
            'parachute_spacex.png'
        ];
        
        console.log(`Attempting to load ${parachuteSkinFiles.length} parachute skins`);
        
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
                
                if (loadedCount + (parachuteSkinFiles.length - this.loadedParachuteSkins.length) >= parachuteSkinFiles.length) {
                    this.checkParachuteSkinsFallback();
                }
            };
            
            img.onerror = () => {
                console.log(`Failed to load parachute skin: ${filename}`);
                loadedCount++;
                
                if (loadedCount >= parachuteSkinFiles.length) {
                    this.checkParachuteSkinsFallback();
                }
            };
            
            img.src = `skins/parachutes/${filename}`;
        });
        
        setTimeout(() => {
            this.checkParachuteSkinsFallback();
        }, 1000);
    }
    
    checkParachuteSkinsFallback() {
        if (this.loadedParachuteSkins.length === 0) {
            console.log('No parachute skins loaded, using fallback colors');
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
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
    }
    
    calculatePositions() {
        // Set player ground position using percentage-based coordinates
        this.player.setGroundY(this.canvas.height * this.config.groundLevel);
    }
    
    setupEventListeners() {
        // Initialize sound on first user interaction
        const initSound = async () => {
            if (!this.soundInitialized) {
                await this.soundManager.initialize();
                this.soundInitialized = true;
                console.log('Sound initialized, game state:', this.gameState);
                if (this.gameState === 'start') {
                    this.soundManager.playMusic('menu');
                }
            }
        };
        
        const handleFirstInteraction = async (e) => {
            await initSound();
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('touchstart', handleFirstInteraction);
            document.removeEventListener('keydown', handleFirstInteraction);
        };
        
        document.addEventListener('click', handleFirstInteraction);
        document.addEventListener('touchstart', handleFirstInteraction);
        document.addEventListener('keydown', handleFirstInteraction);
        
        // Game button event listeners
        this.startButton.addEventListener('click', () => {
            this.soundManager.playButtonClick();
            this.startGame();
        });
        
        this.restartButton.addEventListener('click', () => {
            this.soundManager.playButtonClick();
            this.restartGame();
        });
        
        this.setupNavigationListeners();
        this.setupControlListeners();
        this.setupLeaderboardListeners();
        this.setupInputListeners();
        this.setupAudioControls();
        
        // Dev Menu button
        this.devMenuButton.addEventListener('click', () => {
            console.log("Dev Menu button clicked");
            this.showDevMenu();
        });
        
        // Window resize handler
        window.addEventListener('resize', () => {
            setTimeout(() => {
                this.setupCanvas();
                
                // Update ScaleManager with new canvas dimensions
                this.scaleManager.updateCanvas(this.canvas);
                
                this.calculatePositions();
            }, 100);
        });
    }
    
    setupNavigationListeners() {
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
    }
    
    setupControlListeners() {
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
    }
    
    setupLeaderboardListeners() {
        this.globalTabButton.addEventListener('click', () => this.showGlobalLeaderboard());
        this.recentTabButton.addEventListener('click', () => this.showRecentScores());
        this.refreshLeaderboardButton.addEventListener('click', () => this.refreshCurrentView());
        
        this.submitScoreButton.addEventListener('click', () => this.submitScore());
        this.skipSubmissionButton.addEventListener('click', () => this.skipScoreSubmission());
        
        this.playerNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submitScore();
            }
        });
    }
    
    setupInputListeners() {
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        
        // Mouse events
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
    }
    
    setupAudioControls() {
        const masterVolume = document.getElementById('masterVolume');
        const masterVolumeValue = document.getElementById('masterVolumeValue');
        const masterMute = document.getElementById('masterMute');
        
        const musicVolume = document.getElementById('musicVolume');
        const musicVolumeValue = document.getElementById('musicVolumeValue');
        const musicMute = document.getElementById('musicMute');
        
        const effectsVolume = document.getElementById('effectsVolume');
        const effectsVolumeValue = document.getElementById('effectsVolumeValue');
        const effectsMute = document.getElementById('effectsMute');
        
        // Load current values
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
        
        // Add event listeners for controls
        this.setupVolumeControl('master', masterVolume, masterVolumeValue, masterMute);
        this.setupVolumeControl('music', musicVolume, musicVolumeValue, musicMute);
        this.setupVolumeControl('effects', effectsVolume, effectsVolumeValue, effectsMute);
    }
    
    setupVolumeControl(type, volumeSlider, volumeValue, muteButton) {
        volumeSlider.addEventListener('input', (e) => {
            const value = e.target.value / 100;
            this.soundManager.setVolume(type, value);
            volumeValue.textContent = Math.round(value * 100) + '%';
        });
        
        muteButton.addEventListener('click', () => {
            this.soundManager.toggleMute(type);
            muteButton.textContent = this.soundManager.muted[type] ? '🔊' : '🔇';
            muteButton.classList.toggle('muted', this.soundManager.muted[type]);
        });
    }
    
    // Input Handling Methods
    handleTouchStart(e) {
        e.preventDefault();
        
        if (this.gameState === 'playing') {
            if (e.touches && e.touches.length > 0) {
                this.player.lastTouchX = e.touches[0].clientX;
                this.player.lastTouchY = e.touches[0].clientY;
                this.player.timerTargetX = e.touches[0].clientX;
                this.player.timerTargetY = e.touches[0].clientY;
                
                if (this.player.timerX === 0 && this.player.timerY === 0) {
                    this.player.timerX = e.touches[0].clientX;
                    this.player.timerY = e.touches[0].clientY;
                }
            }
            this.handleJump();
        }
    }
    
    handleJump(mouseX, mouseY) {
        if (this.gameState !== 'playing') return;
        
        // Use the player's activateParachute method for parachute logic
        if (this.player.hasParachute && this.player.parachuteTimeLeft > 0) {
            // Call the proper method which handles all parachute logic
            this.player.activateParachute(mouseX, mouseY);
        } else if (!this.player.isJumping) {
            // Use player's jump method to handle percentage coordinate logic
            if (this.player.jump()) {
                this.soundManager.playJump();
            }
        }
    }
    
    handleKeyDown(e) {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
            if (this.gameState === 'playing') {
                this.pauseGame();
            } else if (this.gameState === 'paused') {
                this.resumeGame();
            }
        }
        
        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            this.handleJump();
        }
    }
    
    // Game State Management
    pauseGame() {
        if (this.gameState !== 'playing') return;
        
        this.gameState = 'paused';
        this.updateHUDVisibility();
        this.pauseScreen.classList.remove('hidden');
        
        this.soundManager.pauseMusic();
        this.soundManager.playMusic('pause');
    }
    
    resumeGame() {
        if (this.gameState !== 'paused') return;
        
        this.gameState = 'playing';
        this.updateHUDVisibility();
        this.pauseScreen.classList.add('hidden');
        
        this.soundManager.stopMusic();
        this.soundManager.playMusic('game');
    }
    
    showDevMenu() {
        this.devMenu.classList.remove('hidden');

        this.toggleHitboxesCheckbox.checked = this.debugHitboxes;
        this.toggleSpeedCheckbox.checked = this.showSpeed;

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
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            this.gameHeader.classList.remove('show-title');
            this.controlButtons.classList.add('active');
            this.scoreContainer.classList.remove('active');
        } else {
            this.gameHeader.classList.add('show-title');
            this.controlButtons.classList.remove('active');
            this.scoreContainer.classList.remove('active');
        }
    }
    
    createBackgroundElements() {
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
        
        // Reset collections
        this.obstacles = [];
        this.constituents = [];
        this.bribes = [];
        this.gerrymanderExpresses = [];
        
        // Reset spawn counters
        this.constituentSpawnCounter = 0;
        this.bribeSpawnCounter = 0;
        
        // Reset player (including train mode)
        this.player.reset(this.canvas.height * this.config.groundLevel);
        
        // Reset game speed
        this.config.gameSpeed = this.config.baseGameSpeed;
        this.config.obstacleSpeed = this.config.baseObstacleSpeed;
        
        // Reset active effects
        this.activeEffects = {
            constituents: [],
            bribes: [],
            currentSpeedMod: 1,
            currentScoreMod: 1
        };
        
        // Fetch top 5 scores
        try {
            const data = await this.leaderboard.getGlobalLeaderboard(5);
            if (data.leaderboard && data.leaderboard.length >= 5) {
                this.top5Threshold = data.leaderboard[4].score;
                console.log('Top 5 threshold set to:', this.top5Threshold);
            } else {
                this.top5Threshold = data.leaderboard?.length > 0 ? 0 : 100;
            }
        } catch (error) {
            console.log('Could not fetch leaderboard, using default threshold');
            this.top5Threshold = 100;
        }
        
        this.soundManager.playMusic('game');
        this.updateScore();
    }
    
    restartGame() {
        this.startGame();
    }
    
    triggerCrash(obstacle) {
        if (this.gameState !== 'playing') return;
        
        this.gameState = 'crashing';
        this.crashTimer = Date.now();
        
        this.soundManager.playEffect('crash');
        
        // Use scaled dimensions for ragdoll (current player size with zoom applied)
        this.ragdoll = new RagdollSystem({
            x: this.player.x,
            y: this.player.y,
            width: this.player.width,  // Already scaled
            height: this.player.height, // Already scaled
            groundY: this.canvas.height * 0.8 // Fixed ground position
        }, this.skinImages);
        
        const collisionForceX = -3 - Math.random() * 2;
        const collisionForceY = -8 - Math.random() * 4;
        this.ragdoll.applyImpulse(collisionForceX, collisionForceY);
        
        this.screenShakeIntensity = 15;
        this.screenShake = this.screenShakeIntensity;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.gameEndTime = Date.now();
        this.finalScoreElement.textContent = this.score;
        this.updateHUDVisibility();
        
        this.soundManager.stopMusic();
        this.soundManager.playMusic('menu');
        
        if (this.score > this.top5Threshold) {
            console.log(`Score ${this.score} beats top 5 threshold of ${this.top5Threshold}! Playing victory fanfare.`);
            this.soundManager.playEffect('victory-fanfare');
            GameLogic.addPopup(this, "TOP 5!", this.canvas.width/2, this.canvas.height * 0.4, {icon: '🏆'});
        } else {
            console.log(`Score ${this.score} didn't beat top 5 threshold of ${this.top5Threshold}. Playing fail sound.`);
            this.soundManager.playEffect('fail');
        }
        
        this.checkForHighScore();
        this.gameOverScreen.classList.remove('hidden');
    }
    
    // Screen Management
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
    
    // Leaderboard Methods
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

        // Set the data-tab attribute for CSS styling
        this.leaderboardContent.setAttribute('data-tab', this.leaderboard.currentView);

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        const pageEntries = currentData.slice(startIndex, endIndex);

        let html = `<div class="leaderboard-table">`;
        
        pageEntries.forEach((entry, index) => {
            const actualIndex = startIndex + index;
            const rankDisplay = entry.rank || (actualIndex + 1);
            
            // Show medals ONLY in Global Top 100 for ranks 1, 2, 3
            // Use actualIndex instead of rankDisplay for more reliable medal assignment
            let medal = '';
            if (this.leaderboard.currentView === 'global' && currentPage === 1) {
                // Only show medals on the first page (where top 3 would be)
                if (actualIndex === 0) medal = '🥇'; // Rank #1
                else if (actualIndex === 1) medal = '🥈'; // Rank #2  
                else if (actualIndex === 2) medal = '🥉'; // Rank #3
            }
            
            html += `
                <div class="leaderboard-entry">
                    <span class="leaderboard-rank">${medal}${medal ? ' ' : ''}#${rankDisplay}</span>
                    <span class="leaderboard-name">${this.escapeHtml(entry.player_name || entry.playerName)}</span>
                    <span class="leaderboard-score">${this.leaderboard.formatScore(entry.score)}</span>
                    <span class="leaderboard-date">${this.leaderboard.formatDate(entry.submitted_at || entry.submittedAt)}</span>
                </div>
            `;
        });
        
        html += `</div>`;
        
        if (totalPages > 1) {
            html += `<div class="pagination-controls">`;
            html += `<div class="pagination-buttons">`;
            
            if (currentPage > 1) {
                html += `<button class="pagination-btn" onclick="window.gameInstance.changePage(${currentPage - 1})">&lt; Previous</button>`;
            } else {
                html += `<button class="pagination-btn" disabled>&lt; Previous</button>`;
            }
            
            if (currentPage < totalPages) {
                html += `<button class="pagination-btn" onclick="window.gameInstance.changePage(${currentPage + 1})">Next &gt;</button>`;
            } else {
                html += `<button class="pagination-btn" disabled>Next &gt;</button>`;
            }
            
            html += `</div>`;
            html += `<div class="pagination-info">Page ${currentPage} of ${totalPages}</div>`;
            html += `</div>`;
        }
        
        this.leaderboardContent.innerHTML = html;
    }
    
    changePage(page) {
        this.leaderboardPagination.currentPage = page;
        this.renderPaginatedLeaderboard(this.leaderboard.currentView === 'global' ? 'Global Leaderboard' : 'Recent Scores');
    }
    
    // Score Submission Methods
    checkForHighScore() {
        this.scoreSubmissionForm.classList.add('hidden');
        this.scoreResult.classList.add('hidden');
        
        if (this.score > 50) {
            this.showScoreSubmissionForm();
        }
    }
    
    showScoreSubmissionForm() {
        const savedName = this.leaderboard.getSavedPlayerName();
        this.playerNameInput.value = savedName;
        this.scoreSubmissionForm.classList.remove('hidden');
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

        let gameDuration = Math.floor((this.gameEndTime - this.gameStartTime) / 1000);
        
        if (gameDuration < 5) {
            gameDuration = Math.max(5, Math.floor(this.score / 10));
        }
        
        if (gameDuration > 7200) {
            gameDuration = 7200;
        }

        console.log('Submitting score:', {
            playerName,
            score: this.score,
            gameDuration
        });
        
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
                
                setTimeout(() => {
                    this.scoreSubmissionForm.classList.add('hidden');
                }, 3000);
            }
        } catch (error) {
            console.error('Full error details:', error);
            this.showSubmissionResult(`Failed to submit score: ${error.message}`, true);
        } finally {
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
    
    updateScore() {
        const now = Date.now();
        if (now - this.lastScoreUpdate > 50) {
            this.scoreElement.textContent = this.score;
            this.lastScoreUpdate = now;
            
            if (this.score > 0 && this.score % 100 === 0) {
                this.animateScoreBadge();
                this.soundManager.playMilestone();
                GameLogic.addPopup(this, "MILESTONE!", this.canvas.width/2, this.canvas.height * 0.3, {icon: '🎯'});
            }
        }
        
        if (this.score > 0 && this.score % 100 === 0) {
            this.config.gameSpeed = Math.min(this.config.gameSpeed + 0.2, 8);
            this.config.obstacleSpeed = Math.min(this.config.obstacleSpeed + 0.2, 8);
            this.soundManager.playSpeedUp();
        }
    }
    
    animateScoreBadge() {
        this.scoreBadge.classList.add('shake');
        setTimeout(() => {
            this.scoreBadge.classList.remove('shake');
        }, 600);
    }
    
    
    // Main Game Loop
    gameLoop() {
        const currentTime = performance.now();
        this.deltaTime = Math.min(currentTime - this.lastFrameTime, 100);
        this.lastFrameTime = currentTime;
        
        // Call static methods from GameLoop and Renderer
        GameLoop.update(this);
        Renderer.render(this);
        
        requestAnimationFrame(() => this.gameLoop());
    }
}
