# Synthia — adaptable, self-serving Computer

A phone-friendly APK of the recovered Synthia Computer. The app starts its own local service, serves its interface on the phone, and retains files, projects, conversation, research records and verified capabilities in app-private storage. **No laptop server or paid API is required for the Android foundation.**

## Install on Android

**[Download Synthia Computer for ARM64 Android](downloads/Synthia-Computer-Android-arm64.apk)**

Android 8 or newer, ARM64 processor and a current Android System WebView are required. Open the downloaded APK and allow installation from your chosen source if Android asks. This debug-signed recovery package (`org.synthai.computer.recovery`) installs alongside previous Synthia apps so their data is preserved.

Once installed, open **Synthia Computer**. Its local service starts automatically; no manual terminal command or sign-in code is needed on the phone.

- Touch navigation: Home, Apps, Files and Synthia.
- Persistent file import, preview, text/code editing and chat.
- You-N-I-Verse, Social Network, Science Lab, Foundry and The Grove with persistent local foundations.
- Foundry executes real JavaScript in an opaque-origin, network-denied Worker; output-verified artifacts remain available in Grove.
- Native Android file import/export and checksummed backup/restore controls.

**Runtime boundaries:** Python and Linux shell require an additional installed runtime; a complete Linux userspace is not bundled in this APK. Unsupported executions report the missing runtime and preserve the source. The existing Linux/bubblewrap computer remains runnable from the same source. The five-chart mathematics and advanced autonomous research/construction remain unfinished.

## App Studio and app library

Build HTML/CSS/JavaScript apps and games inside the Computer. Each build preserves its source, receives the existing system address, and mounts in App library. Run it directly or use **Pick & run** to select a real capability match. Native APK compilation and per-app persistent data APIs are outside this browser-app runtime. [Usage and verification](docs/APP_STUDIO.md).

## Verification

- **61 recovered regression tests passed.**
- **34 desktop end-to-end checks passed** for the preceding local milestone.
- **19 phone-flow checks passed**, using the actual Android-mode host with pinned Node 18: touch layouts, source execution, network isolation, import, persistence, backup and restore.
- APK compilation, ZIP integrity, native-library inclusion, v2 signature verification and alignment passed. Native installation/launch remains unverified: emulator image setup exceeded the workspace storage. See [native test status](verification/android-native-test-status.json).

[Android build and runtime details](computer/android/BUILD_APK.md) · [Phone checks](verification/phone-computer-e2e-results.json) · [APK identity and hash](verification/android-package.json) · [Recovery inventory](docs/recovery/INVENTORY.md) · [Preservation record](verification/preservation-manifest.json)

## Optional Linux operation

Requires Linux, Node.js 24, Python 3 and functioning bubblewrap namespaces. The built interface and pinned donor files are included.

```sh
git clone https://github.com/justappgrabbin/Archeology.git
cd Archeology
npm run start:local
```

Open http://127.0.0.1:8765 on that machine and use the printed local sign-in code. [Desktop setup and recovery](START_HERE.md).

## Source preservation

Recovered from the existing `justappgrabbin/SynthAi` repair branch at `409c271a2edab730ffb9d09f35a5b1a39d4f7025`, with original donor implementations. The Back-up- donor is vendored here; a fresh checkout needs no submodule download to run. Private research PDFs, runtime state, credentials and signing keys are excluded from this repository. Original source notices and provenance remain; no new blanket license is assigned to the mixed-source collection.
