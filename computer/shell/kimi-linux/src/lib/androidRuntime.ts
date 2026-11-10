// Execute imported JS outside the privileged native Computer service.
export function startAndroidExecutor(): () => void {
  let stopped = false, running = false;
  const execute = async (task: { id: string; content: string }) => {
    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts'); frame.style.display = 'none';
    const nonce = crypto.randomUUID();
    const result = await new Promise<unknown>(resolve => {
      const finish = (value: unknown) => { clearTimeout(timer); window.removeEventListener('message', receive); frame.remove(); resolve(value); };
      const receive = (event: MessageEvent) => { if (event.source === frame.contentWindow && event.data?.nonce === nonce) finish(event.data.result); };
      const timer = setTimeout(() => finish({ ok: false, error: 'Execution exceeded 10 seconds.', stdout: [] }), 10000);
      window.addEventListener('message', receive);
      frame.srcdoc = `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; worker-src blob:; connect-src 'none'"><script>
        onmessage = e => {
          const {source, nonce} = e.data;
          const workerSource = 'self.onmessage=async e=>{const nonce=e.data.nonce;const lines=[];let size=0;const push=(...args)=>{const line=args.map(x=>typeof x===\"string\"?x:JSON.stringify(x)).join(\" \");size+=line.length;if(size>250000)throw Error(\"Output limit exceeded\");lines.push(line)};try{const Fn=Object.getPrototypeOf(async function(){}).constructor;const value=await new Fn(\"console\",e.data.source)({log:push,info:push,warn:push,error:push});self.postMessage({nonce,result:{ok:true,stdout:lines,returnValue:value}})}catch(error){self.postMessage({nonce,result:{ok:false,stdout:lines,error:String(error.message||error)}})}}';
          const url = URL.createObjectURL(new Blob([workerSource], {type:'text/javascript'}));
          const worker = new Worker(url); URL.revokeObjectURL(url);
          worker.onmessage = event => { if(event.data.nonce === nonce) { parent.postMessage(event.data, '*'); worker.terminate(); } };
          worker.onerror = event => { parent.postMessage({nonce,result:{ok:false,stdout:[],error:event.message||'Worker failed'}}, '*'); worker.terminate(); };
          worker.postMessage({source,nonce});
        };
      <\/script>`;
      frame.onload = () => frame.contentWindow?.postMessage({ source: task.content, nonce }, '*');
      document.body.appendChild(frame);
    });
    await fetch('/api/runtime-result', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: task.id, result }) });
  };
  const poll = async () => {
    if (stopped || running) return;
    running = true;
    try { const r = await fetch('/api/runtime-tasks'); if (r.ok) { const task = await r.json(); if (task) await execute(task); } }
    catch { /* A host lifecycle interruption is retried; pending tasks time out. */ }
    finally { running = false; }
  };
  const timer = window.setInterval(poll, 250); poll();
  return () => { stopped = true; clearInterval(timer); };
}
