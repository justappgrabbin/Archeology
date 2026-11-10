"""Actual phone-mode host + browser app execution, no mocked build/address services."""
import json,os,secrets,subprocess,tempfile,time,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1];PORT=18869;BASE=f'http://127.0.0.1:{PORT}';checks=[]
def passed(text):checks.append(text);print('PASS',text,flush=True)
with tempfile.TemporaryDirectory(prefix='archeology-library-') as tmp:
    token=secrets.token_hex(32);log=open(Path(tmp)/'host.log','w')
    env={**os.environ,'SYNTHIA_PORT':str(PORT)}
    child=subprocess.Popen(['node','computer/mobile-entry.mjs',str(Path(tmp)/'data'),token],cwd=ROOT,env=env,stdout=log,stderr=log)
    def api(path,body=None):
        req=urllib.request.Request(BASE+path,data=None if body is None else json.dumps(body).encode(),headers={'Cookie':'synthia_session='+token,'Content-Type':'application/json'})
        return json.load(urllib.request.urlopen(req,timeout=30))
    try:
        for _ in range(150):
            if child.poll() is not None:raise RuntimeError(Path(tmp,'host.log').read_text())
            try:
                if api('/api/status')['ready']:break
            except Exception:time.sleep(.1)
        else:raise RuntimeError('Host startup timed out')
        with sync_playwright() as p:
            browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
            context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
            context.add_cookies([{'name':'synthia_session','value':token,'url':BASE,'httpOnly':True,'sameSite':'Strict'}])
            page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE)
            expect(page.get_by_role('heading',name='You-N-I-Verse',exact=True)).to_be_visible()
            def launch(name):
                page.get_by_role('navigation',name='Phone navigation').get_by_role('button',name='Apps',exact=True).click()
                page.get_by_placeholder('Type to search applications...').fill(name)
                page.get_by_role('button',name=name,exact=True).last.click()
            launch('App Studio')
            studio=page.locator('.computer-window').filter(has=page.get_by_role('heading',name='App Studio',exact=True))
            page.get_by_label('App project name').fill('Phone-built apps')
            page.get_by_role('button',name='Create project',exact=True).click()
            expect(page.get_by_label('App project',exact=True)).not_to_have_value('')
            page.get_by_role('button',name='Build & add to library',exact=True).click()
            expect(studio.get_by_role('status')).to_contain_text('app mounted',timeout=30000)
            passed('Phone builds an actual counter, assigns its address, and mounts it')
            page.get_by_role('button',name='App library',exact=True).last.click()
            library=page.locator('.computer-window').filter(has=page.get_by_role('heading',name='App library',exact=True))
            page.get_by_role('button',name='Run app',exact=True).click()
            frame=page.frame_locator('iframe[title="Running Pocket counter"]')
            expect(frame.locator('#count')).to_have_text('0')
            frame.get_by_role('button',name='Count one',exact=False).click()
            expect(frame.locator('#count')).to_have_text('1')
            expect(library.get_by_role('status')).to_contain_text('is running',timeout=15000)
            passed('App runs in the phone sandbox and responds to user input')
            # The app cannot read parent state, open a native bridge, or fetch privileged APIs.
            sandbox=page.frames[-1]
            boundary=sandbox.evaluate('''async()=>{
                let parentBlocked=false,networkBlocked=false;
                try{parent.document.body}catch{parentBlocked=true}
                try{await fetch('/api/status')}catch{networkBlocked=true}
                return {parentBlocked,networkBlocked,native:typeof window.SynthiaNative};
            }''')
            assert boundary=={'parentBlocked':True,'networkBlocked':True,'native':'undefined'},boundary
            passed('Built app cannot access parent document, API network or native bridge')
            page.get_by_role('button',name='Close app',exact=True).click()
            page.get_by_label('App request').fill('I want a counter')
            page.get_by_role('button',name='Pick & run',exact=True).click()
            expect(page.frame_locator('iframe[title="Running Pocket counter"]').locator('#count')).to_have_text('0')
            passed('System selects and runs a real matching app for the user')
            page.get_by_role('button',name='Close app',exact=True).click()
            page.get_by_role('button',name='Create revision',exact=True).click()
            expect(page.get_by_role('textbox',name='App name',exact=True)).to_have_value('Pocket counter')
            page.get_by_role('button',name='Game starter',exact=True).click()
            page.get_by_role('button',name='Build & add to library',exact=True).click()
            expect(studio.get_by_role('status')).to_contain_text('Built Catch the spark',timeout=30000)
            page.get_by_role('button',name='App library',exact=True).last.click()
            # Reopening the existing library must refresh its persistent app list.
            game=page.locator('article').filter(has=page.get_by_role('heading',name='Catch the spark',exact=True))
            game.get_by_role('button',name='Run app',exact=True).click()
            gameframe=page.frame_locator('iframe[title="Running Catch the spark"]')
            for _ in range(10):gameframe.get_by_role('button',name='Catch spark').click()
            expect(gameframe.locator('#score')).to_have_text('You caught every spark!')
            passed('A locally built game is playable through completion')
            page.screenshot(path=str(ROOT/'verification/app-library-phone.png'))
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            assert len(api('/api/apps'))==2
            assert len(api('/api/backup')['state'])>0
            passed('App library and full source persist in Computer state and backup')
            assert not [e for e in errors if 'Content Security Policy' not in e],errors
            browser.close()
    finally:
        child.terminate();child.wait(timeout=15);log.close()
(ROOT/'verification/app-library-e2e-results.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'physicalAndroidDeviceTested':False},indent=2)+'\n')
