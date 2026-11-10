import { useEffect, useState } from 'react';
import { saveFile } from '@/lib/saveFile';

export default function FilePreview({ content, encoding, name }: { content: string; encoding: string; name: string }) {
  const [preview, setPreview] = useState<{ url: string; type: string } | null>(null);
  useEffect(() => {
    if (encoding !== 'base64') { setPreview(null); return; }
    const bytes = Uint8Array.from(atob(content), c => c.charCodeAt(0));
    const header = new TextDecoder('latin1').decode(bytes.slice(0, 16));
    const type = header.startsWith('%PDF-') ? 'application/pdf'
      : bytes[0] === 137 && header.slice(1, 4) === 'PNG' ? 'image/png'
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'image/jpeg'
      : header.startsWith('GIF87a') || header.startsWith('GIF89a') ? 'image/gif'
      : header.startsWith('RIFF') && header.slice(8, 12) === 'WEBP' ? 'image/webp' : 'application/octet-stream';
    const url = URL.createObjectURL(new Blob([bytes], { type }));
    setPreview({ url, type }); return () => URL.revokeObjectURL(url);
  }, [content, encoding]);
  if (encoding !== 'base64') return <pre className="whitespace-pre-wrap break-words max-h-96 overflow-auto p-3 mt-4 bg-[var(--bg-titlebar)]">{content}</pre>;
  if (!preview) return <p>Preparing binary preview…</p>;
  return <div className="space-y-3 mt-4">
    {preview.type.startsWith('image/') ? <img src={preview.url} alt={name} className="max-w-full max-h-96 object-contain" />
      : preview.type === 'application/pdf' ? <object aria-label="PDF preview" data={preview.url} type="application/pdf" className="w-full h-96"><p>Use Download original to view this PDF.</p></object>
      : <p>Binary content preserved. This format has no installed preview or runtime.</p>}
    <a className="inline-block border rounded p-2" href={preview.url} download={name} onClick={async e => { if (window.SynthiaNative) { e.preventDefault(); await saveFile(name, await (await fetch(preview.url)).blob()); } }}>Download original</a>
    {preview.type === 'application/pdf' && <p className="text-xs">PDF preview only. Text extraction and OCR are not connected to this importer.</p>}
  </div>;
}
