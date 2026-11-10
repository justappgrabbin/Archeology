import { useEffect, useState } from 'react';
import { saveFile } from '@/lib/saveFile';
export default function Recovery() {
  const [terminal, setTerminal] = useState(false), [message, setMessage] = useState('');
  const [platform, setPlatform] = useState(''), [restoreFile, setRestoreFile] = useState<File | null>(null);
  useEffect(() => { fetch('/api/status').then(r => r.json()).then(v => setPlatform(v.platform)); }, []);
  const [registry, setRegistry] = useState<Array<{ capability: string; providers: Array<{ provider_id: string; status: string; known_limitations: string[] }> }>>([]);
  useEffect(() => { fetch('/api/local-controls').then(r => r.json()).then(p => setTerminal(Boolean(p.terminal))).catch(e => setMessage(String(e))); }, []);
  return <div className="p-5 text-[var(--text-primary)] space-y-5 overflow-auto h-full">
    <h1 className="text-xl">Recovery &amp; Controls</h1>
    <label className="flex gap-3"><input type="checkbox" checked={terminal} onChange={async e => {
      const next = e.target.checked; setTerminal(next);
      try { const r = await fetch('/api/local-controls', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ terminal: next }) }); const v = await r.json(); if (!r.ok) throw Error(v.error); setTerminal(v.terminal); setMessage('Execution permission saved.'); } catch(e) { setTerminal(!next); setMessage(String(e)); }
    }} />Allow isolated terminal commands</label>
    <p>{platform === 'android' ? 'Synthia serves this computer directly from your phone. JavaScript runs in an isolated WebView worker. An additional Linux userspace is required for Linux shell and Python tools; it is not bundled in this APK.' : 'Commands require your Run action. This release has no automatic shell execution loop. Bubblewrap must be available; failures are reported without a host-shell fallback.'}</p>
    <button className="border rounded p-3" onClick={async () => {
      try { const r = await fetch('/api/backup'); const v = await r.json(); if (!r.ok) throw Error(v.error); await saveFile(`synthia-backup-${Date.now()}.json`, new Blob([JSON.stringify(v)], { type: 'application/json' })); setMessage(platform === 'android' ? 'Choose a destination in the Android file picker to save your backup.' : 'Computer state backup downloaded. Use the CLI backup to also preserve terminal work files.'); } catch(e) { setMessage(String(e)); }
    }}>Download Computer state backup</button>
    {platform === 'android' && <section className="space-y-3"><h2>Restore on this phone</h2><input aria-label="Choose Synthia backup" type="file" accept=".json,application/json" onChange={e => setRestoreFile(e.target.files?.[0] ?? null)} /><button className="border rounded p-3" disabled={!restoreFile} onClick={async () => {
      try { const backup = JSON.parse(await restoreFile!.text()); const r = await fetch('/api/stage-restore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(backup) }); const v = await r.json(); if (!r.ok) throw Error(v.error); setMessage(v.message); window.SynthiaNative?.restartForRestore(); } catch(e) { setMessage(String(e)); }
    }}>Validate and restore checkpoint</button></section>}
    <p>Full local backup: <code>npm run backup:local -- /path/backup.json</code></p>
    <p>Recover: stop the computer, then run <code>npm run restore:local -- /path/backup.json</code>. Restore verifies the checksum and retains the previous data directory.</p>
    <p>Stop: <code>npm run stop:local</code> or Ctrl+C in the start terminal. Start: <code>npm run start:local</code>.</p>
    <button className="border rounded p-3" onClick={async () => {
      try { const r = await fetch('/api/capabilities'); const v = await r.json(); if (!r.ok) throw Error(v.error); setRegistry(v); } catch(e) { setMessage(String(e)); }
    }}>Inspect capability registry</button>
    {registry.length > 0 && <section><h2>Recovered provider registry</h2><p>Provider statuses retain their existing evidence scope. They do not certify the complete master build.</p>{registry.map(entry => <article key={entry.capability} className="border rounded p-3 my-2"><strong>{entry.capability}</strong>{entry.providers.map(p => <div key={p.provider_id}><p>{p.provider_id} · {p.status}</p><p>{p.known_limitations.join('; ')}</p></div>)}</article>)}</section>}
    <p role="status">{message}</p>
  </div>;
}
