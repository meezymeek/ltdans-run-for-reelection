// Game Configuration
export const GAME_CONFIG = {
    // Global zoom factor - disabled in favor of direct percentage adjustments
    globalZoom: 1.0,  // No dynamic zoom - sizes baked into percentages
    
    // Physics (pixels - legacy)
    gravity: 0.8,
    jumpPower: -15,
    groundLevel: 0.8,
    
    // Physics (percentages - based on 600x600 reference)
    gravityPercent: 0.00133,    // 0.133% of screen height per frame
    jumpPowerPercent: -0.025,   // -2.5% of screen height
    groundLevelPercent: 0.8,    // 80% down from top
    
    // Speed settings (pixels - legacy)
    baseGameSpeed: 4,
    gameSpeed: 4,
    baseObstacleSpeed: 4,
    obstacleSpeed: 4,
    speedIncreaseRate: 0.0002,
    maxGameSpeed: 8,
    
    // Speed settings (percentages)
    baseGameSpeedPercent: 0.0067,    // 0.67% of screen width per frame
    gameSpeedPercent: 0.0067,
    baseObstacleSpeedPercent: 0.0067,
    obstacleSpeedPercent: 0.0067,
    speedIncreaseRatePercent: 0.0000003, // Very small percentage increase
    maxGameSpeedPercent: 0.0133,     // 1.33% of screen width per frame
    
    // Scoring
    scoreMultiplier: 1,
    baseScoreMultiplier: 1,
    lowPoints: 10,
    tallPoints: 30,
    
    // Spawn rates (frames - unchanged as they're time-based)
    obstacleSpawnRate: 180,
    tallSpawnMin: 270,
    tallSpawnMax: 540,
    constituentSpawnRate: 300,
    bribeSpawnRate: 180,
    
    // Gaps and distances (pixels - legacy)
    minObstacleGapPx: 250,
    
    // Gaps and distances (percentages)
    minObstacleGapPercent: 0.417,    // 41.7% of screen width
    
    // Effect modifiers
    constituentSpeedMod: 0.85,
    constituentScoreMod: 0.8,
    bribeSpeedMod: 1.2,
    bribeScoreMod: 1.5,
    effectDuration: 5000,
    bribeDuration: 7000
};

// Player Configuration
export const PLAYER_CONFIG = {
    // Dimensions (pixels - legacy)
    width: 40,
    height: 60,
    startX: 100,
    color: '#ff6b6b',
    
    // Dimensions (percentages - adjusted to 70% scale for proper sizing)
    widthPercent: 0.0467,     // 4.67% of screen width (was 6.67% * 0.7)
    heightPercent: 0.07,      // 7% of screen height (was 10% * 0.7)
    startXPercent: 0.06,      // 6% from left edge (unchanged)
    
    // Animation speeds
    animationSpeed: 0.15,
    breathingRate: 0.08,
    
    // Parachute settings (pixels - legacy)
    parachuteBoostForce: 2,
    parachuteActivationThreshold: 0.4, // % of screen height
    parachuteTapWindow: 300, // ms
    
    // Parachute settings (percentages)
    parachuteBoostForcePercent: 0.0033, // 0.33% of screen height
    parachuteMaxTime: 3, // seconds (unchanged)
    parachuteGravityModifier: 0.6, // multiplier (unchanged)
    
    // Launch settings
    constituentLaunchTargetHeight: 0.5 // Launch to 50% from top of screen (50% up) - more controlled height
};

// Visual Configuration
export const VISUAL_CONFIG = {
    crashDuration: 2000,
    screenShakeIntensity: 15,
    popupLifetime: 850,
    
    // Distances (pixels - legacy)
    minSpawnGap: 200,
    
    // Distances (percentages)
    minSpawnGapPercent: 0.333,    // 33.3% of screen width
    
    // Colors
    obstacleColors: {
        low: '#8B4513',
        tall: '#5C2E0E'
    },
    constituentColor: '#ff4444',
    bribeColor: '#ffd700',
    groundColor: '#8B4513'
};

// Entity Dimensions
export const ENTITY_DIMENSIONS = {
    // Pixel dimensions (legacy)
    obstacle: {
        low: { width: 30, height: 40 },
        tall: { width: 35, height: 80 }
    },
    constituent: {
        width: 40,
        height: 60
    },
    bribe: {
        width: 30,
        height: 30
    }
};

// Entity Dimensions (Percentages - adjusted to 70% scale for proper sizing)
export const ENTITY_DIMENSIONS_PERCENT = {
    obstacle: {
        low: { 
            widthPercent: 0.035,     // 3.5% of screen width (was 5% * 0.7)
            heightPercent: 0.0467    // 4.67% of screen height (was 6.67% * 0.7)
        },
        tall: { 
            widthPercent: 0.0408,    // 4.08% of screen width (was 5.83% * 0.7)
            heightPercent: 0.0931    // 9.31% of screen height (was 13.3% * 0.7)
        }
    },
    constituent: {
        widthPercent: 0.0467,        // 4.67% of screen width (was 6.67% * 0.7)
        heightPercent: 0.07          // 7% of screen height (was 10% * 0.7)
    },
    bribe: {
        widthPercent: 0.035,         // 3.5% of screen width (was 5% * 0.7)
        heightPercent: 0.035         // 3.5% of screen height (was 5% * 0.7)
    }
};
