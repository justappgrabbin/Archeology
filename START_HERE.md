# Synthia — recovered local Computer milestone

This is a runnable extension of your existing SynthAi Computer, not completion of every phase in the master build. The foundation is the preserved `repair/embedded-linux-computer-20261109` implementation at `409c271`, with its original pinned Back-up- donor. See [recovery inventory](docs/recovery/INVENTORY.md), [preservation manifest](verification/preservation-manifest.json) and [verification](verification/RESULTS.md).

## Run locally

The delivered ZIP includes the built desktop, source and pinned donor files. Extract the whole directory, then use Linux with Node.js 24, Python 3 and bubblewrap (`bwrap`). Bubblewrap must be permitted to create user, mount, PID and network namespaces. No paid API or LLM is required for these functions.

```sh
npm run start:local
```

Open `http://127.0.0.1:8765` **on the machine running the command**. Paste the sign-in code printed in the terminal. This starts a loopback service; it does not publish a site or install anything on your phone. Keep the start terminal open.

```sh
npm run status:local
npm run stop:local
```

Ctrl+C in the start terminal also stops it. `SYNTHIA_PORT` changes the port. `SYNTHIA_DATA_DIR` chooses a separate persistent data directory; default is `.synthia` beside this document. The desktop session code rotates on restart. The control file stays private and is excluded from delivery archives.

If rebuilding from source:

```sh
npm ci --ignore-scripts --prefix computer/shell/kimi-linux --registry=https://registry.npmjs.org
npm run build:desktop
```

When recovering from Git rather than the ZIP, first run `git submodule update --init --recursive`. A missing Back-up- donor is an actual startup dependency, not something to replace with stubs.

## What to use

Open **Activities** to launch applications. Existing File Manager, Import, Text Editor, Code Editor and Synthia chat remain connected to the recovered runtime. Import retains originals and allocates unique names on collision. ZIP support is bounded to 200 entries, 600 KB per extracted member and 6 MB total; unsupported archives report errors. UTF-8 text previews render escaped text. Image/PDF previews use inspected content signatures; PDF text extraction and OCR are not connected to this importer.

- **You-N-I-Verse:** editable goals, preferences and optional birth notes. Birth-derived calculations are pending verification.
- **Social Network:** private local relationship and shared-goal notes. Network accounts, messaging and cross-device sharing are not implemented.
- **Science Lab:** searchable questions, source statements, derivations, observations, hypotheses, verification evidence and linked revisions. Verification prose is recorded evidence, not an automatic truth judgment.
- **Foundry:** persistent projects; source revisions; actual isolated JavaScript, Python or shell execution; expected-output comparison; retained success/failure receipts. A verified result registers an artifact in the same Computer. Enter your source and an expected output, then choose **Execute, test & retain**.
- **The Grove:** reuse and export actual output-verified Foundry artifacts. Its library purpose was recovered from Synthai2's `GroveStore.tsx`; no fake download counts or nonexistent community downloads are carried into this collection.
- **Terminal:** actual Linux `/bin/sh` commands in a network-disabled bubblewrap namespace. Its `/work` persists separately from the virtual file manager. Enable it in **Recovery & Controls**. Commands have a 10-second and 256 KB output limit. There is no silent host-shell fallback.

Original LCM tools are mounted read-only in the isolated environment:

```sh
python3 /resources/klein/klein_autoling.py
python3 /resources/klein/klein_diseminer.py
```

Foundry Python source can import these actual modules by adding `/resources/klein` to `sys.path`. Their documented scope limitations are preserved. Diagnostic LCM neural weights are not presented as a trained general assistant.

## Backup and recover

For a full local checkpoint, finish active commands and builds before backing up. Offline backups are preferable when you need a stable snapshot of terminal work files.

```sh
npm run backup:local -- /absolute/path/synthia-backup.json
npm run stop:local
npm run restore:local -- /absolute/path/synthia-backup.json
npm run start:local
```

The CLI backup contains checksummed Computer state and event log, plus a companion `.terminal` directory when work files exist. Keep them together. Restore requires the Computer to be stopped, checks the hashes, and preserves the complete previous data directory with a `.before-restore-<timestamp>` suffix. It never silently overwrites a named backup. The UI download backs up state and events; use the CLI for terminal files as well. Backups can contain personal notes and source files.

## Test

The recovered ephemeris regression provider additionally requires PyEphem. Its penta assignment formula is explicitly a donor placeholder; passing its tests does not verify the user's five charts or positional mathematics.

```sh
python3 -m venv .venv
.venv/bin/python -m pip install ephem==4.2.1
PATH="$PWD/.venv/bin:$PATH" node --test --test-concurrency=1 computer/tests/*.test.mjs
```

Real desktop/restart/recovery acceptance uses Python Playwright, PyMuPDF and Chromium (tested with `/usr/bin/chromium`):

```sh
python verification/local-computer-e2e.py
```

This test creates separate temporary data and uses port 18865. It does not test against or reset your live `.synthia` data. See its source and recorded results for exactly what was exercised.

## Scope still open

Exact five-chart rules, five-degree Personality constraint, verified tropical Personality Sun onboarding, gate/center computation, advanced autonomous research, learned swarm construction and adaptive environments remain unfinished. Existing address-derived file coordinates are preserved implementation behavior, not a claim that their mathematics is externally verified. The terminal and Foundry here require user actions; they are not autonomous general coding agents.

The exact named `Research_Library_Updated_7_Links.pdf` was not accessible. Private research-document copies remain in the original recovery workspace and are excluded from this public repository; their source references and uncertain directory identity remain documented. Complete original repositories remain in the recovery workspace. No upstream push, merge or deployment was made.
