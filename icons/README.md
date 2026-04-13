# Icons

This directory contains the extension icons.

## Current Status

SVG icons have been generated. For development and testing, you can:

1. **Use SVG icons directly** - Firefox supports SVG icons in manifest.json
2. **Generate PNG icons** - Use one of these methods:

### Method 1: Online Converter
- Open `create-icons.html` in a browser
- Click the download links to get PNG files
- Save as `icon-16.png`, `icon-48.png`, `icon-96.png`

### Method 2: ImageMagick (if installed)
```bash
convert icon-16.svg icon-16.png
convert icon-48.svg icon-48.png
convert icon-96.svg icon-96.png
```

### Method 3: Online SVG to PNG Converter
- Visit https://cloudconvert.com/svg-to-png
- Upload the SVG files
- Download the PNG versions

### Method 4: Use Existing SVG
Firefox supports SVG icons, so you can update manifest.json to use .svg extensions instead of .png

## Icon Design

The icons feature:
- Purple gradient background (#667eea to #764ba2)
- White network/API symbol (circle with center dot)
- Professional, modern appearance

## For Production

Before publishing to Firefox Add-ons, ensure you have proper PNG icons in all required sizes.