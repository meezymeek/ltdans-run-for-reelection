# Audio Assets Guide for Lt. Dan's Run for Re-Election

## Overview
This document outlines all audio assets needed for the game, their specifications, and usage context. Audio files should be placed in the appropriate subdirectories within `/sfx/`.

## Directory Structure
```
/sfx/
├── /music/          # Background music and themes
├── /effects/        # Sound effects for gameplay
└── audio-assets-guide.md  # This file
```

## Audio Asset Requirements

### 🎵 Background Music (`/music/`)

#### Priority 1 - Essential
| File Name (without extension) | Description | Duration | Loop | Format | Notes |
|-----------|------------|----------|------|--------|-------|
| `game-theme` | Main gameplay background music | 60-90 sec | Yes | WAV/MP3/OGG/M4A | Upbeat, energetic campaign rally style |
| `menu-theme` | Start screen/menu music | 45-60 sec | Yes | WAV/MP3/OGG/M4A | Patriotic, inspiring tone |

#### Priority 2 - Enhanced
| File Name (without extension) | Description | Duration | Loop | Format | Notes |
|-----------|------------|----------|------|--------|-------|
| `pause-ambient` | Pause screen ambient sound | 30-45 sec | Yes | WAV/MP3/OGG/M4A | Soft, contemplative |

### 🔊 Sound Effects (`/effects/`)

#### Priority 1 - Core Gameplay
| File Name (without extension) | Description | Duration | Format | Notes |
|-----------|------------|----------|--------|-------|
| `jump` | Player jump sound | 0.2-0.3 sec | WAV/MP3/OGG/M4A | Quick whoosh or spring sound |
| `point-low` | Low obstacle cleared (+10 pts) | 0.2-0.3 sec | WAV/MP3/OGG/M4A | Small coin/ding sound |
| `point-tall` | Tall obstacle cleared (+30 pts) | 0.3-0.5 sec | WAV/MP3/OGG/M4A | Bigger reward sound, more celebratory |
| `collision` | Game over/crash sound | 0.5-1.0 sec | WAV/MP3/OGG/M4A | Impact/crash sound |
| `button-click` | UI button click | 0.1-0.2 sec | WAV/MP3/OGG/M4A | Soft click/tap |

#### Priority 2 - Enhanced Experience
| File Name (without extension) | Description | Duration | Format | Notes |
|-----------|------------|----------|--------|-------|
| `victory-fanfare` | Top 5 leaderboard achievement | 2-3 sec | WAV/MP3/OGG/M4A | Triumphant fanfare, plays over menu music |
| `fail` | Failed to reach top 5 score | 0.8-1.5 sec | WAV/MP3/OGG/M4A | Disappointment sound, womp womp style |
| `milestone-100` | Every 100 points milestone | 0.5-1.0 sec | WAV/MP3/OGG/M4A | Achievement sound |
| `countdown-3` | Game start countdown - 3 | 0.3 sec | WAV/MP3/OGG/M4A | Beep or voice "3" |
| `countdown-2` | Game start countdown - 2 | 0.3 sec | WAV/MP3/OGG/M4A | Beep or voice "2" |
| `countdown-1` | Game start countdown - 1 | 0.3 sec | WAV/MP3/OGG/M4A | Beep or voice "1" |
| `countdown-go` | Game start countdown - GO | 0.5 sec | WAV/MP3/OGG/M4A | "Go!" or starting gun |
| `speed-up` | Speed increase notification | 0.3-0.5 sec | WAV/MP3/OGG/M4A | Acceleration whoosh |

#### Priority 3 - Thematic Enhancements
| File Name (without extension) | Description | Duration | Format | Notes |
|-----------|------------|----------|--------|-------|
| `crowd-cheer` | Ambient crowd cheering | 2-3 sec | WAV/MP3/OGG/M4A | Political rally atmosphere |
| `vote-collect` | Alternative point sound | 0.2-0.3 sec | WAV/MP3/OGG/M4A | "Vote" themed sound |
| `campaign-slogan` | Random campaign slogan | 1-2 sec | WAV/MP3/OGG/M4A | Voice clip "Re-elect Lt. Dan!" |

## Technical Specifications

### Recommended Audio Settings
- **Formats Supported**: WAV, MP3, OGG, M4A (system auto-detects available format)
- **Priority**: WAV (highest quality), MP3 (best compatibility), OGG (Firefox), M4A (Apple)
- **Bitrate**: 128kbps for music, 96kbps for effects
- **Sample Rate**: 44.1kHz
- **Channels**: Mono for effects, Stereo for music
- **Normalization**: -3dB peak to prevent clipping

### File Size Guidelines
- **Music files**: Keep under 2MB each
- **Sound effects**: Keep under 100KB each
- **Total package**: Aim for under 5MB total

## Audio Sources & Creation Tips

### Free Resources
1. **Freesound.org** - Creative Commons sounds
2. **Zapsplat.com** - Free with account
3. **OpenGameArt.org** - Game-specific assets
4. **YouTube Audio Library** - Royalty-free music

### Creation Tools
1. **Audacity** (Free) - Record and edit sounds
2. **Bfxr** - Retro game sound generator
3. **ChipTone** - Online sound effect generator
4. **GarageBand** (Mac) - Music creation
5. **FL Studio Mobile** - Mobile music production

### Recording Tips
- Record at highest quality, compress later
- Leave small silence padding at start/end
- For loops, ensure seamless loop points
- Test in-game at various volume levels

## Implementation Notes

### Sound Pooling
Effects that play frequently (jump, points) will use audio pooling with 3-5 instances to allow overlapping playback.

### Volume Levels (Default)
- Master: 70%
- Music: 60%
- Effects: 80%

### Browser Compatibility & Multi-Format Support
The system automatically tries to load files in this priority order:
1. **WAV** format (best quality, larger files)
2. **MP3** format (best compatibility, good compression)
3. **OGG** format (Firefox/Chrome support)
4. **M4A** format (Apple devices)
5. **Fallback** to synthesized sound (if all formats fail)

You only need to provide ONE format per sound - the system will find and use whatever format is available. For best results, provide WAV files if quality is priority, or MP3 files if file size is a concern.

## Testing Checklist
- [ ] All sounds load without errors
- [ ] Music loops seamlessly
- [ ] Effects don't clip or distort
- [ ] Volume balance feels right
- [ ] Mobile performance is smooth
- [ ] Sounds work on muted start (after user interaction)

## License Reminders
- Keep documentation of licenses for all audio
- Credit creators as required
- Verify commercial use if planning monetization
- Consider commissioning original music for uniqueness

---

## Quick Start for Testing
If you want to quickly test the system while hunting for better audio:

1. Use online generators to create placeholder sounds:
   - Visit: https://sfxr.me/ for quick retro effects
   - Visit: https://www.bfxr.net/ for more options

2. Record your own temporary sounds:
   - "Jump" - Say "whoosh" into your mic
   - "Point" - Tap a glass with a spoon
   - "Collision" - Crumple paper

3. The system will work with whatever you provide and gracefully fallback to synthesized sounds for missing files.

---

*Last Updated: September 18, 2025*
