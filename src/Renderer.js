// Rendering Methods for the Game
export class Renderer {
    static render(game) {
        const ctx = game.ctx;
        
        // Apply screen shake if active
        ctx.save();
        if (game.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * game.screenShake;
            const shakeY = (Math.random() - 0.5) * game.screenShake;
            ctx.translate(shakeX, shakeY);
        }
        
        // Clear canvas
        ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
        
        // Draw background elements
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let element of game.backgroundElements) {
            ctx.fillStyle = element.color;
            ctx.fillRect(element.x, element.y, element.width, element.height);
        }
        
        // Draw ground line (fixed position regardless of zoom)
        const groundY = game.canvas.height * 0.8; // Always 80% down from top
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(game.canvas.width, groundY);
        ctx.stroke();
        
        // Draw parachute tap overlay EARLY (behind everything except background)
        if ((game.gameState === 'playing' || game.gameState === 'tutorial') && game.parachuteTapOverlay) {
            game.parachuteTapOverlay.render(game.ctx, game);
        }
        
        // Draw tutorial text EARLY (below player and UI elements, above background)
        if (game.gameState === 'tutorial' && game.tutorialManager) {
            this.renderTutorialText(game);
        }
        
        // Draw TRON-style trail segments BEFORE player (so they appear behind)
        if ((game.gameState === 'playing' || game.gameState === 'tutorial') && game.trailSegments.length > 0) {
            this.drawTrailSegments(game);
        }
        
        // Draw player or ragdoll depending on state
        if (game.gameState === 'crashing' && game.ragdoll) {
            // Draw ragdoll
            game.ragdoll.render(ctx);
        } else if (game.gameState === 'playing' || game.gameState === 'tutorial') {
            // Check for invincibility flashing (last 1s of train mode OR post-train invincibility)
            const shouldFlash = (game.player.isTrainMode && game.player.trainModeTimer >= game.player.trainModeDuration - 1000) || 
                               game.player.postTrainInvincible;
            
            if (shouldFlash) {
                // Calculate ramping flash rate - starts slow, gets faster like a ticking time bomb
                let timeElapsed;
                if (game.player.isTrainMode) {
                    // During train mode (last 1 second)
                    timeElapsed = game.player.trainModeTimer - (game.player.trainModeDuration - 1000);
                } else {
                    // Post-train mode
                    timeElapsed = 1000 + (game.player.postTrainInvincibilityDuration - game.player.postTrainInvincibilityTimer);
                }
                
                // Total flashing duration is 3.5 seconds (1s train + 2.5s post-train)
                const totalFlashDuration = 3500;
                const rawProgress = Math.min(timeElapsed / totalFlashDuration, 1);
                
                // Apply smooth easing curve for more natural progression
                const flashProgress = rawProgress * rawProgress * (3 - 2 * rawProgress); // Smoothstep function
                
                // Ramp flash rate from 0.125 flashes/sec to 1 flash/sec (75% reduction)
                const minFlashRate = 1; // Start extremely slow (1 flash every 8 seconds)
                const maxFlashRate = 1.5; // End gentle (1 flash per second)
                const currentFlashRate = minFlashRate + (maxFlashRate - minFlashRate) * flashProgress;
                
                // Convert to milliseconds per flash cycle
                const flashInterval = 1000 / (currentFlashRate * 2); // *2 because sin cycle gives us 2 flashes per cycle
                const flashCycle = Date.now() / flashInterval;
                
                // Simple transparency flash effect
                ctx.globalAlpha = Math.sin(flashCycle) > 0 ? 1.0 : 0.3;
            }
            
            // Draw player based on mode
            if (game.player.isTrainMode) {
                this.drawTrainPlayer(game);
            } else {
                // Draw articulated player (Lt. Dan)
                this.drawArticulatedPlayer(game);
            }
            
            // Draw parachute if active AND has time remaining
            if (game.player.hasParachute && game.player.parachuteTimeLeft > 0) {
                this.drawParachute(game);
            }
            
            // Reset alpha after drawing player
            if (shouldFlash) {
                ctx.globalAlpha = 1.0;
            }
        }
        
        // Draw constituents (red walking enemies - same size as player)
        for (let constituent of game.constituents) {
            constituent.render(ctx);
        }
        
        // Draw bribes (gold floating money)
        for (let bribe of game.bribes) {
            bribe.render(ctx);
        }
        
        // Draw gerrymander expresses (special train collectibles)
        for (let gerrymanderExpress of game.gerrymanderExpresses) {
            gerrymanderExpress.render(ctx);
        }
        
        // Draw obstacles (keep them visible during crash)
        for (let obstacle of game.obstacles) {
            obstacle.render(ctx);
        }
        
        // Debug: draw hitboxes
        if (game.debugHitboxes && game.gameState === 'playing') {
            this.drawDebugHitboxes(game);
        }
        
        // Debug: show speed
        if (game.showSpeed && game.gameState === 'playing') {
            this.drawSpeedDebug(game);
        }
        
        // Restore context after screen shake
        ctx.restore();
        
        // Draw train mode UI (if active)
        if ((game.gameState === 'playing' || game.gameState === 'tutorial') && game.player.isTrainMode) {
            this.drawTrainModeUI(game);
        }
        
        // Draw tutorial crash overlay if active
        if (game.gameState === 'tutorial' && game.tutorialCrashOverlay > 0) {
            this.renderTutorialCrashOverlay(game);
        }
        
        // Draw pause button arrow if in completion stage
        if (game.gameState === 'tutorial' && game.tutorialManager && game.tutorialManager.shouldShowPauseArrow()) {
            this.renderPauseArrow(game);
        }
        
        // Draw popups LAST (on top of everything)
        this.renderPopups(game);
    }
    
    static renderScoreUI(game) {
        // Only render score UI during gameplay
        if (game.gameState !== 'playing' && game.gameState !== 'paused') return;
        
        const ctx = game.ctx;
        
        // Save context for score UI rendering
        ctx.save();
        
        // Center positions on screen
        const centerX = game.canvas.width / 2;
        const topY = 40;
        
        // Draw "VOTES" label with block black shadow (bigger and yellow)
        ctx.font = 'bold 32px Tiny5';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Black shadow offset
        ctx.fillStyle = '#000000';
        ctx.fillText('VOTES', centerX + 3, topY + 3);
        // Yellow text on top
        ctx.fillStyle = '#ffd700';
        ctx.fillText('VOTES', centerX, topY);
        
        // Calculate dynamic font size based on score digit count
        const scoreString = game.score.toString();
        const digitCount = scoreString.length;
        let baseFontSize = 80;
        let scaleFactor = 1.0;
        
        // Adjust font size based on digit count
        if (digitCount <= 4) {
            scaleFactor = 1.0; // 4 digits at current size is max comfortable
        } else if (digitCount === 5) {
            scaleFactor = 0.85; // 15% smaller for 5 digits
        } else if (digitCount === 6) {
            scaleFactor = 0.70; // 30% smaller for 6 digits
        } else {
            scaleFactor = 0.60; // 40% smaller for 7+ digits
        }
        
        const adjustedFontSize = Math.floor(baseFontSize * scaleFactor);
        
        // Draw score number with block black shadow (centered, dynamically sized)
        ctx.font = `bold ${adjustedFontSize}px Tiny5`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top'; // Use top baseline for consistent positioning
        // Black shadow offset (scale shadow with font size)
        const shadowOffset = Math.max(2, Math.floor(4 * scaleFactor));
        // Fixed Y position for consistent placement regardless of font size
        const scoreY = topY + 45; // Consistent top position for score text
        ctx.fillStyle = '#000000';
        ctx.fillText(scoreString, centerX + shadowOffset, scoreY + shadowOffset);
        // White text on top
        ctx.fillStyle = '#ffffff';
        ctx.fillText(scoreString, centerX, scoreY);
        
        // Add milestone animation effect (centered)
        if (game.score > 0 && game.score % 100 === 0) {
            const time = Date.now() % 600;
            if (time < 300) {
                // Pulse effect around the score
                const scale = 1 + (Math.sin(time / 300 * Math.PI) * 0.15);
                ctx.save();
                ctx.translate(centerX, topY + 60);
                ctx.scale(scale, scale);
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 3;
                ctx.globalAlpha = 0.6;
                ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
                ctx.shadowBlur = 8;
                // Draw a circle around the score instead of rectangle
                ctx.beginPath();
                ctx.arc(0, 0, 80, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }
        
        ctx.restore();
    }
    
    static drawArticulatedPlayer(game) {
        const centerX = game.player.x + game.player.width / 2;
        const topY = game.player.y;
        
        // Body proportions
        const headHeight = game.player.height * 0.33;
        const torsoHeight = game.player.height * 0.33;
        const legHeight = game.player.height * 0.34;
        
        // Save context
        game.ctx.save();
        
        // Draw layers in correct z-order for side profile
        const hipY = topY + headHeight + torsoHeight;
        const thighLength = legHeight * 0.5;
        const shinLength = legHeight * 0.5;
        
        // 1. Draw right leg FIRST (behind torso)
        this.drawPlayerLimb(game,
            centerX + 5,
            hipY,
            game.player.rightLegAngle,
            thighLength,
            game.player.rightKneeAngle,
            shinLength,
            10,
            game.skinImages.thigh,
            game.skinImages.shin
        );
        
        // 2. Draw torso (center)
        const torsoY = topY + headHeight;
        if (game.skinsLoaded && game.skinImages.torso && game.skinImages.torso.complete) {
            game.ctx.drawImage(
                game.skinImages.torso,
                centerX - game.player.width/2 + 5,
                torsoY,
                game.player.width - 10,
                torsoHeight
            );
        } else {
            game.ctx.fillStyle = '#cc5858';
            game.ctx.fillRect(
                centerX - game.player.width/2 + 5,
                torsoY,
                game.player.width - 10,
                torsoHeight
            );
        }
        
        // 3. Draw head (shifted right for side profile with animation)
        const headOffset = 8;
        
        // Save context for head transformation
        game.ctx.save();
        
        // Apply head animation transformations
        const headX = centerX - game.player.width/2 + headOffset + game.player.headXOffset;
        const headY = topY - game.player.headYOffset; // Negative because Y offset lifts the head up
        
        // Apply rotation around the head center
        const headCenterX = headX + (game.player.width - headOffset) / 2;
        const headCenterY = headY + headHeight / 2;
        game.ctx.translate(headCenterX, headCenterY);
        game.ctx.rotate(game.player.headRotation * Math.PI / 180);
        game.ctx.translate(-headCenterX, -headCenterY);
        
        // Choose which head to use based on jumping or breathing state
        const useOpenMouth = game.player.isJumping || game.player.isBreathingOut;
        const headImage = useOpenMouth ? game.skinImages['head-open-mouth'] : game.skinImages.head;
        
        if (game.skinsLoaded && headImage && headImage.complete) {
            game.ctx.drawImage(
                headImage,
                headX,
                headY,
                game.player.width - headOffset,
                headHeight
            );
        } else {
            game.ctx.fillStyle = game.player.color;
            game.ctx.fillRect(
                headX,
                headY,
                game.player.width - headOffset,
                headHeight
            );
        }
        
        // 4. Draw face features only if not using skins
        if (!game.skinsLoaded || !game.skinImages.head || !game.skinImages.head.complete) {
            game.ctx.fillStyle = 'white';
            game.ctx.fillRect(headX + headOffset + 8, headY + 5, 5, 5);
            
            game.ctx.strokeStyle = 'white';
            game.ctx.lineWidth = 2;
            game.ctx.beginPath();
            game.ctx.moveTo(headX + headOffset + 11, headY + 13);
            game.ctx.lineTo(headX + headOffset + 17, headY + 16);
            game.ctx.stroke();
        }
        
        // Restore context after head transformation
        game.ctx.restore();
        
        // 5. Draw arm
        const shoulderY = torsoY + 4;
        const armLength = torsoHeight * 0.5;
        
        // Single arm for side profile
        this.drawPlayerLimb(game,
            centerX,
            shoulderY,
            game.player.leftArmAngle,
            armLength,
            game.player.leftElbowAngle,
            armLength * 0.8,
            8,
            game.skinImages.upper_arm,
            game.skinImages.forearm
        );
        
        // 6. Draw left leg LAST (in front)
        this.drawPlayerLimb(game,
            centerX - 5,
            hipY,
            game.player.leftLegAngle,
            thighLength,
            game.player.leftKneeAngle,
            shinLength,
            10,
            game.skinImages.thigh,
            game.skinImages.shin
        );
        
        game.ctx.restore();
    }
    
    static drawTrainPlayer(game) {
        const ctx = game.ctx;
        ctx.save();
        
        // Train dimensions
        const trainWidth = game.player.width;
        const trainHeight = game.player.height;
        const centerX = game.player.x + trainWidth / 2;
        const centerY = game.player.y + trainHeight / 2;
        
        // No glow effect for cleaner look
        const glowIntensity = 0.8; // Static value for speed lines
        
        // Train colors
        const trainBlue = '#4A90E2';
        const trainGold = '#FFD700';
        const trainSilver = '#C0C0C0';
        const trainDark = '#2C5D8A';
        
        // Main train body
        ctx.fillStyle = trainBlue;
        ctx.fillRect(
            game.player.x + trainWidth * 0.1,
            game.player.y + trainHeight * 0.2,
            trainWidth * 0.7,
            trainHeight * 0.6
        );
        
        // Train front nose (cowcatcher)
        ctx.fillStyle = trainSilver;
        ctx.beginPath();
        ctx.moveTo(game.player.x + trainWidth * 0.8, game.player.y + trainHeight * 0.2);
        ctx.lineTo(game.player.x + trainWidth * 0.95, game.player.y + trainHeight * 0.5);
        ctx.lineTo(game.player.x + trainWidth * 0.8, game.player.y + trainHeight * 0.8);
        ctx.closePath();
        ctx.fill();
        
        // Smokestack
        const stackWidth = trainWidth * 0.12;
        const stackHeight = trainHeight * 0.4;
        ctx.fillStyle = trainDark;
        ctx.fillRect(
            game.player.x + trainWidth * 0.25,
            game.player.y - stackHeight * 0.5,
            stackWidth,
            stackHeight
        );
        
        // Smoke effect (simple particles)
        if (game.gameFrame % 5 === 0) {
            ctx.fillStyle = 'rgba(200, 200, 200, 0.7)';
            for (let i = 0; i < 3; i++) {
                const smokeX = game.player.x + trainWidth * 0.31 + (Math.random() - 0.5) * 10;
                const smokeY = game.player.y - stackHeight * 0.7 - i * 5;
                const smokeSize = 3 + i;
                ctx.fillRect(smokeX, smokeY, smokeSize, smokeSize);
            }
        }
        
        // Wheels (4 wheels for train)
        const wheelRadius = trainHeight * 0.15;
        const wheelY = game.player.y + trainHeight * 0.85;
        
        ctx.fillStyle = '#333333';
        // Front wheels
        ctx.beginPath();
        ctx.arc(game.player.x + trainWidth * 0.75, wheelY, wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(game.player.x + trainWidth * 0.6, wheelY, wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Rear wheels
        ctx.beginPath();
        ctx.arc(game.player.x + trainWidth * 0.45, wheelY, wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(game.player.x + trainWidth * 0.3, wheelY, wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Wheel spokes (rotating effect)
        const rotationAngle = (game.gameFrame * 0.3) % (Math.PI * 2);
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        
        [0.75, 0.6, 0.45, 0.3].forEach(position => {
            const wheelX = game.player.x + trainWidth * position;
            ctx.save();
            ctx.translate(wheelX, wheelY);
            ctx.rotate(rotationAngle);
            ctx.beginPath();
            ctx.moveTo(-wheelRadius * 0.7, 0);
            ctx.lineTo(wheelRadius * 0.7, 0);
            ctx.moveTo(0, -wheelRadius * 0.7);
            ctx.lineTo(0, wheelRadius * 0.7);
            ctx.stroke();
            ctx.restore();
        });
        
        // Gold trim and details
        ctx.strokeStyle = trainGold;
        ctx.lineWidth = 3;
        ctx.strokeRect(
            game.player.x + trainWidth * 0.1,
            game.player.y + trainHeight * 0.2,
            trainWidth * 0.7,
            trainHeight * 0.6
        );
        
        // Cab windows
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(
            game.player.x + trainWidth * 0.15,
            game.player.y + trainHeight * 0.3,
            trainWidth * 0.25,
            trainHeight * 0.3
        );
        
        // Window frames
        ctx.strokeStyle = trainGold;
        ctx.lineWidth = 2;
        ctx.strokeRect(
            game.player.x + trainWidth * 0.15,
            game.player.y + trainHeight * 0.3,
            trainWidth * 0.25,
            trainHeight * 0.3
        );
        
        // Speed lines effect
        ctx.strokeStyle = `rgba(255, 255, 255, ${glowIntensity * 0.8})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const lineX = game.player.x - (i + 1) * 15;
            const lineY = game.player.y + trainHeight * 0.3 + i * 10;
            ctx.beginPath();
            ctx.moveTo(lineX, lineY);
            ctx.lineTo(lineX - 20, lineY);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    static drawPlayerLimb(game, startX, startY, angle1, length1, angle2, length2, width, upperSkin, lowerSkin) {
        const ctx = game.ctx;
        ctx.save();
        
        // Upper limb
        ctx.translate(startX, startY);
        ctx.rotate(angle1 * Math.PI / 180);
        
        if (game.skinsLoaded && upperSkin && upperSkin.complete) {
            // Draw skinned upper limb
            ctx.drawImage(upperSkin, -width/2, 0, width, length1);
        } else {
            // Fallback to line drawing
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.strokeStyle = game.player.color;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, length1);
            ctx.stroke();
        }
        
        // Lower limb
        ctx.translate(0, length1);
        ctx.rotate(angle2 * Math.PI / 180);
        
        if (game.skinsLoaded && lowerSkin && lowerSkin.complete) {
            // Draw skinned lower limb
            ctx.drawImage(lowerSkin, -width/2, 0, width, length2);
        } else {
            // Fallback to line drawing
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.strokeStyle = game.player.color;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, length2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    static drawParachute(game) {
        const ctx = game.ctx;
        ctx.save();
        
        // Draw parachute above player
        const chuteCenterX = game.player.x + game.player.width / 2;
        const chuteY = game.player.y - 40;
        
        // Draw parachute with selected skin
        if (game.currentParachuteSkin && game.currentParachuteSkin.loaded && game.currentParachuteSkin.image) {
            // Use loaded image for parachute
            ctx.save();
            ctx.beginPath();
            ctx.arc(chuteCenterX, chuteY, 35, Math.PI, 2 * Math.PI, false);
            ctx.closePath();
            ctx.clip();
            
            // Draw the parachute skin image
            ctx.drawImage(
                game.currentParachuteSkin.image,
                chuteCenterX - 35,
                chuteY - 35,
                70,
                70
            );
            
            ctx.restore();
        } else {
            // Fallback to solid color if no image loaded
            const fallbackColor = game.currentParachuteSkin?.color || '#FF6B6B';
            ctx.fillStyle = fallbackColor;
            ctx.beginPath();
            ctx.arc(chuteCenterX, chuteY, 35, Math.PI, 2 * Math.PI, false);
            ctx.closePath();
            ctx.fill();
        }
        
        // Parachute outline
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(chuteCenterX, chuteY, 35, Math.PI, 2 * Math.PI, false);
        ctx.stroke();
        
        // Parachute lines to player
        ctx.strokeStyle = '#333333'; // Dark gray
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Multiple lines for realistic look
        ctx.moveTo(chuteCenterX - 25, chuteY);
        ctx.lineTo(chuteCenterX - 8, game.player.y + 10);
        ctx.moveTo(chuteCenterX - 12, chuteY);
        ctx.lineTo(chuteCenterX - 4, game.player.y + 10);
        ctx.moveTo(chuteCenterX, chuteY);
        ctx.lineTo(chuteCenterX, game.player.y + 10);
        ctx.moveTo(chuteCenterX + 12, chuteY);
        ctx.lineTo(chuteCenterX + 4, game.player.y + 10);
        ctx.moveTo(chuteCenterX + 25, chuteY);
        ctx.lineTo(chuteCenterX + 8, game.player.y + 10);
        ctx.stroke();
        
        ctx.restore();
        
        // Draw parachute timer centered on player (if not in train mode)
        if (!game.player.isTrainMode) {
            this.drawParachuteTimer(game);
        }
    }
    
    static drawParachuteTimer(game) {
        const ctx = game.ctx;
        ctx.save();
        
        // Position timer directly on the player, centered (like train timer)
        const timerRadius = 39; // Use same radius as train timer
        const centerX = game.player.x + game.player.width / 2;
        const centerY = game.player.y + game.player.height / 2; // Centered on player
        
        // Calculate parachute time remaining
        const timePercent = Math.max(0, game.player.parachuteTimeLeft / 3);
        const secondsLeft = Math.ceil(game.player.parachuteTimeLeft);
        
        // Color based on time remaining and tap state (using train timer color logic)
        let circleColor, progressColor, textColor;
        if (game.player.parachuteTapping) {
            circleColor = '#00CC44'; // Green when tapping (like train timer green)
            progressColor = '#00FF55';
            textColor = '#00FF55';
        } else if (timePercent > 0.5) {
            circleColor = '#00CC44'; // Green when plenty of time
            progressColor = '#00FF55';
            textColor = '#00FF55';
        } else if (timePercent > 0.2) {
            circleColor = '#FF8C00'; // Orange when getting low
            progressColor = '#FF8C00';
            textColor = '#FF8C00';
        } else {
            circleColor = '#FF4444'; // Red when almost out
            progressColor = '#FF4444';
            textColor = '#FF4444';
        }
        
        // Draw timer background (completely transparent like train timer)
        ctx.beginPath();
        ctx.arc(centerX, centerY, timerRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0)'; // Completely transparent
        ctx.fill();
        ctx.strokeStyle = circleColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw progress arc (parachute time remaining)
        if (timePercent > 0) {
            ctx.beginPath();
            const startAngle = -Math.PI / 2;
            const endAngle = startAngle + (Math.PI * 2 * timePercent);
            ctx.arc(centerX, centerY, timerRadius - 2, startAngle, endAngle);
            ctx.strokeStyle = progressColor;
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
        
        // Draw countdown text using train timer style
        ctx.save();
        ctx.font = 'bold 32px Tiny5';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#000000';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 6;
        
        // Black drop shadow
        ctx.fillStyle = '#000000';
        ctx.fillText(`${secondsLeft}s`, centerX + 3, centerY + 3);
        
        // Colored text on top
        ctx.fillStyle = textColor;
        ctx.fillText(`${secondsLeft}s`, centerX, centerY);
        ctx.restore();
        
        ctx.restore();
    }
    
    static drawDebugHitboxes(game) {
        const ctx = game.ctx;
        
        // Player hitbox
        ctx.strokeStyle = 'lime';
        ctx.lineWidth = 2;
        ctx.strokeRect(game.player.x, game.player.y, game.player.width, game.player.height);

        // Obstacle hitboxes
        for (let obstacle of game.obstacles) {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
    }
    
    static drawSpeedDebug(game) {
        const ctx = game.ctx;
        ctx.save();
        
        // Larger retro-style background with border
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(10, 10, 280, 100);
        
        // Golden border
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, 280, 100);
        
        // Larger retro pixel font (no outline)
        ctx.font = 'bold 20px Tiny5';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        
        // Game Speed
        ctx.fillText(`SPEED: ${game.config.gameSpeed.toFixed(2)}`, 25, 40);
        
        // Base Speed
        ctx.fillText(`BASE: ${game.config.baseGameSpeed}`, 25, 65);
        
        // Max Speed
        ctx.fillText(`MAX: ${game.config.maxGameSpeed}`, 25, 90);
        
        ctx.restore();
    }
    
    static drawTrainModeUI(game) {
        const ctx = game.ctx;
        ctx.save();
        
        // Calculate train mode time remaining
        const timeRemaining = Math.max(0, game.player.trainModeDuration - game.player.trainModeTimer);
        const timePercent = timeRemaining / game.player.trainModeDuration;
        const secondsLeft = Math.ceil(timeRemaining / 1000);
        
        // Position timer directly on top of the train, centered
        const timerX = game.player.x + game.player.width / 2;
        const timerY = game.player.y + game.player.height / 2; // Centered on train
        const timerRadius = 39; // 25% larger again (31 * 1.25 = 38.75, rounded to 39)
        
        // Color based on time remaining (starting with green)
        let circleColor, progressColor, textColor;
        if (timePercent > 0.5) {
            circleColor = '#00CC44'; // Green when plenty of time
            progressColor = '#00FF55'; // Bright green progress
            textColor = '#00FF55'; // Bright green text
        } else if (timePercent > 0.2) {
            circleColor = '#FF8C00'; // Orange when getting low
            progressColor = '#FF8C00'; // Orange progress
            textColor = '#FF8C00'; // Orange text
        } else {
            circleColor = '#FF4444'; // Red when almost out
            progressColor = '#FF4444'; // Red progress
            textColor = '#FF4444'; // Red text
        }
        
        // Draw timer background (completely transparent)
        ctx.beginPath();
        ctx.arc(timerX, timerY, timerRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0)'; // Completely transparent
        ctx.fill();
        ctx.strokeStyle = circleColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw progress arc (train mode remaining time)
        if (timePercent > 0) {
            ctx.beginPath();
            const startAngle = -Math.PI / 2;
            const endAngle = startAngle + (Math.PI * 2 * timePercent);
            ctx.arc(timerX, timerY, timerRadius - 2, startAngle, endAngle);
            ctx.strokeStyle = progressColor;
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
        
        // Draw timer text with black drop shadow and color-changing based on time remaining
        ctx.font = 'bold 14px Tiny5';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Position countdown text based on whether parachute is also active
        const hasParachute = game.player.hasParachute && game.player.parachuteTimeLeft > 0;
        const countdownOffsetY = hasParachute ? 70 : -70; // Below circle if parachute active, above if not
        
        // Draw countdown using popup message style
        ctx.save();
        ctx.font = 'bold 32px Tiny5';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#000000';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 6;
        
        // Black drop shadow
        ctx.fillStyle = '#000000';
        ctx.fillText(`${secondsLeft}s`, timerX + 3, timerY + countdownOffsetY + 3);
        
        // Colored text on top
        ctx.fillStyle = textColor;
        ctx.fillText(`${secondsLeft}s`, timerX, timerY + countdownOffsetY);
        ctx.restore();
        
        // Draw "2X POINTS!" text centered and lower with glow effect
        const multiplierX = game.canvas.width / 2; // Centered horizontally
        const multiplierY = game.canvas.height * 0.3; // 30% down from top (50% lower than before)
        
        // Faster pulsing scale effect for attention
        const pulseTime = Date.now() % 800; // Faster pulse
        const pulseScale = 1 + 0.2 * Math.sin(pulseTime / 800 * Math.PI * 2);
        
        ctx.save();
        ctx.translate(multiplierX, multiplierY);
        ctx.scale(pulseScale, pulseScale);
        ctx.rotate(15 * Math.PI / 180); // Tilt 15 degrees
        
        // Add yellow glow effect
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        
        // Use same formatting as "VOTES" text
        ctx.font = 'bold 36px Tiny5'; // Bigger than VOTES
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Black shadow offset (same as VOTES)
        ctx.fillStyle = '#000000';
        ctx.fillText('2X POINTS!', 3, 3);
        
        // Yellow text on top with glow
        ctx.fillStyle = '#ffd700';
        ctx.fillText('2X POINTS!', 0, 0);
        
        ctx.restore();
        
        ctx.restore();
    }
    
    static drawTronTrail(game) {
        const ctx = game.ctx;
        
        ctx.save();
        
        // Simple TRON-style trail: just a line from start to current position
        const currentX = game.player.x + game.player.width / 2;
        const currentY = game.player.y + game.player.height / 2;
        
        // Main trail line (dark red)
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 8;
        ctx.lineCap = 'butt';
        
        ctx.beginPath();
        ctx.moveTo(game.player.trailStartX, game.player.trailStartY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        
        // Inner highlight line (gold)
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        
        ctx.beginPath();
        ctx.moveTo(game.player.trailStartX, game.player.trailStartY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        
        ctx.restore();
    }
    
    static drawTrailSegments(game) {
        const ctx = game.ctx;
        
        ctx.save();
        
        // Calculate timer colors to match trail
        const timeRemaining = Math.max(0, game.player.trainModeDuration - game.player.trainModeTimer);
        const timePercent = timeRemaining / game.player.trainModeDuration;
        
        let trailColor, glowColor;
        if (timePercent > 0.5) {
            trailColor = '#00FF55'; // Bright green like timer
            glowColor = '#00CC44';  // Green glow
        } else if (timePercent > 0.2) {
            trailColor = '#FF8C00'; // Orange like timer
            glowColor = '#FF8C00';  // Orange glow
        } else {
            trailColor = '#FF4444'; // Red like timer
            glowColor = '#FF4444';  // Red glow
        }
        
        // Draw connecting lines between segments for continuous effect
        if (game.trailSegments.length > 1) {
            ctx.strokeStyle = trailColor;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            ctx.moveTo(game.trailSegments[0].x, game.trailSegments[0].y);
            for (let i = 1; i < game.trailSegments.length; i++) {
                ctx.lineTo(game.trailSegments[i].x, game.trailSegments[i].y);
            }
            ctx.stroke();
        }
        
        // Draw each trail segment with glow effect
        for (let segment of game.trailSegments) {
            // Outer glow
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 15;
            ctx.fillStyle = glowColor;
            ctx.fillRect(segment.x - segment.width/2, segment.y - segment.height/2, segment.width, segment.height);
            
            // Inner core (brighter)
            ctx.shadowBlur = 8;
            ctx.fillStyle = trailColor;
            ctx.fillRect(segment.x - segment.width/3, segment.y - segment.height/3, segment.width/1.5, segment.height/1.5);
            
            // Bright center
            ctx.shadowBlur = 4;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(segment.x - segment.width/4, segment.y - segment.height/4, segment.width/2, segment.height/2);
        }
        
        ctx.restore();
    }
    
    static renderTutorialText(game) {
        const tutorialInfo = game.tutorialManager.getCurrentMessage();
        if (!tutorialInfo) return;
        
        const ctx = game.ctx;
        ctx.save();
        
        // Position tutorial text 50% lower from current position
        const textX = game.canvas.width / 2;
        const textY = game.canvas.height * 0.9; // 80% down from top (50% lower from 59%)
        
        // Calculate text dimensions for proper sizing
        ctx.font = 'bold 14px Tiny5';
        const maxWidth = game.canvas.width - 80;
        
        // Wrap the instruction text
        const words = tutorialInfo.instruction.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (let word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        
        // Calculate background height based on content
        const lineHeight = 18;
        const padding = 15;
        const backgroundHeight = padding * 2 + 20 + 20 + (lines.length * lineHeight);
        const backgroundWidth = game.canvas.width - 60;
        const backgroundX = 30;
        const backgroundY = textY - backgroundHeight/2;
        
        // Draw semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(backgroundX, backgroundY, backgroundWidth, backgroundHeight);
        
        // Draw golden border
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.strokeRect(backgroundX, backgroundY, backgroundWidth, backgroundHeight);
        
        // Draw progress indicator with navigation arrows
        const progressY = backgroundY + padding + 8;
        const canGoPrevious = game.tutorialManager.currentSection > 0;
        const canGoNext = game.tutorialManager.currentSection < game.tutorialManager.sections.length - 1;
        
        // Left arrow (previous section) - part of progress row
        if (canGoPrevious) {
            ctx.font = 'bold 16px Tiny5';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffd700';
            ctx.fillText('◀', textX - 80, progressY);
        }
        
        // Progress text in center
        ctx.font = 'bold 12px Tiny5';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(tutorialInfo.progress, textX, progressY);
        
        // Right arrow (next section) - part of progress row
        if (canGoNext) {
            ctx.font = 'bold 16px Tiny5';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffd700';
            ctx.fillText('▶', textX + 80, progressY);
        }
        
        // Draw title
        ctx.font = 'bold 16px Tiny5';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(tutorialInfo.title, textX, backgroundY + padding + 28);
        
        // Draw instruction lines
        ctx.font = 'bold 14px Tiny5';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], textX, backgroundY + padding + 50 + (i * lineHeight));
        }
        
        
        ctx.restore();
    }
    
    static renderTutorialCrashOverlay(game) {
        const ctx = game.ctx;
        ctx.save();
        
        // Draw red overlay with fade effect
        ctx.fillStyle = `rgba(255, 0, 0, ${game.tutorialCrashOverlay * 0.4})`; // Max 40% opacity
        ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
        
        ctx.restore();
    }
    
    static renderPauseArrow(game) {
        const ctx = game.ctx;
        ctx.save();
        
        // Calculate tutorial message box position (matching renderTutorialText)
        const textX = game.canvas.width / 2;
        const textY = game.canvas.height * 0.9;
        const backgroundWidth = game.canvas.width - 60;
        const backgroundX = 30;
        
        // Estimate background height (simplified calculation)
        const padding = 15;
        const backgroundHeight = padding * 2 + 20 + 20 + (2 * 18); // Roughly 2 lines for completion text
        const backgroundY = textY - backgroundHeight/2;
        
        // Start point: middle of right side of message box
        const startX = backgroundX + backgroundWidth;
        const startY = backgroundY + backgroundHeight / 2;
        
        // End point: center of left side of pause button
        // Button is 48x48px, positioned 32px from top and 8px from right
        const endX = game.canvas.width - 56; // Left edge of 48px button (8px margin + 48px width)
        const endY = 56; // Vertical center of button (32px top margin + 24px to center)
        
        // Animation values
        const time = Date.now() % 2000; // 2 second cycle
        const animationProgress = time / 2000;
        const bounce = Math.sin(animationProgress * Math.PI * 4) * 10; // Bouncing effect
        
        // Draw arrow line with animation
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 8;
        
        // Animated dashed line
        ctx.setLineDash([10, 5]);
        ctx.lineDashOffset = -time * 0.02; // Moving dashes
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        // Create an extremely dramatic S-curve path to the pause button
        const controlPoint1X = startX + 100;
        const controlPoint1Y = startY - 300 + bounce; // Very high arc up
        const controlPoint2X = endX - 300;
        const controlPoint2Y = endY - 50 - bounce; // Deep curve down
        
        ctx.bezierCurveTo(controlPoint1X, controlPoint1Y, controlPoint2X, controlPoint2Y, endX, endY);
        ctx.stroke();
        
        // Reset line dash for arrowhead
        ctx.setLineDash([]);
        
        // Draw arrowhead at pause button
        const arrowSize = 15 + Math.sin(animationProgress * Math.PI * 6) * 3; // Pulsing size
        const angle = Math.atan2(endY - controlPoint2Y, endX - controlPoint2X); // Angle from final control point
        
        ctx.save();
        ctx.translate(endX, endY);
        ctx.rotate(angle);
        
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-arrowSize, -arrowSize/2);
        ctx.lineTo(-arrowSize, arrowSize/2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        // Add pulsing text near the curve peak
        const labelX = controlPoint1X;
        const labelY = controlPoint1Y - 20;
        
        ctx.font = 'bold 14px Tiny5';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000000';
        ctx.fillText('Pause to return', labelX + 2, labelY + 2); // Shadow
        ctx.fillStyle = '#ffd700';
        ctx.fillText('Pause to return', labelX, labelY);
        
        ctx.restore();
    }
    
    static renderPopups(game) {
        const ctx = game.ctx;
        for (const p of game.popups) {
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
}
