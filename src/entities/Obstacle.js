// Obstacle Entity Class
import { ENTITY_DIMENSIONS, ENTITY_DIMENSIONS_PERCENT, VISUAL_CONFIG, GAME_CONFIG } from '../constants/GameConfig.js';
import { getScaleManager } from '../utils/ScaleManager.js';

export class Obstacle {
    constructor(type, canvas) {
        this.canvas = canvas;
        this.type = type; // 'low' or 'tall'
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
        this.width = this.scaleManager.toPixelsX(this.widthPercent);
        this.height = this.scaleManager.toPixelsY(this.heightPercent);
        this.x = this.scaleManager.toPixelsX(this.xPercent);
        this.y = this.scaleManager.toPixelsY(this.yPercent);
        this.speed = this.scaleManager.velocityToPixels(this.speedPercent, 'width');
        
        // Visual
        this.color = type === 'tall' ? 
            VISUAL_CONFIG.obstacleColors.tall : 
            VISUAL_CONFIG.obstacleColors.low;
        
        // Ragdoll properties
        this.isRagdolled = false;
        this.velocityX = 0;
        this.velocityY = 0;
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.gravity = 0.5;
        this.groundY = 0; // Will be set when ragdolled
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
            
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
            
            // Add pattern with rotation
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(-this.width/2 + 5, -this.height/2 + 5, this.width - 10, 3);
        } else {
            // Normal rendering
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Add simple pattern to obstacles
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, 3);
        }
        
        ctx.restore();
    }
    
    checkCollision(player) {
        return player.x < this.x + this.width &&
               player.x + player.width > this.x &&
               player.y < this.y + this.height &&
               player.y + player.height > this.y;
    }
}

// Factory function to create obstacles
export function createObstacle(type, canvas, groundY, speed) {
    const obstacle = new Obstacle(type, canvas);
    obstacle.setPosition(groundY);
    obstacle.setSpeed(speed);
    return obstacle;
}
