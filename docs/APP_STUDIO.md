# Apps built inside the Computer

**App Studio** builds browser apps and games directly inside Archeology's existing Android Computer. **App library** recalls and runs them by the system's existing addresses. No second Computer, external build server, Android SDK, Python or Linux shell is needed for these apps.

Open Apps → App Studio. Create/select a project, choose Counter starter or Game starter, edit HTML/CSS/JavaScript, then Build & add to library. App library → Run app opens the actual program. “Pick & run” matches a request and the user's saved goals/needs/interests to real app names, descriptions and capability tags. It does not invent a matching app when none exists.

App Studio can import HTML through Android's file picker, including Google Drive providers. It imports a copy. Trident can generate/fix source and export copies for import. Arbitrary autonomous Drive search is not supplied by this integration.

## Existing services, real artifacts

The builder validates JavaScript syntax without evaluating it in the native Node host. It packages HTML, CSS and JavaScript into a standalone document and retains the original source JSON and compiled document under unique revision paths. Both are admitted through `FileAdmission`: the existing execution address resolver, code-DNA learner, digest registration and trace-firing recall remain authoritative.

The compiled document also enters the existing intake → mutation → `mountApplication` pipeline. The library retains its artifact ID, mount ID, project, source/compiled paths, digest, and address. Launch calls exact address/path recall and verifies the recorded digest. Source edits are new revisions; previous sources remain intact. App records and source files persist in the Computer's existing state and backup. A browser startup receipt records only reported synchronous startup, not a claim of comprehensive testing.

The app address basis is explicitly `computational-file-admission`. The existing human-address service may compare known fields when a user has supplied birth information; unknown fields remain unknown. Selection is explained through actual capability-word matches. It is not presented as verified five-chart personalization or a newly invented ontological formula.

## Phone execution boundary

Apps run in an opaque-origin iframe (`sandbox="allow-scripts"`). They can render UI and respond to input. They receive no native Computer, filesystem or operating-system object. Parent-document access and API/network fetches are blocked. The startup-message receiver checks the source frame and per-launch nonce. Native Android export/restart methods require a separate unguessable top-document capability; sandbox frames cannot invoke the privileged bridge directly.

Network resources, external packages, ES module imports, Python/shell programs and native APK compilation are not supported by this browser-app builder. Apps use HTML/CSS and classic JavaScript; include dependencies in their source. Opaque apps do not receive persistent localStorage: persistent library/source is provided by the Computer, but per-app mutable data APIs are future work. Counter and game starter behavior is usable offline and resets when relaunched.

## Verification

`computer/tests/app-library.test.mjs` uses the actual Computer and addressing/mount services to check build, exact recall, revisions, persistence, syntax rejection, host non-execution and app selection. `verification/app-library-e2e.py` uses the real Android-mode host and Chromium phone viewport to build/run the counter, exercise input, select an app, play the game through completion and verify parent/network isolation. Physical Android device verification remains separate.
