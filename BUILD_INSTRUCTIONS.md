# Android APK Build Instructions

## Build Preparation

### 1. Install Required Tools

1. **Android Studio**: Download and install from [developer.android.com](https://developer.android.com/studio)
2. **Java JDK 11**: Make sure you have the correct Java version installed
3. **EAS CLI**: For building with Expo Application Services

```bash
npm install -g @expo/cli
npm install -g eas-cli
```

### 2. Environment Variables Setup

Add to your `.bashrc` or `.zshrc`:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## Build Methods

### Method 1: EAS Build (Recommended)

1. **Register with Expo**:
```bash
eas login
```

2. **Configure project**:
```bash
eas build:configure
```

3. **Build APK**:
```bash
eas build --platform android --profile preview
```

### Method 2: Local Build

1. **Install Expo Dev Build**:
```bash
npx create-expo-app --template blank
cd CameraAIApp
npx expo install expo-dev-client
```

2. **Create development build**:
```bash
npx expo run:android
```

### Method 3: Expo Go (for testing)

1. **Start development server**:
```bash
npm start
```

2. **Scan QR code** in Expo Go app on Android device

## Release Configuration

### Update app.json for production:

```json
{
  "expo": {
    "name": "CameraAI",
    "slug": "camera-ai-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "package": "com.yourcompany.cameraai",
      "versionCode": 1,
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

## Troubleshooting

### "SDK location not found" error
```bash
echo "sdk.dir=$HOME/Android/Sdk" > android/local.properties
```

### Permissions error
Make sure all plugins are properly configured in app.json

### OpenAI API issues
- Check internet connection on device
- Make sure API key is valid
- Check CORS settings for web version

## APK Testing

1. **Install APK on device**:
```bash
adb install app-release.apk
```

2. **Check logs**:
```bash
adb logcat | grep -F "ReactNativeJS"
```

## Google Play Publishing

1. **Create signed APK/AAB**
2. **Create Google Play Developer account**
3. **Upload app through Play Console**
4. **Fill in metadata and description**
5. **Go through review process**

## Useful Commands

```bash
# Clear cache
npx expo start --clear

# Check dependencies
npx expo doctor

# Update Expo SDK
npx expo install --fix

# View logs
npx expo logs --type=device
``` 