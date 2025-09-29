# Percentage-Based Coordinate System Implementation Plan

## Overview
This document outlines the conversion of RERUN: Danny Boy Runs for Office Again from a fixed-pixel coordinate system to a percentage-based coordinate system. This ensures fair gameplay across all screen sizes and devices.

## Problem Statement
The current game uses fixed pixel values for:
- Entity dimensions (player: 40x60px, obstacles: 30x40px, etc.)
- Physics calculations (velocity: -25px, gravity: 0.8px/frame)
- Spawn distances and gaps (250px minimum gap)

This creates an unfair advantage for players on larger screens, as they get relatively more clearance over obstacles and longer flight times.

## Solution: Percentage-Based Coordinates

### Core Concept
All game elements will be defined as percentages of screen dimensions:
- **Positions**: 0.0 to 1.0 (0% to 100% of screen width/height)
- **Velocities**: Percentage of screen per frame
- **Dimensions**: Percentage of screen width/height

### Reference Dimensions
Base calculations on a reference screen size:
- **Reference Width**: 600px
- **Reference Height**: 600px
- All percentages calculated relative to these dimensions

## Implementation Phases

### Phase 1: Core Infrastructure
1. **ScaleManager Class**: Central coordinate conversion system
2. **Configuration Updates**: Convert all fixed values to percentages
3. **Base Entity Updates**: Modify core entity classes

### Phase 2: Entity Conversion
1. **Player Class**: Convert dimensions, physics, positioning
2. **Obstacle Class**: Convert sizes and spawn positions
3. **Constituent Class**: Convert dimensions and behavior
4. **Bribe Class**: Convert sizes and patterns

### Phase 3: Systems Integration
1. **Physics System**: Convert gravity, velocities, collisions
2. **Rendering System**: Scale all draw operations
3. **Input System**: Convert touch coordinates
4. **Spawn System**: Convert gaps and distances

### Phase 4: Testing & Refinement
1. **Multi-Device Testing**: Verify consistency across screen sizes
2. **Performance Testing**: Ensure no performance degradation
3. **Gameplay Testing**: Verify difficulty balance
4. **Bug Fixes**: Address edge cases

## Technical Details

### ScaleManager Class Structure
```javascript
class ScaleManager {
    constructor(canvas) {
        this.baseWidth = 600;
        this.baseHeight = 600;
        this.canvas = canvas;
        this.scaleX = canvas.width / this.baseWidth;
        this.scaleY = canvas.height / this.baseHeight;
    }
    
    // Convert percentage to pixels
    toPixelsX(percentage) { return percentage * this.canvas.width; }
    toPixelsY(percentage) { return percentage * this.canvas.height; }
    
    // Convert pixels to percentage
    toPercentageX(pixels) { return pixels / this.canvas.width; }
    toPercentageY(pixels) { return pixels / this.canvas.height; }
    
    // Scale based on reference dimensions
    scaleX(value) { return value * this.scaleX; }
    scaleY(value) { return value * this.scaleY; }
}
```

### Configuration Conversion Examples

#### Before (Fixed Pixels)
```javascript
PLAYER_CONFIG = {
    width: 40,           // 40px
    height: 60,          // 60px
    jumpPower: -15,      // -15px velocity
}

GAME_CONFIG = {
    gravity: 0.8,        // 0.8px/frame
    baseGameSpeed: 4,    // 4px/frame
}
```

#### After (Percentages)
```javascript
PLAYER_CONFIG = {
    widthPercent: 0.0667,    // 6.67% of screen width
    heightPercent: 0.1,      // 10% of screen height
    jumpPowerPercent: -0.025, // -2.5% of screen height
}

GAME_CONFIG = {
    gravityPercent: 0.00133,     // 0.133% of screen height/frame
    baseGameSpeedPercent: 0.0067, // 0.67% of screen width/frame
}
```

### Entity Coordinate System

#### Internal Storage (Percentages)
All entities store positions as percentages internally:
```javascript
class Player {
    constructor(canvas, scaleManager) {
        this.scaleManager = scaleManager;
        this.x = 0.167;  // 16.7% from left edge
        this.y = 0.8;    // 80% from top (ground level)
    }
}
```

#### Rendering Conversion
Convert to pixels only during rendering:
```javascript
draw(ctx) {
    const pixelX = this.scaleManager.toPixelsX(this.x);
    const pixelY = this.scaleManager.toPixelsY(this.y);
    const pixelWidth = this.scaleManager.toPixelsX(this.widthPercent);
    const pixelHeight = this.scaleManager.toPixelsY(this.heightPercent);
    
    ctx.fillRect(pixelX, pixelY, pixelWidth, pixelHeight);
}
```

## Benefits

### Gameplay Fairness
- **Consistent Difficulty**: Same relative jump height on all screens
- **Equal Obstacle Clearance**: Same safety margins regardless of device
- **Uniform Physics**: Gravity and velocity scale proportionally

### Technical Advantages
- **Future-Proof**: Automatically supports new screen sizes
- **Scalable**: Works from phones to tablets to desktop
- **Maintainable**: Single source of truth for dimensions

### Player Experience
- **Predictable**: Game feels identical across devices
- **Fair Competition**: Leaderboards reflect skill, not screen size
- **Consistent**: Muscle memory transfers between devices

## Migration Strategy

### Backward Compatibility
During migration, maintain parallel systems:
1. Keep existing pixel-based calculations as fallback
2. Add percentage-based calculations alongside
3. Use feature flag to switch between systems
4. Gradually deprecate pixel-based system

### Testing Approach
1. **Unit Tests**: Verify coordinate conversions
2. **Integration Tests**: Test cross-system compatibility
3. **Device Testing**: Test on various screen sizes
4. **Performance Tests**: Ensure no speed degradation

### Rollback Plan
If issues arise:
1. Feature flag can instantly revert to pixel system
2. Pixel calculations remain as backup
3. Configuration can be quickly reverted
4. Database/save compatibility maintained

## Performance Considerations

### Optimization Strategies
1. **Caching**: Cache pixel conversions where possible
2. **Batch Operations**: Convert multiple coordinates together
3. **Selective Updates**: Only convert when screen size changes
4. **Efficient Math**: Use multiplication instead of division

### Memory Impact
- **Minimal Overhead**: Small increase in memory usage
- **Configuration Growth**: Larger config objects
- **Runtime Storage**: Percentage values stored alongside pixels

## Success Metrics

### Technical Metrics
- **Performance**: No more than 5% FPS degradation
- **Memory**: Less than 10% memory increase
- **Accuracy**: Pixel-perfect rendering across screen sizes

### Gameplay Metrics
- **Consistency**: Jump height ratios identical across devices
- **Fairness**: Score distributions normalized across screen sizes
- **Quality**: No visual artifacts or rendering issues

## Timeline Estimate

### Phase 1 (Infrastructure): 2-3 hours
- ScaleManager implementation
- Configuration updates
- Base entity modifications

### Phase 2 (Entity Conversion): 3-4 hours
- Player, Obstacle, Constituent, Bribe updates
- Physics system conversion
- Collision system updates

### Phase 3 (Integration): 2-3 hours
- Rendering system updates
- Input system conversion
- Spawn system modifications

### Phase 4 (Testing): 2-3 hours
- Multi-device testing
- Performance optimization
- Bug fixes and refinement

**Total Estimated Time**: 9-13 hours

## Conclusion

Converting to a percentage-based coordinate system is essential for creating a fair, scalable mobile game. While it requires significant refactoring, the benefits in gameplay consistency and technical maintainability make it worthwhile.

The phased approach minimizes risk while ensuring thorough testing and validation at each step.
