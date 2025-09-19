// Orientation Detection and Management
export class OrientationManager {
    constructor() {
        this.orientationWarning = document.getElementById('orientationWarning');
        this.gameContainer = document.querySelector('.game-container');
        this.checkOrientation = this.checkOrientation.bind(this);
        this.init();
    }
    
    init() {
        // Listen for orientation changes
        window.addEventListener('orientationchange', () => {
            // Delay check to allow browser to update orientation
            setTimeout(this.checkOrientation, 100);
        });
        
        // Listen for resize events (covers more cases)
        window.addEventListener('resize', this.checkOrientation);
        
        // Initial check
        this.checkOrientation();
    }
    
    checkOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;
        const isMobile = window.innerWidth <= 1024; // Consider tablets as mobile too
        
        if (isLandscape && isMobile) {
            // Show warning and hide game
            this.showOrientationWarning();
        } else {
            // Hide warning and show game
            this.hideOrientationWarning();
        }
    }
    
    showOrientationWarning() {
        this.orientationWarning.classList.remove('hidden');
        this.gameContainer.style.display = 'none';
        
        // Pause game if it's running
        if (window.gameInstance && window.gameInstance.gameState === 'playing') {
            window.gameInstance.pauseGame();
        }
    }
    
    hideOrientationWarning() {
        this.orientationWarning.classList.add('hidden');
        this.gameContainer.style.display = 'flex';
    }
    
    // Add haptic feedback if available
    vibrate(pattern = [100]) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }
}
