// BurnOne Power-Up Entity
import { getScaleManager } from '../utils/ScaleManager.js';
import { ENTITY_DIMENSIONS_PERCENT } from '../constants/GameConfig.js';

export class BurnOne {
    constructor(canvas) {
        this.canvas = canvas;
        this.scaleManager = getScaleManager();
        
        // Use same size as bribe for consistency
        this.widthPercent = ENTITY_DIMENSIONS_PERCENT.bribe.widthPercent;
        this.heightPercent = ENTITY_DIMENSIONS_PERCENT.bribe.heightPercent;
        
        // Calculate pixel dimensions
        this.width = this.scaleManager.uniformDimensionToPixelsX(this.widthPercent);
        this.height = this.scaleManager.uniformDimensionToPixelsY(this.heightPercent);
        
        // Start position off-screen to the right
        this.xPercent = 1.1; // 110% - off screen
        this.yPercent = 0.3 + Math.random() * 0.4; // Random height between 30% and 70%
        
        // Convert to pixels
        this.x = this.scaleManager.toPixelsX(this.xPercent);
        this.y = this.scaleManager.toPixelsY(this.yPercent);
        
        // Movement
        this.speedPercent = 0.01; // 1% of screen width per frame
        this.speed = this.scaleManager.velocityToPixels(this.speedPercent);
        
        // Visual properties
        this.color = '#32CD32'; // Lime green color
        this.glowColor = '#90EE90'; // Light green glow
        this.animationTime = 0;
        this.pulseScale = 1.0;
        
        // Floating animation
        this.floatOffset = 0;
        this.originalYPercent = this.yPercent;
        
        // State
        this.collected = false;
    }
    
    setSpeed(newSpeed) {
        this.speed = newSpeed;
        this.speedPercent = this.scaleManager.velocityToPercentage(newSpeed);
    }
    
    update(deltaTime = 16) {
        if (this.collected) return;
        
        // Move left
        this.xPercent -= this.speedPercent;
        this.x = this.scaleManager.toPixelsX(this.xPercent);
        
        // Update animation
        this.animationTime += deltaTime * 0.003; // Slower animation
        
        // Pulsing glow effect
        this.pulseScale = 1.0 + Math.sin(this.animationTime * 3) * 0.2;
        
        // Floating animation
        this.floatOffset = Math.sin(this.animationTime * 2) * 0.02; // 2% of screen height
        this.yPercent = this.originalYPercent + this.floatOffset;
        this.y = this.scaleManager.toPixelsY(this.yPercent);
        
        // Update dimensions for scaling
        this.width = this.scaleManager.uniformDimensionToPixelsX(this.widthPercent);
        this.height = this.scaleManager.uniformDimensionToPixelsY(this.heightPercent);
    }
    
    isOffScreen() {
        return this.x + this.width < 0;
    }
    
    checkCollision(player) {
        if (this.collected) return false;
        
        return player.x < this.x + this.width &&
               player.x + player.width > this.x &&
               player.y < this.y + this.height &&
               player.y + player.height > this.y;
    }
    
    collect() {
        this.collected = true;
    }
    
    render(ctx) {
        if (this.collected) return;
        
        ctx.save();
        
        // Create glow effect
        const glowSize = this.width * this.pulseScale * 1.5;
        const glowGradient = ctx.createRadialGradient(
            this.x + this.width/2, this.y + this.height/2, 0,
            this.x + this.width/2, this.y + this.height/2, glowSize/2
        );
        glowGradient.addColorStop(0, `${this.glowColor}60`); // Semi-transparent center
        glowGradient.addColorStop(0.7, `${this.glowColor}30`);
        glowGradient.addColorStop(1, `${this.glowColor}00`); // Fully transparent edge
        
        // Draw glow
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(
            this.x + this.width/2, 
            this.y + this.height/2, 
            glowSize/2, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw main power-up (leaf/joint shape)
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.scale(this.pulseScale, this.pulseScale);
        ctx.rotate(this.animationTime * 0.5); // Slow rotation
        
        // Draw leaf shape
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#228B22'; // Darker green outline
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        // Create a leaf-like shape
        const leafWidth = this.width * 0.8;
        const leafHeight = this.height * 0.8;
        
        ctx.ellipse(-leafWidth/4, 0, leafWidth/2, leafHeight/2, 0, 0, Math.PI * 2);
        ctx.ellipse(leafWidth/4, 0, leafWidth/2, leafHeight/2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Add some detail lines
        ctx.strokeStyle = '#006400'; // Dark green
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-leafWidth/3, 0);
        ctx.lineTo(leafWidth/3, 0);
        ctx.moveTo(0, -leafHeight/3);
        ctx.lineTo(0, leafHeight/3);
        ctx.stroke();
        
        ctx.restore();
    }
}
