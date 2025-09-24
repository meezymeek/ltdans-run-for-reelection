// Parachute Tap Overlay Manager - Creates engaging tap prompts during parachute use
export class ParachuteTapOverlay {
    constructor() {
        this.tapPrompts = [];
        this.isActive = false;
        this.spawnTimer = 0;
        this.spawnInterval = 300; // Base spawn interval in ms
        this.currentPattern = 'radial';
        this.patternIndex = 0;
        this.fingerIcon = null;
        
        // Pattern configurations - reduced spawn counts for less clutter
        this.patterns = {
            radial: {
                name: 'Radial Burst',
                spawnCount: 1,
                positions: this.getRadialPositions.bind(this)
            },
            wave: {
                name: 'Wave',
                spawnCount: 2,
                positions: this.getWavePositions.bind(this)
            },
            spiral: {
                name: 'Spiral',
                spawnCount: 1,
                positions: this.getSpiralPositions.bind(this)
            },
            chaos: {
                name: 'Chaos',
                spawnCount: 2,
                positions: this.getChaosPositions.bind(this)
            }
        };
        
        // Remove emoji functionality - keeping it simple with just TAP! text
        this.createFingerIcon();
    }
    
    createFingerIcon() {
        // Create a canvas to draw the finger icon
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        
        // Draw a simple pointing finger icon
        ctx.save();
        ctx.translate(20, 20);
        
        // Finger outline
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        
        // Draw pointing finger shape
        ctx.beginPath();
        ctx.ellipse(-5, -10, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Fingertip
        ctx.beginPath();
        ctx.ellipse(-5, -18, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Thumb
        ctx.beginPath();
        ctx.ellipse(3, -5, 4, 8, Math.PI * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
        
        // Convert canvas to image
        this.fingerIcon = new Image();
        this.fingerIcon.src = canvas.toDataURL();
    }
    
    activate(playerX, playerY, canvas) {
        this.isActive = true;
        this.spawnTimer = 0;
        this.patternIndex = 0;
        this.playerCenterX = playerX;
        this.playerCenterY = playerY;
        
        // Store canvas bounds for boundary checking
        this.canvasWidth = canvas ? canvas.width : 800;
        this.canvasHeight = canvas ? canvas.height : 600;
        this.margin = 50; // Margin from edges
        
        // Start with gentle radial pattern
        this.currentPattern = 'radial';
        this.spawnInterval = 400;
        
        // Spawn initial prompts
        this.spawnPrompts();
    }
    
    deactivate() {
        this.isActive = false;
        // Fade out existing prompts instead of clearing immediately
        this.tapPrompts.forEach(prompt => {
            prompt.fadeOut = true;
        });
    }
    
    update(deltaTime, game) {
        if (!this.isActive || !game.player.hasParachute) {
            // Update existing prompts even when inactive for fade-out
            this.updatePrompts(deltaTime);
            return;
        }
        
        // Update player center position
        this.playerCenterX = game.player.x + game.player.width / 2;
        this.playerCenterY = game.player.y + game.player.height / 2;
        
        // Adjust pattern and spawn rate based on parachute time remaining
        const timePercent = Math.max(0, game.player.parachuteTimeLeft / 3000);
        this.updateUrgencyLevel(timePercent);
        
        // Update spawn timer
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnPrompts();
            this.spawnTimer = 0;
        }
        
        // Update all prompts
        this.updatePrompts(deltaTime);
        
        // Clean up dead prompts
        this.tapPrompts = this.tapPrompts.filter(prompt => prompt.alpha > 0);
    }
    
    updateUrgencyLevel(timePercent) {
        if (timePercent > 0.5) {
            // Calm phase - green colors, much slower spawn
            this.currentPattern = 'radial';
            this.spawnInterval = 1200; // Doubled from 600ms
        } else if (timePercent > 0.2) {
            // Warning phase - yellow/orange colors, moderate spawn
            this.currentPattern = 'wave';
            this.spawnInterval = 800; // Doubled from 400ms
        } else {
            // Urgent phase - red colors, faster spawn
            this.currentPattern = 'chaos';
            this.spawnInterval = 500; // Doubled from 250ms
        }
    }
    
    spawnPrompts() {
        const pattern = this.patterns[this.currentPattern];
        const positions = pattern.positions(pattern.spawnCount);
        
        positions.forEach(pos => {
            // Apply boundary constraints
            const constrainedPos = this.constrainToBounds(pos.x, pos.y);
            
            // Check for collision and find alternative position if needed
            const finalPos = this.findNonCollidingPosition(constrainedPos.x, constrainedPos.y);
            if (finalPos) {
                this.createTapPrompt(finalPos.x, finalPos.y, pos.type || 'text');
            }
        });
    }
    
    // Helper method to constrain positions within playable area
    constrainToBounds(x, y) {
        const textSize = 40; // Approximate size of text/emoji
        return {
            x: Math.max(this.margin + textSize, Math.min(this.canvasWidth - this.margin - textSize, x)),
            y: Math.max(this.margin + textSize, Math.min(this.canvasHeight - this.margin - textSize, y))
        };
    }
    
    // Check if a position collides with existing prompts
    checkCollision(x, y, minDistance = 80) {
        return this.tapPrompts.some(prompt => {
            if (prompt.fadeOut || prompt.alpha <= 0) return false; // Ignore fading out prompts
            const dx = x - prompt.x;
            const dy = y - prompt.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < minDistance;
        });
    }
    
    // Find a non-colliding position for a new prompt
    findNonCollidingPosition(preferredX, preferredY, maxAttempts = 8) {
        // First try the preferred position
        if (!this.checkCollision(preferredX, preferredY)) {
            return { x: preferredX, y: preferredY };
        }
        
        // Try alternative positions in a spiral around the preferred position
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const radius = attempt * 25; // Increase search radius each attempt
            const angleStep = (Math.PI * 2) / (attempt * 2 + 2); // More positions per ring
            
            for (let i = 0; i < attempt * 2 + 2; i++) {
                const angle = i * angleStep;
                const x = preferredX + Math.cos(angle) * radius;
                const y = preferredY + Math.sin(angle) * radius;
                
                // Check bounds and collision
                const boundedPos = this.constrainToBounds(x, y);
                if (!this.checkCollision(boundedPos.x, boundedPos.y)) {
                    return boundedPos;
                }
            }
        }
        
        // If we can't find a non-colliding position, return null (skip this prompt)
        return null;
    }
    
    createTapPrompt(x, y, type = 'text') {
        const prompt = {
            x: x,
            y: y,
            scale: 0,
            rotation: (Math.random() - 0.5) * 120, // Random rotation between -60 and +60 degrees
            alpha: 1,
            lifetime: 0,
            maxLifetime: 800 + Math.random() * 200, // Shorter lifetime for urgency
            type: 'text', // Only text prompts now
            targetScale: 1.0 + Math.random() * 0.2, // Slightly varying sizes
            animPhase: 'popIn',
            fadeOut: false,
            
            // Sharp pop animation properties
            bounceAmount: 0.2 + Math.random() * 0.1,
        };
        
        this.tapPrompts.push(prompt);
    }
    
    updatePrompts(deltaTime) {
        this.tapPrompts.forEach(prompt => {
            prompt.lifetime += deltaTime;
            
            // Handle quick fade out for deactivation
            if (prompt.fadeOut) {
                prompt.alpha = Math.max(0, prompt.alpha - deltaTime / 100);
                return;
            }
            
            // Snappy pop-in animation (first 100ms)
            if (prompt.animPhase === 'popIn' && prompt.lifetime < 100) {
                const progress = prompt.lifetime / 100;
                // Bounce effect - overshoots then settles
                prompt.scale = prompt.targetScale * (1 + prompt.bounceAmount * Math.sin(progress * Math.PI));
            } else if (prompt.animPhase === 'popIn') {
                // Switch to stable display phase
                prompt.animPhase = 'stable';
                prompt.scale = prompt.targetScale;
            }
            
            // Snappy pop-out animation (last 100ms)
            const popOutStartTime = prompt.maxLifetime - 100;
            if (prompt.lifetime > popOutStartTime && prompt.animPhase !== 'popOut') {
                prompt.animPhase = 'popOut';
            }
            
            if (prompt.animPhase === 'popOut') {
                const popOutProgress = (prompt.lifetime - popOutStartTime) / 100;
                // Quick scale down with slight bounce
                prompt.scale = prompt.targetScale * (1 - popOutProgress);
                prompt.alpha = 1 - popOutProgress * 0.5; // Slight alpha fade
            }
            
            // Mark for removal if lifetime exceeded
            if (prompt.lifetime >= prompt.maxLifetime) {
                prompt.alpha = 0;
            }
        });
    }
    
    // Pattern position generators
    getRadialPositions(count) {
        const positions = [];
        const radius = 80 + Math.random() * 60;
        const angleOffset = Math.random() * Math.PI * 2;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + angleOffset;
            positions.push({
                x: this.playerCenterX + Math.cos(angle) * radius,
                y: this.playerCenterY + Math.sin(angle) * radius,
                type: 'text' // Only text prompts now
            });
        }
        
        return positions;
    }
    
    getWavePositions(count) {
        const positions = [];
        const waveY = this.playerCenterY + (Math.random() - 0.5) * 100;
        const startX = this.playerCenterX - 150;
        const spacing = 100;
        
        for (let i = 0; i < count; i++) {
            positions.push({
                x: startX + i * spacing + (Math.random() - 0.5) * 40,
                y: waveY + Math.sin(i * 0.5) * 20,
                type: 'text' // Only text prompts now
            });
        }
        
        return positions;
    }
    
    getSpiralPositions(count) {
        const positions = [];
        this.patternIndex += 0.3;
        
        const angle = this.patternIndex;
        const radius = 60 + (this.patternIndex % 50);
        
        positions.push({
            x: this.playerCenterX + Math.cos(angle) * radius,
            y: this.playerCenterY + Math.sin(angle) * radius,
            type: 'text' // Only text prompts now
        });
        
        return positions;
    }
    
    getChaosPositions(count) {
        const positions = [];
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 120;
            
            positions.push({
                x: this.playerCenterX + Math.cos(angle) * distance,
                y: this.playerCenterY + Math.sin(angle) * distance,
                type: 'text' // Only text prompts now
            });
        }
        
        return positions;
    }
    
    render(ctx, game) {
        if (this.tapPrompts.length === 0) return;
        
        ctx.save();
        
        this.tapPrompts.forEach(prompt => {
            if (prompt.alpha <= 0) return;
            
            ctx.save();
            ctx.globalAlpha = prompt.alpha;
            ctx.translate(prompt.x, prompt.y);
            ctx.scale(prompt.scale, prompt.scale);
            ctx.rotate(prompt.rotation * Math.PI / 180); // Apply random rotation
            
            // Disable anti-aliasing for blocky aesthetic
            ctx.imageSmoothingEnabled = false;
            
            // Draw blocky TAP! text using game's consistent font (smaller for background)
            ctx.font = 'bold 18px Tiny5'; // Smaller font for background layer
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Black drop shadow
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#000000';
            ctx.strokeText('TAP!', 0, 0);
            
            // White text on top
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('TAP!', 0, 0);
            
            ctx.restore();
        });
        
        ctx.restore();
    }
}
