// Game Loop and Update Methods
import { Obstacle, createObstacle, createObstacleWithVariant } from './entities/Obstacle.js';
import { Constituent } from './entities/Constituent.js';
import { Bribe, BribePatternFactory } from './entities/Bribe.js';
import { GerrymanderExpress } from './entities/GerrymanderExpress.js';
import { GameLogic } from './GameLogic.js';
import { PLAYER_CONFIG } from './constants/GameConfig.js';

export class GameLoop {
    static update(game) {
        // Delta time is already calculated in Game.gameLoop()
        
        if (game.gameState === 'playing') {
            game.gameFrame++;
            
            // Update speed targets based on train mode
            if (game.player.isTrainMode) {
                game.targetGameSpeed = game.config.baseGameSpeed * game.trainSpeedMultiplier;
                game.targetObstacleSpeed = game.config.baseObstacleSpeed * game.trainSpeedMultiplier;
            } else {
                // When not in train mode, return to base speeds (not current speeds which may be higher)
                game.targetGameSpeed = game.config.baseGameSpeed;
                game.targetObstacleSpeed = game.config.baseObstacleSpeed;
            }
            
            // Lerp current speed to target for smooth transitions
            game.config.gameSpeed += (game.targetGameSpeed - game.config.gameSpeed) * game.speedLerpRate;
            game.config.obstacleSpeed += (game.targetObstacleSpeed - game.config.obstacleSpeed) * game.speedLerpRate;
            
            // Track distance moved since last spawn
            game.lastSpawnDistance += game.config.obstacleSpeed;
            
            game.player.update(game.config, game.deltaTime, game);
            this.spawnObstacle(game);
            this.spawnConstituent(game);
            this.spawnBribe(game);
            this.spawnGerrymanderExpress(game);
            this.updateObstacles(game);
            this.updateConstituents(game);
            this.updateBribes(game);
            this.updateGerrymanderExpresses(game);
            this.updateBackground(game);
            this.updateTrailSegments(game);
            this.updatePopups(game);
            
            // Update parachute tap overlay
            game.parachuteTapOverlay.update(game.deltaTime, game);
            
            // Continuous scoring with train mode multiplier
            if (game.gameFrame % 10 === 0) {
                const basePoints = 1;
                const multiplier = game.player.isTrainMode ? 2 : 1;
                game.score += basePoints * multiplier;
                GameLogic.updateScore(game);
            }
        } else if (game.gameState === 'crashing') {
            // Update ragdoll physics during crash
            if (game.ragdoll) {
                game.ragdoll.update();
            }
            
            // Update background (keeps scrolling during crash)
            this.updateBackground(game);
            this.updatePopups(game);
            
            // Update screen shake
            if (game.screenShake > 0) {
                game.screenShake *= 0.9; // Decay shake
                if (game.screenShake < 0.5) game.screenShake = 0;
            }
            
            // Check if crash animation is complete
            const now = Date.now();
            if (now - game.crashTimer > game.crashDuration) {
                GameLogic.gameOver(game);
            }
        } else if (game.gameState === 'gameOver') {
            // Keep background moving even after game over
            this.updateBackground(game);
            
            // Continue ragdoll physics in game over screen
            if (game.ragdoll) {
                game.ragdoll.update();
            }
            
            // Continue updating popups
            this.updatePopups(game);
        } else if (game.gameState === 'tutorial') {
            // Tutorial mode - similar to playing mode when regular spawning enabled
            if (game.tutorialManager && game.tutorialManager.regularSpawningEnabled) {
                game.gameFrame++;
                
                // Update speed targets based on train mode (same as playing mode)
                if (game.player.isTrainMode) {
                    game.targetGameSpeed = game.config.baseGameSpeed * game.trainSpeedMultiplier;
                    game.targetObstacleSpeed = game.config.baseObstacleSpeed * game.trainSpeedMultiplier;
                } else {
                    game.targetGameSpeed = game.config.baseGameSpeed;
                    game.targetObstacleSpeed = game.config.baseObstacleSpeed;
                }
                
                // Lerp current speed to target for smooth transitions
                game.config.gameSpeed += (game.targetGameSpeed - game.config.gameSpeed) * game.speedLerpRate;
                game.config.obstacleSpeed += (game.targetObstacleSpeed - game.config.obstacleSpeed) * game.speedLerpRate;
                
                // Track distance moved since last spawn
                game.lastSpawnDistance += game.config.obstacleSpeed;
            }
            
            game.player.update(game.config, game.deltaTime, game);
            
            // Update tutorial manager
            if (game.tutorialManager) {
                game.tutorialManager.update();
            }
            
            // Update entities (allow normal spawning when enabled by tutorial)
            if (game.tutorialManager && game.tutorialManager.regularSpawningEnabled) {
                this.spawnObstacle(game);
                this.spawnConstituent(game);
                this.spawnBribe(game);
                this.spawnGerrymanderExpress(game);
            }
            this.updateObstacles(game);
            this.updateConstituents(game);
            this.updateBribes(game);
            this.updateGerrymanderExpresses(game);
            this.updateBackground(game);
            this.updateTrailSegments(game);
            this.updatePopups(game);
            
            // Update parachute tap overlay
            game.parachuteTapOverlay.update(game.deltaTime, game);
            
            // Check for tutorial-specific collisions and events
            this.handleTutorialCollisions(game);
        } else if (game.gameState === 'paused') {
            // When paused, only render the current frame without updates
        }
    }
    
    static canSpawnEntity(game) {
        // Check if enough distance has passed since last spawn
        return game.lastSpawnDistance >= game.minSpawnGap;
    }
    
    static spawnObstacle(game) {
        // Don't spawn in tutorial mode unless regular spawning is enabled
        if (game.gameState === 'tutorial' && !game.tutorialManager?.regularSpawningEnabled) return;
        
        // Check unified spawn spacing first
        if (!this.canSpawnEntity(game)) return;
        
        const lastObstacle = game.obstacles[game.obstacles.length - 1];
        const canSpawn = !lastObstacle || 
            (game.canvas.width + 50 - (lastObstacle.x + lastObstacle.width)) >= game.config.minObstacleGapPx;

        // Low obstacle spawn (fixed interval)
        if (canSpawn && game.gameFrame % game.config.obstacleSpawnRate === 0) {
            const { variant, skinConfig } = this.selectObstacleVariant('low', game);
            console.log('Spawning low obstacle - variant:', variant, 'skinConfig:', !!skinConfig);
            const obstacle = createObstacleWithVariant('low', game.canvas, game.player.groundY, game.config.obstacleSpeed, variant, skinConfig);
            
            // Set skin image if available
            this.applySkinToObstacle(obstacle, game);
            
            game.obstacles.push(obstacle);
            game.lastSpawnDistance = 0;  // Reset spawn distance
        }

        // Tall obstacle spawn (random interval)
        game.tallSpawnCounter++;
        if (canSpawn && game.tallSpawnCounter >= game.nextTallSpawn && this.canSpawnEntity(game)) {
            const { variant, skinConfig } = this.selectObstacleVariant('tall', game);
            console.log('Spawning tall obstacle - variant:', variant, 'skinConfig:', !!skinConfig, 'obstacleSkinConfig available:', !!game.obstacleSkinConfig);
            const obstacle = createObstacleWithVariant('tall', game.canvas, game.player.groundY, game.config.obstacleSpeed, variant, skinConfig);
            
            // Set skin image if available
            this.applySkinToObstacle(obstacle, game);
            console.log('Tall obstacle created - constructor:', obstacle.constructor.name, 'variant:', obstacle.variant, 'skinImage:', !!obstacle.skinImage);
            
            game.obstacles.push(obstacle);
            game.tallSpawnCounter = 0;
            game.nextTallSpawn = GameLogic.randomInt(game.config.tallSpawnMin, game.config.tallSpawnMax);
            game.lastSpawnDistance = 0;  // Reset spawn distance
        }
    }
    
    static updateObstacles(game) {
        for (let i = game.obstacles.length - 1; i >= 0; i--) {
            const obstacle = game.obstacles[i];
            obstacle.update();
            
            // Remove obstacles that have gone off screen
            if (obstacle.x + obstacle.width < 0) {
                game.obstacles.splice(i, 1);
                
                // Only add points and effects in normal gameplay, not tutorial
                if (game.gameState === 'playing') {
                    if (obstacle.type === 'tall') {
                        const basePoints = game.config.tallPoints;
                        const multiplier = game.player.isTrainMode ? 2 : 1;
                        const points = basePoints * multiplier;
                        game.score += points;
                        GameLogic.updateScore(game);
                        const displayText = game.player.isTrainMode ? `+${points} (2X!)` : `+${points}`;
                        GameLogic.addPopup(game, displayText,
                                      game.player.x + game.player.width/2 + 50, game.player.y - 20);
                        game.soundManager.playPointTall();
                    } else {
                        const basePoints = game.config.lowPoints;
                        const multiplier = game.player.isTrainMode ? 2 : 1;
                        const points = basePoints * multiplier;
                        game.score += points;
                        GameLogic.updateScore(game);
                        const displayText = game.player.isTrainMode ? `+${points} (2X!)` : `+${points}`;
                        GameLogic.addPopup(game, displayText,
                                      game.player.x + game.player.width/2 + 50, game.player.y - 20);
                        game.soundManager.playPointLow();
                    }
                } else if (game.gameState === 'tutorial') {
                    // In tutorial mode, notify tutorial manager
                    if (game.tutorialManager) {
                        game.tutorialManager.handleObstacleCleared();
                    }
                }
                continue;
            }

            // Collision detection - Only in playing mode (tutorial handles separately)
            if (game.gameState === 'playing' && this.checkCollision(game.player, obstacle)) {
                if (game.player.isTrainMode) {
                    // Train mode - player is invincible, add visual effect and points
                    const basePoints = obstacle.type === 'tall' ? game.config.tallPoints : game.config.lowPoints;
                    const points = basePoints * 2; // Double points for plowing through
                    game.score += points;
                    GameLogic.updateScore(game);
                    // No popup message for train hits
                    
                    // Ragdoll the obstacle instead of just removing it
                    obstacle.triggerRagdoll(game.player.x + game.player.width/2, game.player.y + game.player.height/2);
                    continue;
                } else if (game.player.postTrainInvincible) {
                    // Post-train invincibility - just bypass obstacles, no ragdoll
                    continue; // Skip this collision entirely
                } else {
                    // Normal collision - trigger crash
                    GameLogic.triggerCrash(game, obstacle);
                    return;
                }
            }
        }
    }
    
    static spawnConstituent(game) {
        // Don't spawn in tutorial mode unless regular spawning is enabled
        if (game.gameState === 'tutorial' && !game.tutorialManager?.regularSpawningEnabled) return;
        
        // Check unified spawn spacing first
        if (!this.canSpawnEntity(game)) return;
        
        // Spawn constituents periodically
        game.constituentSpawnCounter++;
        if (game.constituentSpawnCounter >= game.config.constituentSpawnRate) {
            const constituent = new Constituent(game.canvas);
            constituent.setPosition(game.player.groundY);
            constituent.setSpeed(game.config.obstacleSpeed);
            game.constituents.push(constituent);
            game.constituentSpawnCounter = 0;
            game.lastSpawnDistance = 0;  // Reset spawn distance
        }
    }
    
    static updateConstituents(game) {
        for (let i = game.constituents.length - 1; i >= 0; i--) {
            const constituent = game.constituents[i];
            
            // Check if animating
            if (constituent.isBeingStomped) {
                // Update animation
                constituent.updateStompAnimation(game.deltaTime);
                
                // Remove when animation complete and off-screen
                if (constituent.isOffScreen()) {
                    game.constituents.splice(i, 1);
                }
                continue;
            }
            
            // Normal movement
            constituent.update(game.deltaTime);
            
            // Remove if off screen
            if (constituent.isOffScreen()) {
                game.constituents.splice(i, 1);
                continue;
            }
            
            // Check for train collision first (if player is in train mode)
            if (game.player.isTrainMode && this.checkCollision(game.player, constituent) && !constituent.isBeingStomped) {
                // Train collision - ragdoll the constituent
                constituent.triggerTrainRagdoll();
                
                // Add bonus points for train collision
                const bonusPoints = 15;
                game.score += bonusPoints;
                GameLogic.updateScore(game);
                
                // No popup message for train hits
                
                // Play impact sound
                game.soundManager.playJump();
                continue;
            }
            
            // Check if player is stomping on constituent (normal behavior)
            const isStomping = constituent.checkStomp(game.player);
            if (isStomping && !constituent.isBeingStomped) {
                // Trigger stomp animation (this will handle the squash animation automatically)
                constituent.triggerStomp();
                
                // Override the constituent's launch physics for more dramatic effect
                // These will be applied after the squash phase (at 220ms)
                constituent.launchVelocityX = -8 - Math.random() * 4;  // Stronger backward launch
                constituent.launchVelocityY = -25 - Math.random() * 10; // Much stronger upward launch
                constituent.rotationSpeed = (Math.random() - 0.5) * 0.6;  // More spinning
                
                // Reduce score by 25 points (and track for tutorial)
                const penalty = 25;
                game.score = Math.max(0, game.score - penalty);  // Prevent negative scores
                GameLogic.updateScore(game);
                
                // Tutorial mode: increment constituent counter when penalty is applied
                if (game.gameState === 'tutorial' && game.tutorialManager) {
                    game.tutorialManager.handleConstituentEncountered();
                }
                
                // Play stomp sound (use jump sound for now)
                game.soundManager.playJump();
                
                // Launch player to consistent height using target height system
                game.player.launchToHeight(PLAYER_CONFIG.constituentLaunchTargetHeight, game);
                // Note: launchToHeight already sets isJumping and gives parachute (if not disabled)
                
                // Select a random parachute skin
                if (game.loadedParachuteSkins && game.loadedParachuteSkins.length > 0) {
                    game.currentParachuteSkin = game.loadedParachuteSkins[
                        Math.floor(Math.random() * game.loadedParachuteSkins.length)
                    ];
                }
                
                // Visual feedback - check if parachute was actually given
                const parachuteGiven = game.player.hasParachute && game.player.parachuteTimeLeft > 0;
                if (parachuteGiven) {
                    GameLogic.addPopup(game, "PARACHUTE!", game.canvas.width / 2, game.canvas.height * 0.9, {icon: '🪂', duration: 2550});
                    // Activate tap overlay when parachute is given
                    game.parachuteTapOverlay.activate(
                        game.player.x + game.player.width / 2,
                        game.player.y + game.player.height / 2
                    );
                } else {
                    GameLogic.addPopup(game, "SUPER JUMP!", game.canvas.width / 2, game.canvas.height * 0.9, {icon: '⬆️', duration: 2550});
                }
            }
        }
    }
    
    static spawnBribe(game) {
        // Don't spawn in tutorial mode unless regular spawning is enabled
        if (game.gameState === 'tutorial' && !game.tutorialManager?.regularSpawningEnabled) return;
        
        // Check for pattern spawning
        game.bribePatternCounter++;
        if (game.bribePatternCounter >= game.nextBribePattern) {
            // Use BribePatternFactory instead of manual pattern creation
            const patternType = BribePatternFactory.getRandomPattern();
            const bribes = BribePatternFactory.createPattern(
                patternType, 
                game.canvas, 
                game.player.groundY, 
                game.config.obstacleSpeed
            );
            game.bribes.push(...bribes);
            game.bribePatternCounter = 0;
            game.nextBribePattern = 200 + Math.random() * 300; // Much more spacing between patterns
            return;
        }
        
        // Regular single bribe spawning
        game.bribeSpawnCounter++;
        if (game.bribeSpawnCounter >= game.config.bribeSpawnRate) {
            // Check unified spawn spacing
            if (!this.canSpawnEntity(game)) return;
            
            // Use factory for single bribe as well
            const bribes = BribePatternFactory.createPattern(
                'single', 
                game.canvas, 
                game.player.groundY, 
                game.config.obstacleSpeed
            );
            game.bribes.push(...bribes);
            game.bribeSpawnCounter = 0;
            game.lastSpawnDistance = 0;  // Reset spawn distance
        }
    }
    
    static spawnGerrymanderExpress(game) {
        // Don't spawn in tutorial mode unless regular spawning is enabled
        if (game.gameState === 'tutorial' && !game.tutorialManager?.regularSpawningEnabled) return;
        
        // Only spawn when player has an active parachute AND not currently in train mode
        if (game.player.hasParachute && game.player.parachuteTimeLeft > 0 && !game.player.isTrainMode) {
            // New spawn limitations:
            // 1. Require at least 3 parachute activations
            if (game.parachuteActivationCount < 3) return;
            
            // 2. Check cooldown - prevent spawning for 15 seconds after last collection
            const currentTime = Date.now();
            if (currentTime - game.lastGerrymanderExpressTime < game.gerrymanderExpressCooldown) return;
            
            // 3. Spawn every 2 seconds when parachute is active, but with probability check
            if (game.gameFrame % 120 === 0) {
                // 4. Add spawn probability - only 40% chance to spawn
                if (Math.random() < 0.4) {
                    const gerrymanderExpress = new GerrymanderExpress(game.canvas, game.assets);
                    gerrymanderExpress.setPosition(game.player.groundY);
                    gerrymanderExpress.setSpeed(game.config.obstacleSpeed);
                    game.gerrymanderExpresses.push(gerrymanderExpress);
                }
            }
        }
        // No spawning when no parachute is active or train mode is active
    }
    
    static updateBribes(game) {
        for (let i = game.bribes.length - 1; i >= 0; i--) {
            const bribe = game.bribes[i];
            
            // Apply magnetic attraction if player is in train mode (BEFORE normal update)
            if (game.player.isTrainMode) {
                const playerCenterX = game.player.x + game.player.width / 2;
                const playerCenterY = game.player.y + game.player.height / 2;
                
                // Calculate distance
                const dx = playerCenterX - bribe.x;
                const dy = playerCenterY - bribe.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Magnetic range (40% of screen width for balanced attraction)
                const magneticRangePercent = 0.4; // 40% of screen width
                const magneticRange = game.canvas.width * magneticRangePercent;
                
                if (distance < magneticRange && distance > 5) {
                    // Use lerp approach like popup system
                    const magneticStrength = (magneticRange - distance) / magneticRange;
                    const lerpSpeed = magneticStrength * 0.2; // Stronger lerp when closer
                    
                    // Update both pixel and percentage coordinates for bribe
                    const newX = bribe.x + (playerCenterX - bribe.x) * lerpSpeed;
                    const newY = bribe.y + (playerCenterY - bribe.y) * lerpSpeed;
                    
                    // Set position using bribe's setPosition method if available
                    if (bribe.setPosition) {
                        bribe.setPosition(newX, newY);
                    } else {
                        bribe.x = newX;
                        bribe.y = newY;
                    }
                }
            }
            
            // Update bribe normally (after magnetic attraction)
            bribe.update();
            
            // Remove if off screen
            if (bribe.x + bribe.width < 0) {
                game.bribes.splice(i, 1);
                continue;
            }
            
            // Check collision with player - only in playing mode (tutorial handles separately)
            if (game.gameState === 'playing' && this.checkCollision(game.player, bribe)) {
                // Remove bribe
                game.bribes.splice(i, 1);
                
                // Add 5 votes to score with train mode multiplier
                const basePoints = 5;
                const multiplier = game.player.isTrainMode ? 2 : 1;
                const points = basePoints * multiplier;
                game.score += points;
                GameLogic.updateScore(game);
                
                // Visual feedback
                const displayText = game.player.isTrainMode ? `+${points} VOTES! (2X!)` : `+${points} VOTES!`;
                GameLogic.addPopup(game, displayText, bribe.x + 50, bribe.y, {icon: '💰'});
                
                // Play collect sound (use point sound for now)
                game.soundManager.playPointTall();
            }
        }
    }
    
    static updateGerrymanderExpresses(game) {
        for (let i = game.gerrymanderExpresses.length - 1; i >= 0; i--) {
            const gerrymanderExpress = game.gerrymanderExpresses[i];
            
            // Update gerrymander express
            gerrymanderExpress.update();
            
            // Remove if off screen
            if (gerrymanderExpress.isOffScreen()) {
                game.gerrymanderExpresses.splice(i, 1);
                continue;
            }
            
            // Check collision with player
            if (gerrymanderExpress.checkCollision(game.player)) {
                // Remove gerrymander express
                game.gerrymanderExpresses.splice(i, 1);
                gerrymanderExpress.collect();
                
                // Set cooldown timer to prevent spawning for 15 seconds (hidden from player)
                game.lastGerrymanderExpressTime = Date.now();
                
                // Activate train mode
                if (game.player.activateTrainMode()) {
                    // Clear all remaining gerrymander express pickups to prevent multiple collection
                    for (let j = game.gerrymanderExpresses.length - 1; j >= 0; j--) {
                        if (j !== i) { // Don't remove the one we just collected
                            game.gerrymanderExpresses.splice(j, 1);
                        }
                    }
                    
                    // Visual feedback
                    GameLogic.addPopup(game, "GERRYMANDER EXPRESS!",
                                      game.canvas.width / 2, game.canvas.height * 0.9, {icon: '🚂', duration: 2550});
                    
                    // Play train activation sound
                    game.soundManager.playEffect('choochoo');
                    
                    // Notify tutorial manager if in tutorial mode
                    if (game.gameState === 'tutorial' && game.tutorialManager) {
                        game.tutorialManager.handleTrainActivated();
                    }
                }
            }
        }
    }
    
    static updateBackground(game) {
        // Update all background layers
        if (game.backgroundLayers) {
            // Update buildings (furthest background)
            for (let building of game.backgroundLayers.buildings) {
                building.x -= building.speed;
                if (building.x + building.width < 0) {
                    building.x = game.canvas.width + Math.random() * 400;
                    building.y = game.canvas.height * (0.3 + Math.random() * 0.2);
                }
            }
            
            // Update tombstones (mid-ground)
            for (let tombstone of game.backgroundLayers.tombstones) {
                tombstone.x -= tombstone.speed;
                if (tombstone.x + tombstone.width < 0) {
                    tombstone.x = game.canvas.width + Math.random() * 300;
                    tombstone.y = game.canvas.height * (0.55 + Math.random() * 0.15);
                }
            }
            
            // Update fences (foreground) - maintain seamless connections
            for (let i = 0; i < game.backgroundLayers.fences.length; i++) {
                const fence = game.backgroundLayers.fences[i];
                fence.x -= fence.speed;
                if (fence.x + fence.width < 0) {
                    // Find the absolute rightmost position of all other fences
                    let rightmostX = game.canvas.width;
                    for (let j = 0; j < game.backgroundLayers.fences.length; j++) {
                        if (j !== i) { // Skip the current fence
                            const otherFence = game.backgroundLayers.fences[j];
                            const otherRightEdge = otherFence.x + otherFence.width;
                            if (otherRightEdge > rightmostX) {
                                rightmostX = otherRightEdge;
                            }
                        }
                    }
                    
                    // Position this fence to touch the rightmost edge exactly
                    fence.x = rightmostX;
                    // Align bottom with ground plane
                    fence.y = game.canvas.height * 0.8 - fence.height;
                }
            }
            
            // Update clouds
            for (let cloud of game.backgroundLayers.clouds) {
                cloud.x -= cloud.speed;
                if (cloud.x + cloud.width < 0) {
                    cloud.x = game.canvas.width + Math.random() * 200;
                    cloud.y = Math.random() * game.canvas.height * 0.3;
                }
            }
            
            // Update fog with variable opacity changes
            for (let fog of game.backgroundLayers.fog) {
                fog.x -= fog.speed;
                
                // Slowly vary the opacity for atmospheric effect
                fog.opacity += (Math.random() - 0.5) * 0.02;
                fog.opacity = Math.max(0.05, Math.min(0.4, fog.opacity));
                
                // Update the color string with new opacity
                fog.color = `rgba(200, 200, 220, ${fog.opacity})`;
                
                if (fog.x + fog.width < 0) {
                    fog.x = game.canvas.width + Math.random() * 200;
                    fog.y = game.canvas.height * (0.75 + Math.random() * 0.15);
                }
            }
        }
        
        // Keep compatibility with old system
        for (let element of game.backgroundElements) {
            element.x -= element.speed;
            
            // Reset position when off screen
            if (element.x + element.width < 0) {
                element.x = game.canvas.width + Math.random() * 200;
                element.y = Math.random() * game.canvas.height * 0.3;
            }
        }
    }
    
    static updatePopups(game) {
        const now = performance.now();
        for (let i = game.popups.length - 1; i >= 0; i--) {
            const p = game.popups[i];
            const t = now - p.start;
            const k = Math.min(t / p.life, 1);

            // Scale in at start
            if (k < 0.18) {
                const u = k / 0.18;
                p.scale = 0.6 + (1.1 - 0.6) * this.easeOutBack(u);
            } else {
                p.scale = 1.0;
            }

            // Detect if this is a power message (appears at tutorial message box location)
            const isPowerMessage = Math.abs(p.y - game.canvas.height * 0.9) < 10; // Within 10px of tutorial position

            if (isPowerMessage) {
                // Power message animation: hold position briefly, then slide right
                const holdTime = 0.4; // Hold for first 40% of life
                if (k < holdTime) {
                    // Hold position (no movement)
                } else {
                    // Slide to the right quickly
                    const slideProgress = (k - holdTime) / (1 - holdTime);
                    const slideSpeed = 8 + (slideProgress * 12); // Accelerating slide
                    p.x += slideSpeed;
                }
            } else {
                // Regular message animation: float toward top-center
                const targetX = game.canvas.width / 2;
                const targetY = game.canvas.height * 0.15;
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
            }

            // Fade out quicker
            if (k < 0.35) {
                p.alpha = 1;
            } else {
                p.alpha = Math.max(0, 1 - (k - 0.35) / 0.35);
            }

            if (k >= 1) game.popups.splice(i, 1);
        }
    }
    
    static checkCollision(player, object) {
        return player.x < object.x + object.width &&
               player.x + player.width > object.x &&
               player.y < object.y + object.height &&
               player.y + player.height > object.y;
    }
    
    static handleTutorialCollisions(game) {
        // Handle obstacle collisions in tutorial mode
        for (let i = game.obstacles.length - 1; i >= 0; i--) {
            const obstacle = game.obstacles[i];
            
            // Check for collision
            if (this.checkCollision(game.player, obstacle)) {
                if (game.player.isTrainMode) {
                    // Train mode - player is invincible, add visual effect and points
                    const basePoints = obstacle.type === 'tall' ? game.config.tallPoints : game.config.lowPoints;
                    const points = basePoints * 2; // Double points for plowing through
                    game.score += points;
                    GameLogic.updateScore(game);
                    
                    // Ragdoll the obstacle instead of just removing it
                    obstacle.triggerRagdoll(game.player.x + game.player.width/2, game.player.y + game.player.height/2);
                    continue;
                } else if (game.player.postTrainInvincible) {
                    // Post-train invincibility - just bypass obstacles, no ragdoll
                    continue; // Skip this collision entirely
                } else {
                    // In tutorial mode, crashes trigger tutorial-specific behavior
                    game.soundManager.playEffect('crash');
                    
                    // Reset player position instead of triggering full crash
                    game.player.reset(game.canvas.height * game.config.groundLevel);
                    
                    // Remove the obstacle that caused the crash
                    game.obstacles.splice(i, 1);
                    
                    // Notify tutorial manager of crash
                    if (game.tutorialManager) {
                        game.tutorialManager.handleTutorialCrash();
                    }
                    return;
                }
            }
        }
        
        // Handle bribe collection in tutorial mode
        for (let i = game.bribes.length - 1; i >= 0; i--) {
            const bribe = game.bribes[i];
            
            if (this.checkCollision(game.player, bribe)) {
                game.bribes.splice(i, 1);
                
                // Add points (no penalty in tutorial)
                game.score += 5;
                GameLogic.updateScore(game);
                
                // Visual feedback
                GameLogic.addPopup(game, "+5 VOTES!", bribe.x + 50, bribe.y, {icon: '💰'});
                game.soundManager.playPointTall();
                
                // Notify tutorial manager
                if (game.tutorialManager) {
                    game.tutorialManager.handleBribeCollected();
                }
            }
        }
        
        // For constituents in tutorial mode, use the normal updateConstituents logic
        // which will call the regular constituent stomp handling and automatically 
        // trigger the tutorial counter via the score penalty function
        
        // Handle train mode activation in tutorial
        for (let i = game.gerrymanderExpresses.length - 1; i >= 0; i--) {
            const gerrymanderExpress = game.gerrymanderExpresses[i];
            
            if (gerrymanderExpress.checkCollision(game.player)) {
                game.gerrymanderExpresses.splice(i, 1);
                gerrymanderExpress.collect();
                
                // Set cooldown timer to prevent spawning for 15 seconds (hidden from player)
                game.lastGerrymanderExpressTime = Date.now();
                
                if (game.player.activateTrainMode()) {
                    // Visual feedback
                    GameLogic.addPopup(game, "GERRYMANDER EXPRESS!",
                                      game.canvas.width / 2, game.canvas.height * 0.9, {icon: '🚂', duration: 2550});
                    game.soundManager.playEffect('choochoo');
                    
                    // Notify tutorial manager
                    if (game.tutorialManager) {
                        game.tutorialManager.handleTrainActivated();
                    }
                }
            }
        }
    }
    
    static updateTrailSegments(game) {
        // Spawn trail segments when in train mode
        if (game.player.isTrainMode && game.gameFrame % 3 === 0) { // Every 3 frames
            const centerX = game.player.x + game.player.width / 2;
            const centerY = game.player.y + game.player.height / 2;
            
            game.trailSegments.push({
                x: centerX,
                y: centerY,
                width: 8,
                height: 8,
                speed: game.config.obstacleSpeed
            });
        }
        
        // Update and remove trail segments
        for (let i = game.trailSegments.length - 1; i >= 0; i--) {
            const segment = game.trailSegments[i];
            segment.x -= segment.speed; // Move left like other elements
            
            // Remove if off screen
            if (segment.x + segment.width < 0) {
                game.trailSegments.splice(i, 1);
            }
        }
    }
    
    // Select obstacle variant based on spawn weights
    static selectObstacleVariant(type, game) {
        console.log('selectObstacleVariant called for type:', type, 'obstacleSkinConfig:', !!game.obstacleSkinConfig);
        
        // Use obstacle skin config if available
        const obstacleSkinConfig = game.obstacleSkinConfig;
        if (!obstacleSkinConfig || !obstacleSkinConfig.spawnWeights || !obstacleSkinConfig.spawnWeights[type]) {
            console.log('No skin config found, falling back to default');
            // Fallback to default
            return { variant: 'default', skinConfig: null };
        }
        
        const weights = obstacleSkinConfig.spawnWeights[type];
        const variants = Object.keys(weights);
        console.log('Available variants for', type, ':', variants, 'weights:', weights);
        
        // Calculate total weight
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        console.log('Total weight:', totalWeight);
        
        // Select random variant based on weights
        let random = Math.random() * totalWeight;
        console.log('Random value:', random);
        for (const variant of variants) {
            random -= weights[variant];
            console.log('Testing variant:', variant, 'remaining random:', random);
            if (random <= 0) {
                const skinConfig = obstacleSkinConfig.skins[type][variant];
                console.log('Selected variant:', variant, 'skinConfig:', skinConfig);
                return { variant, skinConfig };
            }
        }
        
        // Fallback to first variant
        const fallbackVariant = variants[0];
        const skinConfig = obstacleSkinConfig.skins[type][fallbackVariant];
        console.log('Fallback to variant:', fallbackVariant);
        return { variant: fallbackVariant, skinConfig };
    }
    
    // Apply skin image to obstacle if available
    static applySkinToObstacle(obstacle, game) {
        console.log('applySkinToObstacle called for:', obstacle.variant, 'loadedObstacleSkins available:', !!game.loadedObstacleSkins);
        
        if (!game.loadedObstacleSkins || !obstacle.variant || obstacle.variant === 'default') {
            console.log('No skin needed for obstacle variant:', obstacle.variant);
            return; // No skin needed for default obstacles
        }
        
        // Find matching skin in loaded assets
        const skinName = `${obstacle.type}_${obstacle.variant}`;
        console.log('Looking for skin:', skinName, 'in loaded skins:', game.loadedObstacleSkins.length);
        const loadedSkin = game.loadedObstacleSkins.find(skin => skin.name === skinName);
        
        if (loadedSkin && loadedSkin.image && loadedSkin.loaded) {
            console.log('Setting skin image for obstacle:', skinName);
            obstacle.setSkinImage(loadedSkin.image);
        } else {
            console.log('Could not find loaded skin for:', skinName);
        }
    }
    
    static easeOutBack(t) {
        const c1 = 1.70158, c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
}
