import { createHash } from 'node:crypto';
import { readText } from './read-text.mjs';
import { readFile, writeFile, mkdir, copyFile, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
const hash = s => createHash('sha256').update(s).digest('hex');
export function validateBackup(backup) {
  if (backup?.schema !== 'synthia-local-backup-v1' || typeof backup.state !== 'string' || hash(backup.state) !== backup.sha256) throw new TypeError('Backup state checksum mismatch.');
  const state = JSON.parse(backup.state);
  if (!state['synthai-computer'] || typeof state['synthai-computer'] !== 'object' || Array.isArray(state['synthai-computer'])) throw new TypeError('Backup has no Computer state.');
  if (backup.events !== undefined && (typeof backup.events !== 'string' || hash(backup.events) !== backup.eventsSha256)) throw new TypeError('Backup event checksum mismatch.');
  return backup;
}
export async function applyPendingRestore(dataDir) {
  let backup;
  try { backup = validateBackup(JSON.parse(await readText(join(dataDir, 'pending-restore.json')))); }
  catch(error) { if (error.code === 'ENOENT') return; throw error; }
  const previous = join(dataDir, `before-restore-${Date.now()}`);
  await mkdir(previous, { recursive: true });
  for (const name of ['state.json', 'events.jsonl']) await copyFile(join(dataDir, name), join(previous, name)).catch(error => { if (error.code !== 'ENOENT') throw error; });
  for (const [name, content] of [['state.json', backup.state], ['events.jsonl', backup.events]]) {
    if (content === undefined) continue;
    const temporary = join(dataDir, `${name}.restore.tmp`);
    await writeFile(temporary, content, { mode: 0o600 }); await rename(temporary, join(dataDir, name));
  }
  await rm(join(dataDir, 'pending-restore.json'));
}
