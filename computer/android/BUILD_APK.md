# Self-serving phone APK

The Android application starts its own native Node service in app-private storage, provisions a private WebView session cookie, and opens the same persistent Computer at loopback. A laptop or hosted website is not required. Native imports and exports use Android's document pickers; Android Back closes the current panel before leaving the app.

Phone navigation, full-width touch panels, portrait/landscape layout, and keyboard-height bounds adapt the existing desktop rather than replacing the Computer. JavaScript artifacts execute through the existing execution pipeline in an opaque-origin, network-denied WebView Worker with a ten-second limit. Python and shell artifacts report missing runtimes on Android; the original source is preserved. The existing Linux/bubblewrap runtime remains available on Linux. A complete embedded Linux/Python userspace is not bundled in this APK.

## Install

Use the ARM64 APK for a compatible ARM64 Android phone (Android 8 or newer, current Android System WebView). The x86_64 APK is for testing/emulators. The package is `org.synthai.computer.recovery`, so it can coexist with earlier Synthia apps and does not overwrite their private data. This is a debug-signed recovery build; export backups before replacing or removing any existing app.

## Rebuild

Tools: JDK 17, Gradle 8.7, Android SDK platform 35, build-tools 35.0.0, NDK 27.0.12077973, CMake 3.22.1, Node 24 for the frontend build, and Python 3 for asset staging.

```sh
npm ci --ignore-scripts --prefix computer/shell/kimi-linux --registry=https://registry.npmjs.org
npm run build:desktop
python computer/android/prepare-assets.py
curl -fL -o node-mobile.zip https://github.com/nodejs-mobile/nodejs-mobile/releases/download/v18.20.4/nodejs-mobile-v18.20.4-android.zip
printf '%s\n' 'bd7321eaa1a7602fbe0bb87302df2d79d87835cf4363fbdd17c350dbb485c2af  node-mobile.zip' | sha256sum -c -
python computer/android/prepare-node.py node-mobile.zip
gradle -p computer/android :app:assembleDebug
```

Outputs: `computer/android/app/build/outputs/apk/debug/app-arm64-v8a-debug.apk` and `app-x86_64-debug.apk`. Native libraries and desktop assets are bundled. Runtime state, session credentials, build tools and private research PDFs are excluded. No blanket new license is assigned to reused donor code.

## Verification scope

See `verification/android-package.json`, `android-signature.txt`, and `phone-computer-e2e-results.json`. Phone browser tests execute the real Android-mode service using the pinned Node 18 runtime, not a mock backend. Native emulator findings are recorded separately. A successful APK signature/build alone is not a physical-device acceptance test.

The exact five-chart mathematics, verified human addressing, general autonomous construction and shared social network remain later integration work. This APK is a usable self-serving recovery milestone of the same adaptable Computer.
