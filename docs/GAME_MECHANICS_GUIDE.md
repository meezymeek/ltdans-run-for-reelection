# RERUN: Danny Boy Runs for Office Again - Game Mechanics Guide

## Table of Contents
1. [Constituent Squashing System](#constituent-squashing-system)
2. [Bribe Collection System](#bribe-collection-system)
3. [Parachute System](#parachute-system)
4. [Scoring System](#scoring-system)

---

## Constituent Squashing System

### Overview
Constituents are red-colored NPCs that walk toward the player. When stomped on, they trigger a dramatic squash-and-stretch animation before launching off-screen, while propelling the player high into the air.

### Mechanics
- **Spawn Rate**: Every 300 frames
- **Movement Speed**: 80% of obstacle speed
- **Score Penalty**: -25 votes when stomped
- **Player Launch**: Velocity of -28 (super jump pad effect)

### Animation Sequence
The squashing animation consists of three phases:

#### Phase 1: SQUASHING (0-120ms)
- Constituent compresses to 25% of original height
- Expands to 175% of original width
- Uses `easeOutQuad` for smooth compression

#### Phase 2: STRETCHING (120-250ms)
- Springs up to 150% of original height
- Contracts to 60% of original width
- Uses `easeOutElastic` for bouncy spring effect
- Launch velocities prepared at 220ms

#### Phase 3: LAUNCHING (250-500ms)
- Launched backward and upward (-8 horizontal, -24 vertical velocity)
- Spins dramatically with random rotation
- Fades out to 20% opacity
- Subject to gravity

### Visual Features
- Real-time scale interpolation using lerp (speed: 0.25)
- Maintains ground contact during squash
- Lifts slightly during stretch phase
- Surprised eye expression during squash

---

## Bribe Collection System

### Overview
Bribes are golden dollar signs ($) that float in the air. Collecting them grants bonus votes and temporary speed effects.

### Spawn Configuration
- **Single Bribe Rate**: Every 180 frames
- **Pattern Spawn**: Every 200-300 frames (random)
- **Reward**: +5 votes per bribe

### Height Levels
Bribes can spawn at 7 different heights:
1. **Low** (80px up) - Easy jump
2. **Mid** (140px up) - High jump
3. **High** (200px up) - Needs good timing
4. **Very High** (260px up) - Parachute recommended
5. **Super High** (320px up) - Parachute essential
6. **Sky High** (380px up) - Extreme altitude
7. **Near Space** (440px up) - Maximum height

### Pattern Types
Bribes spawn in 5 different patterns:

#### Arch Pattern
- 5 bribes in arc formation
- 60 pixels spacing between bribes
- Creates rainbow-like path

#### Wave Pattern
- 6 bribes in sine wave
- 55 pixels spacing
- Undulating path

#### Diagonal Pattern
- 4 bribes in diagonal line
- 70 pixels spacing
- Can be rising or falling

#### Cluster Pattern
- 3 bribes in random cluster
- 45 pixels base spacing with variation
- Concentrated reward zone

#### Stairs Pattern
- 6 bribes in staircase formation
- 55 pixels spacing
- Goes up then down

### Spacing Configuration
- **Minimum entity gap**: 200 pixels
- **Pattern interval**: 200-300 frames
- **Individual spacing**: 50-75% more than original values

---

## Parachute System

### Activation
- Automatically deploys when player reaches 40% screen height while jumping
- One-time use per jump
- Duration: 3 seconds maximum
- Random skin selection from loaded parachute skins

### Controls
- **Tap to maintain**: Tapping counteracts gravity for floating
- **No tap**: 40% reduced gravity for controlled descent
- **Timer expires**: Normal gravity resumes immediately

### Visual Feedback
- Parachute canopy rendered above player
- Support lines connect to player
- Timer display shows remaining time
- Color-coded timer: Green > Yellow > Red
- "TAP!" indicator flashes continuously
- Smooth position tracking with lerp (0.18 speed)

### Available Skins
- Marlboro theme
- Silver Eagle theme
- Koch theme
- SpaceX theme
- Fallback solid colors if images fail to load

---

## Scoring System

### Base Points
- **Continuous play**: +1 vote per 10 frames
- **Low obstacle cleared**: +10 votes
- **Tall obstacle cleared**: +30 votes
- **Bribe collected**: +5 votes
- **Constituent stomped**: -25 votes (penalty)

### Speed Progression
- Base speed: 4 units
- Increases by 0.2 every 100 points
- Maximum speed: 8 units
- Gradual acceleration: 0.0002 per frame

### Milestones
- Every 100 points triggers:
  - Score badge animation (shake effect)
  - Milestone sound effect
  - Speed increase
  - "MILESTONE!" popup

### Visual Feedback
- Floating score popups at collection points
- Icon indicators (💰 for bribes, 🪂 for parachute, etc.)
- Popups animate toward top-center of screen
- Smooth scaling and fading effects

---

## Technical Implementation

### Animation System
- **Frame-independent updates**: Uses delta time for consistent animation
- **Lerp interpolation**: Smooth transitions for all animated properties
- **Easing functions**: 
  - `easeOutQuad` for natural deceleration
  - `easeOutElastic` for bouncy effects
  - `easeOutBack` for overshoot animations

### Performance Optimizations
- Maximum 20 popups at once
- Throttled score updates (50ms minimum interval)
- Entity spawn distance tracking to prevent overlap
- Delta time capped at 100ms to prevent physics explosions

### Debug Features
- Hitbox visualization toggle
- Speed display overlay
- Real-time performance metrics
- Dev menu accessible from pause screen

---

## Tips for Players

1. **Avoid constituents** unless you need a super jump - they cost 25 votes!
2. **Collect bribes strategically** - higher bribes are worth the same but harder to reach
3. **Master the parachute tap timing** to stay airborne longer
4. **Use constituent launches** to reach extreme height bribes
5. **Watch for patterns** - bribes often spawn in predictable formations
6. **Conserve parachute time** - you only get 3 seconds per jump

---

*Last Updated: September 18, 2025*
*Game Version: Constituent Squashing & Extreme Bribes Update*
