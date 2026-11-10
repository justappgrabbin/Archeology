import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ComputerRuntime } from '../ComputerRuntime.mjs';
import { JsonFilePersistence } from '../runtime/json-file-persistence.mjs';
import { ConversationExecution } from '../services/conversation-execution.mjs';
import { FileAdmission } from '../services/file-admission.mjs';
import { AppLibrary } from '../host/app-library.mjs';

async function setup() {
  const dir=await mkdtemp(join(tmpdir(),'archeology-apps-'));
  const persistence=new JsonFilePersistence(join(dir,'state.json'));
  const computer=await new ComputerRuntime({persistence,eventLogPath:join(dir,'events.jsonl')}).boot();
  const conversation=new ConversationExecution(computer),files=new FileAdmission(computer,conversation.execution);
  return {dir,computer,files,library:new AppLibrary(computer,files),project:await computer.projects.create({name:'Real apps'})};
}
const source={name:'Counter',description:'Count things',tags:'counter,productivity',html:'<button id="add">0</button>',css:'body{color:purple}',js:'document.getElementById("add").onclick=e=>{e.target.textContent=String(Number(e.target.textContent)+1)};'};
test('real build -> file address -> intake -> mount -> exact recall -> retained revision -> restart',async()=>{
  const {dir,computer,files,library,project}=await setup();
  try {
    const original=await library.build({...source,projectId:project.id});
    assert.ok(original.addressKey);assert.equal(original.addressBasis,'computational-file-admission');
    assert.equal(Object.keys(original.address).length,13);
    assert.ok(computer.shellManager.listMounted().some(m=>m.mountId===original.mountId));
    const stored=await library.source(original.id);assert.equal(stored.js,source.js);
    const second=await library.build({...source,projectId:project.id,previousId:original.id,js:source.js+'\n// New revision'});
    assert.equal(library.list().length,2);assert.notEqual(original.path,second.path);
    assert.equal((await library.source(original.id)).js,source.js);
    const launch=await library.launch(original.id);assert.ok(launch.activation.exactAddressVerified);
    assert.match(launch.html,/connect-src 'none'/);assert.equal(launch.sandbox,'allow-scripts');
    const receipt=await library.receipt(original.id,{nonce:launch.nonce,ok:true});assert.equal(receipt.ok,true);
    await assert.rejects(library.receipt(original.id,{nonce:launch.nonce,ok:true}),/Unknown or expired/);
    const rebooted=await new ComputerRuntime({persistence:new JsonFilePersistence(join(dir,'state.json')),eventLogPath:join(dir,'events.jsonl')}).boot();
    const restored=new AppLibrary(rebooted,new FileAdmission(rebooted,new ConversationExecution(rebooted).execution));
    assert.equal(restored.list().length,2);assert.equal((await restored.source(original.id)).js,source.js);
    assert.ok((await restored.launch(original.id)).html.includes('id="add"'));
    assert.equal(files.resolve(original.addressKey).some(f=>f.path===original.path),true);
  } finally {await rm(dir,{recursive:true,force:true})}
});
test('syntax errors cannot enter library and source never executes in host',async()=>{
  const {dir,library,project}=await setup();
  try {
    await assert.rejects(library.build({...source,projectId:project.id,js:'const = ???'}),SyntaxError);
    assert.equal(library.list().length,0);
    await library.build({...source,projectId:project.id,js:'globalThis.__app_host_probe=true;'});
    assert.equal(globalThis.__app_host_probe,undefined);
    await assert.rejects(library.build({...source,projectId:'missing'}),/Select a project/);
  } finally {await rm(dir,{recursive:true,force:true})}
});
test('capability selection uses actual app descriptors and refuses unknown matches',async()=>{
  const {dir,library,project,computer}=await setup();
  try {
    const counter=await library.build({...source,projectId:project.id});
    const game=await library.build({...source,name:'Tap game',description:'A reaction game',tags:'game,play',projectId:project.id});
    assert.equal((await library.select({request:'play a game'})).selected.id,game.id);
    assert.equal((await library.select({request:'count things'})).selected.id,counter.id);
    assert.equal((await library.select({request:'astronomy telescope'})).selected,null);
    await computer.state.set('computer.local.profile',{needs:'play a game'});
    assert.equal((await library.select({})).selected.id,game.id);
  } finally {await rm(dir,{recursive:true,force:true})}
});
