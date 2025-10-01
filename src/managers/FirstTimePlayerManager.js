// First Time Player Manager - Handles tutorial suggestions and UI for new players
export class FirstTimePlayerManager {
    constructor(game) {
        this.game = game;
        this.isShowingSuggestion = false;
        this.suggestionElement = null;
        this.arrowElement = null;
        this.suggestionShown = false;
        this.animationFrame = null;
        this.pulsePhase = 0;
        
        this.createSuggestionElements();
    }

    createSuggestionElements() {
        // Create suggestion container
        this.suggestionElement = document.createElement('div');
        this.suggestionElement.className = 'first-time-suggestion hidden';
        this.suggestionElement.innerHTML = `
            <div class="suggestion-content">
                <div class="suggestion-text">
                    <h3>👋 Welcome to Lt. Dan's Run for Reelection!</h3>
                    <p>New to the campaign trail? Try the tutorial to learn the ropes!</p>
                </div>
                <div class="suggestion-actions">
                    <button id="tryTutorialBtn" class="suggestion-btn primary">
                        🎯 Try Tutorial
                    </button>
                    <button id="skipTutorialBtn" class="suggestion-btn secondary">
                        Skip & Play
                    </button>
                </div>
            </div>
        `;

        // Create animated arrow pointing to tutorial button
        this.arrowElement = document.createElement('div');
        this.arrowElement.className = 'tutorial-arrow hidden';
        this.arrowElement.innerHTML = `
            <div class="arrow-container">
                <div class="arrow-body">👆</div>
                <div class="arrow-text">Try this!</div>
            </div>
        `;

        // Append to body
        document.body.appendChild(this.suggestionElement);
        document.body.appendChild(this.arrowElement);

        // Add event listeners
        this.setupEventListeners();
        this.addSuggestionStyles();
    }

    setupEventListeners() {
        const tryTutorialBtn = document.getElementById('tryTutorialBtn');
        const skipTutorialBtn = document.getElementById('skipTutorialBtn');

        tryTutorialBtn?.addEventListener('click', () => {
            this.game.soundManager.playButtonClick();
            this.hideSuggestion();
            this.game.startTutorial();
        });

        skipTutorialBtn?.addEventListener('click', () => {
            this.game.soundManager.playButtonClick();
            this.hideSuggestion();
            this.game.startGame();
        });

        // Hide suggestion when clicking outside
        this.suggestionElement.addEventListener('click', (e) => {
            if (e.target === this.suggestionElement) {
                this.hideSuggestion();
            }
        });
    }

    addSuggestionStyles() {
        // Add CSS styles for the suggestion elements
        if (!document.getElementById('first-time-suggestion-styles')) {
            const styles = document.createElement('style');
            styles.id = 'first-time-suggestion-styles';
            styles.textContent = `
                .first-time-suggestion {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.85);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    backdrop-filter: blur(5px);
                }

                .first-time-suggestion.show {
                    opacity: 1;
                }

                .first-time-suggestion.hidden {
                    display: none;
                }

                .suggestion-content {
                    background: linear-gradient(135deg, #1a1a2e, #16213e);
                    border: 3px solid #ffd700;
                    border-radius: 15px;
                    padding: 2rem;
                    text-align: center;
                    max-width: 90%;
                    max-height: 90%;
                    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
                    position: relative;
                    animation: suggestionPulse 2s ease-in-out infinite;
                }

                @keyframes suggestionPulse {
                    0%, 100% { box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3); }
                    50% { box-shadow: 0 15px 40px rgba(255, 215, 0, 0.5); }
                }

                .suggestion-text h3 {
                    color: #ffd700;
                    font-size: 1.5rem;
                    margin: 0 0 1rem 0;
                    font-family: 'Tiny5', monospace;
                }

                .suggestion-text p {
                    color: #ffffff;
                    font-size: 1.1rem;
                    margin: 0 0 1.5rem 0;
                    line-height: 1.4;
                }

                .suggestion-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .suggestion-btn {
                    padding: 0.8rem 1.5rem;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: 'Tiny5', monospace;
                }

                .suggestion-btn.primary {
                    background: linear-gradient(135deg, #ffd700, #ffed4e);
                    color: #1a1a2e;
                    animation: btnGlow 2s ease-in-out infinite;
                }

                .suggestion-btn.primary:hover {
                    background: linear-gradient(135deg, #ffed4e, #ffd700);
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(255, 215, 0, 0.4);
                }

                .suggestion-btn.secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: #ffffff;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                }

                .suggestion-btn.secondary:hover {
                    background: rgba(255, 255, 255, 0.2);
                    border-color: rgba(255, 255, 255, 0.5);
                    transform: translateY(-2px);
                }

                @keyframes btnGlow {
                    0%, 100% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.3); }
                    50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.6); }
                }

                .tutorial-arrow {
                    position: fixed;
                    z-index: 9999;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .tutorial-arrow.show {
                    opacity: 1;
                }

                .tutorial-arrow.hidden {
                    display: none;
                }

                .arrow-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .arrow-body {
                    font-size: 2rem;
                    animation: arrowBounce 1s ease-in-out infinite;
                    filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.8));
                }

                .arrow-text {
                    color: #ffd700;
                    font-size: 0.9rem;
                    font-weight: bold;
                    margin-top: 0.5rem;
                    background: rgba(0, 0, 0, 0.7);
                    padding: 0.3rem 0.6rem;
                    border-radius: 15px;
                    border: 1px solid #ffd700;
                    font-family: 'Tiny5', monospace;
                    white-space: nowrap;
                }

                @keyframes arrowBounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                /* Mobile responsiveness */
                @media (max-width: 600px) {
                    .suggestion-content {
                        padding: 1.5rem;
                        margin: 1rem;
                    }

                    .suggestion-text h3 {
                        font-size: 1.3rem;
                    }

                    .suggestion-text p {
                        font-size: 1rem;
                    }

                    .suggestion-actions {
                        flex-direction: column;
                        align-items: center;
                    }

                    .suggestion-btn {
                        width: 100%;
                        max-width: 200px;
                    }

                    .arrow-body {
                        font-size: 1.5rem;
                    }

                    .arrow-text {
                        font-size: 0.8rem;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
    }

    showSuggestion() {
        if (this.suggestionShown) return;
        
        this.isShowingSuggestion = true;
        this.suggestionShown = true;
        
        // Show the suggestion modal
        this.suggestionElement.classList.remove('hidden');
        
        // Trigger show animation after a short delay
        setTimeout(() => {
            this.suggestionElement.classList.add('show');
        }, 50);

        // Position and show arrow pointing to tutorial button
        this.positionArrow();
        setTimeout(() => {
            this.showArrow();
        }, 800);

        console.log('Showing first-time player suggestion for testing');
        
        // Debug: log device info
        if (this.game.deviceManager) {
            console.log('Device info:', this.game.deviceManager.getDeviceInfo());
        }
    }

    hideSuggestion() {
        if (!this.isShowingSuggestion) return;
        
        this.isShowingSuggestion = false;
        
        // Hide elements
        this.suggestionElement.classList.remove('show');
        this.hideArrow();
        
        setTimeout(() => {
            this.suggestionElement.classList.add('hidden');
        }, 300);

        console.log('Hiding first-time player suggestion');
    }

    positionArrow() {
        const tutorialButton = this.game.tutorialButton;
        if (!tutorialButton) return;

        const rect = tutorialButton.getBoundingClientRect();
        
        // Position arrow above the tutorial button
        const arrowX = rect.left + (rect.width / 2) - 25; // Center horizontally
        const arrowY = rect.top - 80; // Position above the button
        
        this.arrowElement.style.left = `${Math.max(10, arrowX)}px`;
        this.arrowElement.style.top = `${Math.max(10, arrowY)}px`;
    }

    showArrow() {
        if (!this.isShowingSuggestion) return;
        
        this.arrowElement.classList.remove('hidden');
        setTimeout(() => {
            this.arrowElement.classList.add('show');
        }, 50);

        // Start arrow animation
        this.startArrowAnimation();
    }

    hideArrow() {
        this.arrowElement.classList.remove('show');
        setTimeout(() => {
            this.arrowElement.classList.add('hidden');
        }, 300);

        // Stop arrow animation
        this.stopArrowAnimation();
    }

    startArrowAnimation() {
        const animate = () => {
            if (!this.isShowingSuggestion) return;
            
            this.pulsePhase += 0.1;
            const pulse = Math.sin(this.pulsePhase) * 0.1 + 1;
            
            if (this.arrowElement.querySelector('.arrow-body')) {
                this.arrowElement.querySelector('.arrow-body').style.transform = 
                    `scale(${pulse}) translateY(${Math.sin(this.pulsePhase * 2) * 5}px)`;
            }
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        this.animationFrame = requestAnimationFrame(animate);
    }

    stopArrowAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    // Check if we should show the suggestion when the start screen is displayed
    checkAndShowSuggestion() {
        // FOR TESTING: Always show the suggestion for now
        // TODO: Later change this to only show for first-time players
        if (this.game.gameState === 'start' && !this.suggestionShown) {
            
            // Check if the actual game menu (startScreen) is visible, not the loading screen
            const startScreen = document.getElementById('startScreen');
            const gameContainer = document.querySelector('.game-container');
            
            if (startScreen && gameContainer && 
                !startScreen.classList.contains('hidden') && 
                gameContainer.style.display !== 'none') {
                
                // Delay showing the suggestion to let the start screen settle
                setTimeout(() => {
                    if (this.game.gameState === 'start' && 
                        !startScreen.classList.contains('hidden')) {
                        this.showSuggestion();
                    }
                }, 500);
            } else {
                // Start screen not visible yet, check again in a bit
                setTimeout(() => {
                    this.checkAndShowSuggestion();
                }, 500);
            }
        }
        
        // Original logic (commented out for testing):
        // Only show if it's the start screen and we haven't shown it yet
        // if (this.game.gameState === 'start' && !this.suggestionShown && 
        //     this.game.deviceManager && this.game.deviceManager.isFirstTimePlayer()) {
        //     
        //     // Check if the actual game menu (startScreen) is visible, not the loading screen
        //     const startScreen = document.getElementById('startScreen');
        //     const gameContainer = document.querySelector('.game-container');
        //     
        //     if (startScreen && gameContainer && 
        //         !startScreen.classList.contains('hidden') && 
        //         gameContainer.style.display !== 'none') {
        //         
        //         // Delay showing the suggestion to let the start screen settle
        //         setTimeout(() => {
        //             if (this.game.gameState === 'start' && 
        //                 !startScreen.classList.contains('hidden')) {
        //                 this.showSuggestion();
        //             }
        //         }, 500);
        //     } else {
        //         // Start screen not visible yet, check again in a bit
        //         setTimeout(() => {
        //             this.checkAndShowSuggestion();
        //         }, 500);
        //     }
        // }
    }

    // Reset suggestion state for testing
    reset() {
        this.suggestionShown = false;
        this.hideSuggestion();
    }

    // Manual trigger for testing (exposed to console)
    forceShowSuggestion() {
        console.log('Manually triggering tutorial suggestion...');
        this.suggestionShown = false; // Reset flag
        this.showSuggestion();
    }

    // Cleanup method
    destroy() {
        this.stopArrowAnimation();
        if (this.suggestionElement) {
            this.suggestionElement.remove();
        }
        if (this.arrowElement) {
            this.arrowElement.remove();
        }
        
        // Remove styles
        const styles = document.getElementById('first-time-suggestion-styles');
        if (styles) {
            styles.remove();
        }
    }
}
