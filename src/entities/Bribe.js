// Bribe Entity Class (Collectible Power-up)
import { ENTITY_DIMENSIONS, VISUAL_CONFIG } from '../constants/GameConfig.js';

export class Bribe {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Dimensions
        const dimensions = ENTITY_DIMENSIONS.bribe;
        this.width = dimensions.width;
        this.height = dimensions.height;
        
        // Position
        this.x = canvas.width + 50;
        this.y = 0; // Will be set based on spawn height
        
        // Movement
        this.speed = 0; // Will be set by game speed
        this.animationFrame = Math.random() * Math.PI * 2;
        
        // Visual
        this.color = VISUAL_CONFIG.bribeColor;
        this.collected = false;
    }
    
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
    
    setSpeed(speed) {
        this.speed = speed;
    }
    
    update() {
        // Move left with the game
        this.x -= this.speed;
        
        // Floating animation
        this.animationFrame += 0.1;
        this.y += Math.sin(this.animationFrame) * 0.5;
    }
    
    isOffScreen() {
        return this.x + this.width < 0;
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
        
        switch(patternType) {
            case 'arch':
                // Create an arch of 5 bribes
                const archHeight = groundY - 180;
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 4) * Math.PI; // 0 to PI
                    const height = Math.sin(angle) * 60; // Arc height variation
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
                    const waveY = groundY - 140 + Math.sin(i * 0.8) * 50;
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
                        groundY - 80 - i * 40 :
                        groundY - 200 + i * 40;
                    const bribe = new Bribe(canvas);
                    bribe.setPosition(startX + i * 70, diagY);
                    bribe.setSpeed(speed);
                    bribe.animationFrame = i * 0.6;
                    patterns.push(bribe);
                }
                break;
                
            case 'cluster':
                // Random cluster of 3 bribes at varying heights
                const clusterBase = groundY - 100 - Math.random() * 100;
                for (let i = 0; i < 3; i++) {
                    const bribe = new Bribe(canvas);
                    bribe.setPosition(
                        startX + i * 45 + Math.random() * 20,
                        clusterBase + (Math.random() * 60 - 30)
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
                        groundY - 80 - i * 35 :
                        groundY - 185 + (i - 3) * 35;
                    const bribe = new Bribe(canvas);
                    bribe.setPosition(startX + i * 55, stairY);
                    bribe.setSpeed(speed);
                    bribe.animationFrame = i * 0.3;
                    patterns.push(bribe);
                }
                break;
                
            case 'single':
            default:
                // Single bribe at various heights
                const heights = [
                    groundY - 80,   // Low (easy jump)
                    groundY - 140,  // Mid (high jump)
                    groundY - 200,  // High (needs good timing)
                    groundY - 260,  // Very high (parachute recommended)
                    groundY - 320,  // Super high (parachute essential)
                    groundY - 380,  // Sky high
                    groundY - 440   // Near space!
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
