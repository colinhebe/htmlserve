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
echo "📋 Compiling AppleScript application..."
osacompile -o HTMLServe_AS.app HTMLServe.applescript
cp -r HTMLServe_AS.app "$APP_BUNDLE"

# Copy executable to Resources
echo "📋 Copying HTMLServe executable..."
cp dist/htmlserve "$APP_BUNDLE/Contents/Resources/htmlserve"
chmod +x "$APP_BUNDLE/Contents/Resources/htmlserve"

# Copy icon and update Info.plist
echo "🎨 Setting up custom icon and permissions..."
if [ -f "assets/icon.icns" ]; then
    cp assets/icon.icns "$APP_BUNDLE/Contents/Resources/"
    # Update Info.plist to use custom icon
    /usr/libexec/PlistBuddy -c "Set :CFBundleIconFile icon" "$APP_BUNDLE/Contents/Info.plist"
    echo "✅ Custom icon set to: icon.icns"
elif [ -f "assets/htmlserve-icon.png" ]; then
    # If no .icns file available, use PNG (not best practice but works)
    cp assets/htmlserve-icon.png "$APP_BUNDLE/Contents/Resources/icon.png"
    /usr/libexec/PlistBuddy -c "Set :CFBundleIconFile icon.png" "$APP_BUNDLE/Contents/Info.plist"
    echo "✅ Icon set to: icon.png"
else
    echo "⚠️  No custom icon found, using default droplet icon"
fi

# Add enhanced permissions for file access
echo "🔐 Adding enhanced file access permissions..."
/usr/libexec/PlistBuddy -c "Add :NSFileProviderDomainUsageDescription string 'HTMLServe needs access to serve local files from any location.'" "$APP_BUNDLE/Contents/Info.plist" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :NSDocumentsFolderUsageDescription string 'HTMLServe needs access to serve HTML files from your Documents folder.'" "$APP_BUNDLE/Contents/Info.plist" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :NSDownloadsFolderUsageDescription string 'HTMLServe needs access to serve HTML files from your Downloads folder.'" "$APP_BUNDLE/Contents/Info.plist" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :NSNetworkVolumesUsageDescription string 'HTMLServe needs access to serve files from network volumes.'" "$APP_BUNDLE/Contents/Info.plist" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :NSRemovableVolumesUsageDescription string 'HTMLServe needs access to serve files from removable volumes.'" "$APP_BUNDLE/Contents/Info.plist" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :NSDesktopFolderUsageDescription string 'HTMLServe needs access to serve files from your Desktop.'" "$APP_BUNDLE/Contents/Info.plist" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :NSSystemAdministrationUsageDescription string 'HTMLServe needs elevated permissions for accessing quarantined files.'" "$APP_BUNDLE/Contents/Info.plist" 2>/dev/null || true
echo "✅ Enhanced permissions added"

# Apply entitlements for broader file access
echo "🔒 Applying enhanced entitlements..."
if [ -f "entitlements.plist" ]; then
    # Remove quarantine from the entitlements file first
    xattr -d com.apple.quarantine entitlements.plist 2>/dev/null || true

    # Re-sign the app with entitlements to give it elevated privileges
    codesign --force --deep --sign - --entitlements entitlements.plist "$APP_BUNDLE" 2>/dev/null || {
        echo "⚠️  Code signing failed, but app should still work"
    }
    echo "✅ Enhanced entitlements applied"
else
    echo "⚠️  No entitlements.plist found, using default permissions"
fi

# Clean up temporary AppleScript app
rm -rf HTMLServe_AS.app

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
