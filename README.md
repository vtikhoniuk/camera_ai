# CameraAIApp - Mobile App with AI Image Analysis

A React Native mobile application for Android with full web version support. Uses device camera to capture photos and analyze them using OpenAI GPT-4 Vision.

## Features

- 📸 Capture images from device camera (mobile and web versions)
- 🔄 Switch between front and rear cameras
- 🌐 **Full web camera support in browser**
- 🤖 Image analysis using OpenAI GPT-4 Vision
- 💾 Automatic photo saving to gallery (mobile version)
- ✨ Beautiful interface animations
- 🌐 Responses in Russian

## Platforms

### 📱 Mobile Version (Android)
- Full camera functionality via Expo Camera API
- Auto-save photos to gallery
- Native permissions

### 🌐 Web Version
- **Real web camera via WebRTC API**
- Switch between front and rear cameras
- Real-time image capture
- Full OpenAI API integration

## Installation and Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. OpenAI API Setup

1. Get API key at [platform.openai.com](https://platform.openai.com/api-keys)
2. Open `config.js` file
3. Replace `'your_openai_api_key_here'` with your actual API key:

```javascript
export const CONFIG = {
  OPENAI_API_KEY: 'sk-your-actual-api-key-here',
};
```

### 3. Prompt Configuration (Optional)

In `config.js` you can choose one of the predefined prompts or create your own:

```javascript
SYSTEM_PROMPT: 'DETAILED_ANALYSIS', // Choose the desired option
```

#### Available Prompts:

- **📋 DETAILED_ANALYSIS** - Detailed image analysis (default)
- **📝 SIMPLE_DESCRIPTION** - Simple description in 2-3 sentences  
- **📖 CREATIVE_STORY** - Creative story inspired by the image
- **🔍 TECHNICAL_ANALYSIS** - Technical analysis of photo quality
- **⚙️ CUSTOM** - Your own custom prompt

#### Creating Custom Prompt:

1. Choose `SYSTEM_PROMPT: 'CUSTOM'`
2. Edit the text in `PROMPTS.CUSTOM`:

```javascript
CUSTOM: `Your unique prompt here. For example:
Describe the emotions of people in the photo and guess their mood.
Answer in Russian.`
```

### 4. Running the Application

#### For web version (with full camera support):
```bash
npm run web
```

#### For Android:
```bash
npm run android
```

## System Requirements

### For web version:
- Modern browser with WebRTC support
- HTTPS connection (for OpenAI API in production)
- Camera access permission in browser

### For mobile version:
- Node.js 16+
- Expo CLI
- Android Studio (for Android development)
- Android device or emulator

## Web Functionality

### Supported Browsers:
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 17+

### Web Version Capabilities:
- Access to front and rear cameras
- High-quality image capture
- Conversion to base64 for OpenAI API
- Camera switching "on the fly"
- Full image analysis

## Permissions

### Mobile Version:
- Camera access (for taking photos)
- Media library access (for saving photos)
- Audio recording (for video, if needed in future)

### Web Version:
- Camera access via `navigator.mediaDevices.getUserMedia()`
- Automatic permission request on first launch

## Usage

1. **Launch Application**: 
   - **Web**: Open in browser, allow camera access
   - **Mobile**: App will request permissions on first launch

2. **Take Photo**: Press the blue camera button to capture image

3. **Switch Cameras**: Use the button in the top right corner

4. **Image Analysis**: After taking a photo it's automatically sent to OpenAI

5. **View Result**: Analysis result appears at the bottom with animation

6. **New Photo**: Press "Take new photo" for repeated use

## Technical Features

### Web Camera:
- Uses WebRTC `getUserMedia()` API
- HTML5 Canvas for frame capture
- Conversion to base64 for OpenAI API
- Camera switching support via `facingMode`

### Mobile Camera:
- Expo Camera API
- Native gallery saving
- High image quality

## Project Structure

```
CameraAIApp/
├── App.js              # Main application component
├── WebCamera.js        # Web camera component
├── config.js           # API keys configuration
├── app.json           # Expo configuration
├── package.json       # Project dependencies
└── assets/           # Application resources
```

## Possible Issues and Solutions

### Web Version

#### "Camera permission denied"
- Allow camera access in browser
- Check that site is not blocked in browser settings
- Use HTTPS for production version

#### "Camera not found"
- Make sure camera is connected and not used by other applications
- Reload page and re-allow access

#### OpenAI API errors in browser
- Use HTTPS for production (OpenAI requires secure connection)
- Check CORS settings
- Make sure API key is correct

### Mobile Version

#### "Camera permission denied"
- Allow camera access in app settings
- Reinstall app if permissions are not requested

#### App won't start
- Make sure all dependencies are installed: `npm install`
- Clear cache: `npx expo start --clear`

## Web Version Deployment

### For static hosting:
```bash
npm run build
```

### For GitHub Pages:
```bash
npm run deploy
```

### Important for production:
- Use HTTPS
- Configure CORS headers
- Ensure API key security

## Security

⚠️ **Important**: 
- Never commit `config.js` file with real API keys
- Use environment variables for production
- Web version requires HTTPS for full OpenAI functionality

## License

MIT License

## Support

If you encounter problems or have questions, create an issue in the project repository. 