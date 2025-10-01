// Tutorial Manager Class
import { GAME_CONFIG } from '../constants/GameConfig.js';
import { createObstacle, createObstacleWithVariant } from '../entities/Obstacle.js';
import { Constituent } from '../entities/Constituent.js';
import { Bribe } from '../entities/Bribe.js';
import { GerrymanderExpress } from '../entities/GerrymanderExpress.js';
import { getScaleManager } from '../utils/ScaleManager.js';

export class TutorialManager {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.currentSection = 0;
        this.sectionComplete = false;
        this.dialogShown = false;
        this.tutorialComplete = false;
        
        // Tutorial sections configuration
        this.sections = [
            {
                id: 'basic_jump',
                title: 'Basic Jumping',
                instruction: 'Welcome! You are a career politician attempoting to avoid any obstacle in your way to victory! Tap anywhere to jump!',
                baseInstruction: 'Welcome! You are a career politician attempoting to avoid any obstacle in your way to victory! Tap anywhere to jump!',
                entities: [], // No entities for basic jumping
                waitForAction: 'jump_multiple',
                spawnContinuous: false,
                checkpoint: true
            },
            {
                id: 'low_obstacles',
                title: 'Suggestion Boxes',
                instruction: 'These are Suggestion Boxes. Jump over them to avoid crashing out!',
                baseInstruction: 'These are Suggestion Boxes. Jump over them to avoid crashing out!',
                entities: [{ type: 'low_obstacle', delay: 2000 }],
                waitForAction: 'clear_obstacles',
                spawnContinuous: true,
                spawnDelay: 3000,
                checkpoint: true
            },
            {
                id: 'tall_obstacles',
                title: 'Pillars of Decency',
                instruction: 'Avoid Decency at all cost! Time these jumps carefully!',
                baseInstruction: 'Avoid Decency at all cost! Time these jumps carefully!',
                entities: [{ type: 'tall_obstacle', delay: 2000 }],
                waitForAction: 'clear_obstacles',
                spawnContinuous: true,
                spawnDelay: 4000,
                checkpoint: true
            },
            {
                id: 'bribes',
                title: 'Collecting Bribes',
                instruction: 'Collect bribes for bonus votes! This is MUCH easier than earning votes!',
                baseInstruction: 'Collect bribes for bonus votes! This is MUCH easier than earning votes!',
                entities: [{ type: 'bribe', delay: 2000, height: 'low' }],
                waitForAction: 'collect_bribes',
                spawnContinuous: true,
                spawnDelay: 3500,
                checkpoint: true
            },
            {
                id: 'constituents',
                title: 'Crush Constituents',
                instruction: 'Crushing a constituent by jumping on their head will cost you -25 votes. Surely its worth it for the extra help!',
                baseInstruction: 'Crushing a constituent by jumping on their head will cost you -25 votes. Surely its worth it for the extra help!',
                entities: [{ type: 'constituent', delay: 2000 }],
                waitForAction: 'encounter_constituent',
                spawnContinuous: false,
                disableParachute: true, // Disable parachute for this section
                allowFailure: true,
                checkpoint: true
            },
            {
                id: 'parachute',
                title: 'Corporate Airlift',
                instruction: 'Crushing Constituents will earn you a Corproate Airlift! TAP repeatedly to stay airborne!',
                baseInstruction: 'Crushing Constituents will earn you a Corproate Airlift! TAP repeatedly to stay airborne for 3 seconds!',
                entities: [{ type: 'constituent', delay: 2000 }],
                waitForAction: 'stay_airborne',
                spawnContinuous: true,
                spawnDelay: 2500, // Faster spawning for parachute practice
                checkpoint: true
            },
            {
                id: 'gerrymander_express',
                title: 'Gerrymander Express',
                instruction: 'Crush constituent for a COrporate Airlift, then collect a ticket to for the Gerrymander Express!',
                baseInstruction: 'Crush constituent for a Corporate Airlift then collect a ticket to for the Gerrymander Express!',
                entities: [
                    { type: 'constituent', delay: 1500 },
                    { type: 'gerrymander_express', delay: 3000 }
                ],
                waitForAction: 'activate_train',
                spawnContinuous: false,
                enableRegularSpawning: true, // Enable regular spawning after train activation
                checkpoint: true
            },
            {
                id: 'completion',
                title: 'Tutorial Complete!',
                instruction: 'You\'ve learned all the basics! Ready for the real campaign? Push the menu button and ',
                entities: [],
                waitForAction: 'none',
                finalSection: true
            }
        ];
        
        // Tutorial state tracking
        this.sectionStartTime = 0;
        this.entitiesSpawned = [];
        this.actionCompleted = false;
        this.obstaclesCleared = 0;
        this.bribesCollected = 0;
        this.constituentsEncountered = 0;
        this.parachuteUsed = false;
        this.parachutesDeployed = 0; // Track parachute deployments for stage 6
        this.parachuteTimerCompleted = false; // Track if parachute timer completed successfully
        this.watchingParachuteTimer = false; // Flag to track when we're monitoring a parachute
        this.trainActivated = false;
        this.lastSpawnTime = 0;
        this.entitiesNeeded = 3; // Default number of entities to clear for obstacle sections
        this.jumpsCompleted = 0; // Track jumps for basic jumping section
        this.regularSpawningEnabled = false; // Flag for enabling regular game spawning
        this.gerrymanderCycleStep = 0; // Track which step in the gerrymander sequence (0=constituent, 1=ticket token)
        this.trainActivations = 0; // Track number of train mode activations for stage 7
        
        // Constituent respawn system
        this.lastConstituentRespawn = 0; // Track last respawn time for stage 5
        
        // Dialog system
        this.showingDialog = false;
        this.dialogElement = null;
        this.createDialogElement();
    }
    
    createDialogElement() {
        // Create tutorial dialog overlay
        this.dialogElement = document.createElement('div');
        this.dialogElement.className = 'tutorial-dialog hidden';
        this.dialogElement.innerHTML = `
            <div class="tutorial-content">
                <div class="tutorial-header">
                    <span class="tutorial-title"></span>
                    <span class="tutorial-progress"></span>
                </div>
                <div class="tutorial-message"></div>
                <div class="tutorial-actions">
                    <button class="tutorial-continue-btn">Continue</button>
                    <button class="tutorial-skip-btn">Skip Tutorial</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.dialogElement);
        
        // Bind event listeners
        this.dialogElement.querySelector('.tutorial-continue-btn').addEventListener('click', () => {
            this.hideDialog();
        });
        
        this.dialogElement.querySelector('.tutorial-skip-btn').addEventListener('click', () => {
            this.skipTutorial();
        });
    }
    
    startTutorial() {
        // Starting tutorial
        this.isActive = true;
        this.currentSection = 0;
        this.tutorialComplete = false;
        this.resetSectionState();
        
        // Set game state to tutorial
        this.game.gameState = 'tutorial';
        this.game.hideAllScreens();
        this.game.updateHUDVisibility();
        
        // Start background music
        this.game.soundManager.playMusic('game');
        
        // Reset player and game state
        this.game.player.reset(this.game.canvas.height * GAME_CONFIG.groundLevel);
        this.game.obstacles = [];
        this.game.constituents = [];
        this.game.bribes = [];
        this.game.gerrymanderExpresses = [];
        
        // Reset tutorial-specific tracking (start with 100 points for testing)
        this.game.score = 100;
        this.game.updateScore();
        
        this.startCurrentSection();
    }
    
    startCurrentSection() {
        const section = this.sections[this.currentSection];
        // Starting tutorial section
        
        this.resetSectionState();
        this.sectionStartTime = Date.now();
        
        // Start spawning entities immediately (no dialog delay)
        this.startEntitySpawning();
    }
    
    resetSectionState() {
        this.sectionComplete = false;
        this.dialogShown = false;
        this.actionCompleted = false;
        this.entitiesSpawned = [];
        this.obstaclesCleared = 0;
        this.bribesCollected = 0;
        this.constituentsEncountered = 0;
        this.parachuteUsed = false;
        this.parachutesDeployed = 0;
        this.parachuteTimerCompleted = false;
        this.watchingParachuteTimer = false;
        this.trainActivated = false;
        this.trainActivations = 0;
        this.jumpsCompleted = 0;
        
        // Reset constituent respawn timer
        this.lastConstituentRespawn = 0;
        
        // Clear existing entities
        this.game.obstacles = [];
        this.game.constituents = [];
        this.game.bribes = [];
    }
    
    showDialog(title, message) {
        const titleElement = this.dialogElement.querySelector('.tutorial-title');
        const progressElement = this.dialogElement.querySelector('.tutorial-progress');
        const messageElement = this.dialogElement.querySelector('.tutorial-message');
        
        titleElement.textContent = title;
        progressElement.textContent = `Step ${this.currentSection + 1} of ${this.sections.length}`;
        messageElement.textContent = message;
        
        this.dialogElement.classList.remove('hidden');
        this.showingDialog = true;
        
        // Pause game while showing dialog
        if (this.game.gameState === 'tutorial') {
            // Don't change to paused, just stop updates temporarily
        }
    }
    
    hideDialog() {
        this.dialogElement.classList.add('hidden');
        this.showingDialog = false;
        this.dialogShown = true;
        
        // Start spawning entities for this section
        this.startEntitySpawning();
    }
    
    startEntitySpawning() {
        const section = this.sections[this.currentSection];
        
        // For continuous spawning sections, don't spawn initial entities
        // Let the continuous spawning logic handle it
        if (section.spawnContinuous) {
            // Set up initial spawn timing
            this.lastSpawnTime = Date.now();
            return;
        }
        
        // For non-continuous sections, spawn all entities from the array
        section.entities.forEach((entityConfig) => {
            setTimeout(() => {
                this.spawnTutorialEntity(entityConfig);
            }, entityConfig.delay);
        });
    }
    
    spawnTutorialEntity(config) {
        const groundY = this.game.canvas.height * GAME_CONFIG.groundLevel;
        
        switch (config.type) {
            case 'low_obstacle':
                const { variant: lowVariant, skinConfig: lowSkinConfig } = this.selectObstacleVariant('low');
                const lowObstacle = createObstacleWithVariant('low', this.game.canvas, groundY, GAME_CONFIG.obstacleSpeed, lowVariant, lowSkinConfig);
                this.applySkinToObstacle(lowObstacle);
                this.game.obstacles.push(lowObstacle);
                this.entitiesSpawned.push({ type: 'obstacle', entity: lowObstacle });
                break;
                
            case 'tall_obstacle':
                const { variant: tallVariant, skinConfig: tallSkinConfig } = this.selectObstacleVariant('tall');
                const tallObstacle = createObstacleWithVariant('tall', this.game.canvas, groundY, GAME_CONFIG.obstacleSpeed, tallVariant, tallSkinConfig);
                this.applySkinToObstacle(tallObstacle);
                this.game.obstacles.push(tallObstacle);
                this.entitiesSpawned.push({ type: 'obstacle', entity: tallObstacle });
                break;
                
            case 'bribe':
                const bribe = new Bribe(this.game.canvas);
                const heightMap = {
                    'low': 0.65,
                    'mid': 0.55,
                    'high': 0.45
                };
                bribe.yPercent = heightMap[config.height] || 0.65;
                bribe.y = this.game.scaleManager.toPixelsY(bribe.yPercent);
                bribe.setSpeed(GAME_CONFIG.obstacleSpeed);
                this.game.bribes.push(bribe);
                this.entitiesSpawned.push({ type: 'bribe', entity: bribe });
                break;
                
            case 'constituent':
                const constituent = new Constituent(this.game.canvas);
                constituent.setPosition(groundY);
                constituent.setSpeed(GAME_CONFIG.obstacleSpeed * 0.8);
                this.game.constituents.push(constituent);
                this.entitiesSpawned.push({ type: 'constituent', entity: constituent });
                break;
                
            case 'gerrymander_express':
                const gerrymanderExpress = new GerrymanderExpress(this.game.canvas, this.game.assets);
                gerrymanderExpress.setPosition(groundY);
                gerrymanderExpress.setSpeed(GAME_CONFIG.obstacleSpeed);
                this.game.gerrymanderExpresses.push(gerrymanderExpress);
                this.entitiesSpawned.push({ type: 'gerrymander_express', entity: gerrymanderExpress });
                break;
        }
    }
    
    update() {
        if (!this.isActive || this.showingDialog) return;
        
        const section = this.sections[this.currentSection];
        const now = Date.now();
        
        // Handle continuous spawning sections
        if (section.spawnContinuous) {
            const currentEntities = this.getCurrentSectionEntities();
            
            // For constituent sections, use more aggressive spawning
            if (section.entities[0]?.type === 'constituent') {
                const spawnDelay = section.spawnDelay;
                
                // Spawn if no constituents on screen and enough time has passed
                if (currentEntities.length === 0 && (now - this.lastSpawnTime) > spawnDelay) {
                    this.spawnTutorialEntity({ type: 'constituent' });
                    this.lastSpawnTime = now;
                }
            } else {
                // Only spawn if no entities on screen and enough time has passed
                if (currentEntities.length === 0 && (now - this.lastSpawnTime) > section.spawnDelay) {
                    this.spawnTutorialEntity(section.entities[0]); // Spawn the first (and only) entity type
                    this.lastSpawnTime = now;
                }
            }
            
            // Check completion based on section type
            if (section.waitForAction === 'clear_obstacles' && this.obstaclesCleared >= this.entitiesNeeded) {
                this.completeSection();
            } else if (section.waitForAction === 'collect_bribes' && this.bribesCollected >= this.entitiesNeeded) {
                this.completeSection();
            } else if (section.waitForAction === 'encounter_constituent' && this.constituentsEncountered >= this.entitiesNeeded) {
                this.completeSection();
            } else if (section.waitForAction === 'stay_airborne') {
                // Monitor existing parachute timer for continuous spawning section
                if (this.game.player.hasParachute && this.game.player.parachuteTimeLeft > 0) {
                    // Start watching when parachute is active
                    this.watchingParachuteTimer = true;
                } else if (this.watchingParachuteTimer && !this.game.player.hasParachute && !this.game.player.isJumping) {
                    // Parachute disappeared and player is on ground - timer completed successfully!
                    this.parachuteTimerCompleted = true;
                    this.completeSection();
                }
            }
        } else {
            // Check for section completion based on waitForAction
            switch (section.waitForAction) {
                case 'jump':
                    if (this.game.player.isJumping) {
                        this.completeSection();
                    }
                    break;
                    
                case 'jump_multiple':
                    // Handled by handleJumpCompleted method
                    break;
                    
                case 'clear_obstacles':
                    // For non-continuous sections, use original logic
                    let clearedCount = this.entitiesSpawned.filter(spawn => 
                        spawn.type === 'obstacle' && spawn.entity.isOffScreen()
                    ).length;
                    if (clearedCount >= section.entities.filter(e => e.type.includes('obstacle')).length) {
                        this.completeSection();
                    }
                    break;
                    
                case 'collect_bribes':
                    // This will be tracked in the collision handler for non-continuous sections
                    const expectedBribes = section.entities.filter(e => e.type === 'bribe').length;
                    if (this.bribesCollected >= expectedBribes) {
                        this.completeSection();
                    }
                    break;
                    
                case 'encounter_constituent':
                    // Stage 5 only needs 1 constituent - but respawn if needed
                    if (this.constituentsEncountered >= 1) {
                        this.completeSection();
                    } else {
                        // Check if constituents are getting close to being missed
                        const constituentsNearMiss = this.game.constituents.filter(c => 
                            c.xPercent < 0.2 && !c.isBeingStomped // Less than 20% across screen and not stomped
                        );
                        
                        // If no constituents on screen, spawn immediately
                        if (this.game.constituents.length === 0) {
                            if (!this.lastConstituentRespawn || (now - this.lastConstituentRespawn) > 2000) {
                                this.spawnTutorialEntity({ type: 'constituent' });
                                this.lastConstituentRespawn = now;
                            }
                        }
                        // If constituents are about to be missed, prepare a backup
                        else if (constituentsNearMiss.length > 0) {
                            if (!this.lastConstituentRespawn || (now - this.lastConstituentRespawn) > 4000) {
                                setTimeout(() => {
                                    if (this.game.constituents.length === 0 && this.constituentsEncountered < 1) {
                                        this.spawnTutorialEntity({ type: 'constituent' });
                                    }
                                }, 2000);
                                this.lastConstituentRespawn = now;
                            }
                        }
                    }
                    break;
                    
                case 'use_parachute':
                    if (this.parachuteUsed) {
                        this.completeSection();
                    }
                    break;
                    
                case 'stay_airborne':
                    // Monitor existing parachute timer
                    if (this.game.player.hasParachute && this.game.player.parachuteTimeLeft > 0) {
                        // Start watching when parachute is active
                        this.watchingParachuteTimer = true;
                    } else if (this.watchingParachuteTimer && !this.game.player.hasParachute && !this.game.player.isJumping) {
                        // Parachute disappeared and player is on ground - timer completed successfully!
                        this.parachuteTimerCompleted = true;
                        this.completeSection();
                    }
                    break;
                    
                case 'activate_train':
                    // Handle gerrymander express cycle (constituent → ticket token → train)
                    if (section.id === 'gerrymander_express') {
                        // Check if ticket token went off screen (missed)
                        const ticketTokenMissed = this.entitiesSpawned.some(spawn =>
                            spawn.type === 'gerrymander_express' && spawn.entity.isOffScreen()
                        );
                        
                        if (ticketTokenMissed) {
                            // Remove missed ticket token and restart cycle
                            this.game.gerrymanderExpresses = [];
                            this.entitiesSpawned = this.entitiesSpawned.filter(spawn => spawn.type !== 'gerrymander_express');
                            this.gerrymanderCycleStep = 0; // Reset to constituent step
                            
                            // Spawn new constituent to restart cycle
                            setTimeout(() => {
                                this.spawnTutorialEntity({ type: 'constituent' });
                            }, 1000);
                        }
                        
                        // Also check if constituent is about to be missed and no parachute is active
                        const constituentsNearMiss = this.game.constituents.filter(c => 
                            c.xPercent < 0.3 && !c.isBeingStomped
                        );
                        
                        if (constituentsNearMiss.length > 0 && !this.game.player.hasParachute) {
                            if (!this.lastConstituentRespawn || (now - this.lastConstituentRespawn) > 4000) {
                                setTimeout(() => {
                                    if (this.game.constituents.length === 0 && !this.trainActivated) {
                                        this.spawnTutorialEntity({ type: 'constituent' });
                                    }
                                }, 3000);
                                this.lastConstituentRespawn = now;
                            }
                        }
                    }
                    
                    if (this.trainActivated) {
                        this.completeSection();
                    }
                    break;
            }
        }
        
        // Update tutorial crash overlay fade effect
        if (this.game.tutorialCrashOverlay > 0) {
            this.game.tutorialCrashOverlay -= this.game.tutorialCrashFadeSpeed;
            if (this.game.tutorialCrashOverlay < 0) {
                this.game.tutorialCrashOverlay = 0;
            }
        }
    }
    
    handleTutorialCrash() {
        // Trigger red overlay effect
        this.game.tutorialCrashOverlay = 1.0; // Full red overlay
        
        // If regular spawning is enabled (stage 7), just reset player position without clearing entities
        if (this.regularSpawningEnabled) {
            // Just reset player position and continue - don't clear entities or reset anything
            setTimeout(() => {
                this.game.player.reset(this.game.canvas.height * GAME_CONFIG.groundLevel);
            }, 300);
        } else {
            // Normal tutorial crash handling for earlier stages
            setTimeout(() => {
                // Reset player but preserve progress counters
                this.game.player.reset(this.game.canvas.height * GAME_CONFIG.groundLevel);
                
                // Clear existing entities but DON'T reset counters
                this.game.obstacles = [];
                this.game.constituents = [];
                this.game.bribes = [];
                
                // Reset spawn timing but keep progress
                this.lastSpawnTime = Date.now();
                
                // Continue from where we left off (don't call startCurrentSection which resets progress)
            }, 500);
        }
    }
    
    // Get current entities on screen for this section
    getCurrentSectionEntities() {
        const section = this.sections[this.currentSection];
        const sectionEntityType = section.entities[0]?.type;
        
        if (sectionEntityType === 'low_obstacle' || sectionEntityType === 'tall_obstacle') {
            return this.game.obstacles;
        } else if (sectionEntityType === 'bribe') {
            return this.game.bribes;
        } else if (sectionEntityType === 'constituent') {
            return this.game.constituents;
        }
        
        return [];
    }
    
    handleObstacleCleared() {
        this.obstaclesCleared++;
    }
    
    handleBribeCollected() {
        this.bribesCollected++;
        // Completion is handled in the main update method for continuous sections
        // Don't complete here to avoid conflicts with continuous spawning logic
    }
    
    handleConstituentEncountered() {
        this.constituentsEncountered++;
        // Completion is handled in the main update method for continuous sections
        // Don't complete here to avoid conflicts with continuous spawning logic
    }
    
    handleParachuteUsed() {
        this.parachuteUsed = true;
    }
    
    handleParachuteDeployed() {
        this.parachutesDeployed++;
        const section = this.sections[this.currentSection];
        
        // Stage 7: Immediately spawn ticket token when parachute is deployed
        if (section.id === 'gerrymander_express') {
            this.spawnTutorialEntity({ type: 'gerrymander_express' });
        }
        
        if (section.waitForAction === 'deploy_parachutes' && this.parachutesDeployed >= this.entitiesNeeded) {
            this.completeSection();
        }
    }
    
    // Handle when player lands without collecting ticket token in stage 7
    handleParachuteLanded() {
        const section = this.sections[this.currentSection];
        
        if (section.id === 'gerrymander_express' && !this.trainActivated) {
            // Clear any remaining ticket tokens
            this.game.gerrymanderExpresses = [];
            this.entitiesSpawned = this.entitiesSpawned.filter(spawn => spawn.type !== 'gerrymander_express');
            
            // Spawn new constituent to restart cycle
            setTimeout(() => {
                this.spawnTutorialEntity({ type: 'constituent' });
            }, 1000);
        }
    }
    
    handleTrainActivated() {
        this.trainActivations++;
        const section = this.sections[this.currentSection];
        
        // Check if we need multiple train activations for this section
        if (section.id === 'gerrymander_express') {
            if (this.trainActivations >= 3) {
                this.trainActivated = true; // Mark as completed after 3 activations
            }
        } else {
            this.trainActivated = true; // Single activation for other sections
        }
        
        // Enable regular spawning on first activation if this section allows it
        if (section.enableRegularSpawning && this.trainActivations === 1) {
            // Switch to playing mode spawning behavior while keeping tutorial UI
            this.enableRegularGameplaySpawning();
        }
    }
    getCurrentMessage() {
        if (!this.isActive) return null;
        
        const section = this.sections[this.currentSection];
        let instruction = section.baseInstruction || section.instruction;
        
        // Add progress tracking for different section types
        if (section.waitForAction === 'jump_multiple') {
            instruction += ` (${this.jumpsCompleted}/${this.entitiesNeeded})`;
        } else if (section.waitForAction === 'stay_airborne') {
            if (this.game.player.hasParachute && this.game.player.parachuteTimeLeft > 0) {
                const timeElapsed = Math.max(0, 3 - this.game.player.parachuteTimeLeft);
                instruction += ` (${timeElapsed.toFixed(1)}/3.0 seconds)`;
            } else {
                instruction += ` (Get parachute and stay airborne!)`;
            }
        } else if (section.waitForAction === 'activate_train') {
            instruction += ` (${this.trainActivations}/3 train modes)`;
        } else if (section.waitForAction === 'encounter_constituent') {
            // Stage 5 only needs 1 constituent
            instruction += ` (${this.constituentsEncountered}/1)`;
        } else if (section.spawnContinuous) {
            if (section.waitForAction === 'clear_obstacles') {
                instruction += ` (${this.obstaclesCleared}/${this.entitiesNeeded})`;
            } else if (section.waitForAction === 'collect_bribes') {
                instruction += ` (${this.bribesCollected}/${this.entitiesNeeded})`;
            }
        }
        
        return {
            title: section.title,
            instruction: instruction,
            progress: `Step ${this.currentSection + 1} of ${this.sections.length}`
        };
    }
    
    enableRegularGameplaySpawning() {
        // Enable regular spawning flag
        this.regularSpawningEnabled = true;
        
        // Set spawning counters to trigger spawning on next few frames
        this.game.gameFrame = this.game.config.obstacleSpawnRate - 1; // Will spawn next frame
        this.game.tallSpawnCounter = this.game.nextTallSpawn - 1; // Will spawn soon
        this.game.constituentSpawnCounter = this.game.config.constituentSpawnRate - 1; // Will spawn next frame
        this.game.bribeSpawnCounter = this.game.config.bribeSpawnRate - 1; // Will spawn next frame
        this.game.bribePatternCounter = 0;
        this.game.nextBribePattern = 50; // Spawn pattern soon
        this.game.lastSpawnDistance = this.game.minSpawnGap; // Allow immediate spawning
        
        // Regular spawning enabled for train mode demonstration - all entities ready
    }
    
    completeSection() {
        if (this.sectionComplete) return;
        
        this.sectionComplete = true;
        
        // Auto-advance to next section without any dialog
        setTimeout(() => {
            this.nextSection();
        }, 1000);
    }
    
    nextSection() {
        this.currentSection++;
        
        if (this.currentSection >= this.sections.length) {
            this.completeTutorial();
        } else {
            this.startCurrentSection();
        }
    }
    
    completeTutorial() {
        // Tutorial completed
        this.isActive = false;
        this.tutorialComplete = true;
        this.endTutorial();
    }
    
    skipTutorial() {
        // Tutorial skipped
        this.isActive = false;
        this.hideDialog();
        this.endTutorial();
    }
    
    endTutorial() {
        // Clean up dialog element
        if (this.dialogElement) {
            this.dialogElement.remove();
            this.dialogElement = null;
        }
        
        // Return to main menu
        this.game.showStartScreen();
    }
    
    handleJumpCompleted() {
        this.jumpsCompleted++;
        const section = this.sections[this.currentSection];
        
        if (section.waitForAction === 'jump_multiple' && this.jumpsCompleted >= this.entitiesNeeded) {
            this.completeSection();
        }
    }
    
    // Check if parachute should be disabled for current section
    isParachuteDisabled() {
        if (!this.isActive) return false;
        
        const section = this.sections[this.currentSection];
        return section.disableParachute || false;
    }
    
    // Check if we should show the pause button arrow (stage 8)
    shouldShowPauseArrow() {
        if (!this.isActive) return false;
        
        const section = this.sections[this.currentSection];
        return section.id === 'completion';
    }
    
    // Navigation methods for arrow buttons
    goToPreviousSection() {
        if (this.currentSection > 0) {
            this.currentSection--;
            this.startCurrentSection();
        }
    }
    
    goToNextSection() {
        if (this.currentSection < this.sections.length - 1) {
            this.currentSection++;
            this.startCurrentSection();
        }
    }
    
    // Handle click on tutorial navigation arrows
    handleTutorialClick(x, y) {
        const textX = this.game.canvas.width / 2;
        const textY = this.game.canvas.height * 0.45;
        const backgroundHeight = this.getBackgroundHeight();
        const backgroundY = textY - backgroundHeight/2;
        const padding = 15;
        const progressY = backgroundY + padding + 8;
        
        // Check if click is on left arrow (previous) - in progress row
        const leftArrowX = textX - 80;
        if (x >= leftArrowX - 20 && x <= leftArrowX + 20 && y >= progressY - 15 && y <= progressY + 15) {
            if (this.currentSection > 0) {
                this.goToPreviousSection();
                return true;
            }
        }
        
        // Check if click is on right arrow (next) - in progress row
        const rightArrowX = textX + 80;
        if (x >= rightArrowX - 20 && x <= rightArrowX + 20 && y >= progressY - 15 && y <= progressY + 15) {
            if (this.currentSection < this.sections.length - 1) {
                this.goToNextSection();
                return true;
            }
        }
        
        return false;
    }
    
    // Helper method to calculate background height for click detection
    getBackgroundHeight() {
        const section = this.sections[this.currentSection];
        const instruction = section.baseInstruction || section.instruction;
        const words = instruction.split(' ');
        const lines = Math.ceil(words.length / 8); // Rough estimate
        return 15 * 2 + 20 + 20 + (lines * 18);
    }
    
    // Select obstacle variant based on spawn weights (updated to use dynamic political words)
    selectObstacleVariant(type) {
        // For tall obstacles, use dynamic political words if available (same as main game)
        if (type === 'tall' && this.game.politicalWords && this.game.politicalWords.length > 0) {
            const randomWord = this.game.getRandomPoliticalWord();
            // Using dynamic political word for tutorial tall obstacle
            
            // Create dynamic skin configuration for this word
            const dynamicSkinConfig = {
                name: `Political: ${randomWord}`,
                imagePath: null,
                color: "#ffffff",
                animationType: "none",
                renderType: "pillar",
                textConfig: {
                    text: randomWord,
                    textColor: "#000000",
                    fontSize: "auto",
                    rotation: -90,
                    fontFamily: "Tiny5"
                }
            };
            
            return { variant: 'political', skinConfig: dynamicSkinConfig };
        }
        
        // Use obstacle skin config if available (for low obstacles or fallback)
        const obstacleSkinConfig = this.game.obstacleSkinConfig;
        if (!obstacleSkinConfig || !obstacleSkinConfig.spawnWeights || !obstacleSkinConfig.spawnWeights[type]) {
            // Fallback to default
            return { variant: 'default', skinConfig: null };
        }
        
        const weights = obstacleSkinConfig.spawnWeights[type];
        const variants = Object.keys(weights);
        
        // Calculate total weight
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        
        // Select random variant based on weights
        let random = Math.random() * totalWeight;
        for (const variant of variants) {
            random -= weights[variant];
            if (random <= 0) {
                const skinConfig = obstacleSkinConfig.skins[type][variant];
                return { variant, skinConfig };
            }
        }
        
        // Fallback to first variant
        const fallbackVariant = variants[0];
        const skinConfig = obstacleSkinConfig.skins[type][fallbackVariant];
        return { variant: fallbackVariant, skinConfig };
    }
    
    // Apply skin image to obstacle if available (copied from GameLoop)
    applySkinToObstacle(obstacle) {
        if (!this.game.loadedObstacleSkins || !obstacle.variant || obstacle.variant === 'default') {
            return; // No skin needed for default obstacles
        }
        
        // Find matching skin in loaded assets
        const skinName = `${obstacle.type}_${obstacle.variant}`;
        const loadedSkin = this.game.loadedObstacleSkins.find(skin => skin.name === skinName);
        
        if (loadedSkin && loadedSkin.image && loadedSkin.loaded) {
            obstacle.setSkinImage(loadedSkin.image);
        }
    }
    
    cleanup() {
        if (this.dialogElement) {
            this.dialogElement.remove();
            this.dialogElement = null;
        }
        this.isActive = false;
    }
}
