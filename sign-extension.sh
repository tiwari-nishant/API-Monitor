#!/bin/bash
# Automated Firefox Extension Signing Script
# This script signs your extension for distribution to your team

set -e  # Exit on error

echo "🔧 Firefox Extension Signing Tool"
echo "=================================="
echo ""

# Check if web-ext is installed
if ! command -v web-ext &> /dev/null; then
    echo "❌ Error: web-ext is not installed"
    echo "📦 Install it with: npm install -g web-ext"
    exit 1
fi

# Check for API credentials
if [ -z "$FIREFOX_API_KEY" ] || [ -z "$FIREFOX_API_SECRET" ]; then
    echo "⚠️  Warning: API credentials not found in environment variables"
    echo ""
    echo "Please set your Mozilla API credentials:"
    echo "  export FIREFOX_API_KEY='your_jwt_issuer'"
    echo "  export FIREFOX_API_SECRET='your_jwt_secret'"
    echo ""
    echo "Get your credentials from: https://addons.mozilla.org/developers/addon/api/key/"
    echo ""
    read -p "Enter JWT Issuer (API Key): " API_KEY
    read -p "Enter JWT Secret (API Secret): " API_SECRET
else
    API_KEY="$FIREFOX_API_KEY"
    API_SECRET="$FIREFOX_API_SECRET"
    echo "✅ Using API credentials from environment variables"
fi

echo ""
echo "📋 Extension Details:"
echo "   Name: OpenBMC GUI Monitor"
echo "   Version: $(grep '"version"' manifest.json | cut -d'"' -f4)"
echo ""

# Clean previous artifacts
if [ -d "web-ext-artifacts" ]; then
    echo "🧹 Cleaning previous artifacts..."
    rm -rf web-ext-artifacts
fi

echo "🔐 Signing extension..."
echo ""

# Sign the extension
web-ext sign \
  --api-key="$API_KEY" \
  --api-secret="$API_SECRET" \
  --channel=unlisted

echo ""
echo "✅ Extension signed successfully!"
echo ""
echo "📦 Your signed .xpi file is located in: web-ext-artifacts/"
echo ""

# List the created file
if [ -d "web-ext-artifacts" ]; then
    XPI_FILE=$(ls web-ext-artifacts/*.xpi 2>/dev/null | head -n 1)
    if [ -n "$XPI_FILE" ]; then
        echo "📄 File: $(basename "$XPI_FILE")"
        echo "📊 Size: $(du -h "$XPI_FILE" | cut -f1)"
        echo ""
        echo "🚀 Next Steps:"
        echo "   1. Upload this file to GitHub Releases or your file server"
        echo "   2. Share the download link with your team"
        echo "   3. Team members can drag-and-drop the .xpi into Firefox"
        echo ""
        echo "📖 See TEAM_DISTRIBUTION.md for detailed instructions"
    fi
fi

# Made with Bob
