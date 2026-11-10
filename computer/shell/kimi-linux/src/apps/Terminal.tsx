import { useEffect, useState } from 'react';
export default function Terminal() {
  const [command, setCommand] = useState('printf "SYNTHIA_OK\\n"; uname -s');
  const [output, setOutput] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { fetch('/api/terminal-history').then(r => r.json()).then(rows => {
    if (Array.isArray(rows)) setOutput(rows.map(r => `$ ${r.command}\n${r.stdout}${r.stderr}\n[exit ${r.code}]`).join('\n'));
  }); }, []);
  return <div className="h-full flex flex-col p-4 gap-3 text-[var(--text-primary)]">
    <p className="text-xs">Linux shell · isolated /work persists · network disabled · 10 second command limit. Enable execution in Recovery &amp; Controls.</p>
    <p className="text-xs">Recovered Klein tools: <code>python3 /resources/klein/klein_autoling.py</code> and <code>python3 /resources/klein/klein_diseminer.py</code></p>
    <pre aria-label="Terminal output" className="flex-1 min-h-0 overflow-auto whitespace-pre-wrap bg-black text-green-200 p-3 text-sm">{output}</pre>
    <form className="flex gap-2" onSubmit={async e => {
      e.preventDefault(); setBusy(true);
      try {
        const r = await fetch('/api/terminal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command }) });
        const v = await r.json(); if (!r.ok) throw Error(v.error);
        setOutput(old => `${old}\n$ ${command}\n${v.stdout}${v.stderr}\n[exit ${v.code}${v.timedOut ? '; timed out' : ''}${v.truncated ? '; output limit' : ''}]`);
      } catch (e) { setOutput(old => `${old}\n${String(e)}`); } finally { setBusy(false); }
    }}><input aria-label="Shell command" value={command} onChange={e => setCommand(e.target.value)} className="flex-1 min-w-0 bg-[var(--bg-secondary)] p-2 border" /><button disabled={busy} className="px-4 border">{busy ? 'Running…' : 'Run command'}</button></form>
  </div>;
}
