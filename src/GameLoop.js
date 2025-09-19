// Game Loop and Update Methods
import { Obstacle, createObstacle } from './entities/Obstacle.js';
import { Constituent } from './entities/Constituent.js';
import { Bribe, BribePatternFactory } from './entities/Bribe.js';
import { GameLogic } from './GameLogic.js';
import { PLAYER_CONFIG } from './constants/GameConfig.js';

export class GameLoop {
    static update(game) {
        // Delta time is already calculated in Game.gameLoop()
        
        if (game.gameState === 'playing') {
            game.gameFrame++;
            
            // Track distance moved since last spawn
            game.lastSpawnDistance += game.config.obstacleSpeed;
            
            game.player.update(game.config, game.deltaTime);
            this.spawnObstacle(game);
            this.spawnConstituent(game);
            this.spawnBribe(game);
            this.updateObstacles(game);
            this.updateConstituents(game);
            this.updateBribes(game);
            this.updateBackground(game);
            this.updatePopups(game);
            
            // Continuous scoring
            if (game.gameFrame % 10 === 0) {
                game.score += 1;
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
        } else if (game.gameState === 'paused') {
            // When paused, only render the current frame without updates
        }
    }
    
    static canSpawnEntity(game) {
        // Check if enough distance has passed since last spawn
        return game.lastSpawnDistance >= game.minSpawnGap;
    }
    
    static spawnObstacle(game) {
        // Check unified spawn spacing first
        if (!this.canSpawnEntity(game)) return;
        
        const lastObstacle = game.obstacles[game.obstacles.length - 1];
        const canSpawn = !lastObstacle || 
            (game.canvas.width + 50 - (lastObstacle.x + lastObstacle.width)) >= game.config.minObstacleGapPx;

        // Low obstacle spawn (fixed interval)
        if (canSpawn && game.gameFrame % game.config.obstacleSpawnRate === 0) {
            const obstacle = createObstacle('low', game.canvas, game.player.groundY, game.config.obstacleSpeed);
            game.obstacles.push(obstacle);
            game.lastSpawnDistance = 0;  // Reset spawn distance
        }

        // Tall obstacle spawn (random interval)
        game.tallSpawnCounter++;
        if (canSpawn && game.tallSpawnCounter >= game.nextTallSpawn && this.canSpawnEntity(game)) {
            const obstacle = createObstacle('tall', game.canvas, game.player.groundY, game.config.obstacleSpeed);
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
                if (obstacle.type === 'tall') {
                    game.score += game.config.tallPoints;
                    GameLogic.updateScore(game);
                    GameLogic.addPopup(game, "+" + game.config.tallPoints, 
                                  game.player.x + game.player.width/2, game.player.y - 20);
                    game.soundManager.playPointTall();
                } else {
                    game.score += game.config.lowPoints;
                    GameLogic.updateScore(game);
                    GameLogic.addPopup(game, "+" + game.config.lowPoints, 
                                  game.player.x + game.player.width/2, game.player.y - 20);
                    game.soundManager.playPointLow();
                }
            }

            // Collision detection - FIXED: Use GameLogic.triggerCrash instead of game.triggerCrash
            if (this.checkCollision(game.player, obstacle)) {
                GameLogic.triggerCrash(game, obstacle);
                return;
            }
        }
    }
    
    static spawnConstituent(game) {
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
            
            // Check if player is stomping on constituent
            const isStomping = constituent.checkStomp(game.player);
            if (isStomping && !constituent.isBeingStomped) {
                // Trigger stomp animation (this will handle the squash animation automatically)
                constituent.triggerStomp();
                
                // Override the constituent's launch physics for more dramatic effect
                // These will be applied after the squash phase (at 220ms)
                constituent.launchVelocityX = -8 - Math.random() * 4;  // Stronger backward launch
                constituent.launchVelocityY = -25 - Math.random() * 10; // Much stronger upward launch
                constituent.rotationSpeed = (Math.random() - 0.5) * 0.6;  // More spinning
                
                // Reduce score by 25 points
                const penalty = 25;
                game.score = Math.max(0, game.score - penalty);  // Prevent negative scores
                GameLogic.updateScore(game);
                
                // Play stomp sound (use jump sound for now)
                game.soundManager.playJump();
                
                // Launch player to consistent height using target height system
                game.player.launchToHeight(PLAYER_CONFIG.constituentLaunchTargetHeight);
                // Note: launchToHeight already sets isJumping and gives parachute
                
                // Select a random parachute skin
                if (game.loadedParachuteSkins && game.loadedParachuteSkins.length > 0) {
                    game.currentParachuteSkin = game.loadedParachuteSkins[
                        Math.floor(Math.random() * game.loadedParachuteSkins.length)
                    ];
                }
                
                // Visual feedback
                GameLogic.addPopup(game, "PARACHUTE!", game.player.x, game.player.y - 50, {icon: '🪂'});
            }
        }
    }
    
    static spawnBribe(game) {
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
    
    
    static updateBribes(game) {
        for (let i = game.bribes.length - 1; i >= 0; i--) {
            const bribe = game.bribes[i];
            
            // Update bribe
            bribe.update();
            
            // Remove if off screen
            if (bribe.x + bribe.width < 0) {
                game.bribes.splice(i, 1);
                continue;
            }
            
            // Check collision with player
            if (this.checkCollision(game.player, bribe)) {
                // Remove bribe
                game.bribes.splice(i, 1);
                
                // Add 5 votes to score
                game.score += 5;
                GameLogic.updateScore(game);
                
                // Visual feedback
                GameLogic.addPopup(game, "+5 VOTES!", bribe.x, bribe.y, {icon: '💰'});
                
                // Play collect sound (use point sound for now)
                game.soundManager.playPointTall();
            }
        }
    }
    
    static updateBackground(game) {
        for (let element of game.backgroundElements) {
            element.x -= element.speed;
            
            // Reset position when off screen
            if (element.x + element.width < 0) {
                element.x = game.canvas.width + Math.random() * 200;
                element.y = Math.random() * game.canvas.height * 0.5;
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

            // Animate toward top-center of screen with ramping speed
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
    
    
    static easeOutBack(t) {
        const c1 = 1.70158, c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
}
