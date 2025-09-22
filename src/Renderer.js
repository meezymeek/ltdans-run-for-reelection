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
        
        // Draw Score UI FIRST (before player and other entities)
        this.renderScoreUI(game);
        
        // Draw TRON-style trail segments BEFORE player (so they appear behind)
        if (game.gameState === 'playing' && game.trailSegments.length > 0) {
            this.drawTrailSegments(game);
        }
        
        // Draw player or ragdoll depending on state
        if (game.gameState === 'crashing' && game.ragdoll) {
            // Draw ragdoll
            game.ragdoll.render(ctx);
        } else if (game.gameState === 'playing') {
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
            if (obstacle.type === 'tall' && !obstacle.isRagdolled) {
                // Draw articulated tall obstacles (animated characters)
                this.drawArticulatedObstacle(game, obstacle);
            } else {
                // Draw simple obstacles (low obstacles or ragdolled tall obstacles)
                obstacle.render(ctx);
            }
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
        if (game.gameState === 'playing' && game.player.isTrainMode) {
            this.drawTrainModeUI(game);
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
        
        // Draw score number with block black shadow (centered, even bigger)
        ctx.font = 'bold 80px Tiny5';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Black shadow offset
        ctx.fillStyle = '#000000';
        ctx.fillText(game.score.toString(), centerX + 4, topY + 74);
        // White text on top
        ctx.fillStyle = '#ffffff';
        ctx.fillText(game.score.toString(), centerX, topY + 70);
        
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
    
    static drawArticulatedObstacle(game, obstacle) {
        const centerX = obstacle.x + obstacle.width / 2;
        const topY = obstacle.y;
        
        // Body proportions (slightly different from player for variety)
        const headHeight = obstacle.height * 0.35; // Slightly bigger head
        const torsoHeight = obstacle.height * 0.32; // Slightly smaller torso
        const legHeight = obstacle.height * 0.33;
        
        // Save context
        game.ctx.save();
        
        // Draw layers in correct z-order for side profile
        const hipY = topY + headHeight + torsoHeight;
        const thighLength = legHeight * 0.5;
        const shinLength = legHeight * 0.5;
        
        // 1. Draw right leg FIRST (behind torso)
        this.drawObstacleLimb(game, obstacle,
            centerX + 3, // Slightly different offset than player
            hipY,
            obstacle.rightLegAngle,
            thighLength,
            obstacle.rightKneeAngle,
            shinLength,
            12, // Slightly thicker than player limbs
            'thigh',
            'shin'
        );
        
        // 2. Draw back arm (behind torso)
        const torsoY = topY + headHeight;
        const shoulderY = torsoY + 6;
        const armLength = torsoHeight * 0.55; // Slightly different proportions

        // Per feedback: the 90° arm (leftArmAngle) should be below the body layer
        this.drawObstacleLimb(game, obstacle,
            centerX + 2, // Slight offset
            shoulderY,
            obstacle.leftArmAngle,
            armLength,
            obstacle.leftElbowAngle,
            armLength * 0.75,
            10, // Thicker than player arms
            'upper_arm',
            'forearm'
        );

        // 3. Draw torso (center)
        const torsoImage = (obstacle.skinImages.torso && obstacle.skinImages.torso.complete)
            ? obstacle.skinImages.torso
            : ((game.skinImages && game.skinImages.torso && game.skinImages.torso.complete) ? game.skinImages.torso : null);
        if (torsoImage) {
            game.ctx.drawImage(
                torsoImage,
                centerX - obstacle.width/2 + 3,
                torsoY,
                obstacle.width - 6,
                torsoHeight
            );
        } else {
            // Fallback to solid color
            game.ctx.fillStyle = obstacle.color;
            game.ctx.fillRect(
                centerX - obstacle.width/2 + 3,
                torsoY,
                obstacle.width - 6,
                torsoHeight
            );
        }
        
        // 3. Draw head (shifted right for side profile with animation)
        const headOffset = 6;
        
        // Save context for head transformation
        game.ctx.save();
        
        // Apply head animation transformations
        const headX = centerX - obstacle.width/2 + headOffset + obstacle.headXOffset;
        const headY = topY - obstacle.headYOffset;
        
        // Apply rotation around the head center
        const headCenterX = headX + (obstacle.width - headOffset) / 2;
        const headCenterY = headY + headHeight / 2;
        game.ctx.translate(headCenterX, headCenterY);
        game.ctx.rotate(obstacle.headRotation * Math.PI / 180);
        game.ctx.translate(-headCenterX, -headCenterY);
        
        // Choose which head to use based on breathing state
        const headImageName = obstacle.isBreathingOut ? 'head-open-mouth' : 'head';
        const headImage = (obstacle.skinImages[headImageName] && obstacle.skinImages[headImageName].complete)
            ? obstacle.skinImages[headImageName]
            : ((game.skinImages && game.skinImages[headImageName] && game.skinImages[headImageName].complete) ? game.skinImages[headImageName] : null);
        
        if (headImage) {
            game.ctx.drawImage(
                headImage,
                headX,
                headY,
                obstacle.width - headOffset,
                headHeight
            );
        } else {
            // Fallback to solid color
            game.ctx.fillStyle = obstacle.color;
            game.ctx.fillRect(
                headX,
                headY,
                obstacle.width - headOffset,
                headHeight
            );
        }
        
        // Restore context after head transformation
        game.ctx.restore();
        
        // 4. Draw front arm (in front of torso)
        // Per feedback: the other arm (rightArmAngle) should be above the body layer
        this.drawObstacleLimb(game, obstacle,
            centerX,
            shoulderY,
            obstacle.rightArmAngle,
            armLength,
            obstacle.rightElbowAngle,
            armLength * 0.75,
            10, // Thicker than player arms
            'upper_arm',
            'forearm'
        );
        
        // 5. Draw left leg LAST (in front)
        this.drawObstacleLimb(game, obstacle,
            centerX - 3, // Slightly different offset than player
            hipY,
            obstacle.leftLegAngle,
            thighLength,
            obstacle.leftKneeAngle,
            shinLength,
            12,
            'thigh',
            'shin'
        );
        
        game.ctx.restore();
    }
    
    static drawObstacleLimb(game, obstacle, startX, startY, angle1, length1, angle2, length2, width, upperSkinName, lowerSkinName) {
        const ctx = game.ctx;
        ctx.save();
        
        // Upper limb
        ctx.translate(startX, startY);
        ctx.rotate(angle1 * Math.PI / 180);
        
        const upperSkin = (obstacle.skinImages[upperSkinName] && obstacle.skinImages[upperSkinName].complete)
            ? obstacle.skinImages[upperSkinName]
            : ((game.skinImages && game.skinImages[upperSkinName] && game.skinImages[upperSkinName].complete) ? game.skinImages[upperSkinName] : null);
        if (upperSkin && upperSkin.complete) {
            // Draw skinned upper limb
            ctx.drawImage(upperSkin, -width/2, 0, width, length1);
        } else {
            // Fallback to solid color
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.strokeStyle = obstacle.color;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, length1);
            ctx.stroke();
        }
        
        // Lower limb
        ctx.translate(0, length1);
        ctx.rotate(angle2 * Math.PI / 180);
        
        const lowerSkin = (obstacle.skinImages[lowerSkinName] && obstacle.skinImages[lowerSkinName].complete)
            ? obstacle.skinImages[lowerSkinName]
            : ((game.skinImages && game.skinImages[lowerSkinName] && game.skinImages[lowerSkinName].complete) ? game.skinImages[lowerSkinName] : null);
        if (lowerSkin && lowerSkin.complete) {
            // Draw skinned lower limb
            ctx.drawImage(lowerSkin, -width/2, 0, width, length2);
        } else {
            // Fallback to solid color
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.strokeStyle = obstacle.color;
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
        
        // Draw parachute timer at smoothly animated position (if player has tapped and not in train mode)
        if (game.player.timerX && game.player.timerY && !game.player.isTrainMode) {
            this.drawParachuteTimer(game);
        }
    }
    
    static drawParachuteTimer(game) {
        const ctx = game.ctx;
        ctx.save();
        
        // Radial timer configuration
        const timerRadius = 35;
        const innerRadius = 25;
        const padding = 10;
        
        // Calculate center position with bounds checking
        let centerX = game.player.timerX;
        let centerY = game.player.timerY;
        
        // Ensure timer stays within screen bounds
        centerX = Math.max(timerRadius + padding, Math.min(centerX, game.canvas.width - timerRadius - padding));
        centerY = Math.max(timerRadius + padding, Math.min(centerY, game.canvas.height - timerRadius - padding));
        
        // Apply tap pulse scaling
        const scale = game.player.tapPulseScale;
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        
        // Time remaining calculation
        const timePercent = Math.max(0, game.player.parachuteTimeLeft / 3);
        const timeLeft = Math.ceil(game.player.parachuteTimeLeft);
        
        // Color based on time remaining and tap state
        let ringColor, progressColor, textColor;
        if (game.player.parachuteTapping) {
            ringColor = '#00ff88';
            progressColor = '#44ff88';
            textColor = '#00ff88';
        } else if (timePercent > 0.5) {
            ringColor = '#ffd700';
            progressColor = '#ffed4e';
            textColor = '#ffd700';
        } else if (timePercent > 0.2) {
            ringColor = '#ff8c00';
            progressColor = '#ffaa44';
            textColor = '#ff8c00';
        } else {
            ringColor = '#ff4444';
            progressColor = '#ff6666';
            textColor = '#ff4444';
        }
        
        // Draw outer ring background
        ctx.beginPath();
        ctx.arc(0, 0, timerRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fill();
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw progress arc (clockwise from top)
        if (timePercent > 0) {
            ctx.beginPath();
            const startAngle = -Math.PI / 2; // Start from top
            const endAngle = startAngle + (Math.PI * 2 * timePercent); // Progress clockwise
            ctx.arc(0, 0, timerRadius - 2, startAngle, endAngle);
            ctx.strokeStyle = progressColor;
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
        
        // Draw inner circle
        ctx.beginPath();
        ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fill();
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw "TAP!" text with pulsing effect
        ctx.font = 'bold 14px Tiny5';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add glow effect when tapping
        if (game.player.parachuteTapping) {
            ctx.shadowColor = textColor;
            ctx.shadowBlur = 8;
            ctx.globalAlpha = 1.0;
        } else {
            // Subtle pulse animation when not tapping
            const pulseTime = Date.now() % 1000;
            ctx.globalAlpha = 0.7 + 0.3 * Math.sin(pulseTime / 1000 * Math.PI * 2);
        }
        
        ctx.fillStyle = textColor;
        ctx.fillText('TAP!', 0, -2);
        
        // Draw small time indicator at bottom
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.8;
        ctx.font = 'bold 8px Tiny5';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${timeLeft}s`, 0, 12);
        
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
