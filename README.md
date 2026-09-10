# PDF & Image Tools - Android App

A complete Android app built with React + Capacitor that provides PDF and image manipulation tools. All processing happens locally on the device — no internet or API required.

## 📱 App Details

| Property | Value |
|----------|-------|
| **App Name** | PDF & Image Tools |
| **Package Name** | `com.utilitytools.pdfimage` |
| **Min SDK** | 24 (Android 7.0) |
| **Target SDK** | 36 (Android 16) |
| **Compile SDK** | 36 |
| **Version** | 1.0.0 |
| **Java Version** | 21 |
| **AGP Version** | 8.13.0 |
| **Gradle Version** | 8.14.2 |

## 🛠️ Features

- **Image → PDF** — Convert a single image to PDF
- **PDF → Image** — Convert PDF pages to PNG images
- **Image Compressor** — Reduce image file size with quality control
- **PDF Compressor** — Reduce PDF file size using object streams
- **Images → PDF** — Convert multiple images to one PDF
- **PDF Merge** — Combine multiple PDFs into one
- **PDF Split** — Split PDF into pages or extract a range

## 🚀 Quick Start - Build APK in Android Studio

### Prerequisites

Before you begin, ensure you have:

1. **Android Studio** (latest version recommended)
   - Download from: https://developer.android.com/studio
   
2. **JDK 21** (Android Studio includes this)
   - Verify: `java -version` should show version 21
   
3. **Android SDK** with the following installed:
   - SDK Platform: Android 16.0 ("Tiramisu") - API 36
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   
4. **Node.js** 18+ and npm
   - Download from: https://nodejs.org/

### Step-by-Step Build Instructions

#### Step 1: Install Dependencies

Open a terminal in the project root directory and run:

```bash
npm install
```

This will install all Node.js dependencies including Capacitor.

#### Step 2: Build the Web App

```bash
npm run build
```

This creates the production web build in the `dist/` directory.

#### Step 3: Sync Capacitor

```bash
npx cap sync android
```

This command:
- Copies the web assets from `dist/` to `android/app/src/main/assets/public/`
- Updates Capacitor configuration files
- Prepares the Android project

**Expected output:**
```
✔ Copying web assets from dist to android/app/src/main/public in 125.43ms
✔ Creating capacitor.config.json in android/app/src/main/assets in 1.28ms
✔ copy android in 212.35ms
✔ Updating Android plugins in 6.42ms
  Found 0 Capacitor plugins for android:
✔ update android in 78.21ms
✔ Running Gradle build in 1245ms
```

#### Step 4: Open in Android Studio

1. Open **Android Studio**
2. Select **File → Open**
3. Navigate to and select the `android/` folder in this project
4. Click **OK**
5. Wait for Android Studio to sync and index the project (first time may take 2-5 minutes)

**Note:** Android Studio will automatically download Gradle 8.14.2 and required dependencies on first sync.

#### Step 5: Build Debug APK

**Option A: Using Android Studio GUI**

1. In Android Studio, wait for the Gradle sync to complete
2. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. Wait for the build to complete (2-5 minutes first time)
4. When complete, a notification will appear: "Build completed successfully"
5. Click **locate** in the notification to find the APK

**Option B: Using Terminal**

From the `android/` directory:

```bash
# macOS/Linux
./gradlew assembleDebug

# Windows
gradlew.bat assembleDebug
```

#### Step 6: Locate the APK

The debug APK will be located at:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

#### Step 7: Install on Device

**Via ADB:**
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**Manual Installation:**
1. Transfer `app-debug.apk` to your Android device
2. Open the file on your device
3. Enable "Install from unknown sources" if prompted
4. Tap **Install**

## 📋 One-Command Build (Alternative)

If you prefer a single command, use the build scripts:

**macOS/Linux:**
```bash
chmod +x build-android.sh
./build-android.sh
```

**Windows:**
```cmd
build-android.bat
```

These scripts will:
1. Install npm dependencies
2. Build the web app
3. Sync Capacitor
4. Build the debug APK
5. Verify the APK was created

## 🏗️ Project Structure

```
project-root/
├── src/                    # React source code
│   ├── App.tsx            # Main app with routing
│   ├── components/        # Shared components
│   │   └── Layout.tsx     # App layout wrapper
│   └── pages/             # Tool pages
│       ├── Home.tsx
│       ├── ImageToPdf.tsx
│       ├── PdfToImage.tsx
│       ├── ImageCompressor.tsx
│       ├── PdfCompressor.tsx
│       ├── ImagesToPdf.tsx
│       ├── PdfMerge.tsx
│       └── PdfSplit.tsx
├── dist/                  # Web build output (generated)
├── android/               # Android project (Capacitor)
│   ├── app/
│   │   ├── build.gradle
│   │   ├── capacitor.build.gradle
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/com/utilitytools/pdfimage/
│   │       │   └── MainActivity.java
│   │       ├── res/       # Icons, themes, layouts
│   │       └── assets/public/  # Web assets (copied by cap sync)
│   ├── build.gradle
│   ├── settings.gradle
│   ├── variables.gradle
│   ├── gradle.properties
│   ├── gradlew
│   └── gradlew.bat
├── capacitor.config.ts    # Capacitor configuration
├── package.json           # Node.js dependencies
├── build-android.sh       # Build script (Linux/Mac)
└── build-android.bat      # Build script (Windows)
```

## 🔧 Configuration Files

### capacitor.config.ts

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.utilitytools.pdfimage',
  appName: 'PDF & Image Tools',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;
```

### android/variables.gradle

Defines SDK versions and library versions used throughout the Android project.

### android/app/build.gradle

Main app module configuration including:
- Application ID: `com.utilitytools.pdfimage`
- SDK versions: compileSdk 36, targetSdk 36, minSdk 24
- Java 21 compatibility

## 🔒 Privacy & Offline

- ✅ 100% offline — all processing on device
- ✅ No data collection
- ✅ No network requests
- ✅ No backend server needed
- ✅ Files never leave the device

## 🎨 Customization

### Change App Name

Edit `android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">Your App Name</string>
```

### Change Package Name

1. Edit `capacitor.config.ts` → `appId`
2. Edit `android/app/build.gradle` → `applicationId` and `namespace`
3. Rename folder: `android/app/src/main/java/com/utilitytools/pdfimage/`
4. Update `MainActivity.java` package declaration
5. Update `android/app/src/main/AndroidManifest.xml` if needed

### Change App Icon

Replace files in:
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` (adaptive icon)
- `android/app/src/main/res/drawable/ic_launcher_foreground.xml` (foreground vector)

Or generate icons using [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html) and place them in the appropriate `mipmap-*` folders.

### Change Theme Colors

Edit `android/app/src/main/res/values/colors.xml`:
```xml
<color name="colorPrimary">#4f46e5</color>      <!-- Primary -->
<color name="colorPrimaryDark">#3730a3</color>   <!-- Status bar -->
<color name="colorAccent">#6366f1</color>        <!-- Accent -->
```

## 🐛 Troubleshooting

### "SDK location not found"

Create `android/local.properties`:
```properties
sdk.dir=/path/to/Android/Sdk
```

**Common paths:**
- macOS: `sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk`
- Windows: `sdk.dir=C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk`
- Linux: `sdk.dir=/home/YOUR_USERNAME/Android/Sdk`

### "JAVA_HOME not set" or "Unsupported Java version"

Ensure JDK 21 is installed and set:

```bash
# macOS/Linux
export JAVA_HOME=/path/to/jdk-21

# Windows
set JAVA_HOME=C:\Program Files\Java\jdk-21
```

### Gradle sync fails in Android Studio

1. **File → Invalidate Caches / Restart**
2. Delete `.gradle` and `.idea` folders in `android/`
3. Re-open project in Android Studio
4. Let it sync again

### "Could not find method compileSdkVersion()"

This error means the Gradle version is too old. Ensure you're using Gradle 8.14.2 or higher.

### Capacitor sync fails

```bash
# Clean and re-sync
npx cap clean
npx cap add android
npx cap sync
```

### Build fails with "Execution failed for task ':app:mergeDebugResources'"

```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### APK not found after build

Verify the build completed successfully. Check:
```bash
ls -la android/app/build/outputs/apk/debug/
```

## 📦 Building Release APK

To build a signed release APK:

1. Generate a keystore:
```bash
keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias release
```

2. Create `android/keystore.properties`:
```properties
storeFile=../release-key.jks
storePassword=YOUR_PASSWORD
keyAlias=release
keyPassword=YOUR_PASSWORD
```

3. Update `android/app/build.gradle`:
```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
keystoreProperties.load(new FileInputStream(keystorePropertiesFile))

android {
    signingConfigs {
        release {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

4. Build release APK:
```bash
cd android
./gradlew assembleRelease
```

The release APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## 📄 License

MIT License - Free to use and modify.

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Capacitor documentation: https://capacitorjs.com/docs
3. Check Android Studio documentation: https://developer.android.com/studio

---

**Ready to build!** Follow the steps above to generate your APK.
