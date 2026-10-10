# 💬 2KT Chating - True Cross-Platform Messenger & Material Sharing

A single codebase powering:
- 📱 **Android** (Google Play Store & direct APK)
- 📱 **iPhone / iOS** (Apple App Store & TestFlight)
- 💻 **Windows** (Desktop application & Chrome/Edge PWA)
- 💻 **macOS** (Desktop application & Safari/Chrome PWA)
- 🌐 **Web / Chrome** (100% Platform-Independent browser access)

---

## 🌟 Architecture Overview

```
                      [ Cloud / Central Server ]
                     (Node.js + Socket.IO + DB)
                   Render / Railway / Docker / VPS
                                 ▲
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
          ▼                      ▼                      ▼
    📱 Android              📱 iPhone             💻 Desktop & Web
  Google Play Store      Apple App Store       Chrome / Windows / Mac
  (Capacitor + AAB)      (Capacitor + IPA)     (Electron & PWA Standalone)
```

1. **Backend Gateway**: Real-time Node.js & Socket.IO server handling authentication, WebSocket messaging, reactions, voice notes, and file attachments up to 100MB.
2. **Universal Client**: Unified responsive frontend built with modern Web Standards, bundled into native Android and iOS apps via **Capacitor**, desktop via **Electron**, and browser via **Progressive Web App (PWA)**.
3. **Dynamic Cloud/Local Gateway**: Built-in server connection switcher in the UI allows users on any platform to connect either to a hosted cloud server (`https://your-domain.com`) or a local development server (`http://192.168.x.x:3000`).

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Backend Server
```bash
npm start
# Or with auto-reload:
npm run dev
```

### 3. Open in Browser (Chrome / Edge / Firefox)
Visit: `http://localhost:3000`

---

## 📱 Platform 1: Android (Google Play Store & APK)

The native Android project is located in `android/`.

### A. Open in Android Studio
```bash
npm run android:open
```
Or open the `android/` directory directly in **Android Studio**.

### B. Build Debug APK (For direct phone testing)
Run from the project root:
```powershell
npm run android:build
```
Your compiled APK will be generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

Transfer this `.apk` to any Android phone and install it directly!

### C. Build Release App Bundle (.AAB) for Google Play Store
1. Open the project in Android Studio (`npm run android:open`).
2. Go to **Build** &rarr; **Generate Signed Bundle / APK...**.
3. Select **Android App Bundle (.aab)**.
4. Select or create your keystore signing key.
5. Choose **release** build variant and click **Finish**.
6. Upload the resulting `.aab` file directly to the **Google Play Console** under **Production / Internal Testing**.

> **Note on Permissions**: `android/app/src/main/AndroidManifest.xml` is already configured with all required permissions for Camera, Microphone (voice notes), Storage, and Internet.

---

## 📱 Platform 2: iPhone / iOS (Apple App Store)

The native iOS Xcode project is located in `ios/`.

### A. Open in Xcode (on macOS)
```bash
npm run ios:open
```
Or open `ios/App/App.xcworkspace` in **Xcode**.

### B. Test on iPhone Simulator or Real Device
1. Connect your iPhone via USB or select a Simulator.
2. Under **Signing & Capabilities**, select your Apple Developer Team.
3. Press **Run** (Cmd + R) to launch on device.

### C. Archive & Submit to Apple App Store
1. In Xcode, set the build target to **Any iOS Device (arm64)**.
2. Select **Product** &rarr; **Archive**.
3. Once archived, click **Distribute App** &rarr; **App Store Connect**.
4. Submit to **TestFlight** for beta testing or directly to the **Apple App Store**.

> **Note on App Store Compliance**: `ios/App/App/Info.plist` already includes required Apple Privacy Descriptions (`NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, `NSPhotoLibraryUsageDescription`).

---

## 💻 Platform 3 & 4: Windows & macOS (Desktop)

### Run as Desktop App with Electron:
```bash
npm run desktop
```
This launches a native desktop window with hardware acceleration, native menus, and tray capability.

### Or Install via Chrome / Edge (1-Click PWA Desktop App):
1. Open the app URL in Chrome or Edge on Windows or Mac.
2. Click the **Install** icon in the browser address bar (or click the glowing **"Install App"** button inside the sidebar).
3. The app is added directly to your Windows Start Menu, Taskbar, or macOS Applications dock as a standalone window!

---

## 🌐 Platform 5: Web & Chrome (Platform-Independent)

Anyone in the world can use **2KT Chating** instantly without downloading from stores by navigating to the URL in Google Chrome, Safari, Edge, or mobile browsers.

- Fully responsive from 320px mobile screens to 4K ultra-wide monitors.
- Supports browser push notifications, sound alerts, and vibration feedback.
- Instant drag-and-drop file sharing.
- Works offline/online with service worker caching.

---

## ☁️ Deploying the Server to the Cloud (For Global Store & Web Access)

For users who download the app from Google Play Store or Apple App Store to communicate across different networks, the backend server must run on a public internet host:

### Option 1: 1-Click Free Cloud Deployment on Render
1. Push your repository to GitHub.
2. Log in to [Render.com](https://render.com) and click **New** &rarr; **Blueprint**.
3. Select your repository — `render.yaml` will automatically configure:
   - Node.js runtime
   - Port 3000
   - SSL / HTTPS domain (e.g. `https://your-app.onrender.com`)
4. Done! Copy your HTTPS URL.

### Option 2: Docker Container Deployment (Fly.io, Railway, AWS, DigitalOcean)
Use the included production `Dockerfile`:
```bash
docker build -t 2kt-chating .
docker run -p 3000:3000 -d 2kt-chating
```

### Option 3: Instant Free Internet Sharing via Cloudflare Tunnel
To share your local computer server over the internet for friends anywhere in the world without port forwarding:
```bash
npm run tunnel
```
This gives you a secure, free public `https://xxxx.trycloudflare.com` URL.

---

## ⚙️ In-App Server Gateway Switcher

Every client build (Android, iPhone, Desktop, Web) includes a **Cloud / Server Connection** button:
- Located in the sidebar header (cloud icon ☁️) and on the Sign In screen.
- Allows users to enter their cloud server URL (e.g. `https://my-2kt-chat.onrender.com`).
- Features a **⚡ Test Connection** button to measure live ping / latency.
- Settings are saved automatically in device storage.

---

## 📂 Project Directory Structure

```
2KT Chating/
├── android/                 # Native Android Studio Gradle Project (Play Store)
│   └── app/src/main/
│       ├── AndroidManifest.xml  # Android permissions (Mic, Camera, Net)
│       └── assets/public/       # Synced web bundle
├── ios/                     # Native Xcode Project (Apple App Store)
│   └── App/App/
│       ├── Info.plist           # Apple App Store Privacy Permissions
│       └── public/              # Synced web bundle
├── electron-main.js         # Desktop wrapper for Windows & macOS
├── capacitor.config.json    # Universal Capacitor mobile configuration
├── Dockerfile               # Universal container deployment
├── render.yaml              # 1-Click Render Cloud deployment blueprint
├── package.json             # NPM dependencies & cross-platform scripts
├── server/                  # Backend engine (Express + Socket.IO + SQLite)
│   ├── index.js             # HTTP/WS server & LAN network detector
│   ├── database.js          # SQLite database schema
│   ├── auth.js              # JWT & bcrypt security
│   ├── socket.js            # Real-time WebSocket handlers
│   └── routes/              # Auth, users, chats, upload endpoints
└── public/                  # Responsive web & PWA frontend
    ├── index.html           # Unified UI layout & modals
    ├── manifest.json        # PWA Web App Manifest
    ├── sw.js                # Service Worker for offline & caching
    ├── css/style.css        # Responsive dark/light theme stylesheet
    └── js/
        ├── api.js           # REST API client with dynamic server URL
        ├── socket.js        # Socket.IO client with dynamic server URL
        ├── chat.js          # Chat renderer & message bubbles
        ├── media.js         # Lightbox, voice note recorder, audio player
        ├── pwa.js           # Cross-platform installation & push alerts
        └── app.js           # UI state manager & server config modal
```

---

## 📜 License
MIT License - Open Source
