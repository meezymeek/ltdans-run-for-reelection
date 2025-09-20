// Player Entity Class
import { PLAYER_CONFIG, GAME_CONFIG } from '../constants/GameConfig.js';
import { getScaleManager } from '../utils/ScaleManager.js';

export class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.scaleManager = getScaleManager();
        
        // Position and dimensions (percentage-based)
        this.xPercent = PLAYER_CONFIG.startXPercent;
        this.widthPercent = PLAYER_CONFIG.widthPercent;
        this.heightPercent = PLAYER_CONFIG.heightPercent;
        this.velocityYPercent = 0;
        this.groundYPercent = GAME_CONFIG.groundLevelPercent;
        
        // Position player on ground (groundLevel - playerHeight)
        this.yPercent = this.groundYPercent - this.heightPercent; // 0.8 - 0.1 = 0.7 (70% from top)
        
        // Pixel values (computed from percentages for rendering)
        this.x = this.scaleManager.toPixelsX(this.xPercent);
        this.y = this.scaleManager.toPixelsY(this.yPercent);
        this.width = this.scaleManager.toPixelsX(this.widthPercent);
        this.height = this.scaleManager.toPixelsY(this.heightPercent);
        this.velocityY = this.scaleManager.velocityToPixels(this.velocityYPercent);
        this.groundY = this.scaleManager.toPixelsY(this.groundYPercent);
        
        this.isJumping = false;
        this.color = PLAYER_CONFIG.color;
        
        // Parachute properties
        this.hasParachute = false;
        this.parachuteUsedThisJump = false;
        this.parachuteActivationHeight = 0;
        this.parachuteTimeLeft = 0;
        this.parachuteTapping = false;
        this.lastTapTime = 0;
        
        // Touch tracking for timer display
        this.lastTouchX = 0;
        this.lastTouchY = 0;
        this.timerX = 0;
        this.timerY = 0;
        this.timerTargetX = 0;
        this.timerTargetY = 0;
        
        // Tap feedback animation properties
        this.tapPulseScale = 1.0;
        this.tapPulseTarget = 1.0;
        this.lastTapAnimTime = 0;
        this.tapEffectActive = false;
        
        // Animation properties
        this.animationFrame = 0;
        this.runCycle = 0;
        this.animationSpeed = PLAYER_CONFIG.animationSpeed;
        
        // Joint angles for animation
        this.leftLegAngle = 0;
        this.rightLegAngle = 0;
        this.leftKneeAngle = 0;
        this.rightKneeAngle = 0;
        this.leftArmAngle = 0;
        this.rightArmAngle = 0;
        this.leftElbowAngle = 0;
        this.rightElbowAngle = 0;
        
        // Head animation properties
        this.headYOffset = 0;
        this.headXOffset = 0;
        this.headRotation = 0;
        this.headYOffsetTarget = 0;
        this.headXOffsetTarget = 0;
        this.headRotationTarget = 0;
        
        // Breathing animation
        this.breathingCycle = 0;
        this.isBreathingOut = false;
        
        // Train mode properties
        this.isTrainMode = false;
        this.trainModeTimer = 0;
        this.trainModeDuration = 5000; // 5 seconds in milliseconds
        this.originalWidthPercent = this.widthPercent;
        this.trainWidthPercent = this.widthPercent * 2; // Double width
        this.trainModeStartTime = 0;
        
        // Position lerping for train mode
        this.originalXPercent = this.xPercent;
        this.trainXPercent = 0.15; // Move forward to 15% from left (closer to middle)
        this.targetXPercent = this.xPercent;
        this.positionLerpRate = 0.03; // Slower transition rate for more dramatic effect
        
        // Simple TRON-style trail (just track position history)
        this.trailStartX = 0;
        this.trailStartY = 0;
        this.isDrawingTrail = false;
    }
    
    setGroundY(groundY) {
        this.groundYPercent = this.scaleManager.toPercentageY(groundY);
        this.groundY = groundY;
        this.yPercent = this.groundYPercent - this.heightPercent;
        this.y = this.scaleManager.toPixelsY(this.yPercent);
        // Update dimensions
        this.width = this.scaleManager.toPixelsX(this.widthPercent);
        this.height = this.scaleManager.toPixelsY(this.heightPercent);
    }
    
    jump() {
        if (!this.isJumping) {
            this.velocityYPercent = GAME_CONFIG.jumpPowerPercent;
            this.velocityY = this.scaleManager.velocityToPixels(this.velocityYPercent);
            this.isJumping = true;
            return true; // Successfully jumped
        }
        return false; // Couldn't jump (already jumping)
    }
    
    activateParachute(touchX, touchY) {
        // Update touch position - center timer on touch location
        if (touchX !== undefined && touchY !== undefined) {
            this.lastTouchX = touchX;
            this.lastTouchY = touchY;
            this.timerTargetX = touchX;
            this.timerTargetY = touchY; // No offset - center on tap
            
            // Initialize current position if first tap
            if (this.timerX === 0 && this.timerY === 0) {
                this.timerX = touchX;
                this.timerY = touchY;
            }
        }
        
        // Only allow parachute tapping if parachute is active AND has time remaining
        if (this.hasParachute && this.parachuteTimeLeft > 0) {
            // Register tap to maintain parachute
            this.lastTapTime = Date.now();
            
            // Trigger tap feedback animation
            this.tapEffectActive = true;
            this.tapPulseTarget = 1.3; // Scale up on tap
            this.lastTapAnimTime = Date.now();
            
            // Apply boost force using percentage-based physics
            this.velocityYPercent -= PLAYER_CONFIG.parachuteBoostForcePercent;
            this.velocityY = this.scaleManager.velocityToPixels(this.velocityYPercent);
            
            return true;
        }
        return false;
    }
    
    giveParachute() {
        // Only give parachute if we don't already have one
        if (!this.hasParachute) {
            this.hasParachute = true;
            this.parachuteUsedThisJump = false; // Reset this flag
            this.parachuteTimeLeft = PLAYER_CONFIG.parachuteMaxTime; // Already in seconds
            this.lastTapTime = 0;
            this.parachuteActivationHeight = this.y;
            // Initialize timer position to be centered slightly above player
            this.timerTargetX = this.x + this.width / 2;
            this.timerTargetY = this.y + this.height / 2; // Center on player initially
            this.timerX = this.timerTargetX;
            this.timerY = this.timerTargetY;
            
            // Reset tap animation properties
            this.tapPulseScale = 1.0;
            this.tapPulseTarget = 1.0;
            this.tapEffectActive = false;
            
            return true; // Parachute given
        }
        return false; // Already had parachute
    }
    
    activateTrainMode() {
        // Activate train mode transformation
        if (!this.isTrainMode) {
            this.isTrainMode = true;
            this.trainModeStartTime = Date.now();
            this.trainModeTimer = 0;
            
            // Transform to train width
            this.widthPercent = this.trainWidthPercent;
            this.width = this.scaleManager.toPixelsX(this.widthPercent);
            
            // Set target position to move forward
            this.targetXPercent = this.trainXPercent;
            
            // Start TRON trail at current position
            this.trailStartX = this.x + this.width / 2;
            this.trailStartY = this.y + this.height / 2;
            this.isDrawingTrail = true;
            
            // If player has parachute, sync parachute timer to train timer
            if (this.hasParachute && this.parachuteTimeLeft > 0) {
                this.parachuteTimeLeft = this.trainModeDuration / 1000; // Convert to seconds
                console.log('Syncing parachute timer to train mode duration:', this.parachuteTimeLeft, 'seconds');
            }
            
            return true; // Train mode activated
        }
        return false; // Already in train mode
    }
    
    deactivateTrainMode() {
        // Deactivate train mode transformation
        if (this.isTrainMode) {
            this.isTrainMode = false;
            this.trainModeTimer = 0;
            
            // Restore original width
            this.widthPercent = this.originalWidthPercent;
            this.width = this.scaleManager.toPixelsX(this.widthPercent);
            
            // Set target position to return to original
            this.targetXPercent = this.originalXPercent;
            
            // Stop drawing trail
            this.isDrawingTrail = false;
            
            return true; // Train mode deactivated
        }
        return false; // Wasn't in train mode
    }
    
    update(config, deltaTime) {
        // Smoothly animate timer position
        const timerLerpSpeed = 0.18;
        this.timerX += (this.timerTargetX - this.timerX) * timerLerpSpeed;
        this.timerY += (this.timerTargetY - this.timerY) * timerLerpSpeed;
        
        // Update tap pulse animation
        if (this.tapEffectActive) {
            const now = Date.now();
            const timeSinceTap = now - this.lastTapAnimTime;
            
            if (timeSinceTap > 200) {
                // Animation finished, reset to normal
                this.tapEffectActive = false;
                this.tapPulseTarget = 1.0;
            }
        }
        
        // Smooth pulse scale animation
        const pulseLerpSpeed = 0.25;
        this.tapPulseScale += (this.tapPulseTarget - this.tapPulseScale) * pulseLerpSpeed;
        
        // Update train mode timer
        if (this.isTrainMode) {
            this.trainModeTimer += deltaTime;
            
            if (this.trainModeTimer >= this.trainModeDuration) {
                // Train mode expired
                this.deactivateTrainMode();
            }
        }
        
        // Lerp player position for train mode visual effect
        this.xPercent += (this.targetXPercent - this.xPercent) * this.positionLerpRate;
        this.x = this.scaleManager.toPixelsX(this.xPercent);
        
        // Update parachute state
        if (this.hasParachute && this.parachuteTimeLeft > 0) {
            // Convert deltaTime from ms to seconds and decrement
            const deltaSeconds = deltaTime / 1000;
            this.parachuteTimeLeft -= deltaSeconds;
            
            if (this.parachuteTimeLeft <= 0) {
                // Parachute expired - force it to disappear
                this.hasParachute = false;
                this.parachuteTimeLeft = 0;
                this.parachuteTapping = false;
                this.lastTapTime = 0;
                this.velocityY = Math.max(this.velocityY, 2);
            } else {
                // Check tapping state
                const now = Date.now();
                const timeSinceLastTap = now - this.lastTapTime;
                this.parachuteTapping = this.lastTapTime > 0 && 
                    timeSinceLastTap < PLAYER_CONFIG.parachuteTapWindow;
            }
        } else {
            // No parachute or time expired
            if (this.hasParachute) {
                this.hasParachute = false;
            }
            this.parachuteTapping = false;
            this.lastTapTime = 0;
            this.parachuteTimeLeft = 0;
        }
        
        // Apply gravity
        if (this.hasParachute && this.parachuteTimeLeft > 0) {
            if (this.parachuteTapping && this.velocityYPercent > 0) {
                // Tapping - slight upward force
                this.velocityYPercent += GAME_CONFIG.gravityPercent * -0.02;
            } else {
                // Not tapping but has parachute - reduced gravity
                this.velocityYPercent += GAME_CONFIG.gravityPercent * PLAYER_CONFIG.parachuteGravityModifier;
            }
        } else {
            // Normal gravity
            this.velocityYPercent += GAME_CONFIG.gravityPercent;
        }
        
        // Update position
        this.yPercent += this.velocityYPercent;
        
        // Sync pixel values for rendering
        this.y = this.scaleManager.toPixelsY(this.yPercent);
        this.width = this.scaleManager.toPixelsX(this.widthPercent);
        this.height = this.scaleManager.toPixelsY(this.heightPercent);
        this.velocityY = this.scaleManager.velocityToPixels(this.velocityYPercent);
        
        // Ground collision
        const groundYPercent = this.groundYPercent - this.heightPercent;
        if (this.yPercent >= groundYPercent) {
            this.yPercent = groundYPercent;
            this.velocityYPercent = 0;
            this.y = this.scaleManager.toPixelsY(this.yPercent);
            this.velocityY = 0;
            this.isJumping = false;
            this.hasParachute = false;
            this.parachuteUsedThisJump = false;
            this.parachuteTimeLeft = 0;
        }
        
        // Update animation
        this.updateAnimation();
    }
    
    updateAnimation() {
        if (!this.isJumping) {
            // Running animation
            this.animationFrame += this.animationSpeed;
            const runPhase = (this.animationFrame % 4) / 4 * Math.PI * 2;
            
            // Leg animation
            this.leftLegAngle = -Math.sin(runPhase) * 30;
            this.rightLegAngle = -Math.sin(runPhase + Math.PI) * 30;
            this.leftKneeAngle = Math.max(0, Math.sin(runPhase) * 45);
            this.rightKneeAngle = Math.max(0, Math.sin(runPhase + Math.PI) * 45);
            
            // Arm swing
            const leftSwing = Math.sin(runPhase + Math.PI);
            const rightSwing = Math.sin(runPhase);
            this.leftArmAngle = 50 + (leftSwing > 0 ? leftSwing * 35 : leftSwing * 40);
            this.rightArmAngle = 50 + (rightSwing > 0 ? rightSwing * 35 : rightSwing * 40);
            this.leftElbowAngle = -Math.abs(Math.sin(runPhase + Math.PI)) * 85;
            this.rightElbowAngle = -Math.abs(Math.sin(runPhase)) * 85;
            
            // Breathing animation
            this.breathingCycle += PLAYER_CONFIG.breathingRate;
            const breathPhase = Math.sin(this.breathingCycle);
            this.isBreathingOut = breathPhase > 0.3;
            
            // Head animation
            this.headYOffsetTarget = Math.abs(Math.sin(runPhase)) * 3.5;
            this.headXOffsetTarget = Math.sin(runPhase * 0.5) * 2;
            this.headRotationTarget = Math.sin(runPhase * 0.5) * 4;
            
            // Apply lerp
            const lerpFactor = 0.15;
            this.headYOffset += (this.headYOffsetTarget - this.headYOffset) * lerpFactor;
            this.headXOffset += (this.headXOffsetTarget - this.headXOffset) * lerpFactor;
            this.headRotation += (this.headRotationTarget - this.headRotation) * lerpFactor;
            
        } else if (this.hasParachute) {
            // Parachuting animation
            this.leftLegAngle = 0;
            this.rightLegAngle = 0;
            this.leftKneeAngle = 0;
            this.rightKneeAngle = 0;
            this.leftArmAngle = 160;
            this.rightArmAngle = 160;
            this.leftElbowAngle = 0;
            this.rightElbowAngle = 0;
            
            // Head looking down
            this.headYOffsetTarget = 1;
            this.headXOffsetTarget = 0;
            this.headRotationTarget = 3;
            
            const parachuteLerpFactor = 0.2;
            this.headYOffset += (this.headYOffsetTarget - this.headYOffset) * parachuteLerpFactor;
            this.headXOffset += (this.headXOffsetTarget - this.headXOffset) * parachuteLerpFactor;
            this.headRotation += (this.headRotationTarget - this.headRotation) * parachuteLerpFactor;
            
        } else {
            // Regular jumping animation
            this.leftLegAngle = -15;
            this.rightLegAngle = -15;
            this.leftKneeAngle = 20;
            this.rightKneeAngle = 20;
            this.leftArmAngle = 180;
            this.rightArmAngle = 180;
            this.leftElbowAngle = 0;
            this.rightElbowAngle = 0;
            
            // Head tilted back
            this.headYOffsetTarget = -2;
            this.headXOffsetTarget = 0;
            this.headRotationTarget = -5;
            
            const jumpLerpFactor = 0.25;
            this.headYOffset += (this.headYOffsetTarget - this.headYOffset) * jumpLerpFactor;
            this.headXOffset += (this.headXOffsetTarget - this.headXOffset) * jumpLerpFactor;
            this.headRotation += (this.headRotationTarget - this.headRotation) * jumpLerpFactor;
        }
    }
    
    reset(groundY) {
        if (groundY !== undefined) {
            this.setGroundY(groundY);
        } else {
            // Reset to default ground position
            this.groundYPercent = GAME_CONFIG.groundLevelPercent;
            this.yPercent = this.groundYPercent - this.heightPercent;
            this.groundY = this.scaleManager.toPixelsY(this.groundYPercent);
            this.y = this.scaleManager.toPixelsY(this.yPercent);
        }
        
        // Update dimensions
        this.width = this.scaleManager.toPixelsX(this.widthPercent);
        this.height = this.scaleManager.toPixelsY(this.heightPercent);
        
        this.velocityYPercent = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.hasParachute = false;
        this.parachuteUsedThisJump = false;
        this.parachuteTimeLeft = 0;
        this.parachuteTapping = false;
        this.lastTapTime = 0;
        this.animationFrame = 0;
        this.breathingCycle = 0;
        this.headYOffset = 0;
        this.headXOffset = 0;
        this.headRotation = 0;
        
        // Reset tap animation properties
        this.tapPulseScale = 1.0;
        this.tapPulseTarget = 1.0;
        this.tapEffectActive = false;
        
        // Reset train mode and position
        this.isTrainMode = false;
        this.trainModeTimer = 0;
        this.trainModeStartTime = 0;
        this.widthPercent = this.originalWidthPercent;
        this.xPercent = this.originalXPercent;
        this.targetXPercent = this.originalXPercent;
        
        // Clear trail
        this.isDrawingTrail = false;
        this.trailStartX = 0;
        this.trailStartY = 0;
    }
    
    launchHigh() {
        // Used when stomping on constituent - also gives parachute
        this.velocityYPercent = -0.025; // Convert to percentage-based
        this.velocityY = this.scaleManager.velocityToPixels(this.velocityYPercent);
        this.isJumping = true;
        this.giveParachute();
    }
    
    launchToHeight(targetHeightRatio) {
        // Percentage-based launch calculation
        const targetYPercent = targetHeightRatio;
        const distanceToTravelPercent = this.yPercent - targetYPercent;
        
        // If we're already above the target, just give a small boost
        if (distanceToTravelPercent <= 0) {
            this.velocityYPercent = -0.0125; // Smaller boost for smoother feel
            this.isJumping = true;
            this.velocityY = this.scaleManager.velocityToPixels(this.velocityYPercent);
            this.giveParachute();
            return;
        }
        
        // Calculate required initial velocity using physics formula
        // v² = u² + 2as, where final velocity v = 0 at peak
        // So: u = sqrt(2 * g * distance)
        const gravityPercent = GAME_CONFIG.gravityPercent;
        const requiredVelocityPercent = -Math.sqrt(2 * gravityPercent * distanceToTravelPercent);
        
        // Apply 85% of the calculated velocity for a slightly softer launch
        this.velocityYPercent = requiredVelocityPercent * 0.85;
        this.velocityY = this.scaleManager.velocityToPixels(this.velocityYPercent);
        this.isJumping = true;
        
        // Give parachute
        this.giveParachute();
    }
}
