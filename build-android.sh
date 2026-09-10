#!/bin/bash

# ============================================================
# PDF & Image Tools - Android APK Build Script
# ============================================================
# Requirements: Node.js 18+, JDK 21+, Android SDK 36
# ============================================================

set -e

echo "🔨 PDF & Image Tools - Building Android APK..."
echo "================================================"

# Step 1: Install dependencies
echo ""
echo "📦 Step 1/5: Installing npm dependencies..."
npm install

# Step 2: Build web app
echo ""
echo "🌐 Step 2/5: Building web app..."
npm run build

# Step 3: Sync Capacitor
echo ""
echo "📱 Step 3/5: Syncing Capacitor (copies web assets to Android)..."
npx cap sync android

# Step 4: Build debug APK
echo ""
echo "🤖 Step 4/5: Building debug APK with Gradle..."
cd android
chmod +x gradlew
./gradlew assembleDebug

# Step 5: Verify APK
echo ""
echo "✅ Step 5/5: Verifying APK..."
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo ""
    echo "=============================================="
    echo "✅ BUILD SUCCESSFUL!"
    echo "=============================================="
    echo "APK Location: android/$APK_PATH"
    echo "APK Size: $APK_SIZE"
    echo ""
    echo "To install on your device:"
    echo "  adb install android/$APK_PATH"
    echo ""
    echo "Or copy the APK to your phone and install it."
    echo "=============================================="
else
    echo "❌ ERROR: APK file not found at $APK_PATH"
    exit 1
fi
