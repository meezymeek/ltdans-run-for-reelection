# Obstacle System Guide
**Lt. Dan's Run for Re-Election - Modular Obstacle Implementation**

## Overview

The obstacle system in Lt. Dan's Run for Re-Election uses a modular parent-child architecture that allows for easy creation of obstacle variations with different appearances and behaviors. This system supports static obstacles (default colored rectangles) and animated obstacles (with movement patterns like bobbing, rotating, etc.).

## Architecture

### Class Hierarchy

```
Obstacle (base parent class)
├── AnimatedObstacle (adds animation support)
│   ├── GhostObstacle (specific ghost with bobbing)
│   └── [Future animated obstacles...]
└── [Future static obstacle variations...]
```

## Core Components

### 1. Obstacle Classes (`src/entities/Obstacle.js`)

#### Base Obstacle Class
- **Purpose**: Parent class for all obstacle variations
- **Features**: 
  - Position and movement logic
  - Collision detection
  - Ragdoll physics
  - Skin image support
  - Basic rendering

#### AnimatedObstacle Class
- **Purpose**: Extends Obstacle to add animation capabilities
- **Features**:
  - Animation timing management
  - Base position tracking for animations
  - Abstract `applyAnimation()` method for custom animations

#### GhostObstacle Class
- **Purpose**: Specific implementation of animated obstacle with bobbing motion
- **Features**:
  - Configurable bobbing height, speed, and offset
  - Smooth sine wave animation

### 2. Configuration System (`skins/obstacles/obstacle-skins.json`)

The system uses a JSON configuration file to define obstacle variants:

```json
{
  "skins": {
    "tall": {
      "default": {
        "name": "Default Tall",
        "imagePath": null,
        "color": "#8B4513",
        "animationType": "none"
      },
      "ghost": {
        "name": "Ghost",
        "imagePath": "skins/obstacles/tall obstacles/tall1.png",
        "color": "#ffffff",
        "animationType": "bob",
        "animationConfig": {
          "bobHeight": 8,
          "bobSpeed": 0.03,
          "bobOffset": 0
        }
      }
    },
    "low": {
      "default": {
        "name": "Default Low",
        "imagePath": null,
        "color": "#654321",
        "animationType": "none"
      }
    }
  },
  "spawnWeights": {
    "tall": {
      "default": 70,
      "ghost": 30
    },
    "low": {
      "default": 100
    }
  }
}
```

### 3. Asset Loading (`src/managers/AssetLoader.js`)

The AssetLoader automatically:
- Reads the obstacle configuration file
- Loads all obstacle skin images
- Provides loaded assets to the game

### 4. Factory System

Two factory functions create obstacles:

```javascript
// New system with variant support
createObstacleWithVariant(type, canvas, groundY, speed, variant, skinConfig)

// Original system for backwards compatibility
createObstacle(type, canvas, groundY, speed)
```

## Adding New Obstacle Variations

### Step 1: Create Skin Image
1. Place your skin image in the appropriate directory: `skins/obstacles/[type] obstacles/`
2. Use PNG format for transparency support
3. Recommended size: 64x64 pixels (will be scaled automatically)

### Step 2: Update Configuration
Add your new variant to `skins/obstacles/obstacle-skins.json`:

```json
{
  "skins": {
    "tall": {
      "your_variant_name": {
        "name": "Your Variant Display Name",
        "imagePath": "skins/obstacles/tall obstacles/your_image.png",
        "color": "#fallback_color",
        "animationType": "none", // or "bob", "rotate", etc.
        "animationConfig": {
          // Animation-specific parameters
        }
      }
    }
  },
  "spawnWeights": {
    "tall": {
      "default": 60,
      "ghost": 20,
      "your_variant_name": 20
    }
  }
}
```

### Step 3: Create Animation Class (if needed)

For animated obstacles, create a new class extending `AnimatedObstacle`:

```javascript
export class YourAnimatedObstacle extends AnimatedObstacle {
    constructor(type, canvas, variant = 'your_variant', skinConfig = null) {
        super(type, canvas, variant, skinConfig);
        
        // Your-specific animation properties from config
        this.yourProperty = this.animationConfig.yourProperty || defaultValue;
    }
    
    applyAnimation() {
        // Calculate your animation (rotation, scaling, etc.)
        const animationValue = Math.sin(this.animationTime * this.animationSpeed) * this.animationMagnitude;
        
        // Apply animation to position/rotation/scale
        this.xPercent = this.baseXPercent + someXModification;
        this.yPercent = this.baseYPercent + someYModification;
    }
}
```

### Step 4: Update Factory System

Add your new class to the factory function in `src/entities/Obstacle.js`:

```javascript
switch (variant) {
    case 'ghost':
        obstacle = new GhostObstacle(type, canvas, variant, skinConfig);
        break;
    case 'your_variant_name':
        obstacle = new YourAnimatedObstacle(type, canvas, variant, skinConfig);
        break;
    default:
        obstacle = new AnimatedObstacle(type, canvas, variant, skinConfig);
        break;
}
```

## Animation Types

### Current Supported Animations

#### 1. Bobbing ("bob")
- **Description**: Gentle up and down movement
- **Configuration**:
  ```json
  "animationConfig": {
    "bobHeight": 8,     // Vertical movement range in pixels
    "bobSpeed": 0.03,   // Animation speed (higher = faster)
    "bobOffset": 0      // Phase offset for variation
  }
  ```

### Future Animation Ideas

#### 2. Rotation ("rotate")
```json
"animationConfig": {
  "rotationSpeed": 0.02,  // Rotation speed
  "rotationRange": 45     // Max rotation angle in degrees
}
```

#### 3. Pulsing ("pulse")
```json
"animationConfig": {
  "pulseScale": 0.2,    // Scale variation (0.2 = 20% size change)
  "pulseSpeed": 0.025   // Pulse frequency
}
```

#### 4. Floating ("float")
```json
"animationConfig": {
  "floatHeight": 15,    // Vertical float range
  "floatSpeed": 0.02,   // Float speed
  "horizontalDrift": 5  // Optional horizontal drift
}
```

## File Structure

```
skins/obstacles/
├── obstacle-skins.json          # Configuration file
├── tall obstacles/
│   ├── tall1.png               # Ghost skin (existing)
│   └── [future tall skins...]
└── low obstacles/
    └── [future low skins...]
```

## Code Integration Points

### Game Initialization
- `Game.js`: Loads obstacle configuration in `setPreloadedAssets()`
- `AssetLoader.js`: Loads all obstacle images and config

### Spawning
- `GameLoop.js`: Uses weighted random selection to choose variants
- Automatically applies skins and creates appropriate class instances

### Rendering
- `Obstacle.render()`: Automatically handles skin images vs fallback colors
- Supports both normal and ragdoll rendering

## Best Practices

### 1. Image Guidelines
- Use PNG format for transparency
- Keep file sizes reasonable (< 50KB per image)
- Design for scalability (game uses percentage-based scaling)

### 2. Animation Guidelines
- Use percentage-based coordinates for resolution independence
- Keep animations subtle to maintain gameplay clarity
- Test animations at different game speeds

### 3. Configuration Guidelines
- Use descriptive variant names
- Set appropriate spawn weights (total should make sense)
- Test spawn probabilities in gameplay

### 4. Performance Considerations
- Limit total number of variants per obstacle type
- Optimize animation calculations for 60fps performance
- Consider memory usage for mobile devices

## Testing Your New Obstacles

1. **Visual Testing**: Verify skin loads correctly and animations work smoothly
2. **Performance Testing**: Check frame rate with multiple animated obstacles
3. **Collision Testing**: Ensure hitboxes work properly with animations
4. **Spawn Testing**: Verify weighted spawning works as expected

## Example: Creating a Spinning Tombstone

### 1. Add to configuration:
```json
"spinning_tombstone": {
  "name": "Spinning Tombstone",
  "imagePath": "skins/obstacles/tall obstacles/tombstone.png",
  "color": "#666666",
  "animationType": "rotate",
  "animationConfig": {
    "rotationSpeed": 0.02,
    "rotationRange": 360
  }
}
```

### 2. Create animation class:
```javascript
export class SpinningTombstoneObstacle extends AnimatedObstacle {
    constructor(type, canvas, variant = 'spinning_tombstone', skinConfig = null) {
        super(type, canvas, variant, skinConfig);
        this.rotationSpeed = this.animationConfig.rotationSpeed || 0.02;
        this.currentRotation = 0;
    }
    
    applyAnimation() {
        // No position change, just track rotation
        this.xPercent = this.baseXPercent;
        this.yPercent = this.baseYPercent;
        this.currentRotation += this.rotationSpeed;
    }
    
    render(ctx) {
        if (!this.isRagdolled && this.currentRotation !== 0) {
            ctx.save();
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            ctx.rotate(this.currentRotation);
            // ... render with rotation
            ctx.restore();
        } else {
            super.render(ctx);
        }
    }
}
```

### 3. Update factory and add to spawn weights

This modular system makes it easy to add new obstacle variations while maintaining clean, organized code and consistent behavior across all obstacle types.
