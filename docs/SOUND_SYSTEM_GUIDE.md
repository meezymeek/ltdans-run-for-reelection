# Sound System Developer Guide
## RERUN: Danny Boy Runs for Office Again

### Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Adding New Sounds](#adding-new-sounds)
4. [Sound Categories](#sound-categories)
5. [Volume Control System](#volume-control-system)
6. [Special Features](#special-features)
7. [Troubleshooting](#troubleshooting)
8. [API Reference](#api-reference)

---

## System Overview

The game uses a modular sound system (`SoundManager`) that provides:
- 🎵 **Background Music** - Looping themes for different game states
- 🔊 **Sound Effects** - One-shot sounds for game events
- 🎚️ **Volume Control** - Independent control for master, music, and effects
- 💾 **Settings Persistence** - Saves user preferences
- 🔄 **Multi-Format Support** - Automatically tries WAV, MP3, OGG, M4A
- 🎹 **Fallback Synthesis** - Generates sounds if files are missing

## Architecture

### File Structure
```
/sfx/
├── /music/          # Background music files
│   ├── menu-theme   # Main menu music (loops)
│   ├── game-theme   # Gameplay music (loops)
│   └── pause-ambient # Pause screen music (loops)
│
├── /effects/        # Sound effect files
│   ├── jump         # Player jump
│   ├── point-low    # +10 points
│   ├── point-tall   # +30 points
│   ├── collision    # Game over crash
│   ├── button-click # UI interactions
│   ├── milestone-100 # Every 100 points
│   ├── speed-up     # Speed increase
│   └── victory-fanfare # Top 5 achievement
│
├── audio-assets-guide.md   # Audio specifications
├── SOUND_SYSTEM_GUIDE.md  # This file
└── soundManager.js        # Core sound engine
```

### Core Components

#### 1. SoundManager Class (`soundManager.js`)
The main audio engine that handles all sound playback:

```javascript
// Located in game.js constructor
this.soundManager = new SoundManager();
this.soundManager.loadSettings();
```

#### 2. Audio Context Initialization
- **Auto-initialized** on first user interaction (click/touch)
- Creates separate gain nodes for master, music, and effects volumes
- Handles browser audio policy restrictions

#### 3. Audio Pools
Frequently played sounds use pooling (5 instances each) to allow overlapping:
- Jump sounds can overlap when jumping rapidly
- Point collection sounds can play simultaneously
- No audio cutting or stuttering

## Adding New Sounds

### Step 1: Add Audio File
Place your audio file in the appropriate directory:
- Background music → `/sfx/music/`
- Sound effects → `/sfx/effects/`

**Supported formats** (in priority order):
1. `.wav` - Highest quality, larger files
2. `.mp3` - Best compatibility, good compression
3. `.ogg` - Firefox/Chrome support
4. `.m4a` - Apple devices

**You only need ONE format** - the system auto-detects available formats.

### Step 2: Register in SoundManager

Edit `soundManager.js` and add your sound to the registry:

```javascript
this.sounds = {
    music: {
        menu: 'sfx/music/menu-theme',
        game: 'sfx/music/game-theme',
        // Add new music here:
        boss: 'sfx/music/boss-theme'
    },
    effects: {
        jump: 'sfx/effects/jump',
        // Add new effect here:
        powerup: 'sfx/effects/powerup'
    }
};
```

### Step 3: Add Fallback Tone (Optional)

For effects, add a synthesized fallback in case the file fails to load:

```javascript
this.fallbackTones = {
    jump: { frequency: 400, duration: 0.15, type: 'sine' },
    // Add fallback for your new sound:
    powerup: { frequency: 1500, duration: 0.3, type: 'triangle' }
};
```

### Step 4: Create Helper Method (Optional)

For commonly used sounds, add a helper method:

```javascript
// In SoundManager class
playPowerup() {
    this.playEffect('powerup', { 
        volume: 0.9, 
        pitch: 1.0 
    });
}
```

### Step 5: Use in Game

```javascript
// Playing music
this.soundManager.playMusic('boss');

// Playing effects
this.soundManager.playEffect('powerup');

// Or with options
this.soundManager.playEffect('powerup', {
    volume: 0.8,    // 0-1 relative to effects volume
    pitch: 1.2,     // Playback speed (1.0 = normal)
    delay: 100      // Delay in milliseconds
});
```

## Sound Categories

### Background Music
- **Characteristics**: Loops continuously, one at a time
- **Volume**: Controlled by music slider
- **Transitions**: Instant switching (no fade in/out)
- **States**:
  - `menu` - Start screen, game over, leaderboard
  - `game` - Active gameplay
  - `pause` - Pause screen

### Sound Effects
- **Characteristics**: Play once, can overlap
- **Volume**: Controlled by effects slider
- **Types**:

| Effect | Trigger | Notes |
|--------|---------|-------|
| `jump` | Player jumps | Slight pitch variation |
| `point-low` | Clear low obstacle (+10) | Quick ding |
| `point-tall` | Clear tall obstacle (+30) | Bigger reward sound |
| `collision` | Hit obstacle | Game over |
| `button-click` | Any UI button | Soft click |
| `milestone-100` | Every 100 points | Achievement |
| `speed-up` | Speed increase | Whoosh |
| `victory-fanfare` | Top 5 score | Plays over menu music |

## Volume Control System

### Three-Tier Volume Control

```
Master Volume (0-100%)
    ├── Music Volume (0-100%)
    └── Effects Volume (0-100%)
```

**Final volume calculation**:
```javascript
musicVolume = masterVolume × musicVolume × trackVolume
effectVolume = masterVolume × effectsVolume × effectVolume
```

### Settings Persistence
Volume settings are saved to `localStorage`:
```javascript
localStorage.setItem('rerun_audio_settings', {
    volumes: { master: 0.7, music: 0.6, effects: 0.8 },
    muted: { master: false, music: false, effects: false }
});
```

### UI Controls
Located in pause menu:
- Sliders for volume adjustment
- Mute toggle buttons (🔇/🔊)
- Real-time percentage display

## Special Features

### 1. Victory Fanfare System
When achieving a top 5 leaderboard score:
```javascript
// In game.js - startGame()
// Fetches current top 5 scores
this.top5Threshold = data.leaderboard[4].score;

// In gameOver()
if (this.score > this.top5Threshold) {
    this.soundManager.playMusic('menu');      // Background
    this.soundManager.playEffect('victory-fanfare'); // Layered on top
    this.addPopup("TOP 5!", ...);            // Visual feedback
}
```

### 2. Audio Pooling
Prevents audio cutting for frequently played sounds:
```javascript
// Each effect has 5 pre-loaded instances
this.poolSize = 5;
// System automatically finds available instance or reuses oldest
```

### 3. Pitch Variation
Adds natural variety to repetitive sounds:
```javascript
playJump() {
    this.playEffect('jump', { 
        pitch: 0.95 + Math.random() * 0.1  // 0.95-1.05 variation
    });
}
```

### 4. Fallback Synthesis
If audio files fail to load, synthesized tones play instead:
```javascript
// Uses Web Audio API oscillator
// Each sound has defined frequency, duration, and waveform
this.fallbackTones = {
    jump: { frequency: 400, duration: 0.15, type: 'sine' }
};
```

## Troubleshooting

### Sound Not Playing

1. **Check browser console** for errors:
   ```
   Failed to load effects 'jump' in any format
   ```

2. **Verify file exists**:
   ```bash
   ls sfx/effects/
   # Should show: jump.wav (or .mp3, .ogg, .m4a)
   ```

3. **Check volume settings**:
   - Master volume > 0
   - Category not muted
   - Individual volume in play call

4. **Browser autoplay policy**:
   - Sounds only work after user interaction
   - First click/touch initializes audio context

### Performance Issues

1. **Reduce pool size** for less critical sounds:
   ```javascript
   this.poolSize = 3; // Instead of 5
   ```

2. **Use compressed formats**:
   - MP3 instead of WAV for effects
   - Keep files under 100KB

3. **Limit simultaneous sounds**:
   ```javascript
   // Add cooldown to prevent spam
   if (Date.now() - this.lastSoundTime < 50) return;
   ```

### Cross-Browser Issues

**Format compatibility**:
| Browser | WAV | MP3 | OGG | M4A |
|---------|-----|-----|-----|-----|
| Chrome  | ✅  | ✅  | ✅  | ✅  |
| Firefox | ✅  | ✅  | ✅  | ❌  |
| Safari  | ✅  | ✅  | ❌  | ✅  |
| Edge    | ✅  | ✅  | ✅  | ✅  |

**Solution**: Provide MP3 as it works everywhere.

## API Reference

### SoundManager Methods

#### Music Control
```javascript
playMusic(name)        // Start playing music track
stopMusic()           // Stop current music
pauseMusic()          // Pause current music
resumeMusic()         // Resume paused music
```

#### Effect Playback
```javascript
playEffect(name, options)  // Play sound effect
// Options: { volume: 0-1, pitch: 0.5-2, delay: ms }

// Helper methods:
playJump()            // Jump sound with pitch variation
playPointLow()        // +10 point sound
playPointTall()       // +30 point sound
playCollision()       // Game over sound
playButtonClick()     // UI click sound
playMilestone()       // 100 point milestone
playSpeedUp()        // Speed increase sound
```

#### Volume Control
```javascript
setVolume(type, value)     // Set volume (0-1)
// type: 'master', 'music', 'effects'

toggleMute(type)           // Toggle mute state
// Returns: new mute state (true/false)

updateVolumes()            // Apply volume changes
saveSettings()            // Save to localStorage
loadSettings()            // Load from localStorage
```

#### Initialization
```javascript
initialize()              // Init audio context (auto-called)
loadAllSounds()          // Preload all audio files
```

### Game Integration Points

#### In `game.js`:

1. **Constructor**: Initialize SoundManager
2. **startGame()**: Play game music
3. **pauseGame()**: Switch to pause music
4. **resumeGame()**: Return to game music
5. **gameOver()**: Play menu music + victory fanfare
6. **handleJump()**: Trigger jump sound
7. **updateObstacles()**: Point collection sounds
8. **checkCollision()**: Collision sound
9. **Button clicks**: UI feedback sounds

### Volume Control UI

Located in `index.html`:
```html
<div class="audio-control">
    <input type="range" id="masterVolume" min="0" max="100">
    <button id="masterMute">🔇</button>
</div>
```

Handled in `game.js` → `setupAudioControls()`

---

## Quick Reference Card

### Adding a New Sound - Checklist
- [ ] Add audio file to `/sfx/music/` or `/sfx/effects/`
- [ ] Register in `soundManager.js` → `this.sounds`
- [ ] Add fallback tone (optional)
- [ ] Create helper method (optional)
- [ ] Test with `this.soundManager.playEffect('name')`
- [ ] Document in `audio-assets-guide.md`

### Common Patterns

**Background music change**:
```javascript
this.soundManager.stopMusic();
this.soundManager.playMusic('newTheme');
```

**Layered victory sequence**:
```javascript
this.soundManager.playMusic('menu');  // Background
this.soundManager.playEffect('victory-fanfare');  // On top
```

**Random pitch variation**:
```javascript
this.soundManager.playEffect('coin', {
    pitch: 0.9 + Math.random() * 0.2
});
```

---

*Last Updated: September 18, 2025*
*Version: 1.0*
