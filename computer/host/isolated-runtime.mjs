import { runTerminal } from './local-terminal.mjs';
const quote = value => "'" + value.replaceAll("'", "'\\''") + "'";
export function isolatedRuntime(directory) {
  return {
    id: 'local-linux-isolated', kinds: ['*'],
    async execute({ artifact, kind }) {
      const content = artifact.content ?? '';
      if (kind === 'json') {
        try { return { ok: true, engine: 'json-native', returnValue: JSON.parse(content) }; }
        catch (e) { return { ok: false, error: e.message }; }
      }
      if (kind === 'data') return { ok: true, engine: 'text-data', returnValue: content };
      if (!['javascript', 'python', 'sh', 'shell'].includes(kind)) return { ok: false, error: `No isolated runtime registered for ${kind}.`, engine: 'runtime-unavailable' };
      let command;
      if (kind === 'javascript') {
        const script = `const fn=Object.getPrototypeOf(async function(){}).constructor; const value=await new fn(Buffer.from('${Buffer.from(content).toString('base64')}','base64').toString())(); if(value!==undefined)console.log(value);`;
        command = `/runtime/node --input-type=module -e ${quote(script)}`;
      } else if (kind === 'python') command = `python3 -c ${quote(content)}`;
      else command = `/bin/sh -c ${quote(content)}`;
      try {
        const r = await runTerminal(directory, command, { nodeBinary: kind === 'javascript' ? process.execPath : null });
        return { ...r, ok: r.code === 0 && !r.timedOut && !r.truncated, engine: `bubblewrap-${kind}`, stdout: r.stdout.trimEnd().split('\n'), stderr: r.stderr ? [r.stderr] : [] };
      } catch (error) { return { ok: false, engine: 'isolation-unavailable', error: error.message }; }
    },
  };
}
