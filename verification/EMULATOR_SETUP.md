# Emulator storage recovery

The first native Android test attempts used the SDK installer on a 7.9 GB execution filesystem. System-image extraction and emulator userdata defaults exceeded its available space. Source, APKs and recovery backups were retained.

The working storage approach uses a separate 4.9 GB RAM-backed filesystem (`/dev/shm`), an official Android 11 x86_64 system image, and sparse extraction. Empty disk blocks are holes rather than allocated zero-filled space. The 3.1 GB logical system image and supporting files occupy about 1.5 GB. A preformatted sparse 6 GB userdata image initially occupies about 1.7 MB and grows only as Android writes data.

Image source: `https://dl.google.com/android/repository/sys-img/android/x86_64-30_r11.zip`. Its SHA-1 was checked against Google's repository metadata: `5e4de3946d46f88856c35efcc4d797b381456347`.

Stable emulator used for this test: Android Emulator 32.1.15, official archive `emulator-linux_x64-10696886.zip`. SHA-256 checked against Google's emulator archive page: `284954ab33259e0125757623132e7e36982d968fb6c22495145bb1b37861e6ef`.

The environment has no KVM support. The emulator runs with software CPU emulation (`-accel off`), SwiftShader graphics, no window, no audio and snapshots disabled. Boot and UI operations are consequently slower. The system image and test device are temporary infrastructure, not application assets or user data.

Representative launch:

```sh
ANDROID_SDK_ROOT=/workspace/android-tools/sdk \
ANDROID_AVD_HOME=/dev/shm/synthia-avd \
/workspace/android-tools/emulator32/emulator/emulator \
  -avd SynthiaTest -no-window -no-audio -no-boot-anim -no-snapshot \
  -accel off -gpu swiftshader_indirect -memory 1536 -cores 2 -feature -Vulkan
```

Native APK acceptance results are recorded separately after installation and launch; successful emulator boot alone does not establish that Synthia works.
