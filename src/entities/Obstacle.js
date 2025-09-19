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
    
    update() {
        this.xPercent -= this.speedPercent;
        this.x = this.scaleManager.toPixelsX(this.xPercent);
    }
    
    isOffScreen() {
        return this.xPercent + this.widthPercent < 0;
    }
    
    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add simple pattern to obstacles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, 3);
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
