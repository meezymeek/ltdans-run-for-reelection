// Main Entry Point for Lt. Dan's Run for Re-Election
import { LtDanRunner } from './Game.js';
import { OrientationManager } from './managers/OrientationManager.js';
import { TouchFeedbackManager } from './managers/TouchFeedbackManager.js';
import { AssetLoader } from './managers/AssetLoader.js';

// Optional: legacy fallback for dvh
function updateLegacyVhVar() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}
updateLegacyVhVar();
window.addEventListener('resize', updateLegacyVhVar);

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize orientation management
    window.orientationManager = new OrientationManager();
    
    // Initialize touch feedback
    window.touchFeedbackManager = new TouchFeedbackManager();
    
    // Get loading screen elements
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingProgress = document.getElementById('loadingProgress');
    const loadingPercentage = document.getElementById('loadingPercentage');
    const loadingDetails = document.getElementById('loadingDetails');
    const gameContainer = document.querySelector('.game-container');
    
    // Show loading screen, hide game
    loadingScreen.style.display = 'flex';
    gameContainer.style.display = 'none';
    
    // Initialize asset loader
    const assetLoader = new AssetLoader();
    
    // Progress callback
    const onProgress = (percentage, loaded, total) => {
        loadingProgress.style.width = `${percentage}%`;
        loadingPercentage.textContent = `${percentage}%`;
        
        // Update loading details with helpful messages
        if (percentage < 25) {
            loadingDetails.textContent = 'Loading audio files...';
        } else if (percentage < 50) {
            loadingDetails.textContent = 'Loading character skins...';
        } else if (percentage < 75) {
            loadingDetails.textContent = 'Loading parachute skins...';
        } else if (percentage < 100) {
            loadingDetails.textContent = 'Preparing campaign assets...';
        } else {
            loadingDetails.textContent = 'Ready to start campaigning!';
        }
        
        console.log(`Loading progress: ${percentage}% (${loaded}/${total})`);
    };
    
    // Completion callback
    const onComplete = (loadedAssets) => {
        console.log('All assets loaded:', loadedAssets);
        
        // Small delay to show completion
        setTimeout(() => {
            // Hide loading screen, show click to start screen
            loadingScreen.style.display = 'none';
            const clickToStartScreen = document.getElementById('clickToStartScreen');
            clickToStartScreen.classList.remove('hidden');
            
            // Set up click to start functionality
            const clickToStartButton = document.getElementById('clickToStartButton');
            clickToStartButton.addEventListener('click', async () => {
                // Show loading state on button
                clickToStartButton.textContent = '🔊 Initializing Audio...';
                clickToStartButton.disabled = true;
                
                try {
                    // Initialize game with pre-loaded assets first
                    window.gameInstance = new LtDanRunner();
                    
                    // Pass loaded assets to game for use
                    if (window.gameInstance && loadedAssets) {
                        window.gameInstance.setPreloadedAssets(loadedAssets);
                    }
                    
                    // Initialize audio system (requires user interaction)
                    if (window.gameInstance && window.gameInstance.soundManager) {
                        console.log('Initializing audio context and preparing sounds...');
                        
                        // Initialize audio context
                        await window.gameInstance.soundManager.initialize();
                        
                        // Prepare all audio for immediate playback
                        await window.gameInstance.soundManager.prepareAudioForPlayback();
                        
                        // Force audio volumes to be set properly
                        window.gameInstance.soundManager.updateVolumes();
                        
                        // Pre-load a small test sound to ensure audio context is ready
                        try {
                            const testAudio = new Audio('data:audio/wav;base64,UklGRnoAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoAAAC4hYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBiI=');
                            testAudio.volume = 0;
                            await testAudio.play();
                        } catch (e) {
                            console.log('Test audio failed, but proceeding anyway');
                        }
                        
                        window.gameInstance.soundInitialized = true;
                        console.log('Audio system fully initialized and ready');
                        
                        // Wait a moment for everything to settle
                        await new Promise(resolve => setTimeout(resolve, 300));
                        
                        // Hide click to start screen
                        clickToStartScreen.style.display = 'none';
                        gameContainer.style.display = 'flex';
                        
                        // Start menu music since we're on start screen - should play immediately now
                        if (window.gameInstance.gameState === 'start') {
                            console.log('Starting menu music...');
                            window.gameInstance.soundManager.playMusic('menu');
                        }
                    }
                } catch (error) {
                    console.error('Error during audio initialization:', error);
                    
                    // Hide click to start screen anyway
                    clickToStartScreen.style.display = 'none';
                    gameContainer.style.display = 'flex';
                    
                    // Continue without audio if initialization fails
                    if (window.gameInstance) {
                        window.gameInstance.soundInitialized = false;
                    }
                }
            });
        }, 500);
    };
    
    try {
        // Start loading all assets
        await assetLoader.startLoading(onProgress, onComplete);
    } catch (error) {
        console.error('Asset loading failed:', error);
        
        // Show error and continue anyway
        loadingDetails.textContent = 'Some assets failed to load - continuing anyway...';
        loadingProgress.style.width = '100%';
        loadingPercentage.textContent = '100%';
        
        // Continue with game initialization after brief delay
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            gameContainer.style.display = 'flex';
            window.gameInstance = new LtDanRunner();
        }, 1500);
    }
});

// Prevent scrolling on touch devices
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// Prevent zoom on double tap
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);
