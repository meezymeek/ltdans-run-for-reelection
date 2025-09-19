// Enhanced Touch Feedback Manager
export class TouchFeedbackManager {
    constructor() {
        this.init();
    }
    
    init() {
        // Add touch feedback to all buttons
        document.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Add visual feedback classes
        this.addTouchStyles();
    }
    
    handleTouchStart(e) {
        const button = e.target.closest('button');
        if (button) {
            button.classList.add('touch-active');
            this.vibrate([50]); // Light haptic feedback
        }
    }
    
    handleTouchEnd(e) {
        const button = e.target.closest('button');
        if (button) {
            // Remove the class after a short delay to allow for visual feedback
            setTimeout(() => {
                button.classList.remove('touch-active');
            }, 150);
        }
    }
    
    addTouchStyles() {
        // Add styles for touch feedback if not already added
        if (!document.querySelector('#touch-feedback-styles')) {
            const style = document.createElement('style');
            style.id = 'touch-feedback-styles';
            style.textContent = `
                button.touch-active {
                    transform: scale(0.95) !important;
                    box-shadow: 1px 1px 0 var(--px-shadow) !important;
                    transition: all 0.1s ease !important;
                }
                
                .control-btn.touch-active {
                    transform: scale(0.9) !important;
                    filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.8)) !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    vibrate(pattern) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }
}
