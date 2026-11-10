import { randomUUID, createHash } from 'node:crypto';
import { Script } from 'node:vm';

const string = (value, limit, name) => {
  if (typeof value !== 'string' || value.length > limit) throw new TypeError(`${name} must be text up to ${limit} characters.`);
  return value;
};
const escaped = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const POLICY = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; connect-src 'none'; frame-src 'none'; worker-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'";

/** Browser apps use the resident Android WebView, not a second Computer or shell.
 * Compilation is deterministic packaging plus JS syntax validation; it never executes source in Node.
 * Addressing, exact recall, intake, mounting, state and events are existing Computer services.
 */
export class AppLibrary {
  constructor(computer, files) { Object.assign(this, { computer, files }); this.pending = Promise.resolve(); this.launches = new Map(); }
  mutate(fn) { const result=this.pending.then(fn);this.pending=result.catch(()=>{});return result; }
  list() { return this.computer.state.get('computer.local.apps', []); }
  get(id) { const app=this.list().find(a=>a.id===id);if(!app)throw new TypeError('App not found.');return app; }
  build(input) { return this.mutate(async()=>{
    const name=string(input.name,100,'App name').trim();if(!name)throw new TypeError('App name is required.');
    const html=string(input.html??'',200000,'HTML'),css=string(input.css??'',100000,'CSS'),js=string(input.js??'',200000,'JavaScript');
    if(!html.trim())throw new TypeError('Provide app HTML.');
    const description=string(input.description??'',2000,'Description').trim();
    const tags=string(input.tags??'',500,'Tags').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean).slice(0,20);
    const project=this.computer.projects.get(input.projectId);if(!project)throw new TypeError('Select a project first.');
    if(input.previousId)this.get(input.previousId);
    // Parse without evaluating. Top-level module imports are intentionally unsupported in this offline builder.
    new Script(js,{filename:`${name}.js`});
    const id=randomUUID();
    const source=JSON.stringify({html,css,js},null,2);
    const code=`window.addEventListener('message',function(event){if(event.source!==parent||event.data?.channel!=='archeology-launch')return;const nonce=event.data.nonce;try{\n${js}\n;parent.postMessage({channel:'archeology-app-ready',nonce,ok:true},'*');}catch(error){parent.postMessage({channel:'archeology-app-ready',nonce,ok:false,error:String(error.message||error)},'*');}},{once:true});`;
    // Protect script/style boundaries even if source contains closing tags. HTML runs only inside the sandbox.
    const document=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${POLICY}"><title>${escaped(name)}</title><style>${css.replace(/<\/style/gi,'<\\/style')}</style></head><body>${html}<script>${code.replace(/<\/script/gi,'<\\/script')}</script></body></html>`;
    const base=`/home/user/Apps/${id}`;
    const savedSource=await this.files.write(`${base}/source.json`,source,'app-studio-source');
    const compiled=await this.files.write(`${base}/index.html`,document,'app-studio-build');
    await this.files.mirrorImported([savedSource,compiled]);
    await this.computer.projects.writeFile(project.id,`apps/${id}/source.json`,source,{type:'application/json'});
    await this.computer.projects.writeFile(project.id,`apps/${id}/index.html`,document,{type:'text/html'});
    const artifact=await this.computer.intake.ingest({name:`${name}.html`,text:document,type:'text/html',source:`app-studio:${project.id}`,tags:['browser-app',...tags]});
    const contract=await this.computer.mountApplication(`built-app-${id}`,{artifactId:artifact.id});
    const record={id,name,description,tags,projectId:project.id,previousId:input.previousId??null,createdAt:new Date().toISOString(),
      kind:'browser-app',runtime:'android-webview-sandbox',validation:'javascript-syntax-checked',
      path:compiled.path,addressKey:compiled.meta.addressKey,address:compiled.meta.address,addressBasis:compiled.meta.addressBasis,
      digest:compiled.meta.digest,sourcePath:savedSource.path,sourceAddressKey:savedSource.meta.addressKey,artifactId:artifact.id,mountId:contract.mountId};
    await this.computer.state.set('computer.local.apps',[...this.list(),record],{source:'addressed-app-library'});
    await contract.services.setState('build',{id,digest:record.digest,addressKey:record.addressKey});
    return record;
  }); }
  async source(id) { const app=this.get(id);const record=await this.files.activate(app.sourceAddressKey,app.sourcePath);return {...app,...JSON.parse(record.content)}; }
  async launch(id) {
    const app=this.get(id),record=await this.files.activate(app.addressKey,app.path);
    if(record.meta.digest!==app.digest||createHash('sha256').update(record.content).digest('hex')!==app.digest)throw new Error('Compiled app digest changed; launch refused.');
    for(const [key,lease] of this.launches)if(lease.expires<Date.now())this.launches.delete(key);
    if(this.launches.size>=20)throw new Error('Too many unacknowledged launches. Close an app or wait a minute.');
    const nonce=randomUUID();this.launches.set(nonce,{id,expires:Date.now()+60000});
    return {app,html:record.content,nonce,sandbox:'allow-scripts',network:'denied',activation:record.activation};
  }
  receipt(id,input) { return this.mutate(async()=>{
    const app=this.get(id),lease=this.launches.get(input.nonce);
    if(!lease||lease.id!==id||lease.expires<Date.now())throw new TypeError('Unknown or expired launch.');
    if(typeof input.ok!=='boolean')throw new TypeError('Launch outcome is required.');
    this.launches.delete(input.nonce);
    const receipt={id:randomUUID(),appId:id,at:new Date().toISOString(),ok:input.ok,error:typeof input.error==='string'?input.error.slice(0,1000):null,
      evidence:'browser sandbox reported synchronous startup; not a full functional certification',addressKey:app.addressKey,digest:app.digest};
    const prior=this.computer.state.get('computer.local.appRuns',[]);
    await this.computer.state.set('computer.local.appRuns',[...prior,receipt],{source:'browser-app-launch'});
    return receipt;
  }); }
  async select(input={}) {
    const profile=this.computer.state.get('computer.local.profile',{});
    const request=string(input.request??'',2000,'Request');
    const terms=[...new Set(`${request} ${profile.goals??''} ${profile.needs??''} ${profile.interests??''}`.toLowerCase().match(/[a-z0-9]{3,}/g)??[])];
    const stop=new Set(['the','and','for','with','want','need','app','apps','that','this','can','please']);
    const words=terms.filter(t=>!stop.has(t));
    let userAddress=null;
    if(profile.birthDate&&profile.birthTime) {
      try { userAddress=(await this.computer.resolveAddress({birthDate:profile.birthDate,birthTime:profile.birthTime})).address; }
      catch { /* Unknown address stays unknown; semantic selection still works. */ }
    }
    const candidates=[];
    for(const app of this.list()) {
      const haystack=`${app.name} ${app.description} ${app.tags.join(' ')}`.toLowerCase();
      const matched=words.filter(t=>haystack.includes(t));
      if(!matched.length)continue;
      const comparison=userAddress?await this.computer.compareAddresses(userAddress,app.address):null;
      candidates.push({app,matched,score:matched.length,comparison});
    }
    candidates.sort((a,b)=>b.score-a.score||(b.comparison?.shared_fields.length??0)-(a.comparison?.shared_fields.length??0)||b.app.createdAt.localeCompare(a.app.createdAt));
    const selected=candidates[0]??null;
    return {selected:selected?.app??null,reason:selected?`Matched ${selected.matched.join(', ')} in the app's description, name or tags.`:'No matching app. Build one or describe what you need.',
      addressComparison:selected?.comparison??null,addressBasis:'Apps use existing computational file-admission addresses. Address comparison is structural, not a claim of personal suitability.',
      candidates:candidates.map(c=>({id:c.app.id,score:c.score,matched:c.matched}))};
  }
}
