#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, cp, rename, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, createHash } from 'node:crypto';

const root = fileURLToPath(new URL('..', import.meta.url));
const data = resolve(process.env.SYNTHIA_DATA_DIR ?? join(root, '.synthia'));
const control = join(data, 'control.json');
const action = process.argv[2] ?? 'start';
const hash = text => createHash('sha256').update(text).digest('hex');
const info = async () => JSON.parse(await readFile(control, 'utf8'));
async function request(path, method = 'GET') {
  const c = await info();
  const r = await fetch(`http://127.0.0.1:${c.port}${path}`, { method, headers: { Cookie: `synthia_session=${c.token}` } });
  if (!r.ok) throw new Error(`Computer returned ${r.status}`);
  return await r.json();
}
async function running() { try { return (await request('/api/status')).ready; } catch { return false; } }
try {
  await mkdir(data, { recursive: true, mode: 0o700 });
  if (action === 'start') {
    if (await running()) { console.log('Synthia is already running.'); process.exit(0); }
    const port = Number(process.env.SYNTHIA_PORT ?? 8765), token = randomBytes(32).toString('hex');
    await stat(join(root, 'computer/shell/kimi-linux/dist/index.html')).catch(() => { throw new Error('Build the recovered desktop first: npm run build:desktop'); });
    const child = spawn(process.execPath, [join(root, 'computer/host/server.mjs')], {
      cwd: root, stdio: 'inherit', env: { ...process.env, SYNTHIA_DATA_DIR: data, SYNTHIA_PORT: String(port), SYNTHIA_API_TOKEN: token, SYNTHIA_DESKTOP_SESSION: '1', SYNTHIA_ALLOW_INSECURE_DEV: '0' },
    });
    await writeFile(control, JSON.stringify({ port, token, pid: child.pid }), { mode: 0o600 });
    console.log(`Open http://127.0.0.1:${port}\nLocal sign-in code: ${token}\nKeep this terminal open. Stop with Ctrl+C or npm run stop:local.`);
    const stop = () => child.kill('SIGTERM');
    process.on('SIGINT', stop); process.on('SIGTERM', stop);
    child.once('exit', code => { process.exitCode = code ?? 0; });
  } else if (action === 'stop') {
    console.log(await request('/api/shutdown', 'POST'));
  } else if (action === 'status') {
    console.log(JSON.stringify(await request('/api/status'), null, 2));
  } else if (action === 'backup') {
    const target = resolve(process.argv[3] ?? join(root, `synthia-backup-${Date.now()}.json`));
    let payload;
    if (await running()) payload = await request('/api/backup');
    else {
      const state = await readFile(join(data, 'state.json'), 'utf8');
      const events = await readFile(join(data, 'events.jsonl'), 'utf8').catch(error => { if (error.code === 'ENOENT') return ''; throw error; });
      payload = { schema: 'synthia-local-backup-v1', createdAt: new Date().toISOString(), state, sha256: hash(state), events, eventsSha256: hash(events) };
    }
    await writeFile(target, JSON.stringify(payload), { flag: 'wx', mode: 0o600 });
    // Terminal work files are independent of the virtual filesystem checkpoint.
    if (await stat(join(data, 'terminal')).catch(() => null)) await cp(join(data, 'terminal'), `${target}.terminal`, { recursive: true, errorOnExist: true, force: false });
    console.log(`Backup saved: ${target}`);
  } else if (action === 'restore') {
    if (await running()) throw new Error('Stop Synthia before restoring.');
    if (!process.argv[3]) throw new Error('Specify the backup JSON path.');
    const source = resolve(process.argv[3]), backup = JSON.parse(await readFile(source, 'utf8'));
    if (backup.schema !== 'synthia-local-backup-v1' || hash(backup.state) !== backup.sha256) throw new Error('Invalid backup or checksum mismatch.');
    if (backup.events !== undefined && (typeof backup.events !== 'string' || hash(backup.events) !== backup.eventsSha256)) throw new Error('Event log checksum mismatch.');
    const parsed = JSON.parse(backup.state);
    if (!parsed['synthai-computer'] || typeof parsed['synthai-computer'] !== 'object' || Array.isArray(parsed['synthai-computer'])) throw new Error('Backup lacks Computer state.');
    const previous = `${data}.before-restore-${Date.now()}`;
    await cp(data, previous, { recursive: true, errorOnExist: true, force: false });
    await writeFile(join(data, 'state.restore.tmp'), backup.state, { mode: 0o600 });
    await rename(join(data, 'state.restore.tmp'), join(data, 'state.json'));
    if (backup.events !== undefined) {
      await writeFile(join(data, 'events.restore.tmp'), backup.events, { mode: 0o600 });
      await rename(join(data, 'events.restore.tmp'), join(data, 'events.jsonl'));
    }
    if (await stat(`${source}.terminal`).catch(() => null)) {
      if (await stat(join(data, 'terminal')).catch(() => null)) await rename(join(data, 'terminal'), join(data, `terminal.before-restore-${Date.now()}`));
      await cp(`${source}.terminal`, join(data, 'terminal'), { recursive: true });
    }
    console.log(`Restored. Previous complete data retained at ${previous}`);
  } else throw new Error('Use start, stop, status, backup [path], or restore <path>.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
