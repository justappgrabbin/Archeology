import { randomUUID } from 'node:crypto';

/** Android keeps the Computer service native and executes browser JS in an opaque,
 * network-denied iframe Worker. Never evaluate imported source in the Node host. */
export class WebViewRuntime {
  constructor() { this.tasks = new Map(); }
  adapter() {
    return { id: 'android-webview-worker', kinds: ['*'], execute: async ({ artifact, kind }) => {
      if (kind === 'json') {
        try { return { ok: true, engine: 'json-native', returnValue: JSON.parse(artifact.content) }; }
        catch (error) { return { ok: false, engine: 'json-native', error: error.message }; }
      }
      if (kind === 'data') return { ok: true, engine: 'text-data', returnValue: artifact.content };
      if (kind !== 'javascript') return { ok: false, engine: 'runtime-unavailable', error: `The APK has no installed ${kind} runtime. The original source is retained; no translation or simulated execution was substituted.` };
      if (this.tasks.size >= 4) return { ok: false, error: 'Execution queue is full.' };
      const id = randomUUID();
      return await new Promise(resolve => {
        const timer = setTimeout(() => { this.tasks.delete(id); resolve({ ok: false, engine: 'android-webview-worker', error: 'Phone execution timed out or the interface was closed.' }); }, 15000);
        this.tasks.set(id, { id, content: artifact.content, delivered: false, finish: result => { clearTimeout(timer); this.tasks.delete(id); resolve(result); } });
      });
    } };
  }
  poll() {
    const task = [...this.tasks.values()].find(t => !t.delivered);
    if (!task) return null;
    task.delivered = true;
    return { id: task.id, content: task.content };
  }
  complete({ id, result }) {
    const task = this.tasks.get(id);
    if (!task || !result || typeof result.ok !== 'boolean') throw new TypeError('Unknown execution task or invalid result.');
    if (JSON.stringify(result).length > 270000) throw new RangeError('Execution result is too large.');
    const stdout = Array.isArray(result.stdout) ? result.stdout.filter(s => typeof s === 'string').slice(0, 2000) : [];
    task.finish({ ok: result.ok, engine: 'android-webview-worker', stdout, error: typeof result.error === 'string' ? result.error : undefined, returnValue: result.returnValue, isolation: 'opaque iframe + dedicated Worker; network denied by CSP; 10-second limit' });
    return { accepted: true };
  }
}
