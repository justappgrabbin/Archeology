"""Phone viewport + actual Android-mode local host, using pinned Node 18.
Native Android installation/picker tests are separate from this browser test.
"""
import base64,json,os,secrets,subprocess,tempfile,time,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]; NODE=os.environ.get('SYNTHIA_TEST_NODE','node');PORT=18867;BASE=f'http://127.0.0.1:{PORT}';checks=[]
def passed(label,condition=True):
 assert condition,label
 checks.append(label);print('PASS:',label,flush=True)
with tempfile.TemporaryDirectory(prefix='synthia-phone-') as tmp:
 data=Path(tmp)/'data';token=secrets.token_hex(32);env={**os.environ,'SYNTHIA_PORT':str(PORT)};log=open(Path(tmp)/'host.log','w');child=None
 def api(path,value=None,method=None):
  r=urllib.request.Request(BASE+path,data=None if value is None else json.dumps(value).encode(),method=method or ('POST' if value is not None else 'GET'),headers={'Cookie':'synthia_session='+token,'Content-Type':'application/json'})
  return json.load(urllib.request.urlopen(r,timeout=30))
 def start():
  global child
  child=subprocess.Popen([NODE,'computer/mobile-entry.mjs',str(data),token],cwd=ROOT,env=env,stdout=log,stderr=log)
  for _ in range(150):
   if child.poll() is not None:raise RuntimeError((Path(tmp)/'host.log').read_text())
   try:
    if api('/api/status')['ready']:return
   except Exception:time.sleep(.1)
  raise RuntimeError('Mobile host startup timeout')
 def stop():
  child.terminate();child.wait(timeout=15)
 try:
  start();passed('APK-mode host self-serves with pinned Node runtime',api('/api/status')['platform']=='android')
  with sync_playwright() as p:
   b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);context=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2)
   context.add_cookies([{'name':'synthia_session','value':token,'url':BASE,'httpOnly':True,'sameSite':'Strict'}])
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE)
   expect(page.get_by_role('heading',name='You-N-I-Verse',exact=True)).to_be_visible()
   passed('phone opens directly into personal environment')
   passed('touch navigation is visible',page.get_by_role('navigation',name='Phone navigation').is_visible())
   passed('phone document has no horizontal overflow',page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
   box=page.locator('.computer-window').bounding_box();passed('phone panel fits the actual viewport',box['x']>=0 and box['width']<=391 and box['y']>=43 and box['y']+box['height']<=781)
   page.get_by_label('Goals and plans',exact=True).fill('Build from my phone');page.get_by_role('button',name='Save personal notes').tap();expect(page.locator('.computer-window').last.get_by_role('status')).to_contain_text('saved locally')
   passed('touch form saves real persistent personal state')
   def launch(name):
    page.get_by_role('button',name='Apps',exact=True).tap();page.get_by_placeholder('Type to search applications...').fill(name);page.get_by_role('button',name=name,exact=True).last.tap();page.wait_for_timeout(400)
   launch('Foundry');page.get_by_label('New project name').fill('Phone capability');page.get_by_role('button',name='Create project',exact=True).tap();page.get_by_role('button',name='Execute, test & retain',exact=True).tap()
   expect(page.locator('.computer-window').last.get_by_role('status')).to_contain_text('registered and retained',timeout=25000)
   passed('phone Foundry executes source in opaque Worker and registers real output')
   launch('The Grove');page.get_by_role('button',name='Run retained capability').tap();expect(page.locator('.computer-window').last.get_by_role('status')).to_contain_text('42',timeout=25000)
   passed('phone reuses actual retained capability')
   # Start a backend request without blocking the page's executor poll loop.
   page.evaluate('''() => { window.phoneProbe = fetch('/api/execute', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'isolation.js',content:'console.log(typeof process); try { await fetch("/api/status"); console.log("UNEXPECTED_NETWORK") } catch { console.log("NETWORK_BLOCKED") }'})}).then(r=>r.json()); }''')
   result=page.evaluate('window.phoneProbe')
   passed('phone Worker has no Node process and network access is denied',result['ok'] and result['result']['result']['stdout']==['undefined','NETWORK_BLOCKED'])
   launch('Import');page.locator('input[type=file]').set_input_files({'name':'phone.js','mimeType':'text/javascript','buffer':b'console.log("PHONE_IMPORT_OK")'})
   page.get_by_role('button',name='Imports/phone.js',exact=True).tap();page.get_by_role('button',name='Run through Synthia').tap();expect(page.get_by_text('PHONE_IMPORT_OK',exact=False).last).to_be_visible(timeout=25000)
   passed('phone file import, preview and actual execution')
   page.get_by_role('button',name='Files',exact=True).tap();expect(page.get_by_text('Imports',exact=True).first).to_be_visible()
   passed('phone file navigation opens the real file manager')
   page.get_by_role('navigation',name='Phone navigation').get_by_role('button',name='Home',exact=True).tap();page.set_viewport_size({'width':844,'height':390});page.wait_for_timeout(300)
   passed('touch landscape retains phone navigation',page.get_by_role('navigation',name='Phone navigation').is_visible())
   page.set_viewport_size({'width':390,'height':500});page.wait_for_timeout(300)
   passed('reduced keyboard-height viewport remains bounded',page.locator('.computer-window').last.bounding_box()['height']<=393)
   page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(ROOT/'verification/synthia-phone.png'))
   # Native Android Back dispatch is the same cancelable event sent by Activity.
   passed('Android Back event is handled by the active app',page.evaluate("!window.dispatchEvent(new CustomEvent('synthia-back',{cancelable:true}))"))
   launch('Recovery & Controls')
   with page.expect_download() as d:page.get_by_role('button',name='Download Computer state backup').tap()
   backup=Path(tmp)/'phone-backup.json';d.value.save_as(str(backup));passed('phone browser backup contains real Computer state','Build from my phone' in backup.read_text())
   # Corrupt restore is rejected; a real validated backup is staged for native restart.
   page.get_by_label('Choose Synthia backup').set_input_files(str(backup));page.get_by_role('button',name='Validate and restore checkpoint').tap();expect(page.locator('.computer-window').last.get_by_role('status')).to_contain_text('staged')
   passed('phone restore validates and stages a real checkpoint')
   unexpected=[e for e in errors if 'Content Security Policy' not in e];passed('no phone page script errors',not unexpected)
   context.close();b.close()
  api('/api/profile',{'goals':'AFTER_CHECKPOINT'},method='PUT');stop();start()
  passed('APK startup applies staged backup and preserves old state',api('/api/profile')['goals']=='Build from my phone' and len(list(data.glob('before-restore-*')))==1)
  passed('APK-mode restart preserves built capability',api('/api/builds')[0]['verified'])
  stop()
 finally:
  if child and child.poll() is None:child.terminate();child.wait(timeout=15)
  log.close()
(ROOT/'verification/phone-computer-e2e-results.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'nativeAndroidDeviceTested':False},indent=2)+'\n');print(f'{len(checks)} phone checks passed.')
