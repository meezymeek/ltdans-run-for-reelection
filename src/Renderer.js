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
        
        // Draw ground line
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, game.player.groundY);
        ctx.lineTo(game.canvas.width, game.player.groundY);
        ctx.stroke();
        
        // Draw Score UI FIRST (before player and other entities)
        this.renderScoreUI(game);
        
        // Draw player or ragdoll depending on state
        if (game.gameState === 'crashing' && game.ragdoll) {
            // Draw ragdoll
            game.ragdoll.render(ctx);
        } else if (game.gameState === 'playing') {
            // Draw articulated player (Lt. Dan)
            this.drawArticulatedPlayer(game);
            
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
        
        // Draw parachute timer at smoothly animated position (if player has tapped)
        if (game.player.timerX && game.player.timerY) {
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
