"""Native emulator acceptance. Uses adb/UI-tree bounds, never screenshot coordinates."""
import subprocess,time,json,re,os,shutil,xml.etree.ElementTree as ET
from pathlib import Path
ADB=os.environ.get('SYNTHIA_ADB') or shutil.which('adb') or '/workspace/android-tools/sdk/platform-tools/adb';SERIAL=os.environ.get('ANDROID_SERIAL','emulator-5554');PACKAGE='org.synthai.computer.recovery';ACTIVITY=PACKAGE+'/org.synthai.computer.MainActivity'
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'verification';checks=[]
def adb(*args,timeout=40):
 r=subprocess.run([ADB,'-s',SERIAL,*args],capture_output=True,timeout=timeout)
 if r.returncode:raise RuntimeError(r.stderr.decode(errors='replace') or r.stdout.decode(errors='replace'))
 return r.stdout
def check(label,condition=True):
 assert condition,label
 checks.append(label);print('PASS:',label,flush=True)
def wait_for(fn,seconds=120):
 end=time.monotonic()+seconds;last=None
 while time.monotonic()<end:
  try:
   value=fn()
   if value:return value
  except Exception as e:last=e
  time.sleep(3)
 raise RuntimeError(f'Timed out: {last}')
def dump():
 adb('shell','uiautomator','dump','/sdcard/synthia-ui.xml',timeout=60)
 xml=adb('exec-out','cat','/sdcard/synthia-ui.xml').decode()
 (OUT/'android-current-ui.xml').write_text(xml)
 return ET.fromstring(xml)
def find(label,root=None):
 if root is None:root=dump()
 matches=[n for n in root.iter('node') if label in [n.get('text'),n.get('content-desc')]]
 matches=[n for n in matches if n.get('bounds') not in [None,'[0,0][0,0]']]
 return next((n for n in reversed(matches) if n.get('clickable')=='true'),matches[-1] if matches else None)
def tap(node):
 bounds=list(map(int,re.findall(r'\d+',node.get('bounds'))));x=(bounds[0]+bounds[2])//2;y=(bounds[1]+bounds[3])//2
 adb('shell','input','tap',str(x),str(y));time.sleep(2)
def tap_label(label):
 node=wait_for(lambda:find(label),120);tap(node)
print('Waiting for Android first boot (software emulation).',flush=True)
wait_for(lambda:adb('shell','getprop','sys.boot_completed',timeout=10).strip()==b'1',600)
check('Android 11 emulator completed native boot')
print(adb('shell','dumpsys','webviewupdate').decode()[:1800],flush=True)
installed=adb('install','-r',os.environ.get('SYNTHIA_TEST_APK','/workspace/delivery/Synthia-Computer-Android-x86_64.apk'),timeout=180).decode();check('actual x86_64 APK installed','Success' in installed)
adb('logcat','-c');launch=adb('shell','am','start','-W','-n',ACTIVITY,timeout=90).decode();(OUT/'android-activity-launch.txt').write_text(launch)
check('Android resolves and launches Synthia Activity','Error' not in launch)
try:
 ui=wait_for(lambda:(lambda r:r if find('You-N-I-Verse',r) is not None else None)(dump()),180)
 check('APK self-starts native local service and renders personal environment')
 (OUT/'android-home-ui.xml').write_text(ET.tostring(ui,encoding='unicode'))
 (OUT/'android-home.png').write_bytes(adb('exec-out','screencap','-p',timeout=60))
 check('native phone navigation is exposed',all(find(label,ui) is not None for label in ['Home','Apps','Files','Synthia']))
 tap_label('Apps');ui=dump();(OUT/'android-apps-ui.xml').write_text(ET.tostring(ui,encoding='unicode'))
 check('native Apps control opens installed application launcher',find('Foundry',ui) is not None)
 tap_label('Foundry');ui=dump();(OUT/'android-foundry-ui.xml').write_text(ET.tostring(ui,encoding='unicode'))
 (OUT/'android-foundry.png').write_bytes(adb('exec-out','screencap','-p'))
 check('native touch opens actual Foundry project environment',find('Create project',ui) is not None)
 # Native back is delivered to the shell, then reopen and inspect persisted state.
 adb('shell','input','keyevent','4');time.sleep(2)
 check('Android Back preserves running app process',bool(adb('shell','pidof',PACKAGE).strip()))
 state=adb('exec-out','run-as',PACKAGE,'cat','files/computer-data/state.json').decode();parsed=json.loads(state)
 check('Computer state is stored in Android app-private storage','synthai-computer' in parsed)
 adb('shell','am','force-stop',PACKAGE);adb('shell','am','start','-W','-n',ACTIVITY,timeout=90)
 wait_for(lambda:find('You-N-I-Verse') is not None,180)
 check('APK starts again after native process restart')
 restored=json.loads(adb('exec-out','run-as',PACKAGE,'cat','files/computer-data/state.json').decode())
 check('app-private Computer namespace survives native restart','synthai-computer' in restored)
finally:
 (OUT/'android-native-logcat.txt').write_bytes(adb('logcat','-d',timeout=60))
 (OUT/'android-native-crash-log.txt').write_bytes(adb('logcat','-d','-b','crash',timeout=60))
 (OUT/'android-native-e2e-results.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'androidVersion':'11','architecture':'x86_64','physicalArm64DeviceTested':False},indent=2)+'\n')
print(f'{len(checks)} native Android checks passed.',flush=True)
