import { useEffect, useRef, useState } from 'react';
import { useOS } from '@/hooks/useOSStore';
import { saveFile } from '@/lib/saveFile';

type BuiltApp = { id: string; name: string; description: string; tags: string[]; projectId: string; addressKey: string; address: { dimension: string; gate: number }; digest: string; previousId: string | null; createdAt: string; validation: string };
type AppSource = BuiltApp & { html: string; css: string; js: string };
type Launch = { app: BuiltApp; html: string; nonce: string };
type Project = { id: string; name: string };
const panel='h-full overflow-auto p-5 text-[var(--text-primary)] space-y-4';
const field='min-w-0 w-full p-3 rounded-lg border bg-[var(--bg-secondary)] border-[var(--border-subtle)]';
const button='px-4 py-2 border rounded-lg hover:bg-[var(--bg-hover)] disabled:opacity-50';
async function api<T>(path: string, method='GET', value?: unknown): Promise<T> {
  const response=await fetch(path,{method,headers:{'Content-Type':'application/json'},body:value===undefined?undefined:JSON.stringify(value)});
  const data=await response.json();if(!response.ok)throw Error(data.error||`Request failed (${response.status})`);return data;
}
const counter={name:'Pocket counter',description:'Count anything with a simple tap.',tags:'counter, counting, productivity',html:'<main><p>YOUR POCKET COUNTER</p><h1 id="count">0</h1><button id="add">＋ Count one</button><button id="reset">Reset</button></main>',css:'body{margin:0;background:#111322;color:#f5f1ff;font:18px system-ui;display:grid;place-items:center;min-height:100vh}main{text-align:center}p{font-size:12px;letter-spacing:2px;color:#bc9de7}h1{font-size:96px;margin:20px}button{border:0;border-radius:14px;background:#b49ae4;color:#191229;padding:16px 22px;margin:6px;font-size:17px}',js:'let count=0;const output=document.getElementById("count");document.getElementById("add").onclick=()=>{output.textContent=String(++count)};document.getElementById("reset").onclick=()=>{count=0;output.textContent="0"};'};
const game={name:'Catch the spark',description:'A small tap game: catch ten moving sparks.',tags:'game, play, tap, reaction',html:'<main><h1>Catch the spark</h1><p id="score">Tap the spark · 0 / 10</p><div id="arena"><button id="spark" aria-label="Catch spark">✦</button></div><button id="again">Play again</button></main>',css:'body{background:#101521;color:#eff5ff;font:17px system-ui;margin:0;padding:20px}main{max-width:600px;margin:auto;text-align:center}#arena{height:330px;border:1px solid #35425b;border-radius:24px;position:relative;margin:24px 0;background:radial-gradient(ellipse at center,#23324e,#131b2b)}#spark{position:absolute;top:40%;left:40%;width:56px;height:56px;background:#b9ebbf;color:#183d2b;font-size:32px;border:0;border-radius:50%}#again{padding:12px 22px;background:#b5c8f4;border:0;border-radius:12px;font-size:16px}',js:'let score=0;const spark=document.getElementById("spark"),label=document.getElementById("score");spark.onclick=()=>{score++;label.textContent=score>=10?"You caught every spark!":`Tap the spark · ${score} / 10`;if(score>=10){spark.hidden=true;return}spark.style.left=(Math.random()*75+2)+"%";spark.style.top=(Math.random()*73+2)+"%"};document.getElementById("again").onclick=()=>{score=0;spark.hidden=false;label.textContent="Tap the spark · 0 / 10"};'};

export function AppStudio() {
  const { state:os, dispatch }=useOS();
  const open=(appId:string)=>{const existing=os.windows.find(w=>w.appId===appId&&w.state!=='minimized');if(existing)dispatch({type:'FOCUS_WINDOW',windowId:existing.id});else dispatch({type:'OPEN_WINDOW',appId})};
  const [draft,setDraft]=useState({...counter}),[tab,setTab]=useState<'html'|'css'|'js'>('html');
  const [projects,setProjects]=useState<Project[]>([]),[projectId,setProjectId]=useState(''),[projectName,setProjectName]=useState('');
  const [previousId,setPreviousId]=useState<string|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{
    let alive=true;
    const load=async()=>{
      try {
        const p=await api<Project[]>('/api/projects');if(!alive)return;setProjects(p);
        const edit=sessionStorage.getItem('archeology-edit-app');
        if(edit){sessionStorage.removeItem('archeology-edit-app');const source=await api<AppSource>(`/api/apps/${edit}/source`);if(!alive)return;setDraft({...source,tags:source.tags.join(', ')});setPreviousId(source.id);setProjectId(source.projectId)}
        else setProjectId(current=>current||p[0]?.id||'');
      }catch(error){if(alive)setMessage(String(error))}
    };
    const receive=()=>{void load()};window.addEventListener('archeology-edit-app',receive);void load();
    return()=>{alive=false;window.removeEventListener('archeology-edit-app',receive)};
  },[]);
  return <div className={panel}><div className="flex items-center justify-between gap-3"><h1 className="text-xl font-semibold">App Studio</h1><button className={button} onClick={()=>open('applibrary')}>App library</button></div>
    <p>Build apps and games inside this Computer. HTML, CSS and JavaScript are packaged locally, assigned an existing system address, and mounted in the app library. Each build is a new revision.</p>
    <div className="flex flex-wrap gap-2"><button className={button} onClick={()=>{setDraft({...counter});setPreviousId(null)}}>Counter starter</button><button className={button} onClick={()=>{setDraft({...game});setPreviousId(null)}}>Game starter</button><label className={`${button} cursor-pointer`}>Import HTML<input type="file" accept=".html,text/html" className="hidden" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>200000){setMessage('Choose an HTML file under 200 KB.');return;}const text=await file.text();setDraft(d=>({...d,html:text}));setPreviousId(null);setMessage('Imported a copy. Original file unchanged.')}} /></label></div>
    <form className="flex gap-2" onSubmit={async e=>{e.preventDefault();try{const p=await api<Project>('/api/projects','POST',{name:projectName});setProjects(old=>[...old,p]);setProjectId(p.id);setProjectName('')}catch(error){setMessage(String(error))}}}><input className={field} aria-label="App project name" required placeholder="New project name" value={projectName} onChange={e=>setProjectName(e.target.value)}/><button className={button}>Create project</button></form>
    <label className="block">Project<select aria-label="App project" className={field} value={projectId} onChange={e=>setProjectId(e.target.value)}><option value="">Select a project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <form className="space-y-4" onSubmit={async e=>{e.preventDefault();setBusy(true);try{const app=await api<BuiltApp>('/api/apps/build','POST',{...draft,projectId,previousId});setPreviousId(app.id);window.dispatchEvent(new Event('archeology-app-built'));setMessage(`Built ${app.name}. Source retained, address assigned, app mounted. Open it in App library.`)}catch(error){setMessage(String(error))}finally{setBusy(false)}}}>
      <label className="block">App name<input className={field} value={draft.name} maxLength={100} required onChange={e=>setDraft(d=>({...d,name:e.target.value}))}/></label>
      <label className="block">What it does<input className={field} value={draft.description} maxLength={2000} onChange={e=>setDraft(d=>({...d,description:e.target.value}))}/></label>
      <label className="block">Capabilities / tags<input className={field} value={draft.tags} maxLength={500} placeholder="game, learning, calculator" onChange={e=>setDraft(d=>({...d,tags:e.target.value}))}/></label>
      <div role="tablist" aria-label="Source language" className="flex gap-2">{(['html','css','js'] as const).map(t=><button type="button" role="tab" aria-selected={tab===t} className={`${button} ${tab===t?'bg-[var(--bg-hover)]':''}`} key={t} onClick={()=>setTab(t)}>{t.toUpperCase()}</button>)}</div>
      <textarea aria-label={`${tab.toUpperCase()} source`} className={`${field} font-mono h-64`} spellCheck={false} value={draft[tab]} onChange={e=>setDraft(d=>({...d,[tab]:e.target.value}))}/>
      {previousId&&<p className="text-sm">Building a new revision. Earlier versions stay in your library.</p>}
      <button className={button} disabled={busy||!projectId}>{busy?'Building locally…':'Build & add to library'}</button>
    </form><p role="status" className="whitespace-pre-wrap">{message}</p><p className="text-sm opacity-70">Runs inside Android’s WebView. No separate server, shell, Android SDK or paid API. External packages, network access and native APK compilation are not part of this builder.</p>
  </div>;
}

export function AppLibrary() {
  const { state:os, dispatch }=useOS();
  const open=(appId:string)=>{const existing=os.windows.find(w=>w.appId===appId&&w.state!=='minimized');if(existing)dispatch({type:'FOCUS_WINDOW',windowId:existing.id});else dispatch({type:'OPEN_WINDOW',appId})};
  const [apps,setApps]=useState<BuiltApp[]>([]),[query,setQuery]=useState(''),[message,setMessage]=useState('');
  const [running,setRunning]=useState<Launch|null>(null),[selected,setSelected]=useState<string|null>(null);const frame=useRef<HTMLIFrameElement>(null);
  useEffect(()=>{const refresh=()=>{api<BuiltApp[]>('/api/apps').then(setApps).catch(e=>setMessage(String(e)))};refresh();window.addEventListener('archeology-app-built',refresh);return()=>window.removeEventListener('archeology-app-built',refresh)},[]);
  useEffect(()=>{
    if(!running)return;let complete=false;
    const timer=setTimeout(()=>{if(!complete)setMessage('App opened but has not reported startup. You can close it and inspect the source.');},12000);
    const receive=(event:MessageEvent)=>{if(event.source!==frame.current?.contentWindow||event.data?.channel!=='archeology-app-ready'||event.data?.nonce!==running.nonce||typeof event.data.ok!=='boolean'||complete)return;
      complete=true;clearTimeout(timer);setMessage(event.data.ok?`${running.app.name} is running.`:`App startup failed: ${String(event.data.error)}`);
      api(`/api/apps/${running.app.id}/receipt`,'POST',{nonce:running.nonce,ok:event.data.ok,error:event.data.error}).catch(e=>setMessage(String(e)));
    };
    window.addEventListener('message',receive);return()=>{clearTimeout(timer);window.removeEventListener('message',receive)};
  },[running]);
  const launch=async(app:BuiltApp)=>{try{setMessage('Recalling app by exact system address and verifying its hash…');setRunning(await api<Launch>(`/api/apps/${app.id}/launch`,'POST',{}))}catch(error){setMessage(String(error))}};
  return <div className={panel}><div className="flex items-center justify-between gap-3"><h1 className="text-xl font-semibold">App library</h1><button className={button} onClick={()=>open('appstudio')}>Build an app</button></div>
    <p>Apps built inside the Computer, retained with their source, address and mount. Pick one yourself or ask the system to match your request to an app’s capabilities.</p>
    <form className="flex gap-2" onSubmit={async e=>{e.preventDefault();try{const result=await api<{selected:BuiltApp|null;reason:string}>('/api/apps/select','POST',{request:query});setSelected(result.selected?.id??null);setMessage(result.reason);if(result.selected)await launch(result.selected)}catch(error){setMessage(String(error))}}}><input aria-label="App request" className={field} placeholder="What would you like to do?" value={query} onChange={e=>setQuery(e.target.value)}/><button className={button}>Pick & run</button></form>
    {running&&<section className="border rounded-xl overflow-hidden"><div className="flex justify-between items-center p-3"><strong>{running.app.name}</strong><button className={button} onClick={()=>setRunning(null)}>Close app</button></div><iframe key={running.nonce} ref={frame} title={`Running ${running.app.name}`} sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={running.html} className="w-full h-[60vh] bg-white" onLoad={()=>frame.current?.contentWindow?.postMessage({channel:'archeology-launch',nonce:running.nonce},'*')}/></section>}
    {!apps.length&&<div className="border rounded-xl p-6 space-y-3"><h2>No apps built yet.</h2><p>Open App Studio, choose the counter or game starter, and build your first app.</p></div>}
    {apps.slice().reverse().map(app=><article key={app.id} className={`border rounded-xl p-4 space-y-3 ${selected===app.id?'ring-2 ring-[var(--accent)]':''}`}><h2 className="font-semibold">{app.name}</h2><p>{app.description}</p><p className="text-sm opacity-70">{app.tags.join(' · ')} · JavaScript syntax checked</p><p className="text-xs break-all">System address: {app.addressKey}</p><p className="text-xs">{app.address.dimension} · Gate {app.address.gate} · {app.previousId?'Revision':'Original build'}</p><div className="flex flex-wrap gap-2"><button className={button} onClick={()=>launch(app)}>Run app</button><button className={button} onClick={()=>{sessionStorage.setItem('archeology-edit-app',app.id);open('appstudio');window.dispatchEvent(new Event('archeology-edit-app'))}}>Create revision</button><button className={button} onClick={async()=>{try{const result=await api<AppSource>(`/api/apps/${app.id}/source`);await saveFile(`${app.name}-source.json`,new Blob([JSON.stringify({html:result.html,css:result.css,js:result.js},null,2)],{type:'application/json'}))}catch(error){setMessage(String(error))}}}>Export source</button></div></article>)}
    <p role="status" className="whitespace-pre-wrap">{message}</p>
  </div>;
}
