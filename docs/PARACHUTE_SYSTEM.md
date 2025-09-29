# Parachute System Documentation

## Overview
RERUN: Danny Boy Runs for Office Again features a dynamic parachute system that activates during high jumps, allowing players to float and extend their airtime. The parachute system includes customizable skins that are randomly selected on each deployment.

## How It Works

### Activation
- **Automatic Deployment**: Parachute activates automatically when the player reaches high altitude (above 60% of screen height)
- **One Per Jump**: Each jump can deploy only one parachute
- **Stomp Bonus**: Stomping on constituents launches the player high and resets parachute availability

### Mechanics
- **Duration**: 3 seconds maximum flight time
- **Tap to Float**: Players must tap repeatedly to maintain altitude
- **Visual Timer**: Shows remaining parachute time at tap location
- **Gravity Reduction**: 
  - While tapping: Near-zero gravity (floating)
  - Without tapping: 40% reduced gravity (slow descent)
  - After expiration: Normal gravity resumes

### Controls
- **Mobile**: Tap anywhere on screen while parachute is active
- **Desktop**: Click anywhere on canvas while parachute is active
- **Feedback**: "TAP!" indicator flashes to remind players to maintain altitude

## Skinnable Parachutes

### Current Skins (4 Available)
1. `parachute_marlboro.png` - Marlboro themed design
2. `parachute_silvereagle.png` - Silver Eagle design
3. `parachute_koch.png` - Koch branded parachute
4. `parachute_spacex.png` - SpaceX themed design

### How Skins Work
- **Random Selection**: Each deployment randomly selects one of the available skins
- **Equal Probability**: All skins have equal chance of appearing
- **Visual Variety**: Adds visual interest and replay value
- **Console Logging**: Selected skin is logged for debugging

### Adding New Skins
1. Create a PNG image (recommended size: 70x70 pixels)
2. Save it to `skins/parachutes/` folder with naming convention: `parachute_[name].png`
3. Edit `game.js` (around line 676) and add the filename to the `parachuteSkinFiles` array:
```javascript
const parachuteSkinFiles = [
    'parachute_marlboro.png',
    'parachute_silvereagle.png',
    'parachute_koch.png',
    'parachute_spacex.png',
    'parachute_yournewskin.png'  // Add your new skin here
];
```

## Technical Implementation

### File Structure
```
skins/
└── parachutes/
    ├── parachute_marlboro.png
    ├── parachute_silvereagle.png
    ├── parachute_koch.png
    ├── parachute_spacex.png
    └── parachute-skins.json (legacy, not used)
```

### Code Architecture
- **Loading System**: Skins are loaded at game initialization
- **Fallback Support**: If images fail to load, colored parachutes are used
- **CORS-Safe**: Implementation avoids CORS issues by embedding skin list in code
- **Performance**: Images are preloaded to prevent lag during gameplay

### Key Variables (in game.js)
```javascript
// Player parachute properties
player.hasParachute              // Boolean: Is parachute active?
player.parachuteUsedThisJump     // Boolean: Has parachute been used this jump?
player.parachuteTimeLeft         // Number: Milliseconds remaining
player.parachuteTapping          // Boolean: Is player actively tapping?
player.lastTapTime               // Number: Timestamp of last tap

// Skin system
this.loadedParachuteSkins        // Array: Loaded skin objects
this.currentParachuteSkin        // Object: Currently selected skin
```

## Visual Features

### Parachute Display
- Semi-circular canopy above player
- Customizable skin/texture via PNG images
- Black outline for visibility
- Five connection lines to player
- Smooth animation and positioning

### UI Elements
- **Timer Display**: Shows remaining time with color coding
  - Green: > 50% time remaining
  - Yellow: 20-50% time remaining  
  - Red: < 20% time remaining
- **TAP! Indicator**: Flashes to prompt player interaction
- **Position Tracking**: Timer follows player's tap position with smooth lerping

## Gameplay Impact

### Strategic Elements
- **Extended Airtime**: Allows avoiding multiple obstacles
- **Height Management**: Players must balance floating vs. controlled descent
- **Skill Requirement**: Rapid tapping needed to maintain altitude
- **Risk/Reward**: Higher altitude means more points but harder landing

### Interaction with Other Systems
- **Constituents**: Stomping grants new parachute opportunity
- **Obstacles**: Parachute helps clear tall obstacles
- **Scoring**: Extended airtime can lead to higher scores

## Future Enhancements

### Potential Improvements
- [ ] Parachute power-ups for extended duration
- [ ] Special parachute abilities (double jump, speed boost)
- [ ] Unlockable skins through achievements
- [ ] Animated parachute designs
- [ ] Wind effects on parachute physics
- [ ] Parachute upgrade system
- [ ] Sound effects for deployment/expiration

## Troubleshooting

### Common Issues
1. **Skins not loading**: Check file paths and naming convention
2. **CORS errors**: Ensure using local embedded list, not external JSON
3. **Parachute not deploying**: Verify altitude threshold (40% of screen height)
4. **Timer not visible**: Timer only appears after first tap

### Debug Commands
- Check console for "Parachute deployed with skin: [name]" messages
- Enable hitboxes in Dev Menu (pause game → gear icon)
- Monitor `player.parachuteTimeLeft` in console

## Credits
- Parachute system designed and implemented for RERUN: Danny Boy Runs for Office Again
- Customizable skin system allows for branded/themed parachutes
- Part of the comprehensive gameplay mechanics alongside ragdoll physics and leaderboards
