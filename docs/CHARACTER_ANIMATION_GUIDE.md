# Character Animation System Documentation

## Overview
Danny Boy's character uses an articulated body system with realistic joint-based animations for running and jumping. The character is rendered in a side profile view with proper z-index layering for depth perception.

## Body Structure

### Proportions
The character body is divided into three equal parts:
- **Head**: 33% of total height (top third)
- **Torso**: 33% of total height (middle third)  
- **Legs**: 34% of total height (bottom third)

### Joint System
The character has the following animated joints:
- **Arms**: Shoulder joint + elbow joint
- **Legs**: Hip joint + knee joint

## Animation Properties

All animation properties are stored in the `player` object:

```javascript
player = {
    // Position and physics
    x: 100,
    y: 0,
    width: 40,
    height: 60,
    velocityY: 0,
    isJumping: false,
    
    // Animation properties
    animationFrame: 0,      // Current frame counter
    runCycle: 0,           // Running cycle position
    animationSpeed: 0.15,   // Speed of animation progression
    
    // Joint angles (in degrees)
    leftLegAngle: 0,       // Hip rotation for left leg
    rightLegAngle: 0,      // Hip rotation for right leg
    leftKneeAngle: 0,      // Knee bend for left leg
    rightKneeAngle: 0,     // Knee bend for right leg
    leftArmAngle: 0,       // Shoulder rotation for left arm
    rightArmAngle: 0,      // Shoulder rotation for right arm
    leftElbowAngle: 0,     // Elbow bend for left arm
    rightElbowAngle: 0     // Elbow bend for right arm
}
```

## Animation States

### Running Animation
The running animation uses sine waves to create smooth, cyclic movement:

1. **Leg Movement**:
   - Legs alternate forward/backward using sine waves with opposite phases
   - Forward swing: -30 degrees, Backward swing: +30 degrees
   - Knees bend only when the leg is moving forward (45 degrees max)

2. **Arm Movement**:
   - Arms swing opposite to legs for natural running motion
   - Asymmetrical swing: More forward (-40°), less backward (+35°)
   - Base angle of 50° prevents arms from extending past body
   - Elbow bend increases to 85° for natural arm movement

```javascript
// Running animation cycle
const runPhase = (animationFrame % 4) / 4 * Math.PI * 2;

// Leg animation
leftLegAngle = -Math.sin(runPhase) * 30;
rightLegAngle = -Math.sin(runPhase + Math.PI) * 30;

// Asymmetrical arm swing
const leftSwing = Math.sin(runPhase + Math.PI);
leftArmAngle = 50 + (leftSwing > 0 ? leftSwing * 35 : leftSwing * 40);
```

### Jumping Animation
When jumping, the character assumes a triumphant pose:
- **Arms**: Fully extended straight up (180° rotation)
- **Elbows**: Fully extended (0° bend)
- **Legs**: Slightly extended forward (-15°)
- **Knees**: Slight bend (20°)

## Rendering System

### Z-Index Layering
Components are drawn in specific order for proper depth:
1. Right leg (behind torso)
2. Torso (middle layer)
3. Head (on torso)
4. Arm (single visible arm for side profile)
5. Left leg (in front)

### Drawing Method
The `drawArticulatedPlayer()` function handles all rendering:

```javascript
drawArticulatedPlayer() {
    // Calculate positions
    const centerX = player.x + player.width / 2;
    const topY = player.y;
    
    // Body proportions
    const headHeight = player.height * 0.33;
    const torsoHeight = player.height * 0.33;
    const legHeight = player.height * 0.34;
    
    // Draw in z-order...
}
```

### Limb Drawing
The `drawPlayerLimb()` function draws articulated limbs with joints:

```javascript
drawPlayerLimb(startX, startY, angle1, length1, angle2, length2, width) {
    // Draw upper segment (thigh/upper arm)
    ctx.translate(startX, startY);
    ctx.rotate(angle1 * Math.PI / 180);
    ctx.lineTo(0, length1);
    
    // Draw lower segment (shin/forearm)
    ctx.translate(0, length1);
    ctx.rotate(angle2 * Math.PI / 180);
    ctx.lineTo(0, length2);
}
```

## Side Profile View
The character is rendered in side profile with:
- Single visible eye (positioned right)
- Extended mouth line for profile view
- Head shifted 8px right for depth
- Single visible arm (left arm shown)
- Legs positioned close together (5px apart)

## Animation Timing
- Animation updates every frame when not jumping
- `animationFrame` increments by `animationSpeed` (0.15) each frame
- Full run cycle completes in approximately 27 frames
- Smooth transitions between running and jumping states

## Key Animation Values

### Running
- Leg swing: ±30 degrees
- Knee bend: 0-45 degrees
- Arm forward swing: 10 degrees (50 - 40)
- Arm backward swing: 85 degrees (50 + 35)
- Elbow bend: 85 degrees max

### Jumping
- Arms: 180 degrees (straight up)
- Elbows: 0 degrees (fully extended)
- Legs: -15 degrees (forward)
- Knees: 20 degrees (slight bend)

## Integration with Game Loop
The animation system updates in `updatePlayerAnimation()` which is called every frame from `updatePlayer()`. The animation state depends on the `isJumping` flag to determine whether to play running or jumping animations.

## Performance Considerations
- All calculations use simple sine waves for smooth, efficient animation
- Joint angles are calculated once per frame
- Drawing uses canvas 2D context with minimal state changes
- Animation speed can be adjusted via the `animationSpeed` property for different effects
