import { randomUUID } from 'node:crypto';

const text = (v, limit = 20000) => {
  if (typeof v !== 'string' || v.length > limit) throw new TypeError(`Expected text of at most ${limit} characters.`);
  return v.trim();
};
export class Workbench {
  constructor(computer, files, conversation) { Object.assign(this, { computer, files, conversation }); this.pending = Promise.resolve(); }
  // Serialize read/modify/write operations so concurrent contributions survive.
  mutate(fn) { const result = this.pending.then(fn); this.pending = result.catch(() => {}); return result; }
  research(query = '') {
    return this.computer.state.get('computer.local.research', []).filter(r => JSON.stringify(r).toLowerCase().includes(query.toLowerCase()));
  }
  addResearch(input) { return this.mutate(async () => {
    if (!['source-statement', 'derivation', 'implementation-choice', 'hypothesis', 'observation'].includes(input.kind)) throw new TypeError('Choose a supported evidence kind.');
    const item = {
      id: randomUUID(), previous: input.previous ? text(input.previous, 64) : null,
      at: new Date().toISOString(), kind: input.kind, question: text(input.question, 2000),
      source: text(input.source, 2000), reference: text(input.reference, 2000), finding: text(input.finding),
      uncertainty: text(input.uncertainty ?? ''), implementations: text(input.implementations ?? ''),
      dependencies: text(input.dependencies ?? ''), verification: text(input.verification ?? ''), conflicts: text(input.conflicts ?? ''),
    };
    if (!item.question || !item.finding) throw new TypeError('Question and finding are required.');
    if (item.kind === 'source-statement' && (!item.source || !item.reference)) throw new TypeError('Source statements require original source and page/section.');
    const rows = this.research();
    if (item.previous && !rows.some(r => r.id === item.previous)) throw new TypeError('Previous finding was not found.');
    await this.computer.state.set('computer.local.research', [...rows, item], { source: 'research-workbench' });
    return item;
  }); }
  builds() { return this.computer.state.get('computer.local.builds', []); }
  build(input) { return this.mutate(async () => {
    const project = this.computer.projects.get(text(input.projectId, 100));
    if (!project) throw new TypeError('Create or select a project first.');
    const name = text(input.name, 100), expected = text(input.expected, 2000);
    text(input.content, 500000);
    const content = input.content;
    if (!/^[\w -]+\.(js|py|sh)$/.test(name) || !content || !expected) throw new TypeError('Provide a .js, .py or .sh filename, source, and expected output.');
    const id = randomUUID();
    const source = await this.files.write(`/home/user/Projects/${project.id}/revisions/${id}/${name}`, content, 'foundry-build');
    await this.files.mirrorImported([source]);
    await this.computer.projects.writeFile(project.id, name, content);
    const receipt = await this.conversation.executeArtifact({ name, content });
    const actual = (receipt.result?.result?.stdout ?? []).join('\n');
    const verified = receipt.ok && actual === expected;
    let artifact = null;
    if (verified) artifact = await this.computer.intake.ingest({ name, text: content, type: 'text/plain', source: `foundry:${project.id}`, tags: ['executed', 'output-verified'] });
    const record = { id, at: new Date().toISOString(), projectId: project.id, name, expected, actual, verified,
      addressKey: source.meta.addressKey, path: source.path, digest: source.meta.digest, receipt, artifactId: artifact?.id ?? null };
    await this.computer.state.set('computer.local.builds', [...this.builds(), record], { source: 'foundry-verification' });
    return record;
  }); }
  profile() { return this.computer.state.get('computer.local.profile', { goals: '', interests: '', skills: '', needs: '', learning: '', challenges: '', birthDate: '', birthTime: '', birthLocation: '' }); }
  saveProfile(input) { return this.mutate(async () => {
    const next = Object.fromEntries(Object.keys(this.profile()).map(k => [k, text(input[k] ?? '', 4000)]));
    await this.computer.state.set('computer.local.profile', next, { source: 'user-correctable-profile' }); return next;
  }); }
  contacts() { return this.computer.state.get('computer.local.contacts', []); }
  addContact(input) { return this.mutate(async () => {
    const item = { id: randomUUID(), name: text(input.name, 200), relationship: text(input.relationship, 2000), sharedGoals: text(input.sharedGoals, 2000), visibility: 'private-local', at: new Date().toISOString() };
    if (!item.name) throw new TypeError('A name is required.');
    await this.computer.state.set('computer.local.contacts', [...this.contacts(), item], { source: 'private-local-relationship' }); return item;
  }); }
}
