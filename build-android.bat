@echo off
REM ============================================================
REM PDF & Image Tools - Android APK Build Script (Windows)
REM ============================================================
REM Requirements: Node.js, JDK 17+, Android SDK
REM ============================================================

echo.
echo ============================================
echo   PDF ^& Image Tools - Building Android APK
echo ============================================
echo.

REM Step 1: Install dependencies
echo [1/5] Installing npm dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed
    exit /b 1
)

REM Step 2: Build web app
echo.
echo [2/5] Building web app...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Web build failed
    exit /b 1
)

REM Step 3: Sync Capacitor
echo.
echo [3/5] Syncing Capacitor...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Capacitor sync failed
    exit /b 1
)

REM Step 4: Build debug APK
echo.
echo [4/5] Building debug APK...
cd android
call gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: APK build failed
    exit /b 1
)

REM Step 5: Verify APK
echo.
echo [5/5] Verifying APK...
set APK_PATH=app\build\outputs\apk\debug\app-debug.apk
if exist "%APK_PATH%" (
    echo.
    echo ============================================
    echo   BUILD SUCCESSFUL!
    echo ============================================
    echo   APK: android\%APK_PATH%
    echo.
    echo   To install: adb install android\%APK_PATH%
    echo ============================================
) else (
    echo ERROR: APK file not found
    exit /b 1
)

cd ..
