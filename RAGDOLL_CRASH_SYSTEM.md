# Lt. Dan's Ragdoll Crash Animation System

## Overview
The game now features a sophisticated ragdoll physics system that triggers when the player collides with obstacles, creating an entertaining crash sequence before the game over screen.

## Features

### 1. **Ragdoll Physics System**
- **Dynamic Physics Simulation**: Realistic physics with gravity, bounce, and friction
- **Multi-Part Character**: 10 body parts (head, torso, arms, legs) with individual physics
- **Joint Constraints**: Body parts stay connected with flexible joints
- **Collision Detection**: Body parts bounce off the ground and screen edges

### 2. **Crash Sequence**
When a collision occurs:
1. Game state changes from 'playing' to 'crashing'
2. Ragdoll system is created at player's position
3. Crash sound effect plays (using the custom 'crash.mp3' sound)
4. Screen shake effect begins (intensity: 15px, decays over time)
5. Crash animation plays for 2 seconds
6. Game over screen appears after animation completes

### 3. **Continuous Background Animation**
- Clouds continue floating during crash sequence
- Background remains animated even after game over screen appears
- Ragdoll physics continue in the background during game over menu
- Creates a living, dynamic world that doesn't freeze

### 4. **Screen Shake Effect**
- Initial intensity of 15 pixels
- Gradually decays (multiplied by 0.9 each frame)
- Stops when shake amount < 0.5 pixels
- Adds impact and drama to collisions

### 5. **Skin Integration**
- Ragdoll uses the same skin system as the animated character
- Each body part renders with appropriate skin texture
- Falls back to colored rectangles if skins aren't loaded

## Technical Implementation

### RagdollSystem Class
Located in `game.js`, the RagdollSystem class handles:
- Body part physics (position, velocity, rotation)
- Joint constraints between connected parts
- Ground and wall collisions
- Rendering with skin support

### Key Physics Parameters
```javascript
gravity: 0.5        // Downward force
friction: 0.98      // Air resistance
bounce: 0.6         // Ground bounce factor
crashDuration: 2000 // 2 seconds before game over
```

### Game State Flow
```
playing → collision detected → crashing (2 sec) → gameOver
```

During 'crashing' state:
- Player character hidden
- Ragdoll physics active
- Screen shake active
- Background continues scrolling

During 'gameOver' state:
- Ragdoll physics continue
- Background continues scrolling
- Game over menu displayed

## Sound Effects
- **crash.mp3**: Plays when collision occurs
- Located in `sfx/effects/crash.mp3`

## Configuration
Crash parameters can be adjusted in the LtDanRunner constructor:
- `crashDuration`: Time before game over screen (default: 2000ms)
- `screenShakeIntensity`: Initial shake strength (default: 15px)

## Future Enhancements
Potential improvements for the crash system:
- Different crash animations based on obstacle type
- Particle effects on impact
- Slow-motion effect during crash
- Multiple crash sound variations
- Ragdoll customization per skin

## Files Modified
- `game.js`: Added RagdollSystem class and crash handling
- `soundManager.js`: Integrated crash sound effect
- `sfx/effects/crash.mp3`: New crash sound file

## Testing
To test the crash system:
1. Start the game
2. Run into any obstacle
3. Observe the ragdoll animation and screen shake
4. Verify background continues moving
5. Check that crash sound plays correctly
