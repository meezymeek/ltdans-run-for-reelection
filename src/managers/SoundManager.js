// Sound Manager for Lt. Dan's Run for Re-Election
// Modular audio system with fallback support

export class SoundManager {
    constructor() {
        // Audio context
        this.audioContext = null;
        this.masterGainNode = null;
        this.musicGainNode = null;
        this.effectsGainNode = null;
        
        // Volume settings (0-1)
        this.volumes = {
            master: 0.7,
            music: 0.6,
            effects: 0.8
        };
        
        // Mute states
        this.muted = {
            master: false,
            music: false,
            effects: false
        };
        
        // Audio pools for frequently used sounds
        this.audioPools = {};
        this.poolSize = 5; // Number of instances per sound effect
        
        // Currently playing music
        this.currentMusic = null;
        this.currentMusicName = null;
        this.musicFadeInterval = null;
        
        // Sound file registry - will try multiple formats
        // Priority order: .wav, .mp3, .ogg, .m4a
        this.supportedFormats = ['wav', 'mp3', 'ogg', 'm4a'];
        
        this.sounds = {
            music: {
                menu: 'sfx/music/menu-theme',
                game: 'sfx/music/game-theme',
                pause: 'sfx/music/pause-ambient'
            },
            effects: {
                jump: 'sfx/effects/jump',
                pointLow: 'sfx/effects/point-low',
                pointTall: 'sfx/effects/point-tall',
                collision: 'sfx/effects/collision',
                crash: 'sfx/effects/crash',  // New crash sound for ragdoll
                buttonClick: 'sfx/effects/button-click',
                milestone: 'sfx/effects/milestone-100',
                countdown3: 'sfx/effects/countdown-3',
                countdown2: 'sfx/effects/countdown-2',
                countdown1: 'sfx/effects/countdown-1',
                countdownGo: 'sfx/effects/countdown-go',
                speedUp: 'sfx/effects/speed-up',
                crowdCheer: 'sfx/effects/crowd-cheer',
                'victory-fanfare': 'sfx/effects/victory-fanfare',
                fail: 'sfx/effects/fail'
            }
        };
        
        // Loaded audio elements
        this.loadedSounds = {
            music: {},
            effects: {}
        };
        
        // Fallback oscillator settings
        this.fallbackTones = {
            jump: { frequency: 400, duration: 0.15, type: 'sine' },
            pointLow: { frequency: 880, duration: 0.15, type: 'square' },
            pointTall: { frequency: 1200, duration: 0.2, type: 'square' },
            collision: { frequency: 150, duration: 0.3, type: 'sawtooth' },
            crash: { frequency: 100, duration: 0.5, type: 'sawtooth' },  // Deeper crash sound
            buttonClick: { frequency: 600, duration: 0.05, type: 'sine' },
            milestone: { frequency: 1000, duration: 0.5, type: 'triangle' },
            countdown: { frequency: 800, duration: 0.2, type: 'square' },
            countdownGo: { frequency: 1000, duration: 0.3, type: 'square' },
            speedUp: { frequency: 500, duration: 0.3, type: 'sine' },
            'victory-fanfare': { frequency: 1400, duration: 1.5, type: 'triangle' },
            fail: { frequency: 200, duration: 0.8, type: 'sawtooth' }
        };
        
        // Loading state
        this.isLoading = false;
        this.loadingProgress = 0;
        this.totalSoundsToLoad = 0;
        this.soundsLoaded = 0;
        
        // Initialize on first user interaction
        this.initialized = false;
        this.initPromise = null;
        
        // Pre-loaded audio assets
        this.preloadedAudio = null;
        
        // Page visibility tracking
        this.wasPlayingBeforeHidden = false;
        this.setupPageVisibilityHandlers();
    }
    
    // Method to receive pre-loaded audio from AssetLoader
    setPreloadedAudio(preloadedAudio) {
        this.preloadedAudio = preloadedAudio;
        console.log('SoundManager received pre-loaded audio:', preloadedAudio);
        
        // Copy pre-loaded sounds to our loaded sounds and configure them
        if (preloadedAudio.music) {
            for (const [name, audio] of Object.entries(preloadedAudio.music)) {
                // Configure music properties
                audio.loop = true;
                audio.volume = this.volumes.music * this.volumes.master;
                this.loadedSounds.music[name] = audio;
            }
        }
        
        if (preloadedAudio.effects) {
            for (const [name, audio] of Object.entries(preloadedAudio.effects)) {
                // Configure effect properties
                audio.loop = false;
                audio.volume = this.volumes.effects * this.volumes.master;
                this.loadedSounds.effects[name] = audio;
            }
            
            // Create audio pools for pre-loaded effects
            for (const [name, audio] of Object.entries(preloadedAudio.effects)) {
                this.createAudioPool(name, audio);
            }
        }
        
        console.log('Pre-loaded audio integrated and configured for immediate playback');
    }
    
    // Enhanced audio preparation after user interaction
    async prepareAudioForPlayback() {
        console.log('Preparing audio for immediate playback...');
        
        // Ensure all audio elements are properly configured
        for (const [name, audio] of Object.entries(this.loadedSounds.music)) {
            audio.loop = true;
            audio.volume = this.volumes.music * this.volumes.master;
            audio.preload = 'auto';
            
            // Try to load the audio data
            try {
                audio.load();
                console.log(`Music '${name}' prepared for playback`);
            } catch (e) {
                console.warn(`Could not prepare music '${name}':`, e);
            }
        }
        
        for (const [name, audio] of Object.entries(this.loadedSounds.effects)) {
            audio.loop = false;
            audio.volume = this.volumes.effects * this.volumes.master;
            audio.preload = 'auto';
            
            // Try to load the audio data
            try {
                audio.load();
                console.log(`Effect '${name}' prepared for playback`);
            } catch (e) {
                console.warn(`Could not prepare effect '${name}':`, e);
            }
        }
        
        // Also prepare pooled audio
        for (const [name, pool] of Object.entries(this.audioPools)) {
            for (const audio of pool) {
                audio.volume = this.volumes.effects * this.volumes.master;
                audio.preload = 'auto';
                try {
                    audio.load();
                } catch (e) {
                    // Ignore load errors for pooled audio
                }
            }
        }
        
        console.log('Audio preparation complete - ready for immediate playback');
    }
    
    // Setup page visibility API to pause audio when page is hidden
    setupPageVisibilityHandlers() {
        // Handle page visibility changes (tab switching, app switching, screen lock)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page is now hidden (switched app, locked phone, etc.)
                this.handlePageHidden();
            } else {
                // Page is now visible again
                this.handlePageVisible();
            }
        });
        
        // Handle window focus/blur events (additional coverage)
        window.addEventListener('blur', () => {
            this.handlePageHidden();
        });
        
        window.addEventListener('focus', () => {
            this.handlePageVisible();
        });
        
        // Handle beforeunload to clean up audio
        window.addEventListener('beforeunload', () => {
            this.stopAllAudio();
        });
    }
    
    handlePageHidden() {
        // Store whether music was playing before hiding
        this.wasPlayingBeforeHidden = this.currentMusic && !this.currentMusic.paused;
        
        // Pause all audio
        this.pauseAllAudio();
        
        // Auto-pause the game if it's playing
        if (window.gameInstance && window.gameInstance.gameState === 'playing') {
            window.gameInstance.pauseGame();
        }
    }
    
    handlePageVisible() {
        // Only resume music if it was playing before hiding AND game is not manually paused
        if (this.wasPlayingBeforeHidden && 
            window.gameInstance && 
            window.gameInstance.gameState !== 'paused') {
            this.resumeMusic();
        }
        
        this.wasPlayingBeforeHidden = false;
    }
    
    pauseAllAudio() {
        // Pause current music
        if (this.currentMusic && !this.currentMusic.paused) {
            this.currentMusic.pause();
        }
        
        // Stop all playing effects
        for (const pool of Object.values(this.audioPools)) {
            for (const audio of pool) {
                if (!audio.paused) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            }
        }
        
        // Stop any standalone effects
        for (const effect of Object.values(this.loadedSounds.effects)) {
            if (!effect.paused) {
                effect.pause();
                effect.currentTime = 0;
            }
        }
    }
    
    stopAllAudio() {
        // Stop current music completely
        this.stopMusic();
        
        // Stop all effects
        for (const pool of Object.values(this.audioPools)) {
            for (const audio of pool) {
                audio.pause();
                audio.currentTime = 0;
            }
        }
        
        for (const effect of Object.values(this.loadedSounds.effects)) {
            effect.pause();
            effect.currentTime = 0;
        }
    }
    
    // Initialize audio context (must be called after user interaction)
    async initialize() {
        if (this.initialized) return this.initPromise;
        
        this.initPromise = this._performInitialization();
        return this.initPromise;
    }
    
    async _performInitialization() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain nodes for volume control
            this.masterGainNode = this.audioContext.createGain();
            this.musicGainNode = this.audioContext.createGain();
            this.effectsGainNode = this.audioContext.createGain();
            
            // Connect gain nodes
            this.musicGainNode.connect(this.masterGainNode);
            this.effectsGainNode.connect(this.masterGainNode);
            this.masterGainNode.connect(this.audioContext.destination);
            
            // Set initial volumes
            this.updateVolumes();
            
            // Load all sounds
            await this.loadAllSounds();
            
            this.initialized = true;
            console.log('SoundManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize SoundManager:', error);
            this.initialized = false;
        }
    }
    
    // Load all sound files (only used if no pre-loaded assets available)
    async loadAllSounds() {
        // Skip loading if we already have pre-loaded audio
        if (this.preloadedAudio) {
            console.log('Using pre-loaded audio, skipping individual sound loading');
            return;
        }
        
        this.isLoading = true;
        const soundPromises = [];
        
        // Count total sounds
        this.totalSoundsToLoad = Object.keys(this.sounds.music).length + 
                                 Object.keys(this.sounds.effects).length;
        this.soundsLoaded = 0;
        
        // Load music
        for (const [name, path] of Object.entries(this.sounds.music)) {
            soundPromises.push(this.loadSound(name, path, 'music'));
        }
        
        // Load effects and create pools
        for (const [name, path] of Object.entries(this.sounds.effects)) {
            soundPromises.push(this.loadSound(name, path, 'effects', true));
        }
        
        await Promise.allSettled(soundPromises);
        this.isLoading = false;
        
        console.log(`Loaded ${this.soundsLoaded}/${this.totalSoundsToLoad} sounds`);
    }
    
    // Load a single sound file with multi-format support
    async loadSound(name, basePath, type, createPool = false) {
        let audioLoaded = false;
        let audio = null;
        
        // Try each supported format in order
        for (const format of this.supportedFormats) {
            const fullPath = `${basePath}.${format}`;
            
            try {
                audio = new Audio();
                audio.src = fullPath;
                
                // Set properties based on type
                if (type === 'music') {
                    audio.loop = true;
                    audio.volume = this.volumes.music * this.volumes.master;
                } else {
                    audio.loop = false;
                    audio.volume = this.volumes.effects * this.volumes.master;
                }
                
                // Test if the audio can be loaded
                await new Promise((resolve, reject) => {
                    const canPlayHandler = () => {
                        resolve();
                    };
                    const errorHandler = () => {
                        reject(new Error(`Cannot load ${fullPath}`));
                    };
                    
                    audio.addEventListener('canplaythrough', canPlayHandler, { once: true });
                    audio.addEventListener('error', errorHandler, { once: true });
                    
                    // Set a timeout to prevent hanging
                    const timeout = setTimeout(() => {
                        audio.removeEventListener('canplaythrough', canPlayHandler);
                        audio.removeEventListener('error', errorHandler);
                        reject(new Error('Load timeout'));
                    }, 2000);
                    
                    audio.load();
                    
                    // Clear timeout if successful
                    audio.addEventListener('canplaythrough', () => clearTimeout(timeout), { once: true });
                });
                
                // If we got here, the audio loaded successfully
                this.loadedSounds[type][name] = audio;
                audioLoaded = true;
                
                // Create audio pool for effects
                if (createPool && type === 'effects') {
                    this.createAudioPool(name, audio);
                }
                
                console.log(`Successfully loaded ${type} '${name}' as ${format.toUpperCase()}`);
                break; // Stop trying other formats
                
            } catch (error) {
                // This format didn't work, try the next one
                console.log(`Could not load ${fullPath}, trying other formats...`);
            }
        }
        
        if (!audioLoaded) {
            console.warn(`Failed to load ${type} '${name}' in any format (tried: ${this.supportedFormats.join(', ')}). Will use fallback sound.`);
        }
        
        this.soundsLoaded++;
        this.loadingProgress = this.soundsLoaded / this.totalSoundsToLoad;
    }
    
    // Create audio pool for frequently played sounds
    createAudioPool(name, originalAudio) {
        this.audioPools[name] = [];
        for (let i = 0; i < this.poolSize; i++) {
            const audioClone = originalAudio.cloneNode();
            audioClone.volume = originalAudio.volume;
            this.audioPools[name].push(audioClone);
        }
    }
    
    // Play a sound effect
    playEffect(effectName, options = {}) {
        if (!this.initialized) {
            this.initialize();
            return;
        }
        
        if (this.muted.master || this.muted.effects) return;
        
        const { volume = 1, pitch = 1, delay = 0 } = options;
        
        // Try to play from pool first
        if (this.audioPools[effectName]) {
            const audio = this.getAvailablePooledAudio(effectName);
            if (audio) {
                setTimeout(() => {
                    audio.volume = this.volumes.effects * this.volumes.master * volume;
                    audio.playbackRate = pitch;
                    audio.currentTime = 0;
                    audio.play().catch(() => {});
                }, delay);
                return;
            }
        }
        
        // Try to play loaded sound
        if (this.loadedSounds.effects[effectName]) {
            const audio = this.loadedSounds.effects[effectName];
            setTimeout(() => {
                audio.volume = this.volumes.effects * this.volumes.master * volume;
                audio.playbackRate = pitch;
                audio.currentTime = 0;
                audio.play().catch(() => {});
            }, delay);
            return;
        }
        
        // Fallback to synthesized sound
        this.playFallbackSound(effectName, delay);
    }
    
    // Get available audio from pool
    getAvailablePooledAudio(effectName) {
        const pool = this.audioPools[effectName];
        if (!pool) return null;
        
        for (const audio of pool) {
            if (audio.paused || audio.ended) {
                return audio;
            }
        }
        
        // If all are playing, return the first one (will restart it)
        return pool[0];
    }
    
    // Play fallback synthesized sound
    playFallbackSound(effectName, delay = 0) {
        if (!this.audioContext) return;
        
        const settings = this.fallbackTones[effectName] || this.fallbackTones.buttonClick;
        
        setTimeout(() => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = settings.type;
            oscillator.frequency.value = settings.frequency;
            
            gainNode.gain.setValueAtTime(
                0.1 * this.volumes.effects * this.volumes.master,
                this.audioContext.currentTime
            );
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                this.audioContext.currentTime + settings.duration
            );
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + settings.duration);
        }, delay);
    }
    
    // Play background music (no fade in/out)
    playMusic(musicName) {
        if (!this.initialized) {
            this.initialize().then(() => this.playMusic(musicName));
            return;
        }
        
        if (this.currentMusicName === musicName && this.currentMusic && !this.currentMusic.paused) {
            return; // Already playing
        }
        
        // Stop current music instantly
        if (this.currentMusic) {
            this.stopMusic();
        }
        
        this._startMusic(musicName);
    }
    
    _startMusic(musicName) {
        if (this.muted.master || this.muted.music) return;
        
        const music = this.loadedSounds.music[musicName];
        
        if (!music) {
            console.warn(`Music '${musicName}' not loaded`);
            return;
        }
        
        this.currentMusic = music;
        this.currentMusicName = musicName;
        
        // Play instantly at full volume
        music.volume = this.volumes.music * this.volumes.master;
        music.currentTime = 0;
        music.play().catch(() => {});
    }
    
    // Stop current music instantly
    stopMusic() {
        if (!this.currentMusic) return;
        
        this.currentMusic.pause();
        this.currentMusic.currentTime = 0;
        this.currentMusic = null;
        this.currentMusicName = null;
    }
    
    // Pause music
    pauseMusic() {
        if (this.currentMusic && !this.currentMusic.paused) {
            this.currentMusic.pause();
        }
    }
    
    // Resume music
    resumeMusic() {
        if (this.currentMusic && this.currentMusic.paused) {
            this.currentMusic.play().catch(() => {});
        }
    }
    
    // Update volume levels
    updateVolumes() {
        // Update master volume
        if (this.masterGainNode) {
            this.masterGainNode.gain.value = this.muted.master ? 0 : this.volumes.master;
        }
        
        // Update music volume
        if (this.currentMusic) {
            this.currentMusic.volume = this.muted.music ? 0 : 
                this.volumes.music * this.volumes.master;
        }
        
        // Update all loaded music
        for (const music of Object.values(this.loadedSounds.music)) {
            music.volume = this.muted.music ? 0 : 
                this.volumes.music * this.volumes.master;
        }
        
        // Update all effects and pools
        const effectVolume = this.muted.effects ? 0 : 
            this.volumes.effects * this.volumes.master;
            
        for (const effect of Object.values(this.loadedSounds.effects)) {
            effect.volume = effectVolume;
        }
        
        for (const pool of Object.values(this.audioPools)) {
            for (const audio of pool) {
                audio.volume = effectVolume;
            }
        }
    }
    
    // Set volume (type: 'master', 'music', 'effects')
    setVolume(type, value) {
        value = Math.max(0, Math.min(1, value));
        this.volumes[type] = value;
        this.updateVolumes();
        this.saveSettings();
    }
    
    // Toggle mute
    toggleMute(type = 'master') {
        this.muted[type] = !this.muted[type];
        this.updateVolumes();
        this.saveSettings();
        return this.muted[type];
    }
    
    // Save settings to localStorage
    saveSettings() {
        const settings = {
            volumes: this.volumes,
            muted: this.muted
        };
        localStorage.setItem('ltdan_audio_settings', JSON.stringify(settings));
    }
    
    // Load settings from localStorage
    loadSettings() {
        const saved = localStorage.getItem('ltdan_audio_settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.volumes = { ...this.volumes, ...settings.volumes };
                this.muted = { ...this.muted, ...settings.muted };
                this.updateVolumes();
            } catch (e) {
                console.warn('Failed to load audio settings');
            }
        }
    }
    
    // Helper methods for common sound effects
    playJump() {
        this.playEffect('jump', { 
            volume: 0.8, 
            pitch: 0.95 + Math.random() * 0.1 
        });
    }
    
    playPointLow() {
        this.playEffect('pointLow', { 
            volume: 0.7, 
            pitch: 0.98 + Math.random() * 0.04 
        });
    }
    
    playPointTall() {
        this.playEffect('pointTall', { 
            volume: 0.8, 
            pitch: 0.98 + Math.random() * 0.04 
        });
    }
    
    playCollision() {
        this.playEffect('collision', { volume: 1.0 });
    }
    
    playButtonClick() {
        this.playEffect('buttonClick', { volume: 0.5 });
    }
    
    playMilestone() {
        this.playEffect('milestone', { volume: 0.9 });
    }
    
    playCountdown(number) {
        if (number === 3) this.playEffect('countdown3');
        else if (number === 2) this.playEffect('countdown2');
        else if (number === 1) this.playEffect('countdown1');
        else if (number === 0) this.playEffect('countdownGo');
    }
    
    playSpeedUp() {
        this.playEffect('speedUp', { volume: 0.7 });
    }
    
    playCrash() {
        this.playEffect('crash', { volume: 1.0, pitch: 0.9 + Math.random() * 0.2 });
    }
}

// Export is handled at class definition
