import { spawn } from 'node:child_process';
import { mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Linux namespaces expose only system binaries and a dedicated persistent /work.
// No host-root bind, credentials, network or silent host-shell fallback.
export async function runTerminal(directory, command, { nodeBinary = null } = {}) {
  if (typeof command !== 'string' || !command.trim() || command.length > 12000) throw new TypeError('A command of at most 12,000 characters is required.');
  if (process.platform !== 'linux') throw new Error('Isolated terminal requires Linux and bubblewrap.');
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const args = ['--unshare-all', '--die-with-parent', '--new-session', '--clearenv'];
  for (const path of ['/usr', '/bin', '/lib', '/lib64']) {
    try { await access(path); args.push('--ro-bind', path, path); } catch {}
  }
  if (nodeBinary) args.push('--dir', '/runtime', '--ro-bind', nodeBinary, '/runtime/node');
  const klein = fileURLToPath(new URL('../donors/recovered/lcm-klein/', import.meta.url));
  await access(klein);
  args.push('--dir', '/resources', '--ro-bind', klein, '/resources/klein');
  args.push('--proc', '/proc', '--dev', '/dev', '--tmpfs', '/tmp', '--dir', '/etc',
    '--bind', directory, '/work', '--chdir', '/work', '--setenv', 'HOME', '/work',
    '--setenv', 'PATH', '/usr/bin:/bin', '--', '/bin/sh', '-c', command);
  return await new Promise((resolve, reject) => {
    const child = spawn('bwrap', args, { env: { PATH: process.env.PATH }, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '', total = 0, timedOut = false, truncated = false;
    const kill = () => { try { process.kill(-child.pid, 'SIGKILL'); } catch {} };
    const timer = setTimeout(() => { timedOut = true; kill(); }, 10000);
    const capture = stream => chunk => {
      total += chunk.length;
      if (total > 262144) { truncated = true; kill(); return; }
      if (stream === 'stdout') stdout += chunk.toString(); else stderr += chunk.toString();
    };
    child.stdout.on('data', capture('stdout')); child.stderr.on('data', capture('stderr'));
    child.once('error', error => { clearTimeout(timer); reject(new Error(`Isolated terminal unavailable: ${error.message}`)); });
    child.once('close', (code, signal) => { clearTimeout(timer); kill(); resolve({ command, stdout, stderr, code, signal, timedOut, truncated, isolation: 'bubblewrap namespaces; no network; persistent /work', cwd: '/work' }); });
  });
}
