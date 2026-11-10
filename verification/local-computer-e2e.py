"""Actual desktop + API + restart + backup/restore acceptance, isolated test data."""
import base64, io, json, os, subprocess, tempfile, time, urllib.request, urllib.error, zipfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
ROOT = Path(__file__).resolve().parents[1]
results=[]
def check(name, condition=True):
 assert condition, name
 results.append(name)
 print('PASS:', name, flush=True)
with tempfile.TemporaryDirectory(prefix='synthia-e2e-') as tmp:
 data=Path(tmp)/'data'; port=18865
 env={**os.environ,'SYNTHIA_DATA_DIR':str(data),'SYNTHIA_PORT':str(port)}
 base=f'http://127.0.0.1:{port}'
 log=open(Path(tmp)/'host.log','w'); child=None; token=''
 def api(path, value=None, method=None, auth=True):
  req=urllib.request.Request(base+path, data=json.dumps(value).encode() if value is not None else None, method=method or ('POST' if value is not None else 'GET'), headers={'Content-Type':'application/json', **({'Cookie':'synthia_session='+token} if auth else {})})
  with urllib.request.urlopen(req,timeout=35) as r: return json.load(r)
 def start():
  global child,token
  child=subprocess.Popen(['node','computer/local.mjs','start'],cwd=ROOT,env=env,stdout=log,stderr=log)
  for _ in range(150):
   if child.poll() is not None: raise RuntimeError((Path(tmp)/'host.log').read_text())
   try:
    token=json.loads((data/'control.json').read_text())['token']
    if api('/api/status')['ready']: return
   except Exception: time.sleep(.1)
  raise RuntimeError('Host startup timeout')
 def stop():
  api('/api/shutdown',{})
  child.wait(timeout=15)
 try:
  start()
  try: api('/api/files',auth=False); raise AssertionError('Unauthenticated API allowed')
  except urllib.error.HTTPError as e: check('unauthenticated API denied',e.code==401)
  # Browser sign-in, actual imports, edits, chat, all core application routes.
  with sync_playwright() as p:
   b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
   page=b.new_page(viewport={'width':1440,'height':1000}); errors=[]
   page.on('pageerror',lambda e: errors.append(str(e)))
   page.goto(base); page.locator('input').fill(token); page.get_by_role('button',name='Open computer',exact=True).click()
   page.get_by_role('button',name='Activities',exact=True).wait_for()
   check('desktop sign-in and rendering')
   check('session cookie is HttpOnly',all(c['httpOnly'] for c in page.context.cookies() if c['name']=='synthia_session'))
   def launch(name):
    page.reload(); page.get_by_role('button',name='Activities',exact=True).click()
    page.get_by_placeholder('Type to search applications...').fill(name)
    page.get_by_role('button',name=name,exact=True).last.click()
    page.wait_for_timeout(500)
   launch('Import')
   page.locator('input[type=file]').set_input_files({'name':'acceptance.js','mimeType':'text/javascript','buffer':b'console.log("IMPORTED_OK");'})
   page.get_by_role('button',name='Imports/acceptance.js',exact=True).wait_for(); page.get_by_role('button',name='Imports/acceptance.js',exact=True).click()
   page.get_by_role('button',name='Run through Synthia').click()
   expect(page.get_by_text('IMPORTED_OK',exact=False).last).to_be_visible(timeout=20000)
   check('browser import, addressed preview and actual execution output')
   # A misleading extension must not decide the preview type.
   png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=')
   page.locator('input[type=file]').set_input_files({'name':'picture.txt','mimeType':'text/plain','buffer':png})
   page.get_by_role('button',name='Imports/picture.txt',exact=True).click()
   expect(page.get_by_role('img',name='picture.txt',exact=True)).to_be_visible()
   check('image preview recognizes actual PNG bytes despite text filename',page.get_by_role('img',name='picture.txt',exact=True).evaluate('(img)=>img.naturalWidth')==1)
   import fitz
   pdf=fitz.open(); pdf.new_page().insert_text((50,50),'Original PDF preview fixture'); pdfbytes=pdf.tobytes(); pdf.close()
   page.locator('input[type=file]').set_input_files({'name':'document.bin','mimeType':'application/octet-stream','buffer':pdfbytes})
   page.get_by_role('button',name='Imports/document.bin',exact=True).click()
   expect(page.locator('object[type="application/pdf"]')).to_be_visible()
   with page.expect_download() as download:
    page.get_by_role('link',name='Download original',exact=True).click()
   download.value.save_as(str(Path(tmp)/'original.pdf'))
   check('PDF preview and original-byte download', (Path(tmp)/'original.pdf').read_bytes()==pdfbytes)
   launch('Code Editor'); page.get_by_title('New File',exact=True).click(); page.locator('textarea').fill('console.log("EDITOR_OK");')
   page.get_by_title('Execute current file through Synthia',exact=True).click()
   expect(page.get_by_text('EDITOR_OK',exact=False).last).to_be_visible(timeout=20000)
   check('code editor executes its actual source')
   launch('Text Editor'); page.get_by_title('New (Ctrl+N)',exact=True).click(); page.locator('textarea').fill('PERSISTENT_EDITOR_TEXT')
   page.get_by_title('Save (Ctrl+S)',exact=True).click(); page.wait_for_timeout(1000)
   check('text editor save reaches persistent filesystem',any('PERSISTENT_EDITOR_TEXT'==n.get('content') for n in api('/api/filesystem')['nodes'].values()))
   launch('Synthia'); page.get_by_placeholder('Type a message...').fill('What files have I imported?'); page.get_by_placeholder('Type a message...').press('Enter')
   page.wait_for_timeout(2000)
   check('chat uses recovered donor and retains actual conversation',any('acceptance.js' in h['text'] for h in api('/api/history')))
   for name,heading in [('You-N-I-Verse','You-N-I-Verse'),('Social Network','Social Network'),('Science Lab','Science Lab'),('Foundry','Foundry'),('The Grove','The Grove'),('Recovery & Controls','Recovery & Controls')]:
    launch(name); expect(page.get_by_role('heading',name=heading,exact=True)).to_be_visible(); check('working application navigation: '+name)
   launch('You-N-I-Verse'); page.get_by_label('Goals and plans',exact=True).fill('Learn and build locally'); page.get_by_role('button',name='Save personal notes').click()
   expect(page.get_by_role('status')).to_contain_text('saved locally')
   launch('Foundry'); page.get_by_label('New project name').fill('Acceptance capability'); page.get_by_role('button',name='Create project',exact=True).click()
   page.get_by_role('button',name='Execute, test & retain',exact=True).click()
   expect(page.get_by_role('status')).to_contain_text('registered and retained',timeout=25000)
   check('Foundry constructs, executes, tests and registers real source')
   launch('The Grove'); page.get_by_role('button',name='Run retained capability').click()
   expect(page.get_by_role('status')).to_contain_text('42',timeout=20000)
   check('Grove reuses the actual retained Foundry artifact')
   launch('Recovery & Controls'); page.get_by_label('Allow isolated terminal commands').check(); expect(page.get_by_role('status')).to_contain_text('saved')
   launch('Terminal'); page.get_by_label('Shell command').fill('printf SHELL_OK; printf retained > saved.txt; test ! -e /workspace; test ! -e /home/agent')
   page.get_by_role('button',name='Run command',exact=True).click(); expect(page.get_by_label('Terminal output')).to_contain_text('[exit 0]',timeout=20000)
   check('real isolated shell, inaccessible host workspace, persistent work file')
   page.screenshot(path=str(ROOT/'verification/desktop-acceptance.png'))
   check('zero browser script errors',not errors)
   b.close()
  original=b'ORIGINAL_SOURCE\n'; encoded=base64.b64encode(original).decode()
  first=api('/api/ingest',{'name':'same.txt','base64':encoded})['items'][0]
  second=api('/api/ingest',{'name':'same.txt','base64':base64.b64encode(b'OTHER_SOURCE').decode()})['items'][0]
  check('same-name import preserves both originals',first['path']!=second['path'])
  zipbuf=io.BytesIO()
  with zipfile.ZipFile(zipbuf,'w',zipfile.ZIP_DEFLATED) as z: z.writestr('source.py','print(42)\n')
  archive=api('/api/ingest',{'name':'bundle.zip','base64':base64.b64encode(zipbuf.getvalue()).decode()})
  check('ZIP original and extracted member retained',len(archive['items'])==2)
  finding=api('/api/research',{'kind':'source-statement','question':'What is tested?','source':'test-source','reference':'section 1','finding':'A rule is tested before acceptance.','uncertainty':'Fixture, not a research claim.'})
  api('/api/research',{'kind':'hypothesis','question':'Revision','source':'','reference':'','finding':'Revised interpretation.','previous':finding['id']})
  check('research preserves cited finding and linked revision',len(api('/api/research'))==2)
  contact=api('/api/contacts',{'name':'Test collaborator','relationship':'Local-only fixture','sharedGoals':'Learn'})
  check('relationship has private-local visibility',contact['visibility']=='private-local')
  build=api('/api/builds')[0]
  bad=api('/api/foundry-build',{'projectId':build['projectId'],'name':'fails.js','content':'console.log(41)','expected':'42'})
  check('incorrect output is retained as failure and never registered',not bad['verified'] and bad['artifactId'] is None)
  code=api('/api/execute',{'name':'isolation.js','content':'console.log(process.env.SYNTHIA_API_TOKEN === undefined); console.log(await import("node:fs").then(fs=>fs.existsSync("/workspace")));'})
  check('code execution cannot see host token or workspace',code['result']['result']['stdout']==['true','false'])
  tools=api('/api/terminal',{'command':'python3 /resources/klein/klein_autoling.py'})
  check('original Klein AUTOLING executes inside Computer isolation',tools['code']==0 and 'ALL PASS' in tools['stdout'])
  backup=Path(tmp)/'backup.json'
  subprocess.run(['node','computer/local.mjs','backup',str(backup)],cwd=ROOT,env=env,check=True,capture_output=True)
  check('backup includes state checksum and terminal files',backup.is_file() and Path(str(backup)+'.terminal/saved.txt').read_text()=='retained')
  oldtoken=token; stop(); start()
  check('restart rotates the session and preserves profile',oldtoken!=token and api('/api/profile')['goals']=='Learn and build locally')
  from urllib.parse import urlencode
  recalled=api('/api/activate-file?'+urlencode({'address':first['addressKey'],'path':first['path']}))
  check('restart recalls exact original bytes by address',recalled['content']==original.decode())
  check('restart preserves verified capability and findings',api('/api/builds')[0]['verified'] and len(api('/api/research'))==2)
  # A later change must disappear after restore, while the pre-restore directory survives.
  api('/api/profile',{'goals':'AFTER_BACKUP'},method='PUT'); stop()
  corrupt=Path(tmp)/'bad.json'; j=json.loads(backup.read_text()); j['state']+=' '; corrupt.write_text(json.dumps(j))
  failed=subprocess.run(['node','computer/local.mjs','restore',str(corrupt)],cwd=ROOT,env=env,capture_output=True)
  check('corrupt backup rejected',failed.returncode!=0)
  subprocess.run(['node','computer/local.mjs','restore',str(backup)],cwd=ROOT,env=env,check=True,capture_output=True)
  check('restore preserves recoverable previous directory',len(list(Path(tmp).glob('data.before-restore-*')))==1)
  start(); check('restored Computer returns original profile and capability',api('/api/profile')['goals']=='Learn and build locally' and api('/api/builds')[0]['verified'])
  check('restored terminal work files survive',api('/api/terminal',{'command':'cat saved.txt'})['stdout']=='retained')
  stop()
 finally:
  if child and child.poll() is None: child.terminate(); child.wait(timeout=15)
  log.close()
(ROOT/'verification/local-computer-e2e-results.json').write_text(json.dumps({'passed':len(results),'checks':results},indent=2)+'\n')
print(f'{len(results)} acceptance checks passed.')
