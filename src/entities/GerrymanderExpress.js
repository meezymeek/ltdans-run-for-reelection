// Gerrymander Express Collectible - Transforms player into invincible train
import { getScaleManager } from '../utils/ScaleManager.js';

export class GerrymanderExpress {
    constructor(canvas, assets = null) {
        this.canvas = canvas;
        this.scaleManager = getScaleManager();
        this.assets = assets;
        
        // Use percentage-based coordinates for consistent scaling - match bribe sizing
        this.widthPercent = 0.04;   // 4% of screen width (slightly larger than bribe's 3.5%)
        this.heightPercent = 0.04;  // 4% of screen height (slightly larger than bribe's 3.5%)
        
        // Convert to actual pixels
        this.width = this.scaleManager.uniformDimensionToPixelsX(this.widthPercent);
        this.height = this.scaleManager.uniformDimensionToPixelsY(this.heightPercent);
        
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
        
        // Draw blue glow effect
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
        
        // Draw ticket icon - use image if available, fallback to shapes
        if (this.assets?.images?.powerups?.ticket) {
            this.drawTicketImage(ctx);
        } else {
            this.drawTicketIcon(ctx);
        }
        
        ctx.restore();
    }
    
    drawTicketImage(ctx) {
        const ticketImg = this.assets.images.powerups.ticket;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Draw additional golden glow effect around the ticket
        const glowRadius = this.width * 1.2;
        const goldGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, glowRadius
        );
        goldGradient.addColorStop(0, `rgba(255, 215, 0, ${this.glowIntensity * 0.6})`);
        goldGradient.addColorStop(0.5, `rgba(255, 215, 0, ${this.glowIntensity * 0.3})`);
        goldGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        
        ctx.fillStyle = goldGradient;
        ctx.fillRect(
            centerX - glowRadius,
            centerY - glowRadius,
            glowRadius * 2,
            glowRadius * 2
        );
        
        // Draw the ticket image scaled to fit our dimensions
        const imgWidth = this.width * 0.9;
        const imgHeight = this.height * 0.9;
        
        ctx.drawImage(
            ticketImg,
            centerX - imgWidth/2,
            centerY - imgHeight/2,
            imgWidth,
            imgHeight
        );
    }
    
    drawTicketIcon(ctx) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const ticketWidth = this.width * 0.9;
        const ticketHeight = this.height * 0.6;
        
        // Main ticket background (cream/off-white)
        ctx.fillStyle = '#F8F8FF'; // Ghost white for ticket
        
        // Create rounded rectangle for ticket shape
        const cornerRadius = 3;
        ctx.beginPath();
        ctx.roundRect(
            centerX - ticketWidth/2,
            centerY - ticketHeight/2,
            ticketWidth,
            ticketHeight,
            cornerRadius
        );
        ctx.fill();
        
        // Ticket border
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Perforated edge effect (left side)
        ctx.fillStyle = '#FFFFFF';
        const perfSize = 2;
        const perfSpacing = 4;
        const leftEdge = centerX - ticketWidth/2;
        
        for (let i = 0; i < ticketHeight; i += perfSpacing) {
            ctx.beginPath();
            ctx.arc(leftEdge, centerY - ticketHeight/2 + i, perfSize/2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Ticket text/details
        ctx.fillStyle = this.color;
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('EXPRESS', centerX, centerY - 2);
        
        // Train symbol (simple)
        const trainY = centerY + 6;
        ctx.fillStyle = '#8B4513'; // Brown for train
        ctx.fillRect(centerX - 8, trainY, 16, 4);
        
        // Train wheels
        ctx.fillStyle = '#2F4F4F'; // Dark slate gray
        ctx.beginPath();
        ctx.arc(centerX - 5, trainY + 4, 2, 0, Math.PI * 2);
        ctx.arc(centerX + 5, trainY + 4, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Ticket stub line (dashed)
        ctx.strokeStyle = '#C0C0C0'; // Light gray
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(centerX + ticketWidth/3, centerY - ticketHeight/2);
        ctx.lineTo(centerX + ticketWidth/3, centerY + ticketHeight/2);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
        
        // Add golden glow effect around the fallback ticket
        const glowRadius = this.width * 1.2;
        const goldGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, glowRadius
        );
        goldGradient.addColorStop(0, `rgba(255, 215, 0, ${this.glowIntensity * 0.4})`);
        goldGradient.addColorStop(0.5, `rgba(255, 215, 0, ${this.glowIntensity * 0.2})`);
        goldGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        
        ctx.fillStyle = goldGradient;
        ctx.fillRect(
            centerX - glowRadius,
            centerY - glowRadius,
            glowRadius * 2,
            glowRadius * 2
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
