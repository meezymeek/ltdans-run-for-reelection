// Asset Loader for Lt. Dan's Run for Re-Election
// Centralized asset loading with progress tracking

export class AssetLoader {
    constructor() {
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.progress = 0;
        this.isLoading = false;
        this.onProgress = null;
        this.onComplete = null;
        
        // Asset categories to load
        this.assets = {
            audio: {
                music: [],
                effects: []
            },
            images: {
                skins: [],
                parachutes: []
            },
            fonts: []
        };
        
        // Track loaded assets
        this.loadedContent = {
            audio: { music: {}, effects: {} },
            images: { skins: {}, parachutes: [] },
            fonts: []
        };
        
        // Audio format priorities
        this.audioFormats = ['wav', 'mp3', 'ogg', 'm4a'];
    }
    
    // Initialize asset lists
    initializeAssetLists() {
        // Music files
        this.assets.audio.music = [
            { name: 'menu', path: 'sfx/music/menu-theme' },
            { name: 'game', path: 'sfx/music/game-theme' },
            { name: 'pause', path: 'sfx/music/pause-ambient' }
        ];
        
        // Effect files
        this.assets.audio.effects = [
            { name: 'jump', path: 'sfx/effects/jump' },
            { name: 'crash', path: 'sfx/effects/crash' },
            { name: 'victory-fanfare', path: 'sfx/effects/victory-fanfare' },
            { name: 'fail', path: 'sfx/effects/fail' }
        ];
        
        // Player skin images
        this.assets.images.skins = [
            'head', 'head-open-mouth', 'torso', 'upper_arm', 
            'forearm', 'thigh', 'shin'
        ];
        
        // Parachute images
        this.assets.images.parachutes = [
            'parachute_marlboro.png',
            'parachute_silvereagle.png', 
            'parachute_koch.png',
            'parachute_spacex.png'
        ];
        
        // Fonts (Google Fonts - just need to check if loaded)
        this.assets.fonts = ['Tiny5'];
        
        // Calculate total assets
        this.totalAssets = 
            this.assets.audio.music.length +
            this.assets.audio.effects.length +
            this.assets.images.skins.length +
            this.assets.images.parachutes.length +
            this.assets.fonts.length;
    }
    
    // Start loading all assets
    async startLoading(onProgress = null, onComplete = null) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.loadedAssets = 0;
        this.progress = 0;
        this.onProgress = onProgress;
        this.onComplete = onComplete;
        
        this.initializeAssetLists();
        
        console.log(`Starting to load ${this.totalAssets} assets...`);
        
        // Load all asset categories in parallel
        const loadPromises = [
            this.loadAudioAssets(),
            this.loadImageAssets(),
            this.loadFonts()
        ];
        
        // Wait for all assets to load (or fail gracefully)
        await Promise.allSettled(loadPromises);
        
        this.isLoading = false;
        this.progress = 100;
        
        if (this.onProgress) {
            this.onProgress(100, this.totalAssets, this.totalAssets);
        }
        
        console.log(`Asset loading complete. Loaded ${this.loadedAssets}/${this.totalAssets} assets.`);
        
        if (this.onComplete) {
            this.onComplete(this.loadedContent);
        }
    }
    
    // Load audio assets
    async loadAudioAssets() {
        const audioPromises = [];
        
        // Load music
        for (const music of this.assets.audio.music) {
            audioPromises.push(this.loadAudioFile(music.name, music.path, 'music'));
        }
        
        // Load effects
        for (const effect of this.assets.audio.effects) {
            audioPromises.push(this.loadAudioFile(effect.name, effect.path, 'effects'));
        }
        
        await Promise.allSettled(audioPromises);
    }
    
    // Load a single audio file with format fallback
    async loadAudioFile(name, basePath, type) {
        let loaded = false;
        
        // Try each format until one works
        for (const format of this.audioFormats) {
            const fullPath = `${basePath}.${format}`;
            
            try {
                const audio = new Audio();
                audio.src = fullPath;
                
                await new Promise((resolve, reject) => {
                    const onLoad = () => {
                        this.loadedContent.audio[type][name] = audio;
                        this.updateProgress();
                        loaded = true;
                        resolve();
                    };
                    
                    const onError = () => {
                        reject(new Error(`Failed to load ${fullPath}`));
                    };
                    
                    audio.addEventListener('canplaythrough', onLoad, { once: true });
                    audio.addEventListener('error', onError, { once: true });
                    
                    // Set timeout to prevent hanging
                    const timeout = setTimeout(() => {
                        audio.removeEventListener('canplaythrough', onLoad);
                        audio.removeEventListener('error', onError);
                        reject(new Error('Load timeout'));
                    }, 3000);
                    
                    audio.addEventListener('canplaythrough', () => clearTimeout(timeout), { once: true });
                    audio.load();
                });
                
                console.log(`Loaded ${type} '${name}' as ${format.toUpperCase()}`);
                break; // Success, stop trying other formats
                
            } catch (error) {
                // This format failed, try next one
                continue;
            }
        }
        
        if (!loaded) {
            console.warn(`Failed to load ${type} '${name}' in any format`);
            this.updateProgress(); // Still count as "processed"
        }
    }
    
    // Load image assets
    async loadImageAssets() {
        const imagePromises = [];
        
        // Load skin images
        for (const skinPart of this.assets.images.skins) {
            imagePromises.push(this.loadSkinImage(skinPart));
        }
        
        // Load parachute images
        for (const parachute of this.assets.images.parachutes) {
            imagePromises.push(this.loadParachuteImage(parachute));
        }
        
        await Promise.allSettled(imagePromises);
    }
    
    // Load a skin image
    async loadSkinImage(partName) {
        try {
            const img = new Image();
            const imgPath = `skins/default/${partName}.png`;
            
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    this.loadedContent.images.skins[partName] = img;
                    this.updateProgress();
                    console.log(`Loaded skin: ${partName}`);
                    resolve();
                };
                
                img.onerror = () => {
                    reject(new Error(`Failed to load skin: ${partName}`));
                };
                
                // Set timeout
                const timeout = setTimeout(() => {
                    reject(new Error('Load timeout'));
                }, 3000);
                
                img.onload = () => {
                    clearTimeout(timeout);
                    this.loadedContent.images.skins[partName] = img;
                    this.updateProgress();
                    console.log(`Loaded skin: ${partName}`);
                    resolve();
                };
                
                img.src = imgPath;
            });
            
        } catch (error) {
            console.warn(`Failed to load skin ${partName}:`, error.message);
            this.updateProgress(); // Still count as processed
        }
    }
    
    // Load a parachute image
    async loadParachuteImage(filename) {
        try {
            const img = new Image();
            const imgPath = `skins/parachutes/${filename}`;
            const skinName = filename.replace('parachute_', '').replace('.png', '');
            
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    this.loadedContent.images.parachutes.push({
                        name: skinName,
                        image: img,
                        loaded: true
                    });
                    this.updateProgress();
                    console.log(`Loaded parachute: ${skinName}`);
                    resolve();
                };
                
                img.onerror = () => {
                    reject(new Error(`Failed to load parachute: ${filename}`));
                };
                
                // Set timeout
                const timeout = setTimeout(() => {
                    reject(new Error('Load timeout'));
                }, 3000);
                
                img.onload = () => {
                    clearTimeout(timeout);
                    this.loadedContent.images.parachutes.push({
                        name: skinName,
                        image: img,
                        loaded: true
                    });
                    this.updateProgress();
                    console.log(`Loaded parachute: ${skinName}`);
                    resolve();
                };
                
                img.src = imgPath;
            });
            
        } catch (error) {
            console.warn(`Failed to load parachute ${filename}:`, error.message);
            this.updateProgress(); // Still count as processed
        }
    }
    
    // Load fonts (check if Google Fonts are loaded)
    async loadFonts() {
        for (const fontName of this.assets.fonts) {
            try {
                // Check if font is loaded by creating a test element
                await this.checkFontLoaded(fontName);
                this.loadedContent.fonts.push(fontName);
                console.log(`Font ${fontName} is loaded`);
            } catch (error) {
                console.warn(`Font ${fontName} may not be loaded:`, error.message);
            }
            this.updateProgress();
        }
    }
    
    // Check if a font is loaded
    async checkFontLoaded(fontName) {
        return new Promise((resolve) => {
            // Use CSS Font Loading API if available
            if ('fonts' in document) {
                document.fonts.ready.then(() => {
                    resolve();
                });
            } else {
                // Fallback - just wait a bit for Google Fonts
                setTimeout(resolve, 1000);
            }
        });
    }
    
    // Update loading progress
    updateProgress() {
        this.loadedAssets++;
        this.progress = Math.round((this.loadedAssets / this.totalAssets) * 100);
        
        if (this.onProgress) {
            this.onProgress(this.progress, this.loadedAssets, this.totalAssets);
        }
    }
    
    // Get loaded assets for use by game systems
    getLoadedAssets() {
        return this.loadedContent;
    }
}
