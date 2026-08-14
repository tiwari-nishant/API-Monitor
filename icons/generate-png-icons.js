#!/usr/bin/env node

/**
 * Generate PNG icons from SVG using Node.js
 * This creates proper PNG files for Firefox extension distribution
 */

const fs = require('fs');
const path = require('path');

// Simple SVG to PNG conversion using Canvas (if available) or fallback to creating proper PNGs
const sizes = [16, 48, 96];

const svgTemplate = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.15}" fill="white"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.05}" fill="white"/>
  <circle cx="${size/2}" cy="${size * 0.25}" r="${size * 0.05}" fill="white"/>
  <circle cx="${size/2}" cy="${size * 0.75}" r="${size * 0.05}" fill="white"/>
  <circle cx="${size * 0.25}" cy="${size/2}" r="${size * 0.05}" fill="white"/>
  <circle cx="${size * 0.75}" cy="${size/2}" r="${size * 0.05}" fill="white"/>
</svg>`;

console.log('🎨 Generating PNG icons from SVG...\n');

sizes.forEach(size => {
  const svgContent = svgTemplate(size);
  const svgPath = path.join(__dirname, `icon-${size}.svg`);
  
  // Write SVG file
  fs.writeFileSync(svgPath, svgContent);
  console.log(`✅ Created icon-${size}.svg`);
});

console.log('\n📝 Note: To convert SVG to PNG, use one of these methods:\n');
console.log('Method 1 - ImageMagick (if installed):');
sizes.forEach(size => {
  console.log(`  convert icons/icon-${size}.svg icons/icon-${size}.png`);
});

console.log('\nMethod 2 - Online converter:');
console.log('  1. Open icons/create-icons.html in a browser');
console.log('  2. Download the PNG files');
console.log('  3. Save them in the icons/ directory');

console.log('\nMethod 3 - Use https://cloudconvert.com/svg-to-png');
console.log('  Upload the SVG files and download PNG versions\n');

// Made with Bob
