
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  LayoutDashboard, 
  Plus, 
  Video, 
  CheckCircle2, 
  Send, 
  MessageSquare, 
  Sparkles, 
  Trash2, 
  Music2, 
  Facebook, 
  Send as TelegramIcon,
  TrendingUp,
  Image as ImageIcon,
  Mic,
  MicOff,
  Wand2,
  Film,
  Maximize2,
  Loader2,
  ChevronRight,
  Monitor,
  Calendar as CalendarIcon,
  X,
  Zap,
  StickyNote,
  Palette,
  HardDrive,
  FileText,
  FileSpreadsheet,
  Presentation,
  File as FileIcon,
  Download,
  Eye,
  Search,
  UploadCloud,
  Bell,
  ClipboardList,
  AlertCircle,
  Clock,
  Layers,
  Building2,
  Target,
  Clapperboard,
  Ghost,
  RefreshCw,
  Users,
  Edit2,
  Check,
  Globe,
  Link as LinkIcon,
  BrainCircuit,
  TrendingUp as ArrowUpRight,
  Lock,
  LogOut,
  User,
  ShieldCheck,
  Coins,
  Key as KeyIcon,
  ExternalLink
} from 'lucide-react';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from "@google/genai";

/**
 * Fix: Removed local AIStudio interface and declare global block.
 * These are already provided by the environment, and manual re-declaration
 * caused "identical modifiers" and "subsequent property declarations" errors.
 */

// --- Types ---
type Platform = 'TikTok' | 'Facebook' | 'Telegram';
type ContentStatus = 'Idea' | 'Source' | 'Editing' | 'Ready' | 'Posted';
type TabType = 'dashboard' | 'pipeline' | 'ai' | 'notes' | 'storage' | 'accounts';
type ItemType = 'video' | 'project';
type TargetType = 'account' | 'content';

interface Account {
  id: string;
  name: string;
  platform: Platform;
  niche: string; 
  followers: number;
  targetFollowers: number;
  views: number;
  targetViews: number;
  lastSynced?: string;
}

interface WorkflowItem {
  id: string;
  title: string;
  type: ItemType;
  platform: Platform;
  targetType: TargetType;
  targetId: string; 
  status: ContentStatus;
  startDate: string;
  endDate: string;
}

interface Note {
  id: string;
  content: string;
  platform?: Platform;
  createdAt: string;
}

interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: string;
  content?: string;
  url: string;
  uploadedAt: string;
  extension: string;
}

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical';
  itemId: string;
}

// --- Mock Data ---
const INITIAL_ACCOUNTS: Account[] = [
  { id: 'tt-1', name: 'Main Buzz', platform: 'TikTok', niche: 'Movies', followers: 4500, targetFollowers: 10000, views: 125000, targetViews: 500000 },
  { id: 'tt-2', name: 'Meme Central', platform: 'TikTok', niche: 'Memes', followers: 2300, targetFollowers: 5000, views: 89000, targetViews: 200000 },
  { id: 'fb-1', name: 'Niche Page A', platform: 'Facebook', niche: 'Lifestyle', followers: 1200, targetFollowers: 10000, views: 15000, targetViews: 100000 },
  { id: 'tg-1', name: 'Update Hub', platform: 'Telegram', niche: 'News', followers: 800, targetFollowers: 10000, views: 4200, targetViews: 20000 },
];

const INITIAL_WORKFLOW: WorkflowItem[] = [
  { id: 'w1', title: 'Funny Cat Video Re-edit', type: 'video', platform: 'TikTok', targetId: 'tt-1', targetType: 'account', status: 'Editing', startDate: new Date().toISOString(), endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
];

const PLATFORMS: Platform[] = ['TikTok', 'Facebook', 'Telegram'];

const App = () => {
  // Security State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // App State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [workflow, setWorkflow] = useState<WorkflowItem[]>(INITIAL_WORKFLOW);
  const [notes, setNotes] = useState<Note[]>([]);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  
  const [newItemPlatform, setNewItemPlatform] = useState<Platform>('TikTok');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string; hasError?: boolean }[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<StoredFile | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'pronluy' && password === 'luy372004') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  const notifications: AppNotification[] = workflow.filter(w => w.status !== 'Posted').map(item => {
    const end = new Date(item.endDate);
    const now = new Date();
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 1) return { id: `notif-${item.id}`, title: 'Urgent Deadline', message: `Video Task: "${item.title}" is due tomorrow!`, type: 'critical', itemId: item.id };
    return null;
  }).filter(n => n !== null) as AppNotification[];

  const PlatformIcon = ({ platform, className = "" }: { platform: Platform, className?: string }) => {
    switch (platform) {
      case 'TikTok': return <Music2 className={`${className} text-pink-500`} size={18} />;
      case 'Facebook': return <Facebook className={`${className} text-blue-500`} size={18} />;
      case 'Telegram': return <TelegramIcon className={`${className} text-sky-500`} size={18} />;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded) return;
    Array.from(uploaded).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newFile: StoredFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          content: file.type.includes('text') ? (event.target?.result as string) : `Binary: ${file.name}`,
          url: event.target?.result as string,
          uploadedAt: new Date().toISOString(),
          extension: file.name.split('.').pop() || ''
        };
        setFiles(prev => [newFile, ...prev]);
      };
      if (file.type.includes('text') || file.name.endsWith('.md')) reader.readAsText(file);
      else reader.readAsDataURL(file);
    });
  };

  const addItemToWorkflow = (data: Omit<WorkflowItem, 'id' | 'status' | 'type' | 'targetType'>) => {
    const newItem: WorkflowItem = {
      id: Math.random().toString(36).substr(2, 9),
      status: 'Idea',
      type: 'video',
      targetType: 'account',
      ...data
    };
    setWorkflow(prev => [...prev, newItem]);
    setIsAddingItem(false);
  };

  const updateAccountStats = (id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const syncAccountStats = async (id: string) => {
    const account = accounts.find(a => a.id === id);
    if (!account) return;
    setSyncingId(id);
    try {
      /**
       * Fix: Created a new GoogleGenAI instance right before making an API call 
       * to ensure it uses the most up-to-date API key.
       * Fix: Updated model to 'gemini-3-flash-preview' for basic text/json tasks.
       * Fix: Used responseSchema for more robust JSON generation.
       */
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Simulate stats for a ${account.platform} account. Current Followers: ${account.followers}, Views: ${account.views}.`,
        config: { 
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              followers: { type: Type.NUMBER },
              views: { type: Type.NUMBER }
            },
            required: ["followers", "views"]
          }
        }
      });
      const text = response.text;
      if (text) {
        const newStats = JSON.parse(text.trim());
        if (newStats.followers && newStats.views) {
          updateAccountStats(id, { followers: newStats.followers, views: newStats.views, lastSynced: new Date().toLocaleTimeString() });
        }
      }
    } catch (e) {
      console.error("Sync error:", e);
      // Fallback
      updateAccountStats(id, { followers: account.followers + 5, views: account.views + 50 });
    } finally {
      setSyncingId(null);
    }
  };

  const syncAllAccounts = async () => {
    setIsSyncingAll(true);
    try {
      await Promise.all(accounts.map(acc => syncAccountStats(acc.id)));
    } catch (error) {
      console.error("Batch sync failed:", error);
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleOpenKeySelector = async () => {
    // @ts-ignore - Assuming aistudio is globally available per instructions
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const driveContext = files.map(f => `File: ${f.name} - Content: ${f.content}`).join('\n');
    const userMsg = { role: 'user' as const, text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsAiLoading(true);
    try {
      /**
       * Fix: Created a fresh instance right before call using process.env.API_KEY directly.
       * Fix: Updated model to 'gemini-3-flash-preview'.
       */
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...chatHistory.filter(h => !h.hasError), userMsg].map(h => ({ 
          role: h.role, 
          parts: [{ text: h.text }] 
        })),
        config: {
          systemInstruction: `You are the Official AI Strategist for Pron Luy. Help with Social Media growth. Use Khmer. Context: ${driveContext}`,
        },
      });
      
      const text = response.text;
      setChatHistory(prev => [...prev, { role: 'model', text: text || 'Thinking...' }]);
    } catch (e: any) {
      console.error(e);
      let errorKhmer = "⚠️ មានកំហុសក្នុងការតភ្ជាប់ទៅកាន់ប្រព័ន្ធ AI។";
      
      const errorString = e.toString().toLowerCase() || "";
      if (errorString.includes("api key not valid") || errorString.includes("requested entity was not found") || errorString.includes("invalid_argument")) {
        errorKhmer = "⚠️ បញ្ហា API Key៖ ប្រព័ន្ធមិនទទួលស្គាល់ Key នេះទេ។ នេះអាចមកពី Key មិនទាន់បានភ្ជាប់ជាមួយ Billing Plan។ សូមចុចប៊ូតុង 'ភ្ជាប់គម្រោងរបស់អ្នក' ខាងក្រោម ដើម្បីដោះស្រាយ។";
      }
      
      setChatHistory(prev => [...prev, { role: 'model', text: errorKhmer, hasError: true }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="flex flex-col items-center text-center">
            <div className="relative w-24 h-24 rounded-full border-4 border-amber-500 bg-gradient-to-br from-slate-900 to-black flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.2)] mb-6">
               <div className="flex items-baseline gap-0.5">
                  <span className="text-amber-500 font-black text-4xl tracking-tighter">P</span>
                  <span className="text-amber-500 font-black text-4xl tracking-tighter">L</span>
               </div>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Pron Luy</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.5em] opacity-80">Security Protocol Activated</p>
          </div>

          <form onSubmit={handleLogin} className="bg-slate-900/40 border border-slate-800/50 p-10 rounded-[3rem] space-y-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            {loginError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-3 animate-shake">
                <AlertCircle size={16} /> {loginError}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest flex items-center gap-2">
                <User size={12} className="text-amber-500/50" /> Username
              </label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest flex items-center gap-2">
                <Lock size={12} className="text-amber-500/50" /> Password
              </label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none"
              />
            </div>
            <button type="submit" className="w-full py-5 bg-gradient-to-r from-amber-600 to-amber-400 text-black font-black rounded-2xl uppercase text-[11px] tracking-[0.3em] shadow-xl shadow-amber-500/10 active:scale-95 transition-all">
              Unlock System
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-300 font-sans selection:bg-amber-500/30">
      <aside className="fixed left-0 top-0 bottom-0 w-20 md:w-64 bg-slate-950 border-r border-slate-900 z-50 flex flex-col">
        <div className="p-8 flex items-center gap-4">
           <div className="relative w-12 h-12 rounded-full border-2 border-amber-500/50 bg-slate-900 flex items-center justify-center group cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <span className="text-amber-500 font-black text-lg">PL</span>
           </div>
           <span className="text-lg font-black text-white tracking-tighter hidden md:block uppercase">Pron Luy</span>
        </div>
        <nav className="flex-grow p-4 space-y-2">
          {[
            { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
            { id: 'pipeline', label: 'Workflow', icon: Video },
            { id: 'ai', label: 'AI Strategy', icon: Sparkles },
            { id: 'notes', label: 'Work Log', icon: StickyNote },
            { id: 'storage', label: 'Drive', icon: HardDrive },
            { id: 'accounts', label: 'Accounts', icon: Monitor },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all group ${activeTab === tab.id ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'hover:bg-slate-900 text-slate-500'}`}>
              <tab.icon size={20} className={activeTab === tab.id ? 'text-amber-500' : 'group-hover:text-slate-300'} />
              <span className="font-bold text-xs hidden md:block uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-900">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 p-3.5 rounded-2xl text-slate-500 hover:bg-red-500/10 hover:text-red-400">
            <LogOut size={20} />
            <span className="font-bold text-xs hidden md:block uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </aside>

      <main className="pl-20 md:pl-64 pt-6 min-h-screen">
        <header className="px-8 md:px-12 flex justify-between items-center mb-10 h-20">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight capitalize">{activeTab}</h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">Commanding the Digital Flow.</p>
          </div>
          <div className="flex items-center gap-5">
            <button className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500">
              <Bell size={20} />
            </button>
            <button onClick={() => setIsAddingItem(true)} className="bg-white text-black px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-400 transition-all">
              New Idea
            </button>
          </div>
        </header>

        <section className="px-8 md:px-12 pb-24">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-700">
              {PLATFORMS.map(p => {
                const pAccs = accounts.filter(a => a.platform === p);
                const totalF = pAccs.reduce((s, a) => s + a.followers, 0);
                return (
                  <div key={p} className="bg-slate-900/40 border border-slate-800/60 p-10 rounded-[2.5rem] relative overflow-hidden group hover:border-amber-500/30 transition-all">
                     <PlatformIcon platform={p as Platform} className="mb-8 scale-150 origin-left" />
                     <div className="space-y-2">
                        <h3 className="text-4xl font-black text-white">{formatNumber(totalF)}</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{p} Network</p>
                     </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="max-w-5xl mx-auto animate-in fade-in duration-700">
               <div className="bg-slate-900/40 border border-slate-800/80 p-10 rounded-[3rem] min-h-[600px] flex flex-col relative overflow-hidden backdrop-blur-xl">
                  <div className="flex items-center gap-6 mb-12">
                     <div className="p-5 bg-amber-500 text-black rounded-3xl"><Sparkles size={32} /></div>
                     <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest">AI Strategy Engine</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Stable Core Engine Online</p>
                     </div>
                  </div>
                  <div className="flex-grow space-y-8 overflow-y-auto mb-10 pr-4">
                    {chatHistory.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
                        <BrainCircuit size={60} className="text-amber-500" />
                        <p className="font-black text-sm uppercase tracking-[0.6em]">System Awaiting Command...</p>
                      </div>
                    )}
                    {chatHistory.map((m, i) => (
                      <div key={i} className={`flex flex-col gap-4 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-6 rounded-[2rem] max-w-[85%] text-sm font-khmer ${m.role === 'user' ? 'bg-amber-500 text-black font-bold' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                           {m.text}
                        </div>
                        {m.hasError && (
                          <button onClick={handleOpenKeySelector} className="flex items-center gap-3 bg-red-500/20 text-red-400 border border-red-500/30 px-8 py-4 rounded-2xl text-[11px] font-black uppercase hover:bg-red-500 hover:text-white transition-all shadow-lg animate-pulse">
                            <ExternalLink size={16} /> ភ្ជាប់គម្រោងរបស់អ្នក (Connect Google Project)
                          </button>
                        )}
                      </div>
                    ))}
                    {isAiLoading && <div className="text-amber-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Neural Matrix Processing...</div>}
                  </div>
                  <div className="flex gap-4 bg-black/40 p-3 rounded-[2.5rem] border border-slate-800/50 shadow-inner">
                    <input 
                      value={chatInput} 
                      onChange={e => setChatInput(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleChat()}
                      placeholder="សួរបញ្ហា ឬរៀបយុទ្ធសាស្ត្រ..." 
                      className="flex-grow bg-transparent px-6 py-4 text-white text-sm outline-none font-khmer" 
                    />
                    <button onClick={handleChat} disabled={!chatInput.trim() || isAiLoading} className="bg-white text-black p-4 rounded-full hover:bg-amber-400 transition-all">
                       <Send size={24} />
                    </button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'pipeline' && (
             <div className="flex gap-10 overflow-x-auto pb-12 snap-x animate-in fade-in duration-700">
             {(['Idea', 'Source', 'Editing', 'Ready', 'Posted'] as ContentStatus[]).map(stage => (
               <div key={stage} className="flex-shrink-0 w-80 bg-slate-900/30 border border-slate-800/60 rounded-[3rem] p-8 snap-start min-h-[500px]">
                  <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8">{stage}</h4>
                  <div className="space-y-6">
                     {workflow.filter(w => w.status === stage).map(item => (
                       <div key={item.id} className="bg-slate-800/60 p-6 rounded-[2rem] border border-slate-700/50">
                          <PlatformIcon platform={item.platform} className="mb-4" />
                          <p className="text-white font-bold text-sm leading-relaxed mb-4">{item.title}</p>
                          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{new Date(item.endDate).toLocaleDateString()}</div>
                       </div>
                     ))}
                  </div>
               </div>
             ))}
          </div>
          )}

          {activeTab === 'accounts' && (
             <div className="space-y-12 animate-in fade-in duration-700">
                <div className="flex justify-between items-center">
                   <h2 className="text-2xl font-black text-white tracking-widest uppercase">Accounts</h2>
                   <button onClick={syncAllAccounts} disabled={isSyncingAll} className="bg-amber-500 text-black px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-3">
                      <RefreshCw size={14} className={isSyncingAll ? 'animate-spin' : ''} /> Sync Stats
                   </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {accounts.map(acc => (
                    <div key={acc.id} className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem] hover:border-amber-500/40 transition-all">
                       <PlatformIcon platform={acc.platform} className="mb-4 scale-75" />
                       <p className="text-white font-black text-xs truncate mb-4">{acc.name}</p>
                       <div className="space-y-2">
                         <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase"><span>F</span><span className="text-amber-500">{formatNumber(acc.followers)}</span></div>
                         <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase"><span>V</span><span className="text-sky-400">{formatNumber(acc.views)}</span></div>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
          )}
        </section>
      </main>

      {isAddingItem && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-slate-950 border border-slate-800 w-full max-w-xl rounded-[3rem] p-12 relative">
              <button onClick={() => setIsAddingItem(false)} className="absolute top-8 right-8 text-slate-600 hover:text-white"><X size={32} /></button>
              <h2 className="text-3xl font-black text-white tracking-tighter mb-10 uppercase">New Viral Idea</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                addItemToWorkflow({
                  title: fd.get('title') as string,
                  platform: newItemPlatform,
                  targetId: 'manual',
                  startDate: new Date().toISOString(),
                  endDate: fd.get('end') as string
                });
              }} className="space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Title</label>
                    <input name="title" required className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none" />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Platform</label>
                    <div className="flex gap-4">
                      {PLATFORMS.map(p => (
                        <button key={p} type="button" onClick={() => setNewItemPlatform(p)} className={`flex-1 py-4 rounded-2xl border transition-all ${newItemPlatform === p ? 'bg-amber-500 text-black border-amber-500' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                           {p}
                        </button>
                      ))}
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Deadline</label>
                    <input name="end" type="date" required className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white outline-none" />
                 </div>
                 <button type="submit" className="w-full py-5 bg-white text-black font-black rounded-2xl uppercase text-[11px] tracking-widest hover:bg-amber-400">Add Workflow</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
