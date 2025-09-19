// Main Entry Point for Lt. Dan's Run for Re-Election
import { LtDanRunner } from './Game.js';
import { OrientationManager } from './managers/OrientationManager.js';
import { TouchFeedbackManager } from './managers/TouchFeedbackManager.js';

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize orientation management
    window.orientationManager = new OrientationManager();
    
    // Initialize touch feedback
    window.touchFeedbackManager = new TouchFeedbackManager();
    
    // Initialize game
    window.gameInstance = new LtDanRunner();
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
