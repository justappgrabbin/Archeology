import type { AppDefinition } from '@/types';

export const APP_REGISTRY: AppDefinition[] = [
  { id: 'youniverse', name: 'You-N-I-Verse', icon: 'Home', category: 'Productivity', description: 'Personal goals, preferences and connected experiences', defaultSize: { width: 780, height: 650 }, minSize: { width: 320, height: 240 } },
  { id: 'social', name: 'Social Network', icon: 'Users', category: 'Internet', description: 'Private local relationships and shared-goal notes', defaultSize: { width: 700, height: 600 }, minSize: { width: 320, height: 240 } },
  { id: 'sciencelab', name: 'Science Lab', icon: 'FlaskConical', category: 'Productivity', description: 'Retain sources, findings, evidence and revisions', defaultSize: { width: 850, height: 700 }, minSize: { width: 320, height: 240 } },
  { id: 'foundry', name: 'Foundry', icon: 'Hammer', category: 'DevTools', description: 'Construct, execute, verify and retain project capabilities', defaultSize: { width: 850, height: 700 }, minSize: { width: 320, height: 240 } },
  { id: 'grove', name: 'The Grove', icon: 'Library', category: 'Productivity', description: 'Run and export actual verified local capabilities', defaultSize: { width: 780, height: 600 }, minSize: { width: 320, height: 240 } },
  { id: 'terminal', name: 'Terminal', icon: 'Terminal', category: 'System', description: 'Run isolated Linux commands with persistent work files', defaultSize: { width: 800, height: 550 }, minSize: { width: 320, height: 240 } },
  { id: 'recovery', name: 'Recovery & Controls', icon: 'Settings', category: 'System', description: 'Backup, recovery and execution permissions', defaultSize: { width: 700, height: 550 }, minSize: { width: 320, height: 240 } },
  { id: 'filemanager', name: 'File Manager', icon: 'Folder', category: 'System', description: 'Browse and manage files', defaultSize: { width: 800, height: 550 }, minSize: { width: 320, height: 240 } },
  { id: 'ingest', name: 'Import', icon: 'FileUp', category: 'System', description: 'Import and address files or ZIP archives', defaultSize: { width: 850, height: 580 }, minSize: { width: 380, height: 300 } },
  { id: 'texteditor', name: 'Text Editor', icon: 'FileText', category: 'System', description: 'Edit local text files', defaultSize: { width: 640, height: 480 }, minSize: { width: 320, height: 240 } },
  { id: 'codeeditor', name: 'Code Editor', icon: 'Code2', category: 'System', description: 'Edit and run through Synthia execution', defaultSize: { width: 800, height: 560 }, minSize: { width: 320, height: 240 } },
  { id: 'chat', name: 'Synthia', icon: 'MessageSquare', category: 'Internet', description: 'Conversation through AutoLing, DISEMINER and the mesh', defaultSize: { width: 620, height: 600 }, minSize: { width: 320, height: 240 } },
];
export const getAppById = (id: string): AppDefinition | undefined => APP_REGISTRY.find((a) => a.id === id);
export const getAppsByCategory = (category: string): AppDefinition[] => APP_REGISTRY.filter((a) => a.category === category);
export const getDefaultDockApps = (): string[] => ['filemanager','ingest','chat','codeeditor','texteditor'];
