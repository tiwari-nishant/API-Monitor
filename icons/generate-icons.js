// Simple script to generate placeholder icons
// Run with: node generate-icons.js

const fs = require('fs');

function createSVGIcon(size) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad${size})" rx="${size/8}"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="none" stroke="white" stroke-width="${size/12}"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/8}" fill="white"/>
</svg>`;
  
  fs.writeFileSync(`icon-${size}.svg`, svg);
  console.log(`Created icon-${size}.svg`);
}

createSVGIcon(16);
createSVGIcon(48);
createSVGIcon(96);

console.log('\nSVG icons created! For Firefox, you can use SVG icons directly.');
console.log('If you need PNG, convert using an online tool or ImageMagick.');
