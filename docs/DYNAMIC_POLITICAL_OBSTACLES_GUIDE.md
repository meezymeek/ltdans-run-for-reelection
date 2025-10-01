# Dynamic Political Obstacles System Guide

## Overview
The Dynamic Political Obstacles system creates varied, educational gameplay by displaying different political terms and concepts as obstacles. Each tall obstacle displays a randomly selected word from a curated list of political terms.

## System Components

### 1. Political Words Database
**File:** `src/entities/political_obstacles.json`
- Contains 100+ political terms, concepts, and phrases
- Simple JSON array format for easy editing
- Categories include: accountability, social issues, reforms, challenges, values, etc.

```json
[
  "Accountability",
  "Transparency", 
  "Healthcare reform",
  "Climate",
  "etc..."
]
```

### 2. Dynamic Loading System
**Location:** `src/Game.js` - `loadPoliticalWords()` method

- Loads political words during game initialization
- Fallback to basic terms if file fails to load
- Words are stored in `game.politicalWords` array

### 3. Random Word Selection
**Location:** `src/Game.js` - `getRandomPoliticalWord()` method

- Randomly selects words from the loaded array
- Ensures equal probability for all words
- Returns fallback word if array is empty

### 4. Dynamic Obstacle Generation
**Location:** `src/GameLoop.js` - `selectObstacleVariant()` method

For tall obstacles:
- Creates dynamic skin configuration on-the-fly
- Each obstacle gets a unique randomly selected word
- Text is auto-sized and rotated (-90°) to fit obstacle bounds

## Visual Configuration

### Text Rendering Properties
```javascript
textConfig: {
    text: randomWord,           // Dynamic political word
    textColor: "#000000",       // Black text
    fontSize: "auto",           // Auto-calculated size
    rotation: -90,              // Rotated sideways
    fontFamily: "Tiny5"         // Game's pixel font
}
```

### Styling
- **Background:** White rectangle (#ffffff)
- **Text:** Black, bold, auto-sized
- **Rotation:** -90 degrees (text reads vertically)
- **Font:** Tiny5 (consistent with game UI)

## Adding New Political Terms

### Simple Method (Recommended)
1. Edit `src/entities/political_obstacles.json`
2. Add new terms to the array:
```json
[
  "Existing term",
  "New term 1",
  "New term 2"
]
```
3. Save file - changes take effect on next game load

### Guidelines for New Terms
- **Keep concise**: Short phrases work best for readability
- **Political relevance**: Focus on civic, governmental, or social concepts
- **Educational value**: Terms that teach about democracy, governance, or civic responsibility
- **Avoid partisan language**: Focus on concepts rather than specific political positions

## Technical Implementation

### 1. Initialization Flow
```
Game starts → loadObstacleSkinConfig() → loadPoliticalWords() → 
Words ready for use in spawning
```

### 2. Obstacle Spawning Flow
```
Tall obstacle needed → selectObstacleVariant('tall') →
getRandomPoliticalWord() → Create dynamic skin config →
Spawn obstacle with random political term
```

### 3. Rendering Flow
```
Obstacle.render() → Check renderType === 'text' →
renderTextObstacle() → Calculate font size → Draw text rotated
```

## Future Enhancement Opportunities

### 1. Category-Based Spawning
Add categories to political_obstacles.json:
```json
{
  "positive": ["Accountability", "Transparency"],
  "challenges": ["Corruption", "Inequality"],
  "reforms": ["Healthcare reform", "Education reform"]
}
```

### 2. Color Coding by Category
- **Positive concepts:** Green background
- **Challenges:** Red background  
- **Reforms:** Blue background
- **Neutral:** White background (current)

### 3. Word Frequency Weights
Add spawn weights for different terms:
```json
[
  {"word": "Accountability", "weight": 10},
  {"word": "Rare term", "weight": 1}
]
```

### 4. Dynamic Font Sizing Improvements
- Shorter words → Larger font
- Longer phrases → Smaller font
- Multi-line text support for very long phrases

## File Structure
```
src/entities/
├── political_obstacles.json     # Word database (edit this!)
├── Obstacle.js                  # Rendering logic
└── ...

src/
├── Game.js                      # Loading & word selection
├── GameLoop.js                  # Spawning logic
└── ...
```

## Debugging

### Console Logs
The system provides detailed logging:
- Word loading: `"Loaded X political words for obstacles"`
- Word selection: `"Using dynamic political word for tall obstacle: X"`
- Spawning: `"Spawning tall obstacle - variant: political"`

### Testing
1. Start game and check browser console for loading messages
2. Play game and observe different words on tall obstacles
3. Each tall obstacle should display a different political term

## Troubleshooting

### Words Not Loading
**Symptoms:** All obstacles show "Accountability"
**Solution:** Check console for fetch errors, verify file path

### Text Not Visible
**Symptoms:** White boxes with no text
**Solution:** Check textConfig in skin configuration, verify font loading

### Same Word Repeating
**Symptoms:** All obstacles show same word
**Solution:** Verify `getRandomPoliticalWord()` is being called for each spawn

## Educational Impact

This system turns obstacle avoidance into civic education by exposing players to:
- **Democratic concepts** (accountability, transparency)
- **Social challenges** (inequality, climate, healthcare)
- **Civic processes** (voting rights, oversight, regulation)
- **Governmental functions** (checks, balances, constitution)

Players unconsciously learn political vocabulary while playing, making the game both entertaining and educational.

---

**For Developers:** This system is designed to be maintenance-free once implemented. Content updates only require editing the JSON file - no code changes needed!
