import { useEffect, useState } from 'react';
import { useOS } from '@/hooks/useOSStore';
import { saveFile } from '@/lib/saveFile';

type Row = Record<string, string>;
type Project = { id: string; name: string };
type Build = { id: string; name: string; verified: boolean; actual: string; expected: string; path: string; addressKey: string; artifactId: string | null; digest: string };
async function api<T>(path: string, method = 'GET', value?: unknown): Promise<T> {
  const r = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: value === undefined ? undefined : JSON.stringify(value) });
  const v = await r.json(); if (!r.ok) throw Error(v.error || `Request failed (${r.status})`); return v;
}
const field = 'w-full p-2 rounded border bg-[var(--bg-secondary)] border-[var(--border-subtle)]';
const button = 'px-3 py-2 border rounded hover:bg-[var(--bg-hover)] disabled:opacity-50';
const panel = 'h-full overflow-auto p-5 text-[var(--text-primary)] space-y-4';

export function YouNIV() {
  const { dispatch } = useOS();
  const [profile, setProfile] = useState<Row>({}), [message, setMessage] = useState('');
  useEffect(() => { api<Row>('/api/profile').then(setProfile).catch(e => setMessage(String(e))); }, []);
  const labels: Row = { goals: 'Goals and plans', interests: 'Interests', skills: 'Skills', needs: 'Needs and desired experiences', learning: 'Learning preferences', challenges: 'Challenges', birthDate: 'Birth date (optional)', birthTime: 'Birth time and time zone (optional)', birthLocation: 'Birth location (optional)' };
  return <div className={panel}><h1 className="text-xl">You-N-I-Verse</h1><p>Your personal starting point. You can correct these notes at any time. Birth information stays local; verified birth-derived addressing is still pending.</p>
    <nav className="flex gap-2 flex-wrap">{[['sciencelab', 'Science Lab'], ['foundry', 'Foundry'], ['social', 'Social Network'], ['grove', 'The Grove']].map(([id, name]) => <button className={button} key={id} onClick={() => dispatch({ type: 'OPEN_WINDOW', appId: id })}>{name}</button>)}</nav>
    <form className="space-y-3" onSubmit={async e => { e.preventDefault(); try { setProfile(await api<Row>('/api/profile', 'PUT', profile)); setMessage('Personal notes saved locally.'); } catch(e) { setMessage(String(e)); } }}>
      {Object.entries(labels).map(([key, label]) => <label className="block" key={key}>{label}<input className={field} value={profile[key] ?? ''} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} /></label>)}
      <button className={button}>Save personal notes</button></form><p role="status">{message}</p>
  </div>;
}

export function SocialNetwork() {
  const [rows, setRows] = useState<Row[]>([]), [draft, setDraft] = useState<Row>({ name: '', relationship: '', sharedGoals: '' }), [message, setMessage] = useState('');
  useEffect(() => { api<Row[]>('/api/contacts').then(setRows).catch(e => setMessage(String(e))); }, []);
  return <div className={panel}><h1 className="text-xl">Social Network</h1><p>Private local relationships and shared-goal notes. Cross-device connections, messaging and public sharing are not connected in this release.</p>
    <form className="space-y-3" onSubmit={async e => { e.preventDefault(); try { const row = await api<Row>('/api/contacts', 'POST', draft); setRows(r => [...r, row]); setMessage('Private relationship saved.'); } catch(e) { setMessage(String(e)); } }}>
      {Object.entries({ name: 'Person or group', relationship: 'Relationship and interests', sharedGoals: 'Shared goals' }).map(([k, label]) => <label className="block" key={k}>{label}<input required={k === 'name'} className={field} value={draft[k]} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))} /></label>)}
      <button className={button}>Save private relationship</button></form>
    {rows.map(r => <article key={r.id} className="border rounded p-3"><strong>{r.name}</strong><p>{r.relationship}</p><p>{r.sharedGoals}</p><small>Private · local</small></article>)}<p role="status">{message}</p>
  </div>;
}

const emptyResearch: Row = { kind: 'hypothesis', question: '', source: '', reference: '', finding: '', uncertainty: '', implementations: '', dependencies: '', verification: '', conflicts: '', previous: '' };
export function ScienceLab() {
  const [rows, setRows] = useState<Row[]>([]), [draft, setDraft] = useState<Row>({ ...emptyResearch }), [query, setQuery] = useState(''), [message, setMessage] = useState('');
  const refresh = () => api<Row[]>('/api/research').then(setRows);
  useEffect(() => { refresh().catch(e => setMessage(String(e))); }, []);
  return <div className={panel}><h1 className="text-xl">Science Lab</h1><p>Questions, source rules, hypotheses, evidence and revisions. Records are retained in the Computer; a new revision links to its predecessor. Verification text records evidence supplied by you, not an automatic certification.</p>
    <input className={field} aria-label="Search research" placeholder="Search retained findings" value={query} onChange={e => setQuery(e.target.value)} />
    <form className="space-y-3" onSubmit={async e => { e.preventDefault(); try { await api('/api/research', 'POST', draft); await refresh(); setDraft({ ...emptyResearch }); setMessage('Finding retained.'); } catch(e) { setMessage(String(e)); } }}>
      <label className="block">Evidence kind<select className={field} value={draft.kind} onChange={e => setDraft(d => ({ ...d, kind: e.target.value }))}>{['source-statement', 'derivation', 'implementation-choice', 'hypothesis', 'observation'].map(k => <option key={k}>{k}</option>)}</select></label>
      {Object.entries({ question: 'Research question', source: 'Original source URL or path', reference: 'Document page or section', finding: 'Rule, finding or interpretation', uncertainty: 'Uncertainty', implementations: 'Related implementations', dependencies: 'Dependencies', verification: 'Test results and evidence', conflicts: 'Conflicting evidence' }).map(([k, label]) => <label className="block" key={k}>{label}<textarea className={field} required={k === 'question' || k === 'finding'} value={draft[k]} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))} /></label>)}
      {draft.previous && <p>Revision of {draft.previous}</p>}<button className={button}>Retain finding</button></form>
    {rows.filter(r => JSON.stringify(r).toLowerCase().includes(query.toLowerCase())).slice().reverse().map(r => <article className="border rounded p-3 space-y-2" key={r.id}><strong>{r.question}</strong><p>{r.kind} · {r.at}</p><p className="whitespace-pre-wrap">{r.finding}</p><p>{r.source} · {r.reference}</p><p>Uncertainty: {r.uncertainty || 'Not specified'}</p><p>Verification: {r.verification || 'Not supplied'}</p><p>Conflicts: {r.conflicts || 'Not recorded'}</p><button className={button} onClick={() => { setDraft({ ...emptyResearch, ...r, previous: r.id }); setMessage('Editing a new revision. Earlier finding is preserved.'); }}>Create revision</button></article>)}<p role="status">{message}</p>
  </div>;
}

export function Foundry() {
  const [projects, setProjects] = useState<Project[]>([]), [projectId, setProjectId] = useState(''), [projectName, setProjectName] = useState('');
  const [name, setName] = useState('capability.js'), [content, setContent] = useState('console.log(6 * 7);'), [expected, setExpected] = useState('42');
  const [builds, setBuilds] = useState<Build[]>([]), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { Promise.all([api<Project[]>('/api/projects'), api<Build[]>('/api/builds')]).then(([p, b]) => { setProjects(p); setProjectId(p[0]?.id ?? ''); setBuilds(b); }).catch(e => setMessage(String(e))); }, []);
  return <div className={panel}><h1 className="text-xl">Foundry</h1><p>Construct source in a persistent project, execute it in the isolated runtime, compare exact output, and register successful results in The Grove. Each build preserves its own source revision and receipt.</p>
    <form className="flex gap-2" onSubmit={async e => { e.preventDefault(); try { const p = await api<Project>('/api/projects', 'POST', { name: projectName }); setProjects(old => [...old, p]); setProjectId(p.id); } catch(e) { setMessage(String(e)); } }}><input className={field} aria-label="New project name" placeholder="New project name" required value={projectName} onChange={e => setProjectName(e.target.value)} /><button className={button}>Create project</button></form>
    <label className="block">Project<select className={field} value={projectId} onChange={e => setProjectId(e.target.value)}><option value="">Select a project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <form className="space-y-3" onSubmit={async e => { e.preventDefault(); setBusy(true); try { const b = await api<Build>('/api/foundry-build', 'POST', { projectId, name, content, expected }); setBuilds(old => [...old, b]); setMessage(b.verified ? 'Executed, output verified, registered and retained in The Grove.' : `Verification failed. Actual output: ${b.actual}. Source and failure receipt retained.`); } catch(e) { setMessage(String(e)); } finally { setBusy(false); } }}>
      <label className="block">Source filename<input className={field} value={name} onChange={e => setName(e.target.value)} /></label>
      <label className="block">Source code<textarea aria-label="Foundry source code" className={`${field} font-mono h-40`} value={content} onChange={e => setContent(e.target.value)} /></label>
      <label className="block">Expected exact output<textarea className={field} value={expected} onChange={e => setExpected(e.target.value)} /></label>
      <button className={button} disabled={busy || !projectId}>{busy ? 'Executing…' : 'Execute, test & retain'}</button></form><p role="status">{message}</p>
    {builds.slice().reverse().map(b => <article key={b.id} className="border p-3 rounded"><strong>{b.name}</strong><p>{b.verified ? 'Output verified' : 'Failed verification'} · {b.id}</p><pre>{b.actual}</pre><small className="break-all">{b.digest}</small></article>)}
  </div>;
}

export function Grove() {
  const [builds, setBuilds] = useState<Build[]>([]), [query, setQuery] = useState(''), [message, setMessage] = useState('');
  useEffect(() => { api<Build[]>('/api/builds').then(setBuilds).catch(e => setMessage(String(e))); }, []);
  return <div className={panel}><h1 className="text-xl">The Grove</h1><p>The recovered Grove Store is an app, tool and template library. This local collection contains actual Foundry artifacts with successful output checks. Community distribution is pending integration.</p><input aria-label="Search Grove" className={field} placeholder="Search retained capabilities" value={query} onChange={e => setQuery(e.target.value)} />
    {builds.filter(b => b.verified && b.name.toLowerCase().includes(query.toLowerCase())).map(b => <article className="border rounded p-4 space-y-2" key={b.id}><strong>{b.name}</strong><p>Verified output: {b.expected}</p><p className="text-xs break-all">Source SHA-256: {b.digest}</p>
      <button className={button} onClick={async () => { try { const receipt = await api<{ ok: boolean; result: { result?: { stdout?: string[] } } }>('/api/execute', 'POST', { addressKey: b.addressKey, path: b.path }); setMessage(receipt.ok ? `Executed ${b.name}: ${(receipt.result.result?.stdout ?? []).join('\n')}` : 'Execution failed; inspect the retained receipt.'); } catch(e) { setMessage(String(e)); } }}>Run retained capability</button>
      <button className={`${button} ml-2`} onClick={async () => { try { const source = await api<{ content: string }>(`/api/activate-file?address=${encodeURIComponent(b.addressKey)}&path=${encodeURIComponent(b.path)}`); await saveFile(b.name, new Blob([source.content], { type: 'text/plain' })); } catch(e) { setMessage(String(e)); } }}>Export source</button>
    </article>)}{!builds.some(b => b.verified) && <p>No verified Foundry capabilities yet. Build one in Foundry.</p>}<p role="status">{message}</p>
  </div>;
}
