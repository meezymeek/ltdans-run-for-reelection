// Main Game Class
import { RagdollSystem } from './physics/RagdollSystem.js';
import { API_CONFIG } from './constants/ApiConfig.js';
import { LeaderboardManager } from './managers/LeaderboardManager.js';
import { SoundManager } from './managers/SoundManager.js';
import { OrientationManager } from './managers/OrientationManager.js';
import { TouchFeedbackManager } from './managers/TouchFeedbackManager.js';
import { TutorialManager } from './managers/TutorialManager.js';
import { ParachuteTapOverlay } from './managers/ParachuteTapOverlay.js';
import { GAME_CONFIG } from './constants/GameConfig.js';
import { Player } from './entities/Player.js';
import { Obstacle } from './entities/Obstacle.js';
import { Constituent } from './entities/Constituent.js';
import { Bribe } from './entities/Bribe.js';
import { GameLogic } from './GameLogic.js';
import { GameLoop } from './GameLoop.js';
import { Renderer } from './Renderer.js';
import { initializeScaleManager, getScaleManager } from './utils/ScaleManager.js';

export class RerunGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('scoreBadge');
        this.finalScoreElement = document.getElementById('finalScore');
        
        // Configuration
        this.config = GAME_CONFIG;
        
        // Viewport resize handling
        this._resizeDebounce = null;
        this._onWindowResize = this._handleWindowResize.bind(this);
        this._onVVResize = this._handleVVResize.bind(this);
        
        // Optional debug logging via ?debug=viewport
        const params = new URLSearchParams(location.search);
        this._debugViewport = params.get('debug') === 'viewport';
        
        // Initialize Scale Manager for percentage-based coordinates with global zoom
        this.scaleManager = initializeScaleManager(this.canvas, this.config.globalZoom);
        
        // Initialize managers
        this.soundManager = new SoundManager();
        this.soundManager.loadSettings();
        this.leaderboard = new LeaderboardManager();
        this.tutorialManager = new TutorialManager(this);
        this.parachuteTapOverlay = new ParachuteTapOverlay();
        
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
        this.tutorialButton = document.getElementById('tutorialButton');
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
        this.crashDuration = 3000; // Increased from 2000ms to 3000ms (3 seconds)
        this.screenShake = 0;
        this.screenShakeIntensity = 0;
        
        // Spawn counters
        this.tallSpawnCounter = 0;
        this.nextTallSpawn = GameLogic.randomInt(this.config.tallSpawnMin, this.config.tallSpawnMax);
        this.constituentSpawnCounter = 0;
        this.bribeSpawnCounter = 0;
        this.bribePatternCounter = 0;
        this.nextBribePattern = 250;
        
        // Gerrymander Express spawn limiting
        this.parachuteActivationCount = 0;  // Track total parachute activations
        this.lastGerrymanderExpressTime = 0;  // Hidden cooldown timer
        this.gerrymanderExpressCooldown = 15000;  // 15 second cooldown (hidden from player)
        
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
        
        // Obstacle skins
        this.obstacleSkinConfig = null;
        this.loadedObstacleSkins = [];
        
        // Debug flags
        this.debugHitboxes = false;
        this.showSpeed = false;
        
        // Tutorial crash overlay effect
        this.tutorialCrashOverlay = 0; // 0 = no overlay, 1 = full red overlay
        this.tutorialCrashFadeSpeed = 0.05;
        
        // Pre-loaded assets (will be set by AssetLoader)
        this.preloadedAssets = null;
        
        // Create crash skip hint element (reusing loading screen styling)
        this.createCrashSkipHint();
        
        this.init();
    }
    
    // Method to receive pre-loaded assets from AssetLoader
    setPreloadedAssets(loadedAssets) {
        this.preloadedAssets = loadedAssets;
        this.assets = loadedAssets; // Also store as assets for easier access
        console.log('Game received pre-loaded assets:', loadedAssets);
        
        // Use pre-loaded skin images if available
        if (loadedAssets.images && loadedAssets.images.skins) {
            this.skinImages = { ...loadedAssets.images.skins };
            this.skinsLoaded = true;
            console.log('Using pre-loaded skin images');
        }
        
        // Use pre-loaded parachute images if available
        if (loadedAssets.images && loadedAssets.images.parachutes) {
            this.loadedParachuteSkins = [...loadedAssets.images.parachutes];
            console.log('Using pre-loaded parachute skins');
        }
        
        // Use pre-loaded obstacle images if available
        if (loadedAssets.images && loadedAssets.images.obstacles) {
            this.loadedObstacleSkins = [...loadedAssets.images.obstacles];
            console.log('Using pre-loaded obstacle skins:', this.loadedObstacleSkins.length);
        }
        
        // Load obstacle skin configuration
        this.loadObstacleSkinConfig();
        
        // Pass audio assets to SoundManager if available
        if (loadedAssets.audio && this.soundManager) {
            this.soundManager.setPreloadedAudio(loadedAssets.audio);
        }
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
            <div style="margin: 8px 0; padding: 8px; background: rgba(255,215,0,0.1); border-radius: 4px;">
                <div style="font-size: 12px; text-align: center; color: #ffd700; margin-bottom: 8px;">
                    🎯 Score Testing
                </div>
                <div style="display: flex; gap: 4px; margin-bottom: 4px;">
                    <input type="number" id="scoreInput" placeholder="Enter score" style="flex: 1; padding: 4px; font-size: 11px; background: rgba(0,0,0,0.8); color: #fff; border: 1px solid #ffd700; border-radius: 0;">
                    <button id="setScore" style="padding: 4px 8px; font-size: 11px; background: #ffd700; color: #000; border: none; cursor: pointer;">Set</button>
                </div>
                <div style="display: flex; gap: 2px; justify-content: space-between;">
                    <button id="score1000" style="flex: 1; padding: 3px; font-size: 10px; background: #666; color: #fff; border: none; cursor: pointer;">1K</button>
                    <button id="score10000" style="flex: 1; padding: 3px; font-size: 10px; background: #666; color: #fff; border: none; cursor: pointer;">10K</button>
                    <button id="score100000" style="flex: 1; padding: 3px; font-size: 10px; background: #666; color: #fff; border: none; cursor: pointer;">100K</button>
                    <button id="score1000000" style="flex: 1; padding: 3px; font-size: 10px; background: #666; color: #fff; border: none; cursor: pointer;">1M</button>
                </div>
            </div>
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
    
    /**
     * Idempotent: measure viewport/container, size canvas, update scale & positions.
     * Call this whenever the viewport may have changed (e.g., keyboard open/close).
     */
    forceRemeasure() {
        // 1) Size canvas to container/viewport
        this.setupCanvas();
        // 2) Update ScaleManager with new canvas dimensions
        this.scaleManager.updateCanvas(this.canvas);
        // 3) Recompute any cached positions/rects
        this.calculatePositions();
        
        if (this._debugViewport) {
            const vv = window.visualViewport;
            console.log('[Viewport]', {
                inner: [window.innerWidth, window.innerHeight],
                vv: vv ? [vv.width, vv.height] : null,
                canvasCSS: [this.canvas.style.width, this.canvas.style.height],
                canvasPx: [this.canvas.width, this.canvas.height],
                dpr: window.devicePixelRatio
            });
        }
    }

    _debouncedRemeasure(delay = 120) {
        clearTimeout(this._resizeDebounce);
        this._resizeDebounce = setTimeout(() => this.forceRemeasure(), delay);
    }

    _handleWindowResize() {
        this._debouncedRemeasure(120);
    }

    _handleVVResize() {
        // Some mobile browsers don't fire window resize on keyboard close.
        // visualViewport resize/scroll will, so treat them the same.
        this._debouncedRemeasure(120);
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
    
    // Load obstacle skin configuration from JSON file
    async loadObstacleSkinConfig() {
        try {
            const response = await fetch('skins/obstacles/obstacle-skins.json');
            this.obstacleSkinConfig = await response.json();
            console.log('Loaded obstacle skin configuration:', this.obstacleSkinConfig);
        } catch (error) {
            console.warn('Could not load obstacle skins config:', error.message);
            // Fallback configuration
            this.obstacleSkinConfig = {
                skins: {
                    tall: { default: { name: "Default Tall", imagePath: null, color: "#8B4513", animationType: "none" } },
                    low: { default: { name: "Default Low", imagePath: null, color: "#654321", animationType: "none" } }
                },
                spawnWeights: {
                    tall: { default: 100 },
                    low: { default: 100 }
                }
            };
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
        // Use current viewport dimensions (preserving original logic)
        const vv = window.visualViewport;
        const width = Math.round(vv?.width || window.innerWidth);
        const height = Math.round(vv?.height || window.innerHeight);
        
        // Only update when dimensions actually change
        if (this.canvas.width !== width) this.canvas.width = width;
        if (this.canvas.height !== height) this.canvas.height = height;
        if (this.canvas.style.width !== `${width}px`) this.canvas.style.width = `${width}px`;
        if (this.canvas.style.height !== `${height}px`) this.canvas.style.height = `${height}px`;
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
        
        this.tutorialButton.addEventListener('click', () => {
            this.soundManager.playButtonClick();
            this.startTutorial();
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
        
        // Window/UI chrome changes
        window.addEventListener('resize', this._onWindowResize);
        window.addEventListener('orientationchange', this._onWindowResize);

        // VisualViewport tracks on-screen keyboard; some browsers won't raise window.resize on close
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', this._onVVResize);
            window.visualViewport.addEventListener('scroll', this._onVVResize);
        }
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
            this.togglePause();
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
            
            // Check for tutorial navigation clicks first
            if (this.gameState === 'tutorial' && this.tutorialManager) {
                if (this.tutorialManager.handleTutorialClick(mouseX, mouseY)) {
                    return; // Navigation click handled, don't process as jump
                }
            }
            
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
        
        // Setup accordion functionality
        const accordionHeader = document.getElementById('audioAccordionHeader');
        const accordionContent = document.getElementById('audioAccordionContent');
        const audioAccordion = accordionHeader.parentElement;
        
        accordionHeader.addEventListener('click', () => {
            audioAccordion.classList.toggle('collapsed');
            this.soundManager.playButtonClick();
        });
        
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
        
        // Check for crash skip functionality first
        if (this.gameState === 'crashing') {
            // Skip crash animation and go directly to game over
            GameLogic.gameOver(this);
            return;
        }
        
        if (this.gameState === 'playing' || this.gameState === 'tutorial') {
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
        // Check for crash skip functionality first
        if (this.gameState === 'crashing') {
            // Skip crash animation and go directly to game over
            GameLogic.gameOver(this);
            return;
        }
        
        if (this.gameState !== 'playing' && this.gameState !== 'tutorial') return;
        
        // Tutorial mode: track parachute usage
        if (this.gameState === 'tutorial' && this.player.hasParachute && this.player.parachuteTimeLeft > 0) {
            this.tutorialManager.handleParachuteUsed();
        }
        
        // Use the player's activateParachute method for parachute logic
        if (this.player.hasParachute && this.player.parachuteTimeLeft > 0) {
            // Call the proper method which handles all parachute logic
            this.player.activateParachute(mouseX, mouseY);
        } else if (!this.player.isJumping) {
            // Use player's jump method to handle percentage coordinate logic
            if (this.player.jump()) {
                this.soundManager.playJump();
                
                // Tutorial mode: track jump completion
                if (this.gameState === 'tutorial' && this.tutorialManager) {
                    this.tutorialManager.handleJumpCompleted();
                }
            }
        }
    }
    
    handleKeyDown(e) {
        // Check for crash skip functionality first
        if (this.gameState === 'crashing') {
            // Skip crash animation and go directly to game over on any key press
            GameLogic.gameOver(this);
            return;
        }
        
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
            if (this.gameState === 'playing') {
                this.pauseGame();
            } else if (this.gameState === 'paused') {
                this.resumeGame();
            } else if (this.gameState === 'tutorial') {
                // ESC skips tutorial
                this.tutorialManager.skipTutorial();
            }
        }
        
        // Tutorial navigation with arrow keys
        if (this.gameState === 'tutorial' && this.tutorialManager) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                console.log('Left arrow key pressed');
                this.tutorialManager.goToPreviousSection();
                return;
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                console.log('Right arrow key pressed');
                this.tutorialManager.goToNextSection();
                return;
            }
        }
        
        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            this.handleJump();
        }
    }
    
    // Game State Management
    togglePause() {
        if (this.gameState === 'paused') {
            this.resumeGame();
        } else if (this.gameState === 'playing' || this.gameState === 'tutorial') {
            this.pauseGame();
        }
    }
    
    pauseGame() {
        if (this.gameState !== 'playing' && this.gameState !== 'tutorial') return;
        
        // Store the previous state so we can resume to the correct mode
        this.previousGameState = this.gameState;
        this.gameState = 'paused';
        this.updateHUDVisibility();
        this.pauseScreen.classList.remove('hidden');
        
        // Update pause menu text based on current mode
        this.updatePauseMenuText();
        
        // Add paused animation and change icon to X
        this.pauseButton.classList.add('paused');
        this.pauseButton.textContent = '×';
        this.pauseButton.title = 'Resume Game';
        
        this.soundManager.pauseMusic();
        this.soundManager.playMusic('pause');
    }
    
    resumeGame() {
        if (this.gameState !== 'paused') return;
        
        // Resume to the previous state (playing or tutorial)
        this.gameState = this.previousGameState || 'playing';
        this.updateHUDVisibility();
        this.pauseScreen.classList.add('hidden');
        
        // Remove paused animation and change icon back to hamburger
        this.pauseButton.classList.remove('paused');
        this.pauseButton.textContent = '≡';
        this.pauseButton.title = 'Pause Game';
        
        this.soundManager.stopMusic();
        this.soundManager.playMusic('game');
    }
    
    updatePauseMenuText() {
        // Update button text based on whether we're in tutorial or regular play
        if (this.previousGameState === 'tutorial') {
            this.resumeButton.textContent = '▶️ Resume Tutorial';
            this.restartFromPauseButton.textContent = '🔄 Restart Tutorial';
        } else {
            this.resumeButton.textContent = '▶️ Resume Campaign';
            this.restartFromPauseButton.textContent = '🔄 Restart';
        }
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
        
        // Score testing controls
        const scoreInput = this.devMenu.querySelector('#scoreInput');
        const setScoreBtn = this.devMenu.querySelector('#setScore');
        const score1KBtn = this.devMenu.querySelector('#score1000');
        const score10KBtn = this.devMenu.querySelector('#score10000');
        const score100KBtn = this.devMenu.querySelector('#score100000');
        const score1MBtn = this.devMenu.querySelector('#score1000000');
        
        // Custom score input
        setScoreBtn.onclick = () => {
            const newScore = parseInt(scoreInput.value);
            if (!isNaN(newScore) && newScore >= 0) {
                this.setTestScore(newScore);
                scoreInput.value = '';
            }
        };
        
        scoreInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                setScoreBtn.click();
            }
        });
        
        // Preset score buttons
        score1KBtn.onclick = () => this.setTestScore(1000);
        score10KBtn.onclick = () => this.setTestScore(10000);
        score100KBtn.onclick = () => this.setTestScore(100000);
        score1MBtn.onclick = () => this.setTestScore(1000000);
        
        this.closeDevMenuButton.onclick = () => {
            this.devMenu.classList.add('hidden');
        };
    }
    
    setTestScore(newScore) {
        this.score = newScore;
        this.updateScore();
        console.log(`Score set to: ${newScore} (${newScore.toString().length} digits)`);
    }
    
    updateHUDVisibility() {
        if (this.gameState === 'playing' || this.gameState === 'paused' || this.gameState === 'tutorial') {
            this.gameHeader.classList.remove('show-title');
            this.controlButtons.classList.add('active');
            this.scoreContainer.classList.add('active'); // Show score during tutorial too
        } else {
            this.gameHeader.classList.add('show-title');
            this.controlButtons.classList.remove('active');
            this.scoreContainer.classList.remove('active');
        }
    }
    
    createBackgroundElements() {
        // Initialize background layers array
        this.backgroundLayers = {
            buildings: [],
            tombstones: [],
            fences: [],
            clouds: [],
            fog: []
        };
        
        // Create silhouetted buildings (furthest background)
        for (let i = 0; i < 8; i++) {
            this.backgroundLayers.buildings.push({
                x: Math.random() * this.canvas.width * 3,
                y: this.canvas.height * (0.3 + Math.random() * 0.2), // Upper portion
                width: 80 + Math.random() * 120,
                height: 100 + Math.random() * 150,
                speed: 0.1 + Math.random() * 0.1, // Very slow
                type: 'building'
            });
        }
        
        // Create tombstones and crosses (mid-ground)
        for (let i = 0; i < 12; i++) {
            this.backgroundLayers.tombstones.push({
                x: Math.random() * this.canvas.width * 2.5,
                y: this.canvas.height * (0.55 + Math.random() * 0.15), // Mid portion
                width: 15 + Math.random() * 25,
                height: 30 + Math.random() * 40,
                speed: 0.2 + Math.random() * 0.15, // Slow
                type: Math.random() > 0.7 ? 'cross' : 'tombstone'
            });
        }
        
        // Create cemetery fences with normalized sizes and proper gate placement
        const standardFenceWidth = 120;
        const standardFenceHeight = 30;
        const standardGateWidth = 140;
        const standardGateHeight = 45;
        
        // Create a pattern with fewer gates: mostly fences with occasional gates
        const patternSequence = ['fence', 'fence', 'fence', 'fence', 'fence', 'fence', 'fence', 'fence', 'fence', 'gate'];
        
        let currentX = this.canvas.width;
        
        for (let i = 0; i < 12; i++) { // More elements for better coverage
            const patternIndex = i % patternSequence.length;
            const elementType = patternSequence[patternIndex];
            const isGate = elementType === 'gate';
            
            // Use normalized sizes
            const width = isGate ? standardGateWidth : standardFenceWidth;
            const height = isGate ? standardGateHeight : standardFenceHeight;
            
            this.backgroundLayers.fences.push({
                x: currentX,
                y: this.canvas.height * 0.8 - height, // Align bottom with ground plane
                width: width,
                height: height,
                speed: 0.5, // Fixed speed so all fences move together
                type: elementType
            });
            
            // Move to next position (elements touch each other)
            currentX += width;
        }
        
        // Create spooky clouds (keep existing system but modify for Halloween)
        for (let i = 0; i < 6; i++) {
            this.backgroundLayers.clouds.push({
                x: Math.random() * this.canvas.width * 2,
                y: Math.random() * this.canvas.height * 0.3, // Upper sky
                width: 60 + Math.random() * 80,
                height: 30 + Math.random() * 30,
                speed: 0.15 + Math.random() * 0.2,
                color: `rgba(60, 50, 80, ${0.15 + Math.random() * 0.25})`, // Dark purple clouds
                type: 'cloud'
            });
        }
        
        // Create ground fog effect
        for (let i = 0; i < 8; i++) {
            this.backgroundLayers.fog.push({
                x: Math.random() * this.canvas.width * 2,
                y: this.canvas.height * (0.75 + Math.random() * 0.15), // Near ground
                width: 80 + Math.random() * 120,
                height: 20 + Math.random() * 25,
                speed: 0.3 + Math.random() * 0.4, // Faster than clouds
                color: `rgba(200, 200, 220, ${0.1 + Math.random() * 0.3})`, // Misty white/grey
                type: 'fog',
                opacity: 0.1 + Math.random() * 0.4 // Variable opacity for atmosphere
            });
        }
        
        // Keep the old backgroundElements for compatibility (now just clouds)
        this.backgroundElements = this.backgroundLayers.clouds;
    }
    
    async startGame() {
        // Ensure canvas/scale match the *current* viewport before play begins
        this.forceRemeasure();
        
        this.gameState = 'playing';
        this.gameStartTime = Date.now();
        this.hideAllScreens();
        this.updateHUDVisibility();
        this.score = 0;
        this.gameFrame = 0;
        
        // Clear previous game state to prevent tutorial restart bug
        this.previousGameState = null;
        
        // Reset pause button icon when starting game
        this.pauseButton.classList.remove('paused');
        this.pauseButton.textContent = '≡';
        this.pauseButton.title = 'Pause Game';
        
        // Reset collections
        this.obstacles = [];
        this.constituents = [];
        this.bribes = [];
        this.gerrymanderExpresses = [];
        
        // Reset spawn counters
        this.constituentSpawnCounter = 0;
        this.bribeSpawnCounter = 0;
        
        // Reset Gerrymander Express spawn tracking
        this.parachuteActivationCount = 0;
        this.lastGerrymanderExpressTime = 0;
        
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
    
    startTutorial() {
        console.log('Starting tutorial from Game class');
        // Ensure canvas/scale match the current viewport
        this.forceRemeasure();
        
        // Clear previous game state to prevent restart bugs
        this.previousGameState = null;
        
        // Start the tutorial
        this.tutorialManager.startTutorial();
    }
    
    restartGame() {
        // Check if we're restarting from tutorial pause
        if (this.previousGameState === 'tutorial') {
            this.restartTutorial();
        } else {
            this.startGame();
        }
    }
    
    restartTutorial() {
        // Reset pause button icon when restarting tutorial
        this.pauseButton.classList.remove('paused');
        this.pauseButton.textContent = '≡';
        this.pauseButton.title = 'Pause Game';
        
        // Start tutorial from beginning
        this.startTutorial();
    }
    
    triggerCrash(obstacle) {
        if (this.gameState !== 'playing') return;
        
        this.gameState = 'crashing';
        this.crashTimer = Date.now();
        
        this.soundManager.playEffect('crash');
        
        // Show crash skip hint
        this.showCrashSkipHint();
        
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
        
        // Hide crash skip hint when transitioning to game over
        this.hideCrashSkipHint();
        
        this.soundManager.stopMusic();
        this.soundManager.playMusic('menu');
        
        if (this.score > this.top5Threshold) {
            console.log(`Score ${this.score} beats top 5 threshold of ${this.top5Threshold}! Playing victory fanfare.`);
            this.soundManager.playEffect('victory-fanfare');
            GameLogic.addPopup(this, "TOP 5!", this.canvas.width / 2, this.canvas.height * 0.9, {icon: '🏆', duration: 3000});
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
        // When falling back to menu after submitting/skipping, re-measure again
        this.forceRemeasure();
        
        this.gameState = 'start';
        this.hideAllScreens();
        this.updateHUDVisibility();
        this.startScreen.classList.remove('hidden');
        
        // Reset pause button icon when returning to main menu
        this.pauseButton.classList.remove('paused');
        this.pauseButton.textContent = '≡';
        this.pauseButton.title = 'Pause Game';
        
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
            
            // Close on-screen keyboard and re-measure
            this.playerNameInput?.blur?.();
            // Next microtask: avoid racing layout
            setTimeout(() => this.forceRemeasure(), 0);
        }
    }
    
    skipScoreSubmission() {
        this.scoreSubmissionForm.classList.add('hidden');
        this.scoreResult.classList.add('hidden');
        
        this.playerNameInput?.blur?.();
        setTimeout(() => this.forceRemeasure(), 0);
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
            
            // Apply dynamic font sizing CSS class based on digit count
            const digitCount = this.score.toString().length;
            
            // Remove existing digit-based classes
            this.scoreElement.className = this.scoreElement.className.replace(/\bdigits-\d+-?(?:or-less|plus)?\b/g, '');
            
            // Add appropriate class based on digit count
            if (digitCount <= 4) {
                this.scoreElement.classList.add('digits-4-or-less');
            } else if (digitCount === 5) {
                this.scoreElement.classList.add('digits-5');
            } else if (digitCount === 6) {
                this.scoreElement.classList.add('digits-6');
            } else {
                this.scoreElement.classList.add('digits-7-plus');
            }
            
            this.lastScoreUpdate = now;
            
            if (this.score > 0 && this.score % 100 === 0) {
                this.animateScoreBadge();
                this.soundManager.playMilestone();
                GameLogic.addPopup(this, "MILESTONE!", this.canvas.width / 2, this.canvas.height * 0.9, {icon: '🎯', duration: 2100});
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
    
    createCrashSkipHint() {
        // Create crash skip hint element (reusing loading screen skip-hint styling)
        this.crashSkipHint = document.createElement('div');
        this.crashSkipHint.className = 'skip-hint hidden';
        this.crashSkipHint.textContent = 'Tap anywhere to skip crash';
        this.crashSkipHint.style.position = 'fixed';
        this.crashSkipHint.style.bottom = '2rem';
        this.crashSkipHint.style.left = '50%';
        this.crashSkipHint.style.transform = 'translateX(-50%)';
        this.crashSkipHint.style.zIndex = '1000';
        document.body.appendChild(this.crashSkipHint);
    }
    
    showCrashSkipHint() {
        if (this.crashSkipHint) {
            this.crashSkipHint.classList.remove('hidden');
        }
    }
    
    hideCrashSkipHint() {
        if (this.crashSkipHint) {
            this.crashSkipHint.classList.add('hidden');
        }
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
