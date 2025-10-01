// Game Logic Methods for LtDanRunner
import { GAME_CONFIG, PLAYER_CONFIG } from './constants/GameConfig.js';
import { RagdollSystem } from './physics/RagdollSystem.js';

export class GameLogic {
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    static handleTouchStart(game, e) {
        e.preventDefault();
        
        if (game.gameState === 'playing') {
            // Capture touch coordinates and set as target
            if (e.touches && e.touches.length > 0) {
                game.player.lastTouchX = e.touches[0].clientX;
                game.player.lastTouchY = e.touches[0].clientY;
                // Set target positions for smooth lerp
                game.player.timerTargetX = e.touches[0].clientX;
                game.player.timerTargetY = e.touches[0].clientY;
                
                // Initialize current position if first tap
                if (game.player.timerX === 0 && game.player.timerY === 0) {
                    game.player.timerX = e.touches[0].clientX;
                    game.player.timerY = e.touches[0].clientY;
                }
            }
            // Jump on touch
            this.handleJump(game);
        }
    }
    
    static handleJump(game, mouseX, mouseY) {
        if (game.gameState !== 'playing') return;
        
        // Update touch position if mouse coordinates are provided
        if (mouseX !== undefined && mouseY !== undefined) {
            game.player.lastTouchX = mouseX;
            game.player.lastTouchY = mouseY;
            // Set target positions for smooth lerp
            game.player.timerTargetX = mouseX;
            game.player.timerTargetY = mouseY;
            
            // Initialize current position if first tap
            if (game.player.timerX === 0 && game.player.timerY === 0) {
                game.player.timerX = mouseX;
                game.player.timerY = mouseY;
            }
        }
        
        // Only allow parachute tapping if parachute is active AND has time remaining
        if (game.player.hasParachute && game.player.parachuteTimeLeft > 0) {
            // Register tap to maintain parachute and give small upward boost ONLY if time remains
            game.player.lastTapTime = Date.now();
            game.player.velocityY -= 2; // Small upward boost on each tap
        } else if (!game.player.isJumping) {
            // If parachute has expired or doesn't exist, only allow normal jumping from ground
            game.player.velocityY = game.config.jumpPower;
            game.player.isJumping = true;
            game.soundManager.playJump();
        }
    }
    
    static handleKeyDown(game, e) {
        // Pause game with P key or Escape
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
            if (game.gameState === 'playing') {
                this.pauseGame(game);
            } else if (game.gameState === 'paused') {
                this.resumeGame(game);
            }
        }
        
        // Space bar to jump
        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            this.handleJump(game);
        }
    }
    
    static pauseGame(game) {
        if (game.gameState !== 'playing') return;
        
        game.gameState = 'paused';
        this.updateHUDVisibility(game);
        game.pauseScreen.classList.remove('hidden');
        
        // Pause the game music
        game.soundManager.pauseMusic();
        game.soundManager.playMusic('pause');
    }
    
    static resumeGame(game) {
        if (game.gameState !== 'paused') return;
        
        game.gameState = 'playing';
        this.updateHUDVisibility(game);
        game.pauseScreen.classList.add('hidden');
        
        // Resume game music
        game.soundManager.stopMusic();
        game.soundManager.playMusic('game');
    }
    
    static showDevMenu(game) {
        // Open Dev Menu from pause screen
        game.devMenu.classList.remove('hidden');

        // Sync checkboxes with current state
        game.toggleHitboxesCheckbox.checked = game.debugHitboxes;
        game.toggleSpeedCheckbox.checked = game.showSpeed;

        // Event listeners
        game.toggleHitboxesCheckbox.onchange = (e) => {
            game.debugHitboxes = e.target.checked;
        };
        game.toggleSpeedCheckbox.onchange = (e) => {
            game.showSpeed = e.target.checked;
        };
        game.closeDevMenuButton.onclick = () => {
            game.devMenu.classList.add('hidden');
        };
    }
    
    static updateHUDVisibility(game) {
        // Show/hide header and controls based on game state
        if (game.gameState === 'playing' || game.gameState === 'paused') {
            // During gameplay, show controls, hide header and HTML score (using canvas score instead)
            game.gameHeader.classList.remove('show-title');
            game.controlButtons.classList.add('active');
            game.scoreContainer.classList.remove('active');  // Hide HTML score, we render on canvas now
        } else {
            // In menus, show header and hide controls/score
            game.gameHeader.classList.add('show-title');
            game.controlButtons.classList.remove('active');
            game.scoreContainer.classList.remove('active');
        }
    }
    
    static async startGame(game) {
        game.gameState = 'playing';
        game.gameStartTime = Date.now();
        this.hideAllScreens(game);
        this.updateHUDVisibility(game);
        game.score = 0;
        game.gameFrame = 0;
        game.obstacles = [];
        game.constituents = [];
        game.bribes = [];
        game.constituentSpawnCounter = 0;
        game.bribeSpawnCounter = 0;
        game.player.reset(game.canvas.height * game.config.groundLevel);
        
        // Reset game speed to new slower initial speed
        game.config.gameSpeed = game.config.baseGameSpeed;
        game.config.obstacleSpeed = game.config.baseObstacleSpeed;
        
        // Reset active effects
        game.activeEffects = {
            constituents: [],
            bribes: [],
            currentSpeedMod: 1,
            currentScoreMod: 1
        };
        
        // Fetch top 5 scores to determine victory threshold
        try {
            const data = await game.leaderboard.getGlobalLeaderboard(5);
            if (data.leaderboard && data.leaderboard.length >= 5) {
                // Set threshold to the 5th place score
                game.top5Threshold = data.leaderboard[4].score;
                console.log('Top 5 threshold set to:', game.top5Threshold);
            } else if (data.leaderboard && data.leaderboard.length > 0) {
                // If less than 5 scores, any score beats the leaderboard
                game.top5Threshold = 0;
                console.log('Less than 5 scores on leaderboard, threshold set to 0');
            } else {
                // Empty leaderboard, use default
                game.top5Threshold = 100;
                console.log('Empty leaderboard, using default threshold of 100');
            }
        } catch (error) {
            console.log('Could not fetch leaderboard, using default threshold');
            game.top5Threshold = 100;
        }
        
        // Play game music
        game.soundManager.playMusic('game');
        
        this.updateScore(game);
    }
    
    static restartGame(game) {
        this.startGame(game);
    }
    
    static showStartScreen(game) {
        game.gameState = 'start';
        this.hideAllScreens(game);
        this.updateHUDVisibility(game);
        game.startScreen.classList.remove('hidden');
        
        // Play menu music if sound is initialized
        if (game.soundInitialized) {
            game.soundManager.stopMusic();
            game.soundManager.playMusic('menu');
        }
    }
    
    static hideAllScreens(game) {
        game.startScreen.classList.add('hidden');
        game.gameOverScreen.classList.add('hidden');
        game.leaderboardScreen.classList.add('hidden');
        game.playerStatsScreen.classList.add('hidden');
        game.pauseScreen.classList.add('hidden');
    }
    
    static triggerCrash(game, obstacle) {
        if (game.gameState !== 'playing') return;
        
        // Switch to crashing state
        game.gameState = 'crashing';
        game.crashTimer = Date.now();
        
        // Play crash sound
        game.soundManager.playEffect('crash');
        
        // Show crash skip hint
        game.showCrashSkipHint();
        
        // Create ragdoll at player position
        game.ragdoll = new RagdollSystem({
            x: game.player.x,
            y: game.player.y,
            width: game.player.width,
            height: game.player.height,
            groundY: game.player.groundY
        }, game.skinImages);
        
        // Apply impulse based on collision direction
        const collisionForceX = -3 - Math.random() * 2; // Backward force
        const collisionForceY = -8 - Math.random() * 4; // Upward force
        game.ragdoll.applyImpulse(collisionForceX, collisionForceY);
        
        // Start screen shake
        game.screenShakeIntensity = 25;
        game.screenShake = game.screenShakeIntensity;
    }
    
    static gameOver(game) {
        game.gameState = 'gameOver';
        game.gameEndTime = Date.now();
        game.finalScoreElement.textContent = game.score;
        this.updateHUDVisibility(game);
        
        // Display random political end message
        const politicalMessageElement = document.getElementById('politicalEndMessage');
        if (politicalMessageElement) {
            const message = game.getRandomPoliticalEndMessage();
            console.log('Setting political end message:', message);
            politicalMessageElement.textContent = message;
        } else {
            console.error('Could not find politicalEndMessage element');
        }
        
        // Reset screen shake effects to ensure clean transition
        game.screenShake = 0;
        game.screenShakeIntensity = 0;
        
        // Hide crash skip hint when transitioning to game over
        game.hideCrashSkipHint();
        
        // Stop game music and always play menu music
        game.soundManager.stopMusic();
        game.soundManager.playMusic('menu');
        
        // If player achieved top 5, play victory fanfare on top
        if (game.score > game.top5Threshold) {
            console.log(`Score ${game.score} beats top 5 threshold of ${game.top5Threshold}! Playing victory fanfare.`);
            game.soundManager.playEffect('victory-fanfare');
            
            // Add a special popup for top 5 achievement
            this.addPopup(game, "TOP 5!", game.canvas.width / 2, game.canvas.height * 0.9, {icon: '🏆', duration: 3000});
        } else {
            // Player didn't make top 5, play fail sound
            console.log(`Score ${game.score} didn't beat top 5 threshold of ${game.top5Threshold}. Playing fail sound.`);
            game.soundManager.playEffect('fail');
        }
        
        // Check if this might be a high score worth submitting
        this.checkForHighScore(game);
        
        game.gameOverScreen.classList.remove('hidden');
    }
    
    static updateScore(game) {
        // Update score with throttling to avoid excessive DOM updates
        const now = Date.now();
        if (now - game.lastScoreUpdate > 50) { // Update every 50ms max
            game.scoreElement.textContent = game.score;
            game.lastScoreUpdate = now;
            
            // Add score animation for significant milestones
            if (game.score > 0 && game.score % 100 === 0) {
                this.animateScoreBadge(game);
                game.soundManager.playMilestone();
                this.addPopup(game, "MILESTONE!", game.canvas.width / 2, game.canvas.height * 0.9, {icon: '🎯', duration: 2100});
            }
        }
        
        // Gradually increase game speed
        if (game.score > 0 && game.score % 100 === 0) {
            game.config.gameSpeed = Math.min(game.config.gameSpeed + 0.2, 8);
            game.config.obstacleSpeed = Math.min(game.config.obstacleSpeed + 0.2, 8);
            game.soundManager.playSpeedUp();
        }
    }
    
    static animateScoreBadge(game) {
        // Add the shake class for the milestone animation
        game.scoreBadge.classList.add('shake');
        setTimeout(() => {
            game.scoreBadge.classList.remove('shake');
        }, 600); // Match the animation duration
    }
    
    static addPopup(game, text, x, y, opts={}) {
        const now = performance.now();
        game.popups.push({
            text,
            lines: opts.lines || null, // Support for multi-line text
            icon: opts.icon || null,
            x, y,
            vx: (Math.random() - 0.5) * 0.25,
            vy: -0.6,
            start: now,
            life: opts.duration || 850, // Allow custom duration, default to 850ms
            scale: 0.6,
            alpha: 1,
            isMultiLine: opts.isMultiLine || false
        });
        if (game.popups.length > 20) game.popups.shift();
    }
    
    // Create a two-line popup for obstacle avoidance
    static addObstacleAvoidedPopup(game, politicalWord, x, y) {
        const now = performance.now();
        
        // Clear existing popups to ensure this message takes priority
        game.popups.length = 0;
        
        // Calculate dynamic font size for political word based on text length and screen width
        const politicalWordFontSize = this.calculateDynamicFontSize(game, politicalWord.toUpperCase());
        
        game.popups.push({
            text: null, // Use lines instead
            lines: [
                { text: "YOU AVOIDED", fontSize: 28, color: "#ffffff" }, // Keep consistent
                { text: politicalWord.toUpperCase(), fontSize: politicalWordFontSize, color: "#ffd700", bold: true } // Dynamic size
            ],
            icon: null,
            x, y,
            vx: (Math.random() - 0.5) * 0.25,
            vy: -0.6,
            start: now,
            life: 2400, // Double duration - was 1200, now 2400ms
            scale: 0.6,
            alpha: 1,
            isMultiLine: true,
            isPriority: true // Mark as priority message
        });
    }
    
    // Calculate dynamic font size for political words to fit screen width
    static calculateDynamicFontSize(game, text) {
        // Use a temporary canvas context to measure text width
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Maximum width should be 90% of screen width for comfortable reading
        const maxWidth = game.canvas.width * 0.9;
        
        // Start with ideal large size and work down
        let fontSize = 48; // Ideal size
        const minFontSize = 24; // Minimum readable size
        
        // Test decreasing font sizes until text fits
        while (fontSize >= minFontSize) {
            tempCtx.font = `bold ${fontSize}px Tiny5`;
            const textWidth = tempCtx.measureText(text).width;
            
            if (textWidth <= maxWidth) {
                break; // Found a size that fits
            }
            
            fontSize -= 2; // Decrease by 2px steps
        }
        
        // Ensure we don't go below minimum
        return Math.max(fontSize, minFontSize);
    }
    
    static checkForHighScore(game) {
        // Reset submission form state
        game.scoreSubmissionForm.classList.add('hidden');
        game.scoreResult.classList.add('hidden');
        
        // Show submission form for any score > 50
        if (game.score > 50) {
            this.showScoreSubmissionForm(game);
        }
    }
    
    static showScoreSubmissionForm(game) {
        const savedName = game.leaderboard.getSavedPlayerName();
        game.playerNameInput.value = savedName;
        game.scoreSubmissionForm.classList.remove('hidden');
        
        // Don't auto-focus to prevent mobile keyboard from popping up
        // Users can tap the input field when they're ready to type
    }
}
