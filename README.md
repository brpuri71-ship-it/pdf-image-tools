# PDF & Image Tools - Android App

A complete Android app built with React + Capacitor that provides PDF and image manipulation tools. All processing happens locally on the device — no internet or API required.

## 📱 App Details

| Property | Value |
|----------|-------|
| **App Name** | PDF & Image Tools |
| **Package Name** | `com.utilitytools.pdfimage` |
| **Min SDK** | 23 (Android 6.0) |
| **Target SDK** | 35 (Android 15) |
| **Version** | 1.0.0 |

## 🛠️ Features

- **Image → PDF** — Convert a single image to PDF
- **PDF → Image** — Convert PDF pages to PNG images
- **Image Compressor** — Reduce image file size with quality control
- **PDF Compressor** — Reduce PDF file size using object streams
- **Images → PDF** — Convert multiple images to one PDF
- **PDF Merge** — Combine multiple PDFs into one
- **PDF Split** — Split PDF into pages or extract a range

## 🚀 Quick Build (One Command)

### On macOS/Linux:
```bash
chmod +x build-android.sh
./build-android.sh
```

### On Windows:
```cmd
build-android.bat
```

The APK will be generated at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## 📋 Manual Build Steps

### Prerequisites
- **Node.js** 18+ 
- **JDK 17** (set `JAVA_HOME`)
- **Android SDK** with SDK 35 installed
- **Android Studio** (recommended)

### Step-by-step:

```bash
# 1. Install dependencies
npm install

# 2. Build the web app
npm run build

# 3. Sync web assets to Android project
npx cap sync android

# 4. Build the debug APK
cd android
./gradlew assembleDebug    # macOS/Linux
# or
gradlew.bat assembleDebug  # Windows

# 5. Find the APK
# android/app/build/outputs/apk/debug/app-debug.apk
```

## 📲 Install on Device

```bash
# Via ADB
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or transfer the APK to your phone and install it directly
```

## 🏗️ Project Structure

```
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
├── android/               # Android project (Capacitor)
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/.../MainActivity.java
│   │       └── res/       # Icons, themes, layouts
│   ├── build.gradle
│   ├── settings.gradle
│   └── gradlew
├── capacitor.config.ts    # Capacitor configuration
├── build-android.sh       # Build script (Linux/Mac)
└── build-android.bat      # Build script (Windows)
```

## 🔒 Privacy

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
3. Rename `android/app/src/main/java/com/utilitytools/pdfimage/` folder
4. Update `MainActivity.java` package declaration

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

### "JAVA_HOME not set"
```bash
export JAVA_HOME=/path/to/jdk-17
```

### Gradle build fails
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### Capacitor sync issues
```bash
npx cap clean
npx cap add android
npx cap sync
```

## 📄 License

MIT License - Free to use and modify.
