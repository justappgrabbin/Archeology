// Android starts the same Computer service after extracting its source assets.
import { webcrypto } from 'node:crypto';
import { applyPendingRestore } from './host/pending-restore.mjs';
if (!globalThis.crypto) globalThis.crypto = webcrypto;
// nodejs-mobile 18 has Event/EventTarget but not the browser CustomEvent global
// used by the preserved donor event bus. Keep its standard detail semantics.
if (!globalThis.CustomEvent) globalThis.CustomEvent = class CustomEvent extends Event {
  constructor(type, options = {}) { super(type, options); this.detail = options.detail ?? null; }
};
process.env.SYNTHIA_ANDROID = '1';
process.env.SYNTHIA_DATA_DIR = process.argv[2];
process.env.SYNTHIA_PORT ||= '8765';
// The Android activity creates a fresh 256-bit secret and provisions its WebView cookie.
if (!/^[a-f0-9]{64}$/.test(process.argv[3] ?? '')) throw new Error('Missing Android Computer session capability.');
process.env.SYNTHIA_API_TOKEN = process.argv[3];
await applyPendingRestore(process.env.SYNTHIA_DATA_DIR);
await import('./host/server.mjs');
