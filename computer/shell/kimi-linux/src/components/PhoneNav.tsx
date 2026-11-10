import { Home, LayoutGrid, Folder, MessageSquare } from 'lucide-react';
import { useOS } from '@/hooks/useOSStore';
export default function PhoneNav() {
  const { state, dispatch } = useOS();
  const open = (appId: string) => {
    dispatch({ type: 'SET_APP_LAUNCHER', open: false });
    const existing = state.windows.find(w => w.appId === appId && w.state !== 'minimized');
    if (existing) dispatch({ type: 'FOCUS_WINDOW', windowId: existing.id });
    else dispatch({ type: 'OPEN_WINDOW', appId });
  };
  return <nav aria-label="Phone navigation" className="synthia-phone-nav">
    <button aria-label="Home" onClick={() => open('youniverse')}><Home size={22} /><span>Home</span></button>
    <button aria-label="Apps" onClick={() => dispatch({ type: 'TOGGLE_APP_LAUNCHER' })}><LayoutGrid size={22} /><span>Apps</span></button>
    <button aria-label="Files" onClick={() => open('filemanager')}><Folder size={22} /><span>Files</span></button>
    <button aria-label="Talk to Synthia" onClick={() => open('chat')}><MessageSquare size={22} /><span>Synthia</span></button>
  </nav>;
}
