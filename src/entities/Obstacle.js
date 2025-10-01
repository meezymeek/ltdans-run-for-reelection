// Obstacle Entity Classes - Modular Parent/Child System
import { ENTITY_DIMENSIONS, ENTITY_DIMENSIONS_PERCENT, VISUAL_CONFIG, GAME_CONFIG } from '../constants/GameConfig.js';
import { getScaleManager } from '../utils/ScaleManager.js';

// Base Obstacle Class - Parent for all obstacle variations
export class Obstacle {
    constructor(type, canvas, variant = 'default', skinConfig = null) {
        this.canvas = canvas;
        this.type = type; // 'low' or 'tall'
        this.variant = variant; // 'default', 'ghost', etc.
        this.scaleManager = getScaleManager();
        
        // Set dimensions based on type (percentage-based)
        const dimensions = type === 'tall' ? 
            ENTITY_DIMENSIONS_PERCENT.obstacle.tall : 
            ENTITY_DIMENSIONS_PERCENT.obstacle.low;
        
        this.widthPercent = dimensions.widthPercent;
        this.heightPercent = dimensions.heightPercent;
        
        // Position (percentages - will be set by spawn method)
        this.xPercent = 1.083; // 108.3% (off-screen right)
        this.yPercent = 0; // Will be set based on ground level
        this.speedPercent = 0; // Will be set by game speed
        
        // Pixel values (computed from percentages for rendering)
        this.width = this.scaleManager.uniformDimensionToPixelsX(this.widthPercent);
        this.height = this.scaleManager.uniformDimensionToPixelsY(this.heightPercent);
        this.x = this.scaleManager.toPixelsX(this.xPercent);
        this.y = this.scaleManager.toPixelsY(this.yPercent);
        this.speed = this.scaleManager.velocityToPixels(this.speedPercent, 'width');
        
        // Skin and visual properties
        this.skinConfig = skinConfig;
        this.skinImage = null;
        this.color = skinConfig?.color || (type === 'tall' ? 
            VISUAL_CONFIG.obstacleColors.tall : 
            VISUAL_CONFIG.obstacleColors.low);
        
        // Store political word for text-based obstacles
        this.politicalWord = skinConfig?.textConfig?.text || null;
        
        // Animation properties (base class has none, but children can override)
        this.animationType = skinConfig?.animationType || 'none';
        this.animationTime = 0;
        
        // Original position tracking for animations
        this.baseX = 0;
        this.baseY = 0;
        
        // Ragdoll properties
        this.isRagdolled = false;
        this.velocityX = 0;
        this.velocityY = 0;
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.gravity = 0.5;
        this.groundY = 0; // Will be set when ragdolled
    }
    
    // Set the skin image (called by AssetLoader)
    setSkinImage(image) {
        this.skinImage = image;
    }
    
    setPosition(groundY) {
        const groundYPercent = this.scaleManager.toPercentageY(groundY);
        this.yPercent = groundYPercent - this.heightPercent;
        this.y = this.scaleManager.toPixelsY(this.yPercent);
    }
    
    setSpeed(speed) {
        this.speedPercent = this.scaleManager.velocityToPercentage(speed, 'width');
        this.speed = speed; // Keep pixel speed for compatibility
    }
    
    triggerRagdoll(impactX, impactY) {
        if (this.isRagdolled) return;
        
        this.isRagdolled = true;
        this.groundY = this.canvas.height * 0.8; // Ground level
        
        // Apply impact forces based on collision point
        this.velocityX = -8 - Math.random() * 4; // Strong backward force
        this.velocityY = -12 - Math.random() * 8; // Upward force
        this.rotationSpeed = (Math.random() - 0.5) * 0.4; // Random rotation
    }
    
    update() {
        if (this.isRagdolled) {
            // Ragdoll physics
            this.x += this.velocityX;
            this.y += this.velocityY;
            this.velocityY += this.gravity; // Apply gravity
            this.rotation += this.rotationSpeed;
            
            // Ground collision for ragdoll
            if (this.y + this.height >= this.groundY) {
                this.y = this.groundY - this.height;
                this.velocityY *= -0.3; // Bounce with damping
                this.velocityX *= 0.8; // Friction
                this.rotationSpeed *= 0.9; // Damping
                
                // Stop bouncing if velocity is too low
                if (Math.abs(this.velocityY) < 1) {
                    this.velocityY = 0;
                }
            }
        } else {
            // Normal movement
            this.xPercent -= this.speedPercent;
            this.x = this.scaleManager.toPixelsX(this.xPercent);
        }
    }
    
    isOffScreen() {
        if (this.isRagdolled) {
            // For ragdolled obstacles, check if they've fallen off screen
            return this.x + this.width < -100 || this.y > this.canvas.height + 100;
        }
        return this.xPercent + this.widthPercent < 0;
    }
    
    render(ctx) {
        ctx.save();
        
        if (this.isRagdolled) {
            // Render ragdolled obstacle with rotation
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            ctx.rotate(this.rotation);
            
            if (this.skinImage && this.skinImage.complete) {
                // Draw skin image with rotation
                ctx.drawImage(
                    this.skinImage,
                    -this.width/2,
                    -this.height/2,
                    this.width,
                    this.height
                );
            } else {
                // Fallback to color rectangle
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
                
                // Add pattern with rotation
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(-this.width/2 + 5, -this.height/2 + 5, this.width - 10, 3);
            }
        } else {
            // Normal rendering - check for pillar, text, or image
            if (this.skinConfig && this.skinConfig.renderType === 'pillar') {
                // Render architectural pillar
                this.renderPillarObstacle(ctx);
            } else if (this.skinConfig && this.skinConfig.renderType === 'text') {
                // Render text-based obstacle
                this.renderTextObstacle(ctx);
            } else if (this.skinImage && this.skinImage.complete) {
                // Draw skin image
                ctx.drawImage(
                    this.skinImage,
                    this.x,
                    this.y,
                    this.width,
                    this.height
                );
            } else {
                // Fallback to color rectangle
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // Add simple pattern to obstacles
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, 3);
            }
        }
        
        ctx.restore();
    }
    
    // Render architectural pillar obstacle
    renderPillarObstacle(ctx) {
        // Define pillar colors - classical marble/stone appearance
        const baseColor = '#E8E8E8';      // Light grey marble
        const shadowColor = '#A8A8A8';    // Darker grey for shadows
        const highlightColor = '#F8F8F8'; // Near white for highlights
        const capColor = '#D0D0D0';       // Medium grey for capital/base
        
        // Pillar proportions
        const capHeight = this.height * 0.08; // Top and bottom caps (8% each)
        const shaftHeight = this.height * 0.84; // Main shaft (84%)
        const shaftInset = this.width * 0.1; // Slight taper inward
        
        // Draw base (bottom cap)
        ctx.fillStyle = capColor;
        ctx.fillRect(this.x, this.y + this.height - capHeight, this.width, capHeight);
        
        // Draw base highlight
        ctx.fillStyle = highlightColor;
        ctx.fillRect(this.x, this.y + this.height - capHeight, this.width, 2);
        
        // Draw main pillar shaft
        ctx.fillStyle = baseColor;
        ctx.fillRect(
            this.x + shaftInset, 
            this.y + capHeight, 
            this.width - (shaftInset * 2), 
            shaftHeight
        );
        
        // Draw shaft left highlight (simulating light from left)
        ctx.fillStyle = highlightColor;
        ctx.fillRect(
            this.x + shaftInset, 
            this.y + capHeight, 
            3, 
            shaftHeight
        );
        
        // Draw shaft right shadow (simulating shadow on right side)
        ctx.fillStyle = shadowColor;
        ctx.fillRect(
            this.x + this.width - shaftInset - 3, 
            this.y + capHeight, 
            3, 
            shaftHeight
        );
        
        // Draw capital (top cap)
        ctx.fillStyle = capColor;
        ctx.fillRect(this.x, this.y, this.width, capHeight);
        
        // Draw capital shadow (bottom edge)
        ctx.fillStyle = shadowColor;
        ctx.fillRect(this.x, this.y + capHeight - 2, this.width, 2);
        
        // Add subtle vertical shading lines for texture
        ctx.fillStyle = 'rgba(160, 160, 160, 0.3)';
        for (let i = 1; i < 4; i++) {
            const lineX = this.x + shaftInset + (this.width - (shaftInset * 2)) * (i / 4);
            ctx.fillRect(lineX, this.y + capHeight, 1, shaftHeight);
        }
    }
    
    // Render text-based obstacle
    renderTextObstacle(ctx) {
        const textConfig = this.skinConfig.textConfig;
        
        // Draw background rectangle
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Save context for text rendering
        ctx.save();
        
        // Move to center of obstacle for rotation
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        ctx.translate(centerX, centerY);
        
        // Apply rotation if specified
        if (textConfig.rotation) {
            ctx.rotate(textConfig.rotation * Math.PI / 180);
        }
        
        // Calculate font size to fit the text in the obstacle
        const text = textConfig.text || 'TEXT';
        const fontFamily = textConfig.fontFamily || 'Arial';
        let fontSize = this.calculateFontSize(ctx, text, this.width, this.height, fontFamily);
        
        // Set font and text properties
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = textConfig.textColor || '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw the text
        ctx.fillText(text, 0, 0);
        
        ctx.restore();
    }
    
    // Calculate font size to fit text within dimensions
    calculateFontSize(ctx, text, maxWidth, maxHeight, fontFamily) {
        let fontSize = 12; // Start larger
        let textWidth, textHeight;
        
        // Try increasing font sizes until we find the largest that fits
        do {
            fontSize += 3; // Bigger increments
            ctx.font = `bold ${fontSize}px ${fontFamily}`;
            const metrics = ctx.measureText(text);
            textWidth = metrics.width;
            textHeight = fontSize; // Approximate height
        } while (textWidth < maxWidth * 0.95 && textHeight < maxHeight * 0.95 && fontSize < 80); // More aggressive fitting
        
        // Back off by one step to ensure it fits
        return Math.max(12, fontSize - 3);
    }
    
    checkCollision(player) {
        return player.x < this.x + this.width &&
               player.x + player.width > this.x &&
               player.y < this.y + this.height &&
               player.y + player.height > this.y;
    }
}

// Animated Obstacle Class - Adds animation support to base Obstacle
export class AnimatedObstacle extends Obstacle {
    constructor(type, canvas, variant = 'default', skinConfig = null) {
        super(type, canvas, variant, skinConfig);
        
        // Animation-specific properties
        this.animationConfig = skinConfig?.animationConfig || {};
        this.animationTime = 0;
        
        // Store base positions for animation calculations
        this.baseXPercent = this.xPercent;
        this.baseYPercent = this.yPercent;
    }
    
    update() {
        // Update animation time
        this.animationTime += 16.67; // Approximate 60fps (16.67ms per frame)
        
        // Perform base obstacle update first
        if (this.isRagdolled) {
            // Use parent ragdoll physics
            super.update();
        } else {
            // Update base position percentages
            this.baseXPercent -= this.speedPercent;
            this.baseYPercent = this.yPercent; // Keep original Y
            
            // Apply animation modifications
            this.applyAnimation();
            
            // Convert to pixel coordinates
            this.x = this.scaleManager.toPixelsX(this.xPercent);
            this.y = this.scaleManager.toPixelsY(this.yPercent);
        }
    }
    
    // Override this method in specific animated obstacle types
    applyAnimation() {
        // Base implementation - no animation
        this.xPercent = this.baseXPercent;
        this.yPercent = this.baseYPercent;
    }
    
    setPosition(groundY) {
        super.setPosition(groundY);
        // Update base positions
        this.baseYPercent = this.yPercent;
    }
    
    isOffScreen() {
        if (this.isRagdolled) {
            return this.x + this.width < -100 || this.y > this.canvas.height + 100;
        }
        return this.baseXPercent + this.widthPercent < 0;
    }
}

// Ghost Obstacle - Specific implementation with bobbing animation
export class GhostObstacle extends AnimatedObstacle {
    constructor(type, canvas, variant = 'ghost', skinConfig = null) {
        super(type, canvas, variant, skinConfig);
        
        // Ghost-specific animation properties from config
        this.bobHeight = this.animationConfig.bobHeight || 2;
        this.bobSpeed = this.animationConfig.bobSpeed || 0.003;
        this.bobOffset = this.animationConfig.bobOffset || 0;
    }
    
    applyAnimation() {
        // Calculate bobbing motion - oscillate around base position but never below ground
        const sineValue = Math.sin(this.animationTime * this.bobSpeed + this.bobOffset);
        // Transform sine wave from [-1,1] to [0,1] for upward-only motion from base position
        const bobAmount = (sineValue + 1) * 0.5 * this.bobHeight;
        
        // Convert pixel-based bob amount to percentage for our coordinate system
        const bobAmountPercent = bobAmount / this.canvas.height;
        
        // Apply animation to current position - subtract to move upward (negative Y is up)
        this.xPercent = this.baseXPercent;
        this.yPercent = this.baseYPercent - bobAmountPercent; // Subtract for upward movement
    }
}

// Obstacle Factory System - Creates appropriate obstacle types based on variant
export function createObstacleWithVariant(type, canvas, groundY, speed, variant = 'default', skinConfig = null) {
    let obstacle;
    
    // Create appropriate obstacle class based on variant and animation type
    if (skinConfig && skinConfig.animationType !== 'none') {
        switch (variant) {
            case 'ghost':
                obstacle = new GhostObstacle(type, canvas, variant, skinConfig);
                break;
            default:
                // Generic animated obstacle
                obstacle = new AnimatedObstacle(type, canvas, variant, skinConfig);
                break;
        }
    } else {
        // Static obstacle (no animation)
        obstacle = new Obstacle(type, canvas, variant, skinConfig);
    }
    
    obstacle.setPosition(groundY);
    obstacle.setSpeed(speed);
    return obstacle;
}

// Original factory function for backwards compatibility
export function createObstacle(type, canvas, groundY, speed) {
    const obstacle = new Obstacle(type, canvas);
    obstacle.setPosition(groundY);
    obstacle.setSpeed(speed);
    return obstacle;
}
