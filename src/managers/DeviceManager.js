// Device Manager Class - Handles device ID generation and first-time player detection
export class DeviceManager {
    constructor() {
        this.deviceId = null;
        this.hasPlayedBefore = false;
        this.storageKey = 'rerun_device_data';
        this.init();
    }

    init() {
        this.loadDeviceData();
        if (!this.deviceId) {
            this.generateDeviceId();
        }
        this.checkFirstTimePlayer();
    }

    // Generate a unique device ID using various browser fingerprinting techniques
    generateDeviceId() {
        const components = [];
        
        // Screen resolution
        components.push(`${screen.width}x${screen.height}`);
        
        // Timezone offset
        components.push(new Date().getTimezoneOffset().toString());
        
        // User agent hash (simplified)
        components.push(this.hashString(navigator.userAgent));
        
        // Language
        components.push(navigator.language || 'en-US');
        
        // Platform
        components.push(navigator.platform || 'unknown');
        
        // Hardware concurrency
        components.push((navigator.hardwareConcurrency || 1).toString());
        
        // Memory (if available)
        if (navigator.deviceMemory) {
            components.push(navigator.deviceMemory.toString());
        }
        
        // Canvas fingerprint (simple)
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('Lt. Dan\'s Run for Reelection', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Device fingerprint test', 4, 45);
            components.push(this.hashString(canvas.toDataURL()));
        } catch (e) {
            components.push('canvas-error');
        }
        
        // WebGL fingerprint (simple)
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const renderer = gl.getParameter(gl.RENDERER);
                const vendor = gl.getParameter(gl.VENDOR);
                components.push(this.hashString(`${vendor}-${renderer}`));
            }
        } catch (e) {
            components.push('webgl-error');
        }
        
        // Random component for uniqueness (stored once)
        let randomComponent = localStorage.getItem('rerun_device_random');
        if (!randomComponent) {
            randomComponent = Math.random().toString(36).substring(2, 15);
            localStorage.setItem('rerun_device_random', randomComponent);
        }
        components.push(randomComponent);
        
        // Create device ID from components
        const deviceString = components.join('|');
        this.deviceId = this.hashString(deviceString);
        
        console.log('Generated device ID:', this.deviceId);
        this.saveDeviceData();
    }

    // Simple hash function for string inputs
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    // Load device data from localStorage
    loadDeviceData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                this.deviceId = data.deviceId;
                this.hasPlayedBefore = data.hasPlayedBefore || false;
                
                // Check if user has completed tutorial or played a game
                this.checkGameHistory();
                
                console.log('Loaded device data:', {
                    deviceId: this.deviceId,
                    hasPlayedBefore: this.hasPlayedBefore
                });
            }
        } catch (error) {
            console.warn('Could not load device data:', error);
            this.hasPlayedBefore = false;
        }
    }

    // Check if user has any game history indicators
    checkGameHistory() {
        // Check if user has submitted any scores
        const savedPlayerName = localStorage.getItem('rerun_player_name');
        
        // Check if there are any high score indicators
        const hasScoreHistory = savedPlayerName && savedPlayerName.length > 0;
        
        // Check if tutorial has been completed before
        const tutorialCompleted = localStorage.getItem('rerun_tutorial_completed') === 'true';
        
        // Check if user has played games before (we'll set this when games are completed)
        const gamesPlayed = parseInt(localStorage.getItem('rerun_games_played') || '0');
        
        if (hasScoreHistory || tutorialCompleted || gamesPlayed > 0) {
            this.hasPlayedBefore = true;
        }
    }

    // Save device data to localStorage
    saveDeviceData() {
        try {
            const data = {
                deviceId: this.deviceId,
                hasPlayedBefore: this.hasPlayedBefore,
                lastSeen: Date.now()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.warn('Could not save device data:', error);
        }
    }

    // Check if this is a first-time player
    checkFirstTimePlayer() {
        // If we've never seen this combination before, it's a first-time player
        if (!this.hasPlayedBefore) {
            console.log('First-time player detected!');
            return true;
        }
        return false;
    }

    // Mark that the player has now played the game
    markAsPlayedBefore() {
        if (!this.hasPlayedBefore) {
            console.log('Marking player as having played before');
            this.hasPlayedBefore = true;
            this.saveDeviceData();
        }
    }

    // Mark tutorial as completed
    markTutorialCompleted() {
        localStorage.setItem('rerun_tutorial_completed', 'true');
        this.markAsPlayedBefore();
    }

    // Increment games played counter
    incrementGamesPlayed() {
        const current = parseInt(localStorage.getItem('rerun_games_played') || '0');
        localStorage.setItem('rerun_games_played', (current + 1).toString());
        this.markAsPlayedBefore();
    }

    // Get device ID for high score submission
    getDeviceId() {
        return this.deviceId;
    }

    // Get player status
    isFirstTimePlayer() {
        return !this.hasPlayedBefore;
    }

    // Get additional device info for analytics
    getDeviceInfo() {
        return {
            deviceId: this.deviceId,
            isFirstTime: this.isFirstTimePlayer(),
            screen: `${screen.width}x${screen.height}`,
            platform: navigator.platform,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    // Reset device data (for testing)
    reset() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem('rerun_device_random');
        localStorage.removeItem('rerun_tutorial_completed');
        localStorage.removeItem('rerun_games_played');
        this.hasPlayedBefore = false;
        this.deviceId = null;
        this.generateDeviceId();
        console.log('Device data reset for testing');
    }
}
