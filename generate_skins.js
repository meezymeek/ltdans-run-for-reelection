const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Define body parts with their dimensions and colors
const bodyParts = [
    { name: 'head', width: 32, height: 20, color: '#ff6b6b' },
    { name: 'torso', width: 30, height: 20, color: '#cc5858' },
    { name: 'upper_arm', width: 8, height: 12, color: '#ff6b6b' },
    { name: 'forearm', width: 6, height: 10, color: '#ff8585' },
    { name: 'thigh', width: 10, height: 12, color: '#ff6b6b' },
    { name: 'shin', width: 8, height: 12, color: '#ff8585' }
];

// Ensure directory exists
const skinDir = path.join(__dirname, 'skins', 'default');
if (!fs.existsSync(skinDir)) {
    fs.mkdirSync(skinDir, { recursive: true });
}

// Generate each body part image
bodyParts.forEach(part => {
    const canvas = createCanvas(part.width, part.height);
    const ctx = canvas.getContext('2d');
    
    // Draw base color
    ctx.fillStyle = part.color;
    ctx.fillRect(0, 0, part.width, part.height);
    
    // Add some detail/shading
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, part.width, 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, part.height - 2, part.width, 2);
    
    // Add edge highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, part.width - 1, part.height - 1);
    
    // Save to file
    const buffer = canvas.toBuffer('image/png');
    const filepath = path.join(skinDir, `${part.name}.png`);
    fs.writeFileSync(filepath, buffer);
    console.log(`Created ${filepath}`);
});

console.log('All placeholder skins generated successfully!');
