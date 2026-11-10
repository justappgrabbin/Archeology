# Verified local milestone — 2026-11-10

## Results

- Recovered Computer regression: **61 passed, 0 failed**. Full output: `recovered-regression-results.log`.
- Real Chromium + API + service restart + backup/restore: **34 acceptance checks passed**. Enumerated checks: `local-computer-e2e-results.json`; reproducible source: `local-computer-e2e.py`.
- Original LCM AUTOLING replay: **10 checks passed**, original output includes `ALL PASS`. See `lcm-autoling-results.log`. This is a bounded source-example replay, not a general language benchmark.
- TypeScript desktop production build passed. Vite warns that the main JS bundle exceeds its 500 KB guidance; compressed main JS is about 257 KB.
- Final live checks: provider registry UI, actual persisted Klein capability after restart, event-log backup and no Chromium page script errors. See `final-live-check.json`.
- Preservation: no original tracked files missing; original branch and source commits retained. See `preservation-manifest.json`.

## Actual end-to-end scope

The acceptance run uses temporary data, authenticates through the desktop form, imports actual source, previews and executes it, previews an image with a misleading filename, downloads exact original PDF bytes, runs editor source, saves text to the persistent backend, and checks a real donor chat turn. It opens all five core application routes. Foundry builds and output-verifies source; Grove executes the retained artifact. Terminal runs a real shell in a network-disabled namespace, creates a persistent work file, and cannot see the host workspace. Original Klein AUTOLING runs through that isolated terminal.

The test rejects unauthenticated API access and verifies HttpOnly session cookies. It checks duplicate-name preservation, real ZIP extraction, linked research revisions, private-local relationship records and failed-output retention without successful artifact registration. Executed code cannot read the host session token or workspace. It then backs up, restarts, verifies original-byte recall, rejects a corrupted backup, restores the checkpoint and verifies both the capability and terminal file. Previous data remains recoverable.

## Newly retained composition

`retained-klein-composition.json` is the actual Foundry receipt for `computer/examples/klein-composition.py`. It imports the unchanged recovered AUTOLING implementation, learns from six input sentences using a bounded informant oracle, accepts an unseen valid combination and rejects invalid order. Observed output:

```
unseen_sentence=True
invalid_order=False
```

The source, digest, address, execution stages, test output and registered artifact ID were retained inside the running Computer. This proves this particular composition, not arbitrary autonomous application construction or general language comprehension.

## Baseline failures resolved by recovery/environment setup

Initial tests lacked the pinned Back-up- submodule. It was recovered at `1c45318a668de3bb3c54ae488b3d5f4109d1ba6b`. Local-host tests needed loopback access outside the command sandbox. Two ephemeris tests needed PyEphem, installed in a project-local virtual environment. The original npm mirror repeatedly failed; the lockfile's mirror URLs were redirected to the official registry without changing package versions or integrity values. The original lockfile remains preserved.

Real browser interaction exposed a full-window resize overlay blocking clicks, missing Documents folders after first import, an invalid initial file-manager location, and an incorrect nested execution-output path in Import. These were fixed and normal-click acceptance rerun. No forced-click bypass is used.

## Limits

This verifies a Linux local Computer milestone. Windows/macOS runtime isolation, physical Android installation, mobile permissions, networked social interactions, autonomous neural coding, universal document extraction, and the complete advanced ontological/swarm program are not verified. The inherited penta formula is explicitly marked a placeholder by its donor; tests do not validate it as the user's five-chart mathematics. Exact Personality Sun calculations and the five-degree constraint remain research tasks. Unknown relationships were not filled with invented rules.

## Android self-serving APK follow-up

The phone release now starts the Computer service inside the APK, has touch navigation, native file-picker imports/exports, Android Back integration and staged checkpoint restore. The existing native host is retained. Android JavaScript execution uses the existing pipeline with a dedicated opaque iframe/Worker adapter; Node host evaluation is not substituted. Python/Linux shell report unavailable until a suitable runtime is installed.

- 19 phone checks passed against the actual Android-mode host under the pinned Node 18 runtime.
- 61 recovered regression tests still pass.
- ARM64 and x86_64 APK builds passed; required native dependencies are present.
- ARM64 APK v2 signature, ZIP integrity and alignment checks passed.
- Native emulator installation/launch could not be completed because available workspace storage was insufficient for system images. Physical-phone installation remains unverified.

The recovery application ID is separate so earlier app-private data is not replaced. See `computer/android/BUILD_APK.md` and `verification/android-package.json`.
