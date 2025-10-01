// Main Entry Point for RERUN: Danny Boy Runs for Office Again
import { RerunGame } from './Game.js';
import { OrientationManager } from './managers/OrientationManager.js';
import { TouchFeedbackManager } from './managers/TouchFeedbackManager.js';
import { AssetLoader } from './managers/AssetLoader.js';
import { RagdollSystem } from './physics/RagdollSystem.js';

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
    
    // Get unified screen elements
    const clickToStartScreen = document.getElementById('clickToStartScreen');
    const loadingProgress = document.getElementById('loadingProgress');
    const loadingPercentage = document.getElementById('loadingPercentage');
    const loadingDetails = document.getElementById('loadingDetails');
    const loadingMessage = document.getElementById('loadingMessage');
    const loadingStatus = document.getElementById('loadingStatus');
    const loadingBarContainer = document.getElementById('loadingBarContainer');
    const clickToStartContent = document.getElementById('clickToStartContent');
    const gameContainer = document.querySelector('.game-container');
    
    // Show unified screen, hide game
    clickToStartScreen.style.display = 'flex';
    gameContainer.style.display = 'none';
    
    // Set up initial hidden states for animation sequence
    setupInitialHiddenStates();
    
    // Initialize animation state
    const animationState = {
        isPlaying: true,
        isSkipped: false,
        startTime: Date.now()
    };
    
    // Add skip hint element
    addSkipHint(clickToStartScreen, animationState);
    
    // Initialize character preview animation with entrance control
    initializeCharacterPreview(null, animationState);
    
    // Make animation state globally accessible for skip function
    window.characterAnimationState = animationState;
    
    // Start the staged animation sequence
    startAnimationSequence(animationState);
    
    // Initialize asset loader
    const assetLoader = new AssetLoader();
    
    // Artificial loading progress for better UX
    let artificialProgress = 0;
    let actualProgress = 0;
    const minLoadingTime = 1000; // Minimum 1 second (3x faster)
    const startTime = Date.now();
    
    // Smooth progress animation
    function updateDisplayedProgress() {
        const elapsed = Date.now() - startTime;
        const timeProgress = Math.min(elapsed / minLoadingTime, 1) * 100;
        
        // Use the maximum when both are ready, otherwise slower progress
        let targetProgress;
        if (actualProgress >= 100 && timeProgress >= 100) {
            targetProgress = 100; // Both complete, go to 100%
        } else {
            targetProgress = Math.min(actualProgress, timeProgress); // Use slower progress
        }
        
        // Smooth lerp to target
        artificialProgress += (targetProgress - artificialProgress) * 0.05; // Faster lerp
        
        // Force completion when very close to 100 to avoid 99% stuck issue
        if (targetProgress >= 100 && artificialProgress >= 99.5) {
            artificialProgress = 100;
        }
        
        const displayProgress = Math.round(artificialProgress);
        loadingProgress.style.width = `${displayProgress}%`;
        loadingPercentage.textContent = `${displayProgress}%`;
        
        // Update loading details and status with human-friendly messages
        if (displayProgress < 20) {
            loadingDetails.textContent = 'Loading audio files...';
            loadingStatus.textContent = 'Warming up the campaign speakers...';
        } else if (displayProgress < 40) {
            loadingDetails.textContent = 'Loading character skins...';
            loadingStatus.textContent = 'Dressing Lt. Dan for the campaign...';
        } else if (displayProgress < 60) {
            loadingDetails.textContent = 'Loading parachute skins...';
            loadingStatus.textContent = 'Packing campaign parachutes...';
        } else if (displayProgress < 80) {
            loadingDetails.textContent = 'Preparing campaign assets...';
            loadingStatus.textContent = 'Setting up the campaign trail...';
        } else if (displayProgress < 100) {
            loadingDetails.textContent = 'Finalizing campaign setup...';
            loadingStatus.textContent = 'Almost ready to hit the trail...';
        } else {
            loadingDetails.textContent = 'Ready to start campaigning!';
            loadingStatus.textContent = 'Campaign assets loaded successfully!';
        }
        
        // Continue animation if not complete
        if (displayProgress < 100) {
            requestAnimationFrame(updateDisplayedProgress);
        }
    }
    
    // Delay progress animation until loading bar has finished sliding in
    // Loading bar appears at 5.0s + 0.8s animation = 5.8s total
    setTimeout(() => {
        updateDisplayedProgress();
    }, 5800);
    
    // Progress callback
    const onProgress = (percentage, loaded, total) => {
        actualProgress = percentage;
        // Loading progress tracking removed for production
    };
    
    // Completion callback
    const onComplete = (loadedAssets) => {
        // Asset loading complete - debug logging removed
        
        // Small delay to show completion
        setTimeout(() => {
            // Hide loading message/details, show click-to-start content, keep loading bar
            loadingMessage.style.display = 'none';
            loadingDetails.style.display = 'none';
            clickToStartContent.classList.remove('hidden');
            // Loading bar stays visible always
            
            // Show disclaimer after a much longer delay to be the absolute final element
            setTimeout(() => {
                const disclaimerBox = document.querySelector('.disclaimer-box');
                if (disclaimerBox) {
                    disclaimerBox.classList.remove('hidden-disclaimer');
                    disclaimerBox.classList.add('animate-disclaimer-enter');
                    // Disclaimer animation started
                }
            }, 6500); // Show disclaimer 6.5 seconds after content appears - absolute final element
            
            // Update character preview with loaded assets (preserve animation state)
            initializeCharacterPreview(loadedAssets, animationState);
            
            // Set up click to start functionality
            const clickToStartButton = document.getElementById('clickToStartButton');
            clickToStartButton.addEventListener('click', async () => {
                // Show loading state on button
                clickToStartButton.textContent = 'STARTING!';
                clickToStartButton.disabled = true;
                
                // Trigger character exit animation
                animationState.characterExiting = true;
                animationState.exitStartTime = Date.now();
                
                // Wait for exit animation to complete before starting game
                setTimeout(async () => {
                    try {
                        // Initialize game with pre-loaded assets first
                        window.gameInstance = new RerunGame();
                        
                        // Pass loaded assets to game for use
                        if (window.gameInstance && loadedAssets) {
                            window.gameInstance.setPreloadedAssets(loadedAssets);
                        }
                        
                        // Initialize audio system (requires user interaction)
                        if (window.gameInstance && window.gameInstance.soundManager) {
                            // Initializing audio context and preparing sounds
                            
                            // Initialize audio context
                            await window.gameInstance.soundManager.initialize();
                            
                            // Prepare all audio for immediate playback
                            await window.gameInstance.soundManager.prepareAudioForPlayback();
                            
                            // Force audio volumes to be set properly
                            window.gameInstance.soundManager.updateVolumes();
                            
                            // Pre-load a small test sound to ensure audio context is ready
                            try {
                                const testAudio = new Audio('data:audio/wav;base64,UklGRnoAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoAAAC4hYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmeewFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBiI=');
                                testAudio.volume = 0;
                                await testAudio.play();
                            } catch (e) {
                                // Test audio failed, but proceeding anyway
                            }
                            
                            window.gameInstance.soundInitialized = true;
                            // Audio system fully initialized and ready
                            
                            // Wait a moment for everything to settle
                            await new Promise(resolve => setTimeout(resolve, 300));
                            
                            // Hide click to start screen
                            clickToStartScreen.style.display = 'none';
                            gameContainer.style.display = 'flex';
                            
                            // Start menu music since we're on start screen - should play immediately now
                            if (window.gameInstance.gameState === 'start') {
                                // Starting menu music
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
                }, 3000); // Wait for exit animation to complete
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
            // Hide loading elements, show click-to-start content
            loadingBarContainer.style.display = 'none';
            loadingMessage.style.display = 'none';
            loadingDetails.style.display = 'none';
            clickToStartContent.classList.remove('hidden');
            
            // Initialize game
            window.gameInstance = new RerunGame();
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

// Setup Initial Hidden States for Animation Sequence
function setupInitialHiddenStates() {
    // Presents sequence elements - hidden by default in CSS
    const companyLogo = document.querySelector('.company-logo');
    const presentsText = document.querySelector('.presents-text');
    // These are already hidden by default in CSS, no need to add classes
    
    // Individual title elements - hide them separately for independent animation
    const titleMain = document.querySelector('.title-main');
    const titleSub = document.querySelector('.title-sub');
    if (titleMain) {
        titleMain.classList.add('title-main-hidden');
    }
    if (titleSub) {
        titleSub.classList.add('title-sub-hidden');
    }
    
    // Loading bar
    const loadingBarContainer = document.getElementById('loadingBarContainer');
    if (loadingBarContainer) {
        loadingBarContainer.classList.add('hidden-above');
    }
    
    // Bottom content elements
    const clickToStartContent = document.getElementById('clickToStartContent');
    if (clickToStartContent) {
        clickToStartContent.classList.add('hidden-left');
    }
    
    // Audio text (will be added to click-to-start-hint)
    const clickToStartHint = document.querySelector('.click-to-start-hint');
    if (clickToStartHint) {
        clickToStartHint.classList.add('hidden-right');
    }
    
    // Disclaimer box - hide initially for unique animation
    const disclaimerBox = document.querySelector('.disclaimer-box');
    if (disclaimerBox) {
        disclaimerBox.classList.add('hidden-disclaimer');
    }
}

// Add Skip Hint Element and Double-Tap Functionality
function addSkipHint(container, animationState) {
    const skipHint = document.createElement('div');
    skipHint.className = 'skip-hint';
    skipHint.textContent = 'Double tap anywhere to skip intro';
    container.appendChild(skipHint);
    
    // Double-tap detection
    let tapCount = 0;
    let tapTimer = null;
    
    const handleSkip = () => {
        if (animationState.isPlaying && !animationState.isSkipped) {
            // Animation sequence skipped
            animationState.isSkipped = true;
            animationState.isPlaying = false;
            skipHint.classList.add('hidden');
            
            // Immediately show all elements in final positions
            showAllElementsImmediately();
        }
    };
    
    container.addEventListener('touchend', (event) => {
        tapCount++;
        
        if (tapCount === 1) {
            tapTimer = setTimeout(() => {
                tapCount = 0;
            }, 300);
        } else if (tapCount === 2) {
            clearTimeout(tapTimer);
            tapCount = 0;
            handleSkip();
        }
    });
    
    // Also handle double-click for desktop testing
    container.addEventListener('dblclick', handleSkip);
    
    // Hide skip hint after animation completes
    setTimeout(() => {
        if (skipHint && !animationState.isSkipped) {
            skipHint.classList.add('hidden');
        }
    }, 4000);
}

// Show All Elements Immediately (Skip Function)
function showAllElementsImmediately() {
    // Presents elements - handle both image and fallback logo
    const logoImage = document.querySelector('.company-logo:not(.logo-fallback)');
    const logoFallback = document.querySelector('.company-logo.logo-fallback');
    const presentsText = document.querySelector('.presents-text');
    
    if (logoImage) {
        logoImage.style.opacity = '1';
        logoImage.style.transform = 'translateX(-50%) scale(1)';
    }
    if (logoFallback && logoFallback.style.display !== 'none') {
        logoFallback.style.opacity = '1';
        logoFallback.style.transform = 'translateX(-50%) scale(1)';
    }
    if (presentsText) {
        presentsText.style.opacity = '1';
        presentsText.style.transform = 'translateX(-50%) translateY(0)';
    }
    
    // Individual title elements
    const titleMain = document.querySelector('.title-main');
    const titleSub = document.querySelector('.title-sub');
    if (titleMain) {
        titleMain.classList.remove('title-main-hidden');
        titleMain.style.opacity = '1';
        titleMain.style.transform = 'translateY(0)';
    }
    if (titleSub) {
        titleSub.classList.remove('title-sub-hidden');
        titleSub.style.opacity = '1';
        titleSub.style.transform = 'translateY(0)';
    }
    
    // Loading bar and loading elements
    const loadingBarContainer = document.getElementById('loadingBarContainer');
    if (loadingBarContainer) {
        loadingBarContainer.classList.remove('hidden-above');
        loadingBarContainer.style.opacity = '1';
        loadingBarContainer.style.transform = 'translateX(-50%) translateY(0)';
    }
    
    // Show loading text elements
    const loadingMessage = document.getElementById('loadingMessage');
    const loadingDetails = document.getElementById('loadingDetails');
    const loadingPercentage = document.getElementById('loadingPercentage');
    const loadingStatus = document.getElementById('loadingStatus');
    
    if (loadingMessage) loadingMessage.style.opacity = '1';
    if (loadingDetails) loadingDetails.style.opacity = '1';
    if (loadingPercentage) loadingPercentage.style.opacity = '1';
    if (loadingStatus) loadingStatus.style.opacity = '1';
    
    // Bottom content
    const clickToStartContent = document.getElementById('clickToStartContent');
    if (clickToStartContent) {
        clickToStartContent.classList.remove('hidden-left');
        clickToStartContent.style.opacity = '1';
        clickToStartContent.style.transform = 'translateX(0)';
    }
    
    // Audio text
    const clickToStartHint = document.querySelector('.click-to-start-hint');
    if (clickToStartHint) {
        clickToStartHint.classList.remove('hidden-right');
        clickToStartHint.style.opacity = '1';
        clickToStartHint.style.transform = 'translateX(0)';
    }
    
    // Disclaimer box - show immediately when skipped
    const disclaimerBox = document.querySelector('.disclaimer-box');
    if (disclaimerBox) {
        disclaimerBox.classList.remove('hidden-disclaimer');
        disclaimerBox.style.opacity = '1';
        disclaimerBox.style.transform = 'translateY(0)';
    }
    
    // Force character to center position if entrance was in progress
    if (window.characterAnimationState) {
        window.characterAnimationState.characterEntering = false;
        window.characterAnimationState.entranceComplete = true;
    }
}

// Start Animation Sequence
function startAnimationSequence(animationState) {
    const timeline = [
        { time: 500, action: () => showLogo() }, // Logo fades in first
        { time: 1500, action: () => showPresentsText() }, // "PRESENTS..." slides in 1s later
        { time: 3000, action: () => startCloudsEntrance() }, // Clouds start after presents sequence
        { time: 4000, action: () => startCharacterEntrance(animationState) }, // Character entrance
        { time: 5500, action: () => showTitleElements() }, // Main title and subtitle
        { time: 6000, action: () => showLoadingBar() }, // Loading bar
        { time: 6300, action: () => showBottomElements() }, // Bottom elements
        { time: 6700, action: () => showBottomText() }, // Additional bottom text
        { time: 7000, action: () => finishAnimationSequence(animationState) } // Finish animation sequence
    ];
    
    timeline.forEach(({ time, action }) => {
        setTimeout(() => {
            if (animationState.isPlaying && !animationState.isSkipped) {
                action();
            }
        }, time);
    });
}

// Animation Sequence Functions
function showLogo() {
    // Showing logo - handle both image and fallback text
    const logoImage = document.querySelector('.company-logo:not(.logo-fallback)');
    const logoFallback = document.querySelector('.company-logo.logo-fallback');
    
    if (logoImage) {
        logoImage.classList.add('animate-logo-fade-in');
    }
    if (logoFallback && logoFallback.style.display !== 'none') {
        logoFallback.classList.add('animate-logo-fade-in');
    }
}

function showPresentsText() {
    // Showing presents text
    const presentsText = document.querySelector('.presents-text');
    if (presentsText) {
        presentsText.classList.add('animate-presents-slide-in');
    }
}

function startCloudsEntrance() {
    // Starting clouds entrance - clouds will start moving in naturally from right side
    // Character animation will handle cloud positioning
}

function startCharacterEntrance(animationState) {
    // Starting character entrance
    animationState.characterEntering = true;
    // Character will move in from left side (handled in character animation)
}

function showTitleElements() {
    // Showing title elements
    
    // Show main title immediately
    const titleMain = document.querySelector('.title-main');
    if (titleMain) {
        titleMain.classList.remove('title-main-hidden');
        titleMain.classList.add('animate-title-main-enter');
        // Main title animation started
    }
    
    // Show subtitle 500ms later
    setTimeout(() => {
        const titleSub = document.querySelector('.title-sub');
        if (titleSub) {
            titleSub.classList.remove('title-sub-hidden');
            titleSub.classList.add('animate-title-sub-enter');
            // Subtitle animation started (500ms delay)
        }
    }, 500);
}

function showLoadingBar() {
    // Showing loading bar
    const loadingBarContainer = document.getElementById('loadingBarContainer');
    if (loadingBarContainer) {
        loadingBarContainer.classList.remove('hidden-above');
        loadingBarContainer.classList.add('animate-slide-in-from-top');
        
        // Show loading bar elements with opacity animation
        loadingBarContainer.style.opacity = '1';
        loadingBarContainer.style.transform = 'translateX(-50%) translateY(0)';
    }
    
    // Show loading elements after loading bar appears
    setTimeout(() => {
        const loadingMessage = document.getElementById('loadingMessage');
        const loadingDetails = document.getElementById('loadingDetails');
        const loadingPercentage = document.getElementById('loadingPercentage');
        const loadingStatus = document.getElementById('loadingStatus');
        
        if (loadingMessage) {
            loadingMessage.style.opacity = '1';
            loadingMessage.style.transition = 'opacity 0.5s ease';
        }
        if (loadingDetails) {
            loadingDetails.style.opacity = '1';
            loadingDetails.style.transition = 'opacity 0.5s ease';
        }
        if (loadingPercentage) {
            loadingPercentage.style.opacity = '1';
            loadingPercentage.style.transition = 'opacity 0.5s ease';
        }
        if (loadingStatus) {
            loadingStatus.style.opacity = '1';
            loadingStatus.style.transition = 'opacity 0.5s ease';
        }
    }, 800); // Show loading text 800ms after loading bar appears
}

function showBottomElements() {
    // Showing bottom elements - START button from left
    const clickToStartContent = document.getElementById('clickToStartContent');
    if (clickToStartContent) {
        clickToStartContent.classList.remove('hidden-left');
        clickToStartContent.classList.add('animate-slide-in-from-left');
    }
    
    // Audio text from right (same timing)
    const clickToStartHint = document.querySelector('.click-to-start-hint');
    if (clickToStartHint) {
        clickToStartHint.classList.remove('hidden-right');
        clickToStartHint.classList.add('animate-slide-in-from-right');
    }
}

function showBottomText() {
    // Showing bottom text
    // Any additional bottom text elements can fade in here
    const additionalElements = document.querySelectorAll('.hidden-fade');
    additionalElements.forEach(element => {
        element.classList.remove('hidden-fade');
        element.classList.add('animate-fade-in');
    });
}

function showDisclaimer() {
    // Showing disclaimer
    const disclaimerBox = document.querySelector('.disclaimer-box');
    if (disclaimerBox) {
        disclaimerBox.classList.remove('hidden-disclaimer');
        disclaimerBox.classList.add('animate-disclaimer-enter');
    }
}

function finishAnimationSequence(animationState) {
    // Animation sequence complete
    animationState.isPlaying = false;
    animationState.characterEntering = false;
    
    // Hide skip hint
    const skipHint = document.querySelector('.skip-hint');
    if (skipHint && !animationState.isSkipped) {
        skipHint.classList.add('hidden');
    }
}

// Start Fall-Off Sequence (All Elements Fall Simultaneously)
function startFallOffSequence() {
    // Starting fall-off sequence - all elements fall at the same time (like gravity affects everything)
    
    const fallOffElements = [
        { element: '.bottom-content', animation: 'animate-fall-off-left' },
        { element: '.loading-bar-container', animation: 'animate-fall-off' },
        { element: '.title-sub', animation: 'animate-fall-off-right' },
        { element: '.title-main', animation: 'animate-fall-off-left' },
        { element: '.company-logo', animation: 'animate-fall-off-centered-left' },
        { element: '.presents-text', animation: 'animate-fall-off-centered-right' }
    ];
    
    // Apply gravity to all elements immediately
    fallOffElements.forEach(({ element, animation }) => {
        const el = document.querySelector(element);
        if (el) {
            el.classList.add(animation);
            // Element falling off simultaneously
        }
    });
}

// Character Preview Animation
async function initializeCharacterPreview(loadedAssets, animationState = null) {
    const canvas = document.getElementById('characterPreview');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Animation state
    let animationFrame = 0;
    let lastTime = 0;
    const animationSpeed = 0.25; // Increased from 0.15 for faster character movement
    
    // Character dimensions (scaled to 75% for balanced visibility)
    const charWidth = width * 0.06; // 6% of 800px = ~48px character width (75% of original)
    const charHeight = height * 0.2; // 20% of 360px = ~72px character height (75% of original)
    const centerX = width / 2;
    const baseY = height * 0.85; // Ground at 85% down (204px from top)
    
    // Character position and physics - Start WAY off-screen 
    let charX = -500; // Start way off-screen left (outside canvas)
    let charY = baseY - charHeight;
    let velocityY = 0;
    let isJumping = false;
    
    // Character entrance state
    const startX = -500; // Way off-screen left (outside canvas)
    const targetX = centerX; // Center position
    let entranceProgress = 0; // Always start at 0 (off-screen)
    
    // Character exit state
    let exitProgress = 0; // 0 = center, 1 = off-screen right
    let ragdoll = null; // Will be created when character crashes
    let screenShake = 0; // Screen shake intensity
    
    // Animation state
    let animationPhase = 'running'; // 'running', 'jumping', 'landing'
    let jumpCycle = 0;
    const jumpDuration = 2000; // 2 seconds per jump cycle
    let canJump = !animationState?.characterEntering; // No jumping during entrance
    
    // Joint angles for animation
    let leftLegAngle = 0;
    let rightLegAngle = 0;
    let leftKneeAngle = 0;
    let rightKneeAngle = 0;
    let leftArmAngle = 0;
    let rightArmAngle = 0;
    let leftElbowAngle = 0;
    let rightElbowAngle = 0;
    let headYOffset = 0;
    let headXOffset = 0;
    let headRotation = 0;
    
    // Background cloud elements (replicate main game's background system)
    let backgroundElements = [];
    let cloudGroupOpacity = 0; // Start with invisible clouds, will fade in
    
    // Initialize background clouds (optimized for 60% height canvas)
    function createBackgroundElements() {
        for (let i = 0; i < 18; i++) { // More clouds for 60% height coverage
            // All clouds start well off-screen to the right for trickle effect
            const cloudStartX = width + (i * 50) + Math.random() * 200; // Staggered positions off-screen right
                
            backgroundElements.push({
                x: cloudStartX,
                y: Math.random() * height * 0.75, // Fill top 75% of taller canvas
                width: 55 + Math.random() * 90, // Good cloud sizes for 60% height canvas
                height: 28 + Math.random() * 42,
                speed: 0.4 + Math.random() * 1.0, // Good parallax speeds
                color: `rgba(255, 255, 255, ${0.08 + Math.random() * 0.15})` // Visible but subtle
            });
        }
    }
    
    // Create initial clouds
    createBackgroundElements();
    
    // Load skin images if available
    const skinImages = {};
    // Loading character preview assets
    
    // Try to get from loaded assets first
    if (loadedAssets && loadedAssets.images && loadedAssets.images.skins) {
        const skins = loadedAssets.images.skins;
        // Using available skins from loaded assets
        
        skinImages.head = skins.head;
        skinImages['head-open-mouth'] = skins['head-open-mouth'];
        skinImages.torso = skins.torso;
        skinImages.thigh = skins.thigh;
        skinImages.shin = skins.shin;
        skinImages.upper_arm = skins.upper_arm;
        skinImages.forearm = skins.forearm;
        
        // Check which images are actually loaded (production logging removed)
        Object.keys(skinImages).forEach(key => {
            if (skinImages[key]) {
                // Skin loaded and ready
            } else {
                // Skin missing, will use fallback
            }
        });
    } else {
        // No skin assets found in loadedAssets, using fallback
    }
    
    // Fallback: Load skin images directly if not found in assets
    if (!skinImages.head) {
        // Loading skin images directly as fallback
        const skinParts = ['head', 'head-open-mouth', 'torso', 'thigh', 'shin', 'upper_arm', 'forearm'];
        
        for (const part of skinParts) {
            const img = new Image();
            img.src = `skins/default/${part}.png`;
            img.onload = () => {
                // Direct skin loaded successfully
            };
            img.onerror = () => {
                // Failed to load skin, will use fallback rendering
            };
            skinImages[part] = img;
        }
        
        // Wait a bit for images to load
        setTimeout(() => {
            // Images should be loaded now
        }, 100);
    }
    
    // Draw a limb (similar to the game's drawPlayerLimb function)
    function drawLimb(startX, startY, angle1, length1, angle2, length2, width, upperSkin, lowerSkin) {
        ctx.save();
        
        // Upper limb
        ctx.translate(startX, startY);
        ctx.rotate(angle1 * Math.PI / 180);
        
        if (upperSkin && upperSkin.complete) {
            ctx.drawImage(upperSkin, -width/2, 0, width, length1);
        } else {
            // Fallback to colored rectangles
            ctx.fillStyle = '#cc5858';
            ctx.fillRect(-width/2, 0, width, length1);
        }
        
        // Lower limb
        ctx.translate(0, length1);
        ctx.rotate(angle2 * Math.PI / 180);
        
        if (lowerSkin && lowerSkin.complete) {
            ctx.drawImage(lowerSkin, -width/2, 0, width, length2);
        } else {
            // Fallback to colored rectangles
            ctx.fillStyle = '#cc5858';
            ctx.fillRect(-width/2, 0, width, length2);
        }
        
        ctx.restore();
    }
    
    // Animation loop
    function animate(currentTime) {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Apply screen shake (copy from Renderer.js)
        ctx.save();
        if (screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * screenShake;
            const shakeY = (Math.random() - 0.5) * screenShake;
            ctx.translate(shakeX, shakeY);
            
            // Update screen shake (copy from GameLoop.js)
            screenShake *= 0.9; // Decay shake
            if (screenShake < 0.5) screenShake = 0;
        }
        
        // Update animation frame
        if (currentTime - lastTime > 16) { // ~60 FPS
            animationFrame += animationSpeed;
            lastTime = currentTime;
            jumpCycle += 16; // Track jump timing
        }
        
        // Calculate elapsed time from start
        const elapsedTime = Date.now() - (animationState?.startTime || 0);
        
        // Handle cloud group opacity fade-in (starts immediately for 1 second)
        if (elapsedTime >= 0 && cloudGroupOpacity < 1) {
            cloudGroupOpacity += 0.016; // Fade in over ~1 second (60fps * 1s = 60 frames)
            if (cloudGroupOpacity >= 1) {
                cloudGroupOpacity = 1;
            }
        }
        
        // Handle skip case for clouds
        if (animationState?.isSkipped || animationState?.entranceComplete) {
            cloudGroupOpacity = 1;
        }
        
        // Handle character position animation (always visible, just position changes)
        if (elapsedTime > 4000 && entranceProgress < 1) {
            // Character entrance starts at 4000ms (4 seconds)
            entranceProgress += 0.0025; // Smooth entrance over ~8 seconds (1/8th speed)
            if (entranceProgress >= 1) {
                entranceProgress = 1;
                canJump = true; // Enable jumping when entrance is complete
            }
            // Smooth easing function for natural movement
            const easedProgress = 1 - Math.pow(1 - entranceProgress, 3); // Ease-out cubic
            charX = startX + (targetX - startX) * easedProgress;
        } else if (elapsedTime <= 4000) {
            // Before entrance time, stay off-screen
            charX = startX;
        } else if (entranceProgress >= 1) {
            // After entrance complete, stay centered
            charX = centerX;
        }
        
        // Handle character exit animation (when START is clicked)
        if (animationState?.characterExiting && !ragdoll) {
            const exitElapsed = Date.now() - (animationState?.exitStartTime || 0);
            exitProgress += 0.02; // Move to right edge over ~1.5 seconds
            charX = centerX + (width - centerX + 100) * exitProgress;
            
            // Check if character has hit screen boundary
            if (charX >= width - charWidth/2) {
                // Trigger ragdoll crash
                ragdoll = new RagdollSystem({
                    x: charX,
                    y: charY,
                    width: charWidth,
                    height: charHeight,
                    groundY: baseY
                }, skinImages);
                
                // Apply crash impulse (copy from GameLogic.js)
                const collisionForceX = -3 - Math.random() * 2; // Backward force
                const collisionForceY = -8 - Math.random() * 4; // Upward force
                ragdoll.applyImpulse(collisionForceX, collisionForceY);
                
                // Start screen shake (increased intensity)
                screenShake = 25;
                
                // Play crash sound if available
                if (window.gameInstance?.soundManager) {
                    window.gameInstance.soundManager.playEffect('crash');
                }
                
                // Start fall-off sequence (bottom to top)
                startFallOffSequence();
            }
        }
        
        // Handle skip case - jump to center position
        if (animationState?.isSkipped || animationState?.entranceComplete) {
            charX = centerX;
            canJump = true;
            entranceProgress = 1;
        }
        
        // Update background clouds (same logic as GameLoop.js updateBackground)
        for (let element of backgroundElements) {
            element.x -= element.speed;
            
            // Reset position when off screen (optimized for 60% height canvas)
            if (element.x + element.width < 0) {
                element.x = width + Math.random() * 200;
                element.y = Math.random() * height * 0.75; // Fill top 75% when resetting for 60% canvas
            }
        }
        
        // Draw background clouds with group opacity control
        ctx.save();
        ctx.globalAlpha = cloudGroupOpacity; // Apply group opacity to all clouds
        for (let element of backgroundElements) {
            ctx.fillStyle = element.color;
            ctx.fillRect(element.x, element.y, element.width, element.height);
        }
        ctx.restore(); // Restore original alpha for character drawing
        
        // Infrequent jump animation - primarily running with occasional jumps (only when allowed)
        if (canJump) {
            const jumpPhase = (jumpCycle % 6000) / 6000; // 0 to 1 over 6 seconds (jump 1/4 as often)
            
            if (jumpPhase < 0.85) {
                // Running phase - majority of the time spent running
                animationPhase = 'running';
                charY = baseY - charHeight;
            } else if (jumpPhase < 0.95) {
                // Jumping phase - quick, snappy jump when it happens
                animationPhase = 'jumping';
                const jumpProgress = (jumpPhase - 0.85) / 0.1; // 0 to 1 over short jump phase
                const jumpHeight = Math.sin(jumpProgress * Math.PI) * (height * 0.4); // High jump for impact
                charY = (baseY - charHeight) - jumpHeight;
            } else {
                // Landing phase (brief recovery)
                animationPhase = 'running';
                charY = baseY - charHeight;
            }
        } else {
            // During entrance, stay in running mode at ground level
            animationPhase = 'running';
            charY = baseY - charHeight;
        }
        
        // Calculate animation based on current phase
        let runPhase;
        if (animationPhase === 'running') {
            runPhase = (animationFrame % 4) / 4 * Math.PI * 2;
            
            // Running leg animation
            leftLegAngle = -Math.sin(runPhase) * 30;
            rightLegAngle = -Math.sin(runPhase + Math.PI) * 30;
            leftKneeAngle = Math.max(0, Math.sin(runPhase) * 45);
            rightKneeAngle = Math.max(0, Math.sin(runPhase + Math.PI) * 45);
            
            // Running arm swing
            const leftSwing = Math.sin(runPhase + Math.PI);
            const rightSwing = Math.sin(runPhase);
            leftArmAngle = 50 + (leftSwing > 0 ? leftSwing * 35 : leftSwing * 40);
            rightArmAngle = 50 + (rightSwing > 0 ? rightSwing * 35 : rightSwing * 40);
            leftElbowAngle = -Math.abs(Math.sin(runPhase + Math.PI)) * 85;
            rightElbowAngle = -Math.abs(Math.sin(runPhase)) * 85;
            
            // Head animation
            const headYOffsetTarget = Math.abs(Math.sin(runPhase)) * 2;
            const headXOffsetTarget = Math.sin(runPhase * 0.5) * 1;
            const headRotationTarget = Math.sin(runPhase * 0.5) * 2;
            
            // Smooth lerp for head movement
            const lerpFactor = 0.15;
            headYOffset += (headYOffsetTarget - headYOffset) * lerpFactor;
            headXOffset += (headXOffsetTarget - headXOffset) * lerpFactor;
            headRotation += (headRotationTarget - headRotation) * lerpFactor;
        } else {
            // Jumping animation
            leftLegAngle = -15;
            rightLegAngle = -15;
            leftKneeAngle = 20;
            rightKneeAngle = 20;
            leftArmAngle = 180;
            rightArmAngle = 180;
            leftElbowAngle = 0;
            rightElbowAngle = 0;
            
            // Head tilted back
            const jumpLerpFactor = 0.25;
            const headYOffsetTarget = -2;
            const headXOffsetTarget = 0;
            const headRotationTarget = -5;
            
            headYOffset += (headYOffsetTarget - headYOffset) * jumpLerpFactor;
            headXOffset += (headXOffsetTarget - headXOffset) * jumpLerpFactor;
            headRotation += (headRotationTarget - headRotation) * jumpLerpFactor;
        }
        
        // Character proportions
        const headHeight = charHeight * 0.33;
        const torsoHeight = charHeight * 0.33;
        const legHeight = charHeight * 0.34;
        const topY = charY;
        
        // Only draw character after 4 seconds have elapsed AND if no ragdoll exists
        if ((elapsedTime >= 4000 || animationState?.isSkipped || animationState?.entranceComplete) && !ragdoll) {
            // Always draw character - just position animates
            const hipY = topY + headHeight + torsoHeight;
            const thighLength = legHeight * 0.5;
            const shinLength = legHeight * 0.5;
        
        // 1. Draw right leg (behind torso)
        drawLimb(
            charX + 3,
            hipY,
            rightLegAngle,
            thighLength,
            rightKneeAngle,
            shinLength,
            8,
            skinImages.thigh,
            skinImages.shin
        );
        
        // 2. Draw torso
        const torsoY = topY + headHeight;
        if (skinImages.torso && skinImages.torso.complete) {
            ctx.drawImage(
                skinImages.torso,
                charX - charWidth/2 + 3,
                torsoY,
                charWidth - 6,
                torsoHeight
            );
        } else {
            ctx.fillStyle = '#cc5858';
            ctx.fillRect(
                charX - charWidth/2 + 3,
                torsoY,
                charWidth - 6,
                torsoHeight
            );
        }
        
        // 3. Draw head with animation
        ctx.save();
        const headX = charX - charWidth/2 + 5 + headXOffset;
        const headY = topY - headYOffset;
        
        // Apply rotation around head center
        const headCenterX = headX + (charWidth - 5) / 2;
        const headCenterY = headY + headHeight / 2;
        ctx.translate(headCenterX, headCenterY);
        ctx.rotate(headRotation * Math.PI / 180);
        ctx.translate(-headCenterX, -headCenterY);
        
        // Choose head image based on animation phase
        const useOpenMouth = animationPhase === 'jumping' || Math.sin(animationFrame * 0.1) > 0.3;
        const headImage = useOpenMouth ? skinImages['head-open-mouth'] : skinImages.head;
        
        if (headImage && headImage.complete) {
            ctx.drawImage(
                headImage,
                headX,
                headY,
                charWidth - 5,
                headHeight
            );
        } else {
            ctx.fillStyle = '#cc5858';
            ctx.fillRect(headX, headY, charWidth - 5, headHeight);
            
            // Draw simple face
            ctx.fillStyle = 'white';
            ctx.fillRect(headX + 5, headY + 3, 3, 3); // Eye
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(headX + 8, headY + 8);
            ctx.lineTo(headX + 12, headY + 10);
            ctx.stroke(); // Mouth
        }
        ctx.restore();
        
        // 4. Draw arm
        const shoulderY = torsoY + 3;
        const armLength = torsoHeight * 0.5;
        
        drawLimb(
            charX,
            shoulderY,
            leftArmAngle,
            armLength,
            leftElbowAngle,
            armLength * 0.8,
            6,
            skinImages.upper_arm,
            skinImages.forearm
        );
        
        // 5. Draw left leg (in front)
        drawLimb(
            charX - 3,
            hipY,
            leftLegAngle,
            thighLength,
            leftKneeAngle,
            shinLength,
            8,
            skinImages.thigh,
            skinImages.shin
        );
        } // Close character drawing conditional
        
        // Update and render ragdoll if it exists
        if (ragdoll) {
            ragdoll.update();
            ragdoll.render(ctx);
        }
        
        // Restore canvas context after screen shake
        ctx.restore();
        
        // Continue animation loop
        requestAnimationFrame(animate);
    }
    
    // Start animation
    requestAnimationFrame(animate);
}
