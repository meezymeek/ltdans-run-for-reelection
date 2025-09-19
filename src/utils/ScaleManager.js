// Scale Manager for Percentage-Based Coordinate System
// Handles conversion between percentage coordinates and pixel coordinates
// Ensures consistent gameplay across all screen sizes

export class ScaleManager {
    constructor(canvas) {
        // Reference dimensions - these are our "base" screen size
        // All percentages are calculated relative to these dimensions
        this.baseWidth = 600;
        this.baseHeight = 600;
        
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
    
    // Convert percentage (0.0-1.0) to pixel coordinates
    toPixelsX(percentage) {
        return percentage * this.canvasWidth;
    }
    
    toPixelsY(percentage) {
        return percentage * this.canvasHeight;
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
        return value * this.scaleX;
    }
    
    scaleHeight(value) {
        return value * this.scaleY;
    }
    
    // Uniform scaling (for elements that should maintain aspect ratio)
    scaleUniform(value) {
        return value * this.uniformScale;
    }
    
    // Convert percentage-based dimensions to pixels
    dimensionsToPixels(widthPercent, heightPercent) {
        return {
            width: this.toPixelsX(widthPercent),
            height: this.toPixelsY(heightPercent)
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
            aspectRatio: this.getAspectRatio().toFixed(3),
            orientation: this.isPortrait() ? 'Portrait' : 'Landscape'
        };
    }
}

// Singleton instance - can be imported and used globally
let globalScaleManager = null;

export function initializeScaleManager(canvas) {
    globalScaleManager = new ScaleManager(canvas);
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

export function percent(pixels, dimension = 'width') {
    const sm = getScaleManager();
    return dimension === 'width' ? sm.toPercentageX(pixels) : sm.toPercentageY(pixels);
}
