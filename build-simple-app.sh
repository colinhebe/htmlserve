#!/bin/bash

# Simplified HTMLServe macOS App Builder
# This script creates a complete macOS app bundle with file associations

set -e

echo "🚀 Building HTMLServe App Bundle..."

# Create App Bundle structure
APP_NAME="HTMLServe"
APP_BUNDLE="dist/${APP_NAME}.app"
echo "📱 Creating app bundle: $APP_BUNDLE"

rm -rf "$APP_BUNDLE"

# Build CLI executable first
echo "🔨 Building CLI executable..."
npm run build-cli

# Use the compiled AppleScript app as base
echo "📋 Using AppleScript application as base..."
cp -r HTMLServe_AS.app "$APP_BUNDLE"

# Copy executable to Resources
echo "📋 Copying HTMLServe executable..."
cp dist/htmlserve "$APP_BUNDLE/Contents/Resources/htmlserve"
chmod +x "$APP_BUNDLE/Contents/Resources/htmlserve"
# Copy icon
if [ -f "build/icon.icns" ]; then
    cp build/icon.icns "$APP_BUNDLE/Contents/Resources/"
elif [ -f "assets/htmlserve-icon.png" ]; then
    # If no .icns file available, use PNG (not best practice but works)
    cp assets/htmlserve-icon.png "$APP_BUNDLE/Contents/Resources/icon.png"
fi

echo "✅ AppleScript app bundle created successfully!"
echo " Location: $APP_BUNDLE"
echo ""
echo "🔧 To set up file associations:"
echo "1. Copy the app to /Applications/"
echo "   cp -r '$APP_BUNDLE' /Applications/"
echo ""
echo "2. Set as default for HTML files:"
echo "   Right-click on an HTML file > Open With > Other... > Select HTMLServe.app"
echo "   Check 'Always Open With' and click 'Open'"
echo ""
echo "🎯 Features:"
echo "✅ Double-click HTML files to open with HTMLServe"
echo "✅ Drag & drop HTML files onto the app icon"
echo "✅ Automatic server shutdown when browser closes"
echo "✅ No file picker - direct usage only"
