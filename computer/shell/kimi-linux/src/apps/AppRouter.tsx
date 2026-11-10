import type { FC } from 'react';
import FileManager from './FileManager';
import TextEditor from './TextEditor';
import CodeEditor from './CodeEditor';
import Chat from './Chat';
import Ingest from './Ingest';
import Terminal from './Terminal';
import Recovery from './Recovery';
import { YouNIV, SocialNetwork, ScienceLab, Foundry, Grove } from './Workbench';
interface AppRouterProps { appId: string; windowId: string; }
const AppRouter: FC<AppRouterProps> = ({ appId }) => {
  switch (appId) {
    case 'filemanager': return <FileManager />;
    case 'texteditor': return <TextEditor />;
    case 'codeeditor': return <CodeEditor />;
    case 'chat': return <Chat />;
    case 'ingest': return <Ingest />;
    case 'terminal': return <Terminal />;
    case 'recovery': return <Recovery />;
    case 'youniverse': return <YouNIV />;
    case 'social': return <SocialNetwork />;
    case 'sciencelab': return <ScienceLab />;
    case 'foundry': return <Foundry />;
    case 'grove': return <Grove />;
    default: return <div className="p-4">This application is not installed.</div>;
  }
};
export default AppRouter;
