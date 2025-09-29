// Ragdoll Physics System for crash animations
export class RagdollSystem {
    constructor(initialPosition, skinImages) {
        this.gravity = 0.5;
        this.friction = 0.98;
        this.bounce = 0.6;
        this.skinImages = skinImages;
        this.headDetached = false;
        this.headDetachChance = 0.7; // 70% chance head detaches on crash
        
        // Initialize body parts with physics properties scaled to player size
        const x = initialPosition.x + initialPosition.width / 2;
        const y = initialPosition.y;
        const playerWidth = initialPosition.width;
        const playerHeight = initialPosition.height;
        
        // Scale all dimensions proportionally to the actual player size
        const scale = Math.min(playerWidth / 40, playerHeight / 60); // Based on original 40x60 player
        
        this.parts = {
            head: {
                x: x, y: y + 10 * scale,
                vx: Math.random() * 4 - 2, vy: -Math.random() * 5,
                width: 32 * scale, height: 20 * scale,
                angle: 0, angleVel: Math.random() * 0.3 - 0.15,
                mass: 0.8
            },
            torso: {
                x: x, y: y + 30 * scale,
                vx: Math.random() * 3 - 1.5, vy: -Math.random() * 3,
                width: 30 * scale, height: 20 * scale,
                angle: 0, angleVel: Math.random() * 0.2 - 0.1,
                mass: 1.2
            },
            leftUpperArm: {
                x: x - 5 * scale, y: y + 32 * scale,
                vx: Math.random() * 5 - 2.5, vy: -Math.random() * 4,
                width: 8 * scale, height: 12 * scale,
                angle: 0, angleVel: Math.random() * 0.4 - 0.2,
                mass: 0.3
            },
            leftForearm: {
                x: x - 8 * scale, y: y + 42 * scale,
                vx: Math.random() * 6 - 3, vy: -Math.random() * 3,
                width: 6 * scale, height: 10 * scale,
                angle: 0, angleVel: Math.random() * 0.5 - 0.25,
                mass: 0.2
            },
            rightUpperArm: {
                x: x + 5 * scale, y: y + 32 * scale,
                vx: Math.random() * 5 - 2.5, vy: -Math.random() * 4,
                width: 8 * scale, height: 12 * scale,
                angle: 0, angleVel: Math.random() * 0.4 - 0.2,
                mass: 0.3
            },
            rightForearm: {
                x: x + 8 * scale, y: y + 42 * scale,
                vx: Math.random() * 6 - 3, vy: -Math.random() * 3,
                width: 6 * scale, height: 10 * scale,
                angle: 0, angleVel: Math.random() * 0.5 - 0.25,
                mass: 0.2
            },
            leftThigh: {
                x: x - 5 * scale, y: y + 50 * scale,
                vx: Math.random() * 4 - 2, vy: -Math.random() * 2,
                width: 10 * scale, height: 15 * scale,
                angle: 0, angleVel: Math.random() * 0.3 - 0.15,
                mass: 0.5
            },
            leftShin: {
                x: x - 7 * scale, y: y + 63 * scale,
                vx: Math.random() * 5 - 2.5, vy: -Math.random() * 2,
                width: 8 * scale, height: 12 * scale,
                angle: 0, angleVel: Math.random() * 0.4 - 0.2,
                mass: 0.3
            },
            rightThigh: {
                x: x + 5 * scale, y: y + 50 * scale,
                vx: Math.random() * 4 - 2, vy: -Math.random() * 2,
                width: 10 * scale, height: 15 * scale,
                angle: 0, angleVel: Math.random() * 0.3 - 0.15,
                mass: 0.5
            },
            rightShin: {
                x: x + 7 * scale, y: y + 63 * scale,
                vx: Math.random() * 5 - 2.5, vy: -Math.random() * 2,
                width: 8 * scale, height: 12 * scale,
                angle: 0, angleVel: Math.random() * 0.4 - 0.2,
                mass: 0.3
            }
        };
        
        // Define joint connections (for constraint solving) - scaled to match player size
        this.joints = [
            { partA: 'head', partB: 'torso', length: 15 * scale, stiffness: 0.7 },
            { partA: 'torso', partB: 'leftUpperArm', length: 12 * scale, stiffness: 0.5 },
            { partA: 'leftUpperArm', partB: 'leftForearm', length: 10 * scale, stiffness: 0.4 },
            { partA: 'torso', partB: 'rightUpperArm', length: 12 * scale, stiffness: 0.5 },
            { partA: 'rightUpperArm', partB: 'rightForearm', length: 10 * scale, stiffness: 0.4 },
            { partA: 'torso', partB: 'leftThigh', length: 15 * scale, stiffness: 0.6 },
            { partA: 'leftThigh', partB: 'leftShin', length: 12 * scale, stiffness: 0.4 },
            { partA: 'torso', partB: 'rightThigh', length: 15 * scale, stiffness: 0.6 },
            { partA: 'rightThigh', partB: 'rightShin', length: 12 * scale, stiffness: 0.4 }
        ];
        
        this.groundY = initialPosition.groundY;
    }
    
    applyImpulse(forceX, forceY) {
        // Randomly determine if head should detach
        if (Math.random() < this.headDetachChance) {
            this.detachHead();
        }
        
        // Apply initial crash force to all parts with some variation
        for (const part of Object.values(this.parts)) {
            part.vx += forceX * (0.5 + Math.random() * 0.5) / part.mass;
            part.vy += forceY * (0.5 + Math.random() * 0.5) / part.mass;
            part.angleVel += (Math.random() - 0.5) * 0.8;
        }
        
        // If head is detached, give it extra dramatic physics
        if (this.headDetached) {
            const head = this.parts.head;
            // Much stronger horizontal force to ensure separation from body
            head.vx += (Math.random() - 0.5) * 15; // Stronger random horizontal spin
            head.vy -= Math.random() * 12 + 3; // Much stronger upward force (3-15 range)
            head.angleVel += (Math.random() - 0.5) * 2.5; // More dramatic spin
            
            // Add additional directional force away from the torso
            const torso = this.parts.torso;
            const dx = head.x - torso.x;
            const dy = head.y - torso.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                // Normalize direction vector and apply separation force
                const separationForce = 8;
                head.vx += (dx / distance) * separationForce;
                head.vy += (dy / distance) * separationForce;
            }
        }
    }
    
    detachHead() {
        this.headDetached = true;
        // Remove the head-torso joint constraint
        this.joints = this.joints.filter(joint => 
            !(joint.partA === 'head' && joint.partB === 'torso') &&
            !(joint.partA === 'torso' && joint.partB === 'head')
        );
    }
    
    update() {
        // Apply physics to each part
        for (const [name, part] of Object.entries(this.parts)) {
            // Apply gravity
            part.vy += this.gravity;
            
            // Special physics for detached head
            const isDetachedHead = name === 'head' && this.headDetached;
            
            // Apply friction (less friction for detached head to keep it rolling)
            const frictionRate = isDetachedHead ? 0.995 : this.friction;
            const angularFriction = isDetachedHead ? 0.995 : 0.99;
            
            part.vx *= frictionRate;
            part.vy *= frictionRate;
            part.angleVel *= angularFriction;
            
            // Update position
            part.x += part.vx;
            part.y += part.vy;
            part.angle += part.angleVel;
            
            // Ground collision
            const bottomY = part.y + part.height / 2;
            if (bottomY > this.groundY) {
                part.y = this.groundY - part.height / 2;
                
                // Enhanced bounce for detached head
                const bounceRate = isDetachedHead ? 0.8 : this.bounce;
                const groundFriction = isDetachedHead ? 0.9 : 0.8;
                const angleReduction = isDetachedHead ? 0.9 : 0.7;
                
                part.vy *= -bounceRate;
                part.vx *= groundFriction;
                part.angleVel *= angleReduction;
                
                // For detached head, add rolling physics when on ground
                if (isDetachedHead && Math.abs(part.vy) < 2) {
                    // Convert some horizontal velocity to rotation (rolling effect)
                    const rollFactor = 0.1;
                    part.angleVel += part.vx * rollFactor;
                }
                
                // Stop tiny bounces
                const minBounce = isDetachedHead ? 1.0 : 0.5;
                if (Math.abs(part.vy) < minBounce) {
                    part.vy = 0;
                }
            }
            
            // Screen bounds with special behavior for detached head
            if (part.x < part.width / 2) {
                part.x = part.width / 2;
                const wallBounce = isDetachedHead ? -0.7 : -0.5;
                part.vx *= wallBounce;
                
                // Add extra spin when detached head hits walls
                if (isDetachedHead) {
                    part.angleVel += Math.random() * 0.5 - 0.25;
                }
            }
            if (part.x > window.innerWidth - part.width / 2) {
                part.x = window.innerWidth - part.width / 2;
                const wallBounce = isDetachedHead ? -0.7 : -0.5;
                part.vx *= wallBounce;
                
                // Add extra spin when detached head hits walls
                if (isDetachedHead) {
                    part.angleVel += Math.random() * 0.5 - 0.25;
                }
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
