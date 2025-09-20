// Gerrymander Express Collectible - Transforms player into invincible train
import { getScaleManager } from '../utils/ScaleManager.js';

export class GerrymanderExpress {
    constructor(canvas) {
        this.canvas = canvas;
        this.scaleManager = getScaleManager();
        
        // Use percentage-based coordinates for consistent scaling - match bribe sizing
        this.widthPercent = 0.04;   // 4% of screen width (slightly larger than bribe's 3.5%)
        this.heightPercent = 0.04;  // 4% of screen height (slightly larger than bribe's 3.5%)
        
        // Convert to actual pixels
        this.width = this.scaleManager.toPixelsX(this.widthPercent);
        this.height = this.scaleManager.toPixelsY(this.heightPercent);
        
        // Position (will be set by spawn logic)
        this.x = canvas.width;
        this.y = 0;
        
        // Movement
        this.speed = 3;
        
        // Visual properties
        this.color = '#4A90E2';  // Train blue
        this.accentColor = '#FFD700';  // Gold accents
        
        // Animation
        this.bobOffset = Math.random() * Math.PI * 2;
        this.bobAmount = 3;  // Very subtle floating - only 3 pixels
        this.baseY = this.y;
        
        // Collectible properties
        this.collected = false;
        this.value = 0; // No point value, just transformation
        
        // Visual effects
        this.glowIntensity = 0;
        this.glowDirection = 1;
        this.sparkles = [];
        
        // Initialize sparkle effects
        this.initializeSparkles();
    }
    
    initializeSparkles() {
        for (let i = 0; i < 3; i++) {
            this.sparkles.push({
                x: 0,
                y: 0,
                life: Math.random(),
                maxLife: 1.0,
                speed: 0.02 + Math.random() * 0.03
            });
        }
    }
    
    setPosition(groundY) {
        // Position high in air - requires parachute to reach (parachute-only access)
        const minHeight = 250; // 250 pixels from ground minimum (requires parachute)
        const maxHeight = 350; // 350 pixels from ground maximum (definitely needs parachute)
        const heightFromGround = minHeight + Math.random() * (maxHeight - minHeight);
        
        this.y = groundY - heightFromGround - this.height;
        this.baseY = this.y;
    }
    
    setSpeed(obstacleSpeed) {
        this.speed = obstacleSpeed;
    }
    
    update() {
        // Move left with obstacles
        this.x -= this.speed;
        
        // Keep Y position locked (no vertical movement)
        this.y = this.baseY;
        
        // Glowing effect
        this.glowIntensity += this.glowDirection * 0.03;
        if (this.glowIntensity >= 1.0) {
            this.glowIntensity = 1.0;
            this.glowDirection = -1;
        } else if (this.glowIntensity <= 0.3) {
            this.glowIntensity = 0.3;
            this.glowDirection = 1;
        }
        
        // Update sparkle effects
        this.updateSparkles();
    }
    
    updateSparkles() {
        for (let sparkle of this.sparkles) {
            sparkle.life -= sparkle.speed;
            if (sparkle.life <= 0) {
                sparkle.life = 1.0;
                sparkle.x = (Math.random() - 0.5) * this.width * 1.5;
                sparkle.y = (Math.random() - 0.5) * this.height * 1.5;
            }
        }
    }
    
    render(ctx) {
        if (this.collected) return;
        
        ctx.save();
        
        // Draw glow effect
        const glowRadius = this.width * 0.8;
        const gradient = ctx.createRadialGradient(
            this.x + this.width/2, this.y + this.height/2, 0,
            this.x + this.width/2, this.y + this.height/2, glowRadius
        );
        gradient.addColorStop(0, `rgba(74, 144, 226, ${this.glowIntensity * 0.4})`);
        gradient.addColorStop(0.7, `rgba(74, 144, 226, ${this.glowIntensity * 0.2})`);
        gradient.addColorStop(1, 'rgba(74, 144, 226, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            this.x + this.width/2 - glowRadius,
            this.y + this.height/2 - glowRadius,
            glowRadius * 2,
            glowRadius * 2
        );
        
        // Draw sparkles
        this.renderSparkles(ctx);
        
        // Draw map icon using simple shapes
        this.drawMapIcon(ctx);
        
        ctx.restore();
    }
    
    drawMapIcon(ctx) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const mapWidth = this.width * 0.8;
        const mapHeight = this.height * 0.8;
        
        // Main map background
        ctx.fillStyle = '#F5F5DC'; // Beige paper color
        ctx.fillRect(
            centerX - mapWidth/2,
            centerY - mapHeight/2,
            mapWidth,
            mapHeight
        );
        
        // Map border
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(
            centerX - mapWidth/2,
            centerY - mapHeight/2,
            mapWidth,
            mapHeight
        );
        
        // Draw gerrymandered district boundaries (irregular shapes)
        ctx.strokeStyle = '#8B0000'; // Dark red for district lines
        ctx.lineWidth = 1.5;
        
        // District 1 (upper left - weird shape)
        ctx.beginPath();
        ctx.moveTo(centerX - mapWidth/2 + 2, centerY - mapHeight/2 + 2);
        ctx.lineTo(centerX - mapWidth/4, centerY - mapHeight/3);
        ctx.lineTo(centerX - mapWidth/6, centerY - mapHeight/4);
        ctx.lineTo(centerX - mapWidth/3, centerY);
        ctx.lineTo(centerX - mapWidth/2 + 2, centerY - mapHeight/6);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fill();
        
        // District 2 (upper right - snake-like)
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - mapHeight/2 + 2);
        ctx.lineTo(centerX + mapWidth/2 - 2, centerY - mapHeight/2 + 2);
        ctx.lineTo(centerX + mapWidth/2 - 2, centerY - mapHeight/4);
        ctx.lineTo(centerX + mapWidth/4, centerY - mapHeight/6);
        ctx.lineTo(centerX + mapWidth/6, centerY);
        ctx.lineTo(centerX, centerY - mapHeight/3);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
        ctx.fill();
        
        // District 3 (bottom - sprawling)
        ctx.beginPath();
        ctx.moveTo(centerX - mapWidth/3, centerY);
        ctx.lineTo(centerX + mapWidth/3, centerY + mapHeight/6);
        ctx.lineTo(centerX + mapWidth/2 - 2, centerY + mapHeight/2 - 2);
        ctx.lineTo(centerX - mapWidth/2 + 2, centerY + mapHeight/2 - 2);
        ctx.lineTo(centerX - mapWidth/4, centerY + mapHeight/4);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 128, 0, 0.3)';
        ctx.fill();
        
        // Gold accent border
        ctx.strokeStyle = this.accentColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(
            centerX - mapWidth/2,
            centerY - mapHeight/2,
            mapWidth,
            mapHeight
        );
    }
    
    renderSparkles(ctx) {
        for (let sparkle of this.sparkles) {
            if (sparkle.life > 0.5) {
                const alpha = (sparkle.life - 0.5) * 2; // Fade in/out
                const size = 2;
                
                ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
                ctx.fillRect(
                    this.x + this.width/2 + sparkle.x - size/2,
                    this.y + this.height/2 + sparkle.y - size/2,
                    size,
                    size
                );
            }
        }
    }
    
    isOffScreen() {
        return this.x + this.width < 0;
    }
    
    // Collision detection
    checkCollision(player) {
        return player.x < this.x + this.width &&
               player.x + player.width > this.x &&
               player.y < this.y + this.height &&
               player.y + player.height > this.y;
    }
    
    collect() {
        this.collected = true;
    }
}
