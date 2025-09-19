// Constituent Entity Class (Stompable Enemy)
import { ENTITY_DIMENSIONS, ENTITY_DIMENSIONS_PERCENT, VISUAL_CONFIG } from '../constants/GameConfig.js';
import { getScaleManager } from '../utils/ScaleManager.js';

export class Constituent {
    constructor(canvas) {
        this.canvas = canvas;
        this.scaleManager = getScaleManager();
        
        // Dimensions (percentage-based)
        const dimensions = ENTITY_DIMENSIONS_PERCENT.constituent;
        this.widthPercent = dimensions.widthPercent;
        this.heightPercent = dimensions.heightPercent;
        this.originalWidthPercent = dimensions.widthPercent;
        this.originalHeightPercent = dimensions.heightPercent;
        
        // Position (percentages)
        this.xPercent = 1.083; // 108.3% (off-screen right)
        this.yPercent = 0; // Will be set based on ground level
        this.speedPercent = 0; // Will be set by game speed
        
        // Pixel values (computed from percentages for rendering)
        this.width = this.scaleManager.toPixelsX(this.widthPercent);
        this.height = this.scaleManager.toPixelsY(this.heightPercent);
        this.originalWidth = this.width;
        this.originalHeight = this.height;
        this.x = this.scaleManager.toPixelsX(this.xPercent);
        this.y = this.scaleManager.toPixelsY(this.yPercent);
        this.speed = this.scaleManager.velocityToPixels(this.speedPercent, 'width');
        
        // Movement
        this.animationFrame = Math.random() * 4;
        this.walkDirection = 1;
        
        // Visual
        this.color = VISUAL_CONFIG.constituentColor;
        
        // Squash and stretch animation state
        this.isBeingStomped = false;
        this.stompAnimationTime = 0;
        this.scaleX = 1;
        this.scaleY = 1;
        this.targetScaleX = 1;
        this.targetScaleY = 1;
        
        // Launch physics
        this.launchVelocityX = 0;
        this.launchVelocityY = 0;
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.opacity = 1;
    }
    
    setPosition(groundY) {
        const groundYPercent = this.scaleManager.toPercentageY(groundY);
        this.yPercent = groundYPercent - this.heightPercent;
        this.y = this.scaleManager.toPixelsY(this.yPercent);
    }
    
    setSpeed(speed) {
        // Constituents move slower than obstacles
        this.speedPercent = this.scaleManager.velocityToPercentage(speed * 0.8, 'width');
        this.speed = speed * 0.8; // Keep pixel speed for compatibility
    }
    
    update(deltaTime) {
        if (this.isBeingStomped) {
            this.updateStompAnimation(deltaTime);
        } else {
            // Normal movement in percentage space
            this.xPercent -= this.speedPercent;
            this.x = this.scaleManager.toPixelsX(this.xPercent);
            // Walking animation
            this.animationFrame += 0.1;
        }
    }
    
    updateStompAnimation(deltaTime) {
        // Update animation time
        this.stompAnimationTime += deltaTime;
        const t = this.stompAnimationTime;
        
        // Lerp speed for smooth transitions
        const lerpSpeed = 0.25;
        
        if (t < 120) {
            // Phase 1: SQUASHING (0-120ms)
            const progress = t / 120;
            const ease = this.easeOutQuad(progress);
            
            // Set target values for squash
            this.targetScaleY = 1 - (ease * 0.75);  // Compress to 25% of original height
            this.targetScaleX = 1 + (ease * 0.75);   // Expand to 175% of original width
            
        } else if (t < 250) {
            // Phase 2: STRETCHING (120-250ms)
            const progress = (t - 120) / 130;
            const ease = this.easeOutElastic(progress);
            
            // Set target values for spring up
            this.targetScaleY = 0.25 + (ease * 1.25);  // Spring to 150% height
            this.targetScaleX = 1.75 - (ease * 1.15);   // Contract to 60% width
            
            // Prepare launch velocities late in the phase
            if (t >= 220 && this.launchVelocityX === 0) {
                this.launchVelocityX = -8;
                this.launchVelocityY = -24;
                this.rotationSpeed = (Math.random() - 0.5) * 0.4;
            }
            
        } else {
            // Phase 3: LAUNCHING (250-500ms)
            const progress = Math.min((t - 250) / 250, 1);
            
            // Maintain stretched proportions as targets
            this.targetScaleY = 1.5;
            this.targetScaleX = 0.6;
            
            // Apply launch physics
            this.launchVelocityY += 0.6; // Gravity
            this.x += this.launchVelocityX;
            this.y += this.launchVelocityY;
            
            // Spin dramatically
            this.rotation += this.rotationSpeed;
            
            // Fade out
            this.opacity = Math.max(0, 1 - (progress * 0.8));
        }
        
        // Apply lerp to smoothly transition scale values
        this.scaleY += (this.targetScaleY - this.scaleY) * lerpSpeed;
        this.scaleX += (this.targetScaleX - this.scaleX) * lerpSpeed;
        
        // Apply dimensions based on lerped scale values
        this.height = this.originalHeight * this.scaleY;
        this.width = this.originalWidth * this.scaleX;
    }
    
    triggerStomp() {
        this.isBeingStomped = true;
        this.stompAnimationTime = 0;
    }
    
    isOffScreen() {
        if (this.isBeingStomped) {
            // Check if animation is complete and off-screen
            return this.stompAnimationTime > 800 && 
                (this.x < -100 || this.x > this.canvas.width + 100 ||
                 this.y < -200 || this.opacity <= 0);
        }
        
        return this.xPercent + this.widthPercent < 0;
    }
    
    checkStomp(player) {
        // Check if player is above and falling onto constituent
        return player.x < this.x + this.width &&
               player.x + player.width > this.x &&
               player.y + player.height > this.y &&
               player.y + player.height < this.y + this.height / 2 &&
               player.velocityY > 0;  // Must be falling
    }
    
    render(ctx) {
        ctx.save();
        
        // Apply opacity for fade out during launch
        if (this.opacity < 1) {
            ctx.globalAlpha = this.opacity;
        }
        
        // Apply rotation if being stomped
        if (this.isBeingStomped) {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(this.rotation);
            ctx.translate(-centerX, -centerY);
        }
        
        // Simple walking figure with scaling applied
        ctx.fillStyle = this.color;
        
        // Calculate actual dimensions based on scale
        const actualWidth = this.width;
        const actualHeight = this.height;
        
        // Head (scaled proportionally)
        const headWidth = actualWidth * 0.6;
        const headHeight = actualHeight * 0.3;
        const headX = this.x + (actualWidth - headWidth) / 2;
        const headY = this.y + actualHeight * 0.03;
        ctx.fillRect(headX, headY, headWidth, headHeight);
        
        // Body (scaled proportionally)
        const bodyWidth = actualWidth * 0.75;
        const bodyHeight = actualHeight * 0.47;
        const bodyX = this.x + (actualWidth - bodyWidth) / 2;
        const bodyY = this.y + actualHeight * 0.37;
        ctx.fillRect(bodyX, bodyY, bodyWidth, bodyHeight);
        
        // Legs animation (scaled proportionally) - only if not being stomped
        if (!this.isBeingStomped) {
            const legPhase = Math.sin(this.animationFrame) * 8;
            const legWidth = actualWidth * 0.15;
            const legHeight = actualHeight * 0.25;
            const leg1X = this.x + actualWidth * 0.3;
            const leg2X = this.x + actualWidth * 0.55;
            const legY = this.y + actualHeight * 0.83;
            
            ctx.fillRect(leg1X, legY, legWidth, legHeight);
            ctx.fillRect(leg2X, legY, legWidth, legHeight - legPhase * (actualHeight / 60));
        } else if (this.stompAnimationTime < 200) {
            // During squash phase, draw compressed legs
            const legWidth = actualWidth * 0.15;
            const legHeight = actualHeight * 0.1; // Much shorter during squash
            const legY = this.y + actualHeight * 0.9;
            ctx.fillRect(this.x + actualWidth * 0.2, legY, legWidth, legHeight);
            ctx.fillRect(this.x + actualWidth * 0.65, legY, legWidth, legHeight);
        }
        
        // Add angry face (scaled proportionally) - only if not launching
        if (this.stompAnimationTime < 400) {
            ctx.fillStyle = 'white';
            const eyeSize = actualWidth * 0.1;
            const eye1X = this.x + actualWidth * 0.35;
            const eye2X = this.x + actualWidth * 0.55;
            const eyeY = this.y + actualHeight * 0.13;
            
            // During squash, make eyes wider
            if (this.isBeingStomped && this.stompAnimationTime < 200) {
                // Surprised expression during squash
                ctx.fillRect(eye1X - eyeSize/2, eyeY, eyeSize * 1.5, eyeSize);
                ctx.fillRect(eye2X - eyeSize/2, eyeY, eyeSize * 1.5, eyeSize);
            } else {
                // Normal angry eyes
                ctx.fillRect(eye1X, eyeY, eyeSize, eyeSize);
                ctx.fillRect(eye2X, eyeY, eyeSize, eyeSize);
            }
        }
        
        ctx.restore();
    }
    
    updateGroundPosition(groundY) {
        if (this.stompAnimationTime < 120) {
            // Keep grounded during squash
            this.y = groundY - this.height;
        } else if (this.stompAnimationTime < 250) {
            // Lift off ground during stretch
            const progress = (this.stompAnimationTime - 120) / 130;
            const liftAmount = this.easeOutElastic(progress) * 12;
            this.y = groundY - this.height - liftAmount;
        }
        // Phase 3 position is handled by launch physics
    }
    
    // Easing functions
    easeOutQuad(t) {
        return t * (2 - t);
    }
    
    easeOutElastic(t) {
        if (t === 0 || t === 1) return t;
        const p = 0.3;
        return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    }
}
