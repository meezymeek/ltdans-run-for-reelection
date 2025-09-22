// Bribe Entity Class (Collectible Power-up)
import { ENTITY_DIMENSIONS, ENTITY_DIMENSIONS_PERCENT, VISUAL_CONFIG } from '../constants/GameConfig.js';
import { getScaleManager } from '../utils/ScaleManager.js';

export class Bribe {
    constructor(canvas) {
        this.canvas = canvas;
        this.scaleManager = getScaleManager();
        
        // Dimensions (percentage-based)
        const dimensions = ENTITY_DIMENSIONS_PERCENT.bribe;
        this.widthPercent = dimensions.widthPercent;
        this.heightPercent = dimensions.heightPercent;
        
        // Position (percentages)
        this.xPercent = 1.083; // 108.3% (off-screen right)
        this.yPercent = 0; // Will be set based on spawn height
        this.speedPercent = 0; // Will be set by game speed
        
        // Pixel values (computed from percentages for rendering)
        this.width = this.scaleManager.uniformDimensionToPixelsX(this.widthPercent);
        this.height = this.scaleManager.uniformDimensionToPixelsY(this.heightPercent);
        this.x = this.scaleManager.toPixelsX(this.xPercent);
        this.y = this.scaleManager.toPixelsY(this.yPercent);
        this.speed = this.scaleManager.velocityToPixels(this.speedPercent, 'width');
        
        // Movement
        this.animationFrame = Math.random() * Math.PI * 2;
        
        // Visual
        this.color = VISUAL_CONFIG.bribeColor;
        this.collected = false;
    }
    
    setPosition(x, y) {
        this.xPercent = this.scaleManager.toPercentageX(x);
        this.yPercent = this.scaleManager.toPercentageY(y);
        this.x = x;
        this.y = y;
    }
    
    setSpeed(speed) {
        this.speedPercent = this.scaleManager.velocityToPercentage(speed, 'width');
        this.speed = speed; // Keep pixel speed for compatibility
    }
    
    update() {
        // Move left with the game in percentage space
        this.xPercent -= this.speedPercent;
        this.x = this.scaleManager.toPixelsX(this.xPercent);
        
        // Floating animation
        this.animationFrame += 0.1;
        const floatOffset = Math.sin(this.animationFrame) * 0.5;
        this.yPercent += this.scaleManager.toPercentageY(floatOffset);
        this.y = this.scaleManager.toPixelsY(this.yPercent);
    }
    
    isOffScreen() {
        return this.xPercent + this.widthPercent < 0;
    }
    
    checkCollision(player) {
        return player.x < this.x + this.width &&
               player.x + player.width > this.x &&
               player.y < this.y + this.height &&
               player.y + player.height > this.y;
    }
    
    render(ctx) {
        ctx.save();
        
        // Floating animation
        const floatY = Math.sin(this.animationFrame) * 3;
        
        // Set font and alignment
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const centerX = this.x + this.width/2;
        const centerY = this.y + this.height/2 + floatY;
        
        // Draw black drop shadow first
        ctx.fillStyle = '#000000';
        ctx.fillText('$', centerX + 3, centerY + 3);
        
        // Draw gold dollar sign on top
        ctx.fillStyle = this.color;
        ctx.fillText('$', centerX, centerY);
        
        ctx.restore();
    }
}

// Bribe Pattern Factory
export class BribePatternFactory {
    static createPattern(patternType, canvas, groundY, speed) {
        const patterns = [];
        const startX = canvas.width + 50;
        
        // Use percentage-based heights that work well with 70% scaled player
        const canvasHeight = canvas.height;
        const jumpHeights = {
            veryLow: canvasHeight * 0.05,    // 5% of screen height above ground
            low: canvasHeight * 0.08,        // 8% of screen height above ground
            medium: canvasHeight * 0.12,     // 12% of screen height above ground
            high: canvasHeight * 0.18,       // 18% of screen height above ground
            veryHigh: canvasHeight * 0.25,   // 25% of screen height above ground
            extreme: canvasHeight * 0.35,    // 35% of screen height above ground
            space: canvasHeight * 0.45       // 45% of screen height above ground
        };
        
        switch(patternType) {
            case 'arch':
                // Create an arch of 5 bribes
                const archHeight = groundY - jumpHeights.high;
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 4) * Math.PI; // 0 to PI
                    const height = Math.sin(angle) * jumpHeights.medium; // Arc height variation
                    const bribe = new Bribe(canvas);
                    bribe.setPosition(startX + i * 60, archHeight - height);
                    bribe.setSpeed(speed);
                    bribe.animationFrame = i * 0.5;
                    patterns.push(bribe);
                }
                break;
                
            case 'wave':
                // Create a sine wave of bribes
                for (let i = 0; i < 6; i++) {
                    const waveY = groundY - jumpHeights.medium + Math.sin(i * 0.8) * jumpHeights.low;
                    const bribe = new Bribe(canvas);
                    bribe.setPosition(startX + i * 55, waveY);
                    bribe.setSpeed(speed);
                    bribe.animationFrame = i * 0.4;
                    patterns.push(bribe);
                }
                break;
                
            case 'diagonal':
                // Rising or falling diagonal line
                const rising = Math.random() > 0.5;
                for (let i = 0; i < 4; i++) {
                    const diagY = rising ? 
                        groundY - jumpHeights.veryLow - i * jumpHeights.veryLow :
                        groundY - jumpHeights.high + i * jumpHeights.veryLow;
                    const bribe = new Bribe(canvas);
                    bribe.setPosition(startX + i * 70, diagY);
                    bribe.setSpeed(speed);
                    bribe.animationFrame = i * 0.6;
                    patterns.push(bribe);
                }
                break;
                
            case 'cluster':
                // Random cluster of 3 bribes at varying heights
                const clusterBase = groundY - jumpHeights.low - Math.random() * jumpHeights.medium;
                for (let i = 0; i < 3; i++) {
                    const bribe = new Bribe(canvas);
                    bribe.setPosition(
                        startX + i * 45 + Math.random() * 20,
                        clusterBase + (Math.random() * jumpHeights.veryLow - jumpHeights.veryLow/2)
                    );
                    bribe.setSpeed(speed);
                    bribe.animationFrame = Math.random() * Math.PI * 2;
                    patterns.push(bribe);
                }
                break;
                
            case 'stairs':
                // Staircase pattern going up then down
                for (let i = 0; i < 6; i++) {
                    const stairY = i < 3 ?
                        groundY - jumpHeights.veryLow - i * (jumpHeights.low * 0.7) :
                        groundY - jumpHeights.high + (i - 3) * (jumpHeights.low * 0.7);
                    const bribe = new Bribe(canvas);
                    bribe.setPosition(startX + i * 55, stairY);
                    bribe.setSpeed(speed);
                    bribe.animationFrame = i * 0.3;
                    patterns.push(bribe);
                }
                break;
                
            case 'single':
            default:
                // Single bribe at various heights - scaled to work with 70% player
                const heights = [
                    groundY - jumpHeights.veryLow,  // Very low (easy jump)
                    groundY - jumpHeights.low,      // Low (normal jump)
                    groundY - jumpHeights.medium,   // Medium (high jump)
                    groundY - jumpHeights.high,     // High (needs good timing)
                    groundY - jumpHeights.veryHigh, // Very high (parachute recommended)
                    groundY - jumpHeights.extreme,  // Extreme (parachute essential)
                    groundY - jumpHeights.space     // Space (parachute required)
                ];
                const chosenHeight = heights[Math.floor(Math.random() * heights.length)];
                const bribe = new Bribe(canvas);
                bribe.setPosition(startX, chosenHeight + (Math.random() * 20 - 10));
                bribe.setSpeed(speed);
                patterns.push(bribe);
                break;
        }
        
        return patterns;
    }
    
    static getRandomPattern() {
        const patterns = ['arch', 'wave', 'diagonal', 'cluster', 'stairs'];
        return patterns[Math.floor(Math.random() * patterns.length)];
    }
}
