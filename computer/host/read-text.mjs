// Reads a file as raw bytes and decodes UTF-8 here, instead of relying on the
// runtime's readFile(path, 'utf8') path (nodejs-mobile 18 on Android).
import { readFile } from 'node:fs/promises';

const decoder = new TextDecoder('utf-8', { fatal: true });

export async function readText(path) {
  const bytes = await readFile(path);
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  // strip a UTF-8 BOM so JSON.parse never sees it
  const start = view[0] === 0xef && view[1] === 0xbb && view[2] === 0xbf ? 3 : 0;
  return decoder.decode(view.subarray(start));
}
