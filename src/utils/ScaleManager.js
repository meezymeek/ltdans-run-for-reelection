// Scale Manager for Percentage-Based Coordinate System
// Handles conversion between percentage coordinates and pixel coordinates
// Ensures consistent gameplay across all screen sizes

export class ScaleManager {
    constructor(canvas, globalZoom = 1.0) {
        // Reference dimensions - these are our "base" screen size
        // All percentages are calculated relative to these dimensions
        this.baseWidth = 600;
        this.baseHeight = 600;
        
        // Global zoom factor - allows scaling all game elements uniformly
        this.globalZoom = globalZoom;
        
        // Current canvas dimensions
        this.canvas = canvas;
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
        
        // Scale factors for maintaining aspect ratio
        this.scaleX = canvas.width / this.baseWidth;
        this.scaleY = canvas.height / this.baseHeight;
        
        // Uniform scale factor (use smaller dimension to ensure everything fits)
        this.uniformScale = Math.min(this.scaleX, this.scaleY);
    }
    
    // Update canvas reference when canvas size changes
    updateCanvas(canvas) {
        this.canvas = canvas;
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
        this.scaleX = canvas.width / this.baseWidth;
        this.scaleY = canvas.height / this.baseHeight;
        this.uniformScale = Math.min(this.scaleX, this.scaleY);
    }
    
    // Global zoom control methods
    setGlobalZoom(zoom) {
        this.globalZoom = Math.max(0.1, Math.min(3.0, zoom)); // Clamp between 10% and 300%
        console.log(`Global zoom set to: ${(this.globalZoom * 100).toFixed(1)}%`);
    }
    
    getGlobalZoom() {
        return this.globalZoom;
    }
    
    // Convert percentage (0.0-1.0) to pixel coordinates (positions - NO zoom applied)
    toPixelsX(percentage) {
        return percentage * this.canvasWidth;
    }
    
    toPixelsY(percentage) {
        return percentage * this.canvasHeight;
    }
    
    // Convert percentage dimensions to pixels (dimensions - WITH zoom applied)
    dimensionToPixelsX(percentage) {
        return percentage * this.canvasWidth * this.globalZoom;
    }
    
    dimensionToPixelsY(percentage) {
        return percentage * this.canvasHeight * this.globalZoom;
    }
    
    // Convert pixel coordinates to percentage (0.0-1.0)
    toPercentageX(pixels) {
        return pixels / this.canvasWidth;
    }
    
    toPercentageY(pixels) {
        return pixels / this.canvasHeight;
    }
    
    // Scale a value based on reference dimensions (for maintaining proportions)
    scaleWidth(value) {
        return value * this.scaleX * this.globalZoom;
    }
    
    scaleHeight(value) {
        return value * this.scaleY * this.globalZoom;
    }
    
    // Uniform scaling (for elements that should maintain aspect ratio)
    scaleUniform(value) {
        return value * this.uniformScale * this.globalZoom;
    }
    
    // Convert percentage-based dimensions to pixels (with zoom applied)
    dimensionsToPixels(widthPercent, heightPercent) {
        return {
            width: this.dimensionToPixelsX(widthPercent),
            height: this.dimensionToPixelsY(heightPercent)
        };
    }
    
    // Convert percentage-based position to pixels
    positionToPixels(xPercent, yPercent) {
        return {
            x: this.toPixelsX(xPercent),
            y: this.toPixelsY(yPercent)
        };
    }
    
    // Convert pixel dimensions to percentages
    dimensionsToPercentages(width, height) {
        return {
            widthPercent: this.toPercentageX(width),
            heightPercent: this.toPercentageY(height)
        };
    }
    
    // Convert pixel position to percentages
    positionToPercentages(x, y) {
        return {
            xPercent: this.toPercentageX(x),
            yPercent: this.toPercentageY(y)
        };
    }
    
    // Helper methods for common conversions
    
    // Convert velocity from reference pixels/frame to percentage/frame
    velocityToPercentage(pixelVelocity, dimension = 'height') {
        if (dimension === 'width') {
            return pixelVelocity / this.baseWidth;
        } else {
            return pixelVelocity / this.baseHeight;
        }
    }
    
    // Convert velocity from percentage/frame to current pixels/frame
    velocityToPixels(percentageVelocity, dimension = 'height') {
        if (dimension === 'width') {
            return percentageVelocity * this.canvasWidth;
        } else {
            return percentageVelocity * this.canvasHeight;
        }
    }
    
    // Get screen aspect ratio
    getAspectRatio() {
        return this.canvasWidth / this.canvasHeight;
    }
    
    // Check if screen is portrait or landscape
    isPortrait() {
        return this.canvasHeight > this.canvasWidth;
    }
    
    isLandscape() {
        return this.canvasWidth > this.canvasHeight;
    }
    
    // Get safe area for UI elements (accounting for aspect ratio differences)
    getSafeArea() {
        return {
            left: 0,
            right: 1,
            top: 0,
            bottom: 1,
            width: 1,
            height: 1
        };
    }
    
    // Debug helpers
    getDebugInfo() {
        return {
            canvasSize: `${this.canvasWidth}x${this.canvasHeight}`,
            baseSize: `${this.baseWidth}x${this.baseHeight}`,
            scaleFactors: `X:${this.scaleX.toFixed(3)}, Y:${this.scaleY.toFixed(3)}`,
            uniformScale: this.uniformScale.toFixed(3),
            globalZoom: `${(this.globalZoom * 100).toFixed(1)}%`,
            aspectRatio: this.getAspectRatio().toFixed(3),
            orientation: this.isPortrait() ? 'Portrait' : 'Landscape'
        };
    }
}

// Singleton instance - can be imported and used globally
let globalScaleManager = null;

export function initializeScaleManager(canvas, globalZoom = 1.0) {
    globalScaleManager = new ScaleManager(canvas, globalZoom);
    return globalScaleManager;
}

export function getScaleManager() {
    if (!globalScaleManager) {
        throw new Error('ScaleManager not initialized. Call initializeScaleManager() first.');
    }
    return globalScaleManager;
}

// Helper functions for quick conversions without needing the full manager
export function px(percentage, dimension = 'width') {
    const sm = getScaleManager();
    return dimension === 'width' ? sm.toPixelsX(percentage) : sm.toPixelsY(percentage);
}

// Helper functions for dimension conversions (with zoom applied)
export function pxDim(percentage, dimension = 'width') {
    const sm = getScaleManager();
    return dimension === 'width' ? sm.dimensionToPixelsX(percentage) : sm.dimensionToPixelsY(percentage);
}

export function percent(pixels, dimension = 'width') {
    const sm = getScaleManager();
    return dimension === 'width' ? sm.toPercentageX(pixels) : sm.toPercentageY(pixels);
}
