// Ragdoll Physics System for crash animations
export class RagdollSystem {
    constructor(initialPosition, skinImages) {
        this.gravity = 0.5;
        this.friction = 0.98;
        this.bounce = 0.6;
        this.skinImages = skinImages;
        
        // Initialize body parts with physics properties
        const x = initialPosition.x + initialPosition.width / 2;
        const y = initialPosition.y;
        
        this.parts = {
            head: {
                x: x, y: y + 10,
                vx: Math.random() * 4 - 2, vy: -Math.random() * 5,
                width: 32, height: 20,
                angle: 0, angleVel: Math.random() * 0.3 - 0.15,
                mass: 0.8
            },
            torso: {
                x: x, y: y + 30,
                vx: Math.random() * 3 - 1.5, vy: -Math.random() * 3,
                width: 30, height: 20,
                angle: 0, angleVel: Math.random() * 0.2 - 0.1,
                mass: 1.2
            },
            leftUpperArm: {
                x: x - 5, y: y + 32,
                vx: Math.random() * 5 - 2.5, vy: -Math.random() * 4,
                width: 8, height: 12,
                angle: 0, angleVel: Math.random() * 0.4 - 0.2,
                mass: 0.3
            },
            leftForearm: {
                x: x - 8, y: y + 42,
                vx: Math.random() * 6 - 3, vy: -Math.random() * 3,
                width: 6, height: 10,
                angle: 0, angleVel: Math.random() * 0.5 - 0.25,
                mass: 0.2
            },
            rightUpperArm: {
                x: x + 5, y: y + 32,
                vx: Math.random() * 5 - 2.5, vy: -Math.random() * 4,
                width: 8, height: 12,
                angle: 0, angleVel: Math.random() * 0.4 - 0.2,
                mass: 0.3
            },
            rightForearm: {
                x: x + 8, y: y + 42,
                vx: Math.random() * 6 - 3, vy: -Math.random() * 3,
                width: 6, height: 10,
                angle: 0, angleVel: Math.random() * 0.5 - 0.25,
                mass: 0.2
            },
            leftThigh: {
                x: x - 5, y: y + 50,
                vx: Math.random() * 4 - 2, vy: -Math.random() * 2,
                width: 10, height: 15,
                angle: 0, angleVel: Math.random() * 0.3 - 0.15,
                mass: 0.5
            },
            leftShin: {
                x: x - 7, y: y + 63,
                vx: Math.random() * 5 - 2.5, vy: -Math.random() * 2,
                width: 8, height: 12,
                angle: 0, angleVel: Math.random() * 0.4 - 0.2,
                mass: 0.3
            },
            rightThigh: {
                x: x + 5, y: y + 50,
                vx: Math.random() * 4 - 2, vy: -Math.random() * 2,
                width: 10, height: 15,
                angle: 0, angleVel: Math.random() * 0.3 - 0.15,
                mass: 0.5
            },
            rightShin: {
                x: x + 7, y: y + 63,
                vx: Math.random() * 5 - 2.5, vy: -Math.random() * 2,
                width: 8, height: 12,
                angle: 0, angleVel: Math.random() * 0.4 - 0.2,
                mass: 0.3
            }
        };
        
        // Define joint connections (for constraint solving)
        this.joints = [
            { partA: 'head', partB: 'torso', length: 15, stiffness: 0.7 },
            { partA: 'torso', partB: 'leftUpperArm', length: 12, stiffness: 0.5 },
            { partA: 'leftUpperArm', partB: 'leftForearm', length: 10, stiffness: 0.4 },
            { partA: 'torso', partB: 'rightUpperArm', length: 12, stiffness: 0.5 },
            { partA: 'rightUpperArm', partB: 'rightForearm', length: 10, stiffness: 0.4 },
            { partA: 'torso', partB: 'leftThigh', length: 15, stiffness: 0.6 },
            { partA: 'leftThigh', partB: 'leftShin', length: 12, stiffness: 0.4 },
            { partA: 'torso', partB: 'rightThigh', length: 15, stiffness: 0.6 },
            { partA: 'rightThigh', partB: 'rightShin', length: 12, stiffness: 0.4 }
        ];
        
        this.groundY = initialPosition.groundY;
    }
    
    applyImpulse(forceX, forceY) {
        // Apply initial crash force to all parts with some variation
        for (const part of Object.values(this.parts)) {
            part.vx += forceX * (0.5 + Math.random() * 0.5) / part.mass;
            part.vy += forceY * (0.5 + Math.random() * 0.5) / part.mass;
            part.angleVel += (Math.random() - 0.5) * 0.8;
        }
    }
    
    update() {
        // Apply physics to each part
        for (const part of Object.values(this.parts)) {
            // Apply gravity
            part.vy += this.gravity;
            
            // Apply friction
            part.vx *= this.friction;
            part.vy *= this.friction;
            part.angleVel *= 0.99;
            
            // Update position
            part.x += part.vx;
            part.y += part.vy;
            part.angle += part.angleVel;
            
            // Ground collision
            const bottomY = part.y + part.height / 2;
            if (bottomY > this.groundY) {
                part.y = this.groundY - part.height / 2;
                part.vy *= -this.bounce;
                part.vx *= 0.8; // Extra friction on ground
                part.angleVel *= 0.7;
                
                // Stop tiny bounces
                if (Math.abs(part.vy) < 0.5) {
                    part.vy = 0;
                }
            }
            
            // Screen bounds
            if (part.x < part.width / 2) {
                part.x = part.width / 2;
                part.vx *= -0.5;
            }
            if (part.x > window.innerWidth - part.width / 2) {
                part.x = window.innerWidth - part.width / 2;
                part.vx *= -0.5;
            }
        }
        
        // Apply joint constraints (simple distance constraints)
        for (let i = 0; i < 3; i++) { // Multiple iterations for stability
            for (const joint of this.joints) {
                const partA = this.parts[joint.partA];
                const partB = this.parts[joint.partB];
                
                const dx = partB.x - partA.x;
                const dy = partB.y - partA.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0) {
                    const diff = (joint.length - dist) / dist * joint.stiffness * 0.5;
                    const offsetX = dx * diff;
                    const offsetY = dy * diff;
                    
                    partA.x -= offsetX;
                    partA.y -= offsetY;
                    partB.x += offsetX;
                    partB.y += offsetY;
                }
            }
        }
    }
    
    render(ctx) {
        // Render each body part with rotation
        for (const [name, part] of Object.entries(this.parts)) {
            ctx.save();
            ctx.translate(part.x, part.y);
            ctx.rotate(part.angle);
            
            // Map part names to skin images
            let skinImage = null;
            if (this.skinImages) {
                if (name === 'head') skinImage = this.skinImages['head'];
                else if (name === 'torso') skinImage = this.skinImages['torso'];
                else if (name.includes('Arm')) skinImage = name.includes('Upper') ? 
                    this.skinImages['upper_arm'] : this.skinImages['forearm'];
                else if (name.includes('Thigh')) skinImage = this.skinImages['thigh'];
                else if (name.includes('Shin')) skinImage = this.skinImages['shin'];
            }
            
            if (skinImage && skinImage.complete) {
                ctx.drawImage(
                    skinImage,
                    -part.width / 2,
                    -part.height / 2,
                    part.width,
                    part.height
                );
            } else {
                // Fallback to colored rectangles
                ctx.fillStyle = name === 'head' ? '#ff6b6b' : 
                               name === 'torso' ? '#cc5858' : '#ff8080';
                ctx.fillRect(
                    -part.width / 2,
                    -part.height / 2,
                    part.width,
                    part.height
                );
            }
            
            ctx.restore();
        }
    }
    
    isSettled() {
        // Check if ragdoll has mostly stopped moving
        for (const part of Object.values(this.parts)) {
            if (Math.abs(part.vx) > 0.5 || Math.abs(part.vy) > 0.5) {
                return false;
            }
        }
        return true;
    }
}
