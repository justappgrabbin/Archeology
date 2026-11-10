import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readText } from '../host/read-text.mjs';

test('raw text reader retains Unicode and strips a JSON BOM without changing source bytes', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'synthia-readtext-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = join(dir, 'source.json');
  const original = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('{"name":"Synthia · 語言 · ◯"}')]);
  await writeFile(file, original);
  assert.equal(JSON.parse(await readText(file)).name, 'Synthia · 語言 · ◯');
  assert.deepEqual(await readFile(file), original);
});
test('raw text reader rejects malformed UTF-8 instead of silently replacing it', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'synthia-readtext-bad-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = join(dir, 'source.txt'); await writeFile(file, Buffer.from([0xc3, 0x28]));
  await assert.rejects(readText(file), TypeError);
});
test('raw text reader preserves missing-file errors needed by first boot and restore', async () => {
  await assert.rejects(readText(join(tmpdir(), 'synthia-missing-'+crypto.randomUUID())), { code: 'ENOENT' });
});
