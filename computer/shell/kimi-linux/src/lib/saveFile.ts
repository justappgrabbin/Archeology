declare global { interface Window { SynthiaNative?: { saveFile(name: string, base64: string): void; restartForRestore(): void } } }
export async function saveFile(name: string, bytes: Blob): Promise<void> {
  if (window.SynthiaNative?.saveFile) {
    const buffer = new Uint8Array(await bytes.arrayBuffer()); let binary = '';
    for (let i = 0; i < buffer.length; i += 8192) binary += String.fromCharCode(...buffer.subarray(i, i + 8192));
    window.SynthiaNative.saveFile(name, btoa(binary)); return;
  }
  const url = URL.createObjectURL(bytes); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
