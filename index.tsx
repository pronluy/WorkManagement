
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
  Coins
} from 'lucide-react';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from "@google/genai";

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
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string; sources?: any[] }[]>([]);
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Simulate a realistic daily stat update for a ${account.platform} account (${account.niche}). 
                  Current Followers: ${account.followers}, Views: ${account.views}. 
                  Return JSON: {"followers": number, "views": number}`,
        config: { responseMimeType: 'application/json' }
      });
      const newStats = JSON.parse(response.text || '{}');
      if (newStats.followers && newStats.views) {
        updateAccountStats(id, { followers: newStats.followers, views: newStats.views, lastSynced: new Date().toLocaleTimeString() });
      }
    } catch (e) {
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

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const driveContext = files.map(f => `File: ${f.name} - Content: ${f.content}`).join('\n');
    const userMsg = { role: 'user' as const, text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [...chatHistory, userMsg].map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        config: {
          systemInstruction: `You are the Official AI Strategist for Pron Luy. Use internal data: ${driveContext}. Use Google Search for trends. Help with TikTok, Facebook, Telegram growth. Use Khmer if appropriate.`,
          tools: [{ googleSearch: {} }]
        },
      });
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      setChatHistory(prev => [...prev, { role: 'model', text: response.text || 'Thinking...', sources }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'model', text: 'Connection to Brain Matrix lost. Check API settings.' }]);
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
            <div className="relative w-24 h-24 rounded-full border-4 border-amber-500 bg-gradient-to-br from-slate-900 to-black flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.2)] group mb-6 overflow-hidden">
               <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
               <div className="flex items-baseline gap-0.5 z-10">
                  <span className="text-amber-500 font-black text-4xl tracking-tighter drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">P</span>
                  <span className="text-amber-500 font-black text-4xl tracking-tighter drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">L</span>
               </div>
               <Coins size={14} className="absolute top-4 right-4 text-amber-500/60" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Pron Luy</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.5em] opacity-80">Security Protocol Activated</p>
          </div>

          <form onSubmit={handleLogin} className="bg-slate-900/40 border border-slate-800/50 p-10 rounded-[3rem] space-y-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px]" />
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
                placeholder="········"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 outline-none transition-all placeholder:text-slate-900"
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
                placeholder="········"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 outline-none transition-all placeholder:text-slate-900"
              />
            </div>
            <button type="submit" className="w-full py-5 bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-black font-black rounded-2xl uppercase text-[11px] tracking-[0.3em] shadow-xl shadow-amber-500/10 transition-all transform active:scale-95 flex items-center justify-center gap-3">
              <ShieldCheck size={18} /> Unlock System
            </button>
          </form>

          <div className="flex justify-center gap-4 text-slate-700 text-[9px] font-black uppercase tracking-widest">
            <span>© 2025 PRON LUY PORTFOLIO</span>
            <span className="opacity-30">•</span>
            <span>SECURE ACCESS ONLY</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-300 font-sans selection:bg-amber-500/30">
      <aside className="fixed left-0 top-0 bottom-0 w-20 md:w-64 bg-slate-950 border-r border-slate-900 z-50 flex flex-col">
        <div className="p-8 flex items-center gap-4">
           <div className="relative w-12 h-12 rounded-full border-2 border-amber-500/50 bg-slate-900 flex items-center justify-center shadow-lg group cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="flex items-baseline gap-0.2">
                <span className="text-amber-500 font-black text-lg tracking-tighter">P</span>
                <span className="text-amber-500 font-black text-lg tracking-tighter">L</span>
              </div>
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
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all group ${activeTab === tab.id ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-lg shadow-amber-500/5' : 'hover:bg-slate-900 text-slate-500'}`}>
              <tab.icon size={20} className={activeTab === tab.id ? 'text-amber-500' : 'group-hover:text-slate-300'} />
              <span className="font-bold text-xs hidden md:block uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-900">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 p-3.5 rounded-2xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all group">
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
            <button className={`p-4 rounded-2xl bg-slate-900/50 border transition-all ${notifications.length > 0 ? 'border-red-500/40 text-red-500 animate-pulse' : 'border-slate-800 text-slate-500'}`}>
              <Bell size={20} />
            </button>
            <button onClick={() => setIsAddingItem(true)} className="bg-white text-black px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-400 transition-all shadow-xl shadow-white/5">
              New Idea
            </button>
          </div>
        </header>

        <section className="px-8 md:px-12 pb-24">
          {activeTab === 'dashboard' && (
            <div className="space-y-12 animate-in fade-in duration-700">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {PLATFORMS.map(p => {
                  const pAccs = accounts.filter(a => a.platform === p);
                  const totalF = pAccs.reduce((s, a) => s + a.followers, 0);
                  return (
                    <div key={p} className="bg-slate-900/40 border border-slate-800/60 p-10 rounded-[2.5rem] relative overflow-hidden group hover:border-amber-500/30 transition-all">
                       <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:scale-110 transition-transform"><PlatformIcon platform={p as Platform} className="w-32 h-32" /></div>
                       <PlatformIcon platform={p as Platform} className="mb-8 scale-150 origin-left" />
                       <div className="space-y-2">
                          <h3 className="text-4xl font-black text-white">{formatNumber(totalF)}</h3>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{p} Network</p>
                       </div>
                    </div>
                  );
                })}
               </div>
               <div className="space-y-8">
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-4">
                    <TrendingUp size={16} className="text-amber-500" /> Account Live Matrix
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {accounts.map(acc => (
                      <div key={acc.id} className="bg-slate-950 border border-slate-800 p-5 rounded-3xl hover:border-amber-500/40 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <PlatformIcon platform={acc.platform} className="scale-75" />
                          <button onClick={() => syncAccountStats(acc.id)} className={`text-slate-600 hover:text-white ${syncingId === acc.id ? 'animate-spin' : ''}`}>
                            <RefreshCw size={12} />
                          </button>
                        </div>
                        <p className="text-white font-black text-[12px] truncate mb-3">{acc.name}</p>
                        <div className="space-y-3">
                          <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase"><span>FLW</span><span className="text-amber-500">{formatNumber(acc.followers)}</span></div>
                          <div className="w-full bg-slate-900 h-1 rounded-full"><div className="h-full bg-amber-500" style={{ width: `${(acc.followers/acc.targetFollowers)*100}%` }} /></div>
                          <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase"><span>VWS</span><span className="text-sky-400">{formatNumber(acc.views)}</span></div>
                          <div className="w-full bg-slate-900 h-1 rounded-full"><div className="h-full bg-sky-500" style={{ width: `${(acc.views/acc.targetViews)*100}%` }} /></div>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="bg-slate-900/40 border border-slate-800/80 p-10 rounded-[3rem] min-h-[650px] flex flex-col relative overflow-hidden backdrop-blur-xl">
                  <div className="absolute top-0 right-0 p-6 flex gap-3">
                    <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse">
                       <Zap size={10} fill="currentColor" /> Neural Core Online
                    </span>
                  </div>
                  <div className="flex items-center gap-6 mb-12">
                     <div className="p-5 bg-amber-500 text-black rounded-3xl shadow-xl shadow-amber-500/10"><Sparkles size={32} /></div>
                     <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest">AI Strategy Engine</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Powered by Gemini 3 Pro & Google Search</p>
                     </div>
                  </div>
                  <div className="flex-grow space-y-8 overflow-y-auto mb-10 pr-4 scrollbar-hide">
                    {chatHistory.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30 grayscale">
                        <BrainCircuit size={80} className="text-amber-500" />
                        <p className="font-black text-sm uppercase tracking-[0.6em]">System Awaiting Command...</p>
                      </div>
                    )}
                    {chatHistory.map((m, i) => (
                      <div key={i} className={`flex flex-col gap-3 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-6 rounded-[2rem] max-w-[80%] text-sm leading-relaxed ${m.role === 'user' ? 'bg-amber-500 text-black font-bold shadow-xl shadow-amber-500/5' : 'bg-slate-800/80 text-slate-200 border border-slate-700/50'}`}>
                           {m.text}
                        </div>
                        {m.sources && m.sources.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                             {m.sources.map((s, idx) => s.web && (
                               <a key={idx} href={s.web.uri} target="_blank" rel="noreferrer" className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-[9px] text-sky-400 hover:text-white transition-all flex items-center gap-2">
                                  <LinkIcon size={10} /> Research {idx + 1}
                               </a>
                             ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {isAiLoading && <div className="flex items-center gap-4 text-amber-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse"><Loader2 size={16} className="animate-spin" /> Core Brain Processing Trends...</div>}
                  </div>
                  <div className="flex gap-4 bg-black/40 p-3 rounded-[2.5rem] border border-slate-800/50 shadow-inner">
                    <input 
                      value={chatInput} 
                      onChange={e => setChatInput(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleChat()}
                      placeholder="Ask the machine to solve growth obstacles..." 
                      className="flex-grow bg-transparent px-6 py-4 text-white text-sm outline-none placeholder:text-slate-800" 
                    />
                    <button onClick={handleChat} disabled={!chatInput.trim() || isAiLoading} className="bg-white text-black p-4 rounded-full hover:bg-amber-400 transition-all shadow-lg active:scale-90">
                       <Send size={24} />
                    </button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'pipeline' && (
            <div className="flex gap-10 overflow-x-auto pb-12 snap-x animate-in fade-in duration-700">
               {(['Idea', 'Source', 'Editing', 'Ready', 'Posted'] as ContentStatus[]).map(stage => (
                 <div key={stage} className="flex-shrink-0 w-85 bg-slate-900/30 border border-slate-800/60 rounded-[3.5rem] p-8 snap-start min-h-[60vh]">
                    <div className="flex justify-between items-center mb-10 px-2">
                       <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.4em]">{stage}</h4>
                       <span className="bg-white/5 border border-white/10 px-4 py-1 rounded-full text-[10px] text-white font-black">{workflow.filter(w => w.status === stage).length}</span>
                    </div>
                    <div className="space-y-6">
                       {workflow.filter(w => w.status === stage).map(item => (
                         <div key={item.id} className="bg-slate-800/60 p-7 rounded-[2.5rem] border border-slate-700/50 hover:border-amber-500/30 transition-all group shadow-xl">
                            <div className="flex justify-between items-center mb-5"><PlatformIcon platform={item.platform} /><button onClick={() => setWorkflow(prev => prev.filter(x => x.id !== item.id))} className="text-slate-700 hover:text-red-500"><Trash2 size={14} /></button></div>
                            <p className="text-white font-bold text-[14px] leading-relaxed mb-6">{item.title}</p>
                            <div className="flex items-center gap-2 text-[9px] text-amber-500/80 font-black uppercase tracking-widest bg-amber-500/5 w-fit px-3 py-1.5 rounded-xl border border-amber-500/10"><Clock size={12} /> {new Date(item.endDate).toLocaleDateString()}</div>
                            {stage !== 'Posted' && (
                              <button onClick={() => {
                                const stages: ContentStatus[] = ['Idea', 'Source', 'Editing', 'Ready', 'Posted'];
                                const nextIdx = stages.indexOf(stage) + 1;
                                setWorkflow(prev => prev.map(x => x.id === item.id ? { ...x, status: stages[nextIdx] } : x));
                              }} className="mt-8 w-full py-4 bg-slate-950/80 text-slate-400 hover:bg-white hover:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Move Forward</button>
                            )}
                         </div>
                       ))}
                       {stage === 'Idea' && (
                         <button onClick={() => setIsAddingItem(true)} className="w-full py-20 border-2 border-dashed border-slate-800/40 rounded-[3rem] text-slate-800 hover:border-amber-500/30 hover:text-amber-500/50 transition-all flex flex-col items-center justify-center gap-4">
                            <Plus size={40} />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">New Entry</span>
                         </button>
                       )}
                    </div>
                 </div>
               ))}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
               <div className="bg-slate-900/40 border border-slate-800 p-10 rounded-[3rem]">
                  <textarea 
                    value={newNoteContent} 
                    onChange={e => setNewNoteContent(e.target.value)} 
                    placeholder="Log your success or strategy thoughts... AI will remember." 
                    className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] p-8 text-white text-sm font-khmer min-h-[160px] outline-none focus:border-amber-500/50" 
                  />
                  <div className="flex justify-between items-center mt-8">
                     <div className="flex gap-4">
                        {PLATFORMS.map(p => <button key={p} onClick={() => setNewItemPlatform(p)} className={`p-4 rounded-2xl border transition-all ${newItemPlatform === p ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10' : 'bg-slate-900 border-slate-800 text-slate-600'}`}><PlatformIcon platform={p} className={newItemPlatform === p ? 'brightness-50' : ''} /></button>)}
                     </div>
                     <button onClick={() => {
                       if (!newNoteContent.trim()) return;
                       setNotes([{ id: Math.random().toString(), content: newNoteContent, platform: newItemPlatform, createdAt: new Date().toISOString() }, ...notes]);
                       setNewNoteContent('');
                     }} className="px-12 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-400 transition-all shadow-xl">Save Log</button>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {notes.map(n => (
                    <div key={n.id} className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] relative group hover:border-amber-500/20 transition-all">
                       <div className="flex justify-between items-center mb-6">
                          <div className="flex items-center gap-3">
                             <PlatformIcon platform={n.platform!} />
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{n.platform} Entry</span>
                          </div>
                          <span className="text-[10px] text-slate-700 font-black">{new Date(n.createdAt).toLocaleDateString()}</span>
                       </div>
                       <p className="text-white text-sm font-khmer leading-relaxed whitespace-pre-wrap">{n.content}</p>
                       <button onClick={() => setNotes(prev => prev.filter(x => x.id !== n.id))} className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 text-slate-700 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'accounts' && (
             <div className="space-y-16 animate-in fade-in duration-700">
                <div className="flex justify-between items-center">
                   <h2 className="text-2xl font-black text-white tracking-widest uppercase">Network Management</h2>
                   <button onClick={syncAllAccounts} disabled={isSyncingAll} className="bg-amber-500 text-black px-10 py-3.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-amber-500/10 flex items-center gap-3">
                      <RefreshCw size={16} className={isSyncingAll ? 'animate-spin' : ''} /> Sync Neural Stats
                   </button>
                </div>
                {PLATFORMS.map(platform => (
                  <div key={platform} className="space-y-8">
                     <div className="flex items-center gap-6"><PlatformIcon platform={platform} className="scale-150" /><h3 className="text-[12px] font-black text-white uppercase tracking-[0.5em]">{platform} Ecosystem</h3><div className="flex-grow h-px bg-slate-900" /></div>
                     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {accounts.filter(a => a.platform === platform).map(a => (
                          <div key={a.id} className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem] hover:border-amber-500/40 transition-all group">
                             <p className="text-white font-black text-[14px] mb-4 truncate">{a.name}</p>
                             <div className="space-y-4">
                               <div className="flex justify-between text-[9px] font-black text-slate-500"><span>F</span><span className="text-amber-500">{formatNumber(a.followers)}</span></div>
                               <div className="flex justify-between text-[9px] font-black text-slate-500"><span>V</span><span className="text-sky-400">{formatNumber(a.views)}</span></div>
                             </div>
                             <div className="mt-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="text-slate-600 hover:text-white"><Edit2 size={12} /></button>
                                <button onClick={() => syncAccountStats(a.id)} className="text-slate-600 hover:text-amber-500"><RefreshCw size={12} /></button>
                             </div>
                          </div>
                        ))}
                        <button className="border-2 border-dashed border-slate-800/60 rounded-[2rem] flex flex-col items-center justify-center p-8 gap-4 text-slate-800 hover:border-amber-500/30 hover:text-amber-500/50 transition-all">
                           <Plus size={32} />
                           <span className="text-[9px] font-black uppercase tracking-widest">Connect Account</span>
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          )}

          {activeTab === 'storage' && (
            <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
               <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900/30 border border-slate-800/80 p-10 rounded-[3.5rem] gap-10">
                  <div className="relative w-full md:w-110">
                     <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
                     <input placeholder="Search digital assets for AI indexing..." className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] pl-16 pr-6 py-4 text-sm text-white outline-none focus:border-amber-500/40 transition-all" />
                  </div>
                  <label className="flex items-center gap-4 bg-white text-black px-12 py-4.5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] cursor-pointer hover:bg-amber-400 transition-all shadow-xl shadow-white/5">
                     <UploadCloud size={24} /> Feed Matrix
                     <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                  </label>
               </div>
               {files.length === 0 ? (
                 <div className="text-center py-40 border-2 border-dashed border-slate-900 rounded-[4rem] opacity-20 grayscale">
                    <HardDrive size={80} className="mx-auto mb-8 text-amber-500" />
                    <p className="font-black text-lg uppercase tracking-[0.6em]">Drive Storage Offline</p>
                    <p className="text-xs uppercase font-bold mt-2">Zero datasets detected.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                    {files.map(f => (
                      <div key={f.id} className="bg-slate-950 border border-slate-800/80 p-8 rounded-[2.5rem] flex flex-col items-center text-center group relative hover:border-amber-500/40 transition-all hover:-translate-y-2">
                        <button onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))} className="absolute top-4 right-4 text-slate-800 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                        <div className="p-6 bg-slate-900 rounded-[1.5rem] mb-6 text-amber-500/80 group-hover:scale-110 transition-transform"><FileText size={40} /></div>
                        <p className="text-white font-bold text-[13px] truncate w-full mb-1">{f.name}</p>
                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{f.size}</p>
                        <button onClick={() => setSelectedFile(f)} className="mt-6 w-full py-3 bg-slate-900 border border-slate-800 text-slate-500 hover:bg-amber-500 hover:text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Matrix Analysis</button>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}
        </section>
      </main>

      {isAddingItem && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/98 backdrop-blur-2xl animate-in fade-in duration-300">
           <div className="bg-slate-950 border border-slate-800 w-full max-w-2xl rounded-[4rem] p-16 shadow-[0_0_100px_rgba(245,158,11,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                 <button onClick={() => setIsAddingItem(false)} className="p-4 text-slate-600 hover:text-white transition-all"><X size={32} /></button>
              </div>
              <h2 className="text-4xl font-black text-white tracking-tighter mb-12 uppercase">Inject Viral Idea</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                addItemToWorkflow({
                  title: fd.get('title') as string,
                  platform: newItemPlatform,
                  targetId: fd.get('target') as string,
                  startDate: fd.get('start') as string,
                  endDate: fd.get('end') as string
                });
              }} className="space-y-10">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] px-2">Concept Title</label>
                    <input name="title" required placeholder="········" className="w-full bg-slate-900 border border-slate-800 rounded-3xl px-8 py-5 text-white focus:border-amber-500 outline-none transition-all" />
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] px-2">Deployment Hub</label>
                       <div className="flex gap-4">
                          {PLATFORMS.map(p => (
                            <button key={p} type="button" onClick={() => setNewItemPlatform(p)} className={`flex-1 py-5 rounded-3xl border transition-all flex items-center justify-center ${newItemPlatform === p ? 'bg-amber-500 text-black border-amber-500' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                               <PlatformIcon platform={p} className={newItemPlatform === p ? 'brightness-0' : ''} />
                            </button>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] px-2">Target Niche</label>
                       <input name="target" required placeholder="········" className="w-full bg-slate-900 border border-slate-800 rounded-3xl px-8 py-5 text-white focus:border-amber-500 outline-none transition-all" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] px-2">Start Cycle</label>
                       <input name="start" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white outline-none" />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] px-2">End Cycle</label>
                       <input name="end" type="date" required defaultValue={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white outline-none" />
                    </div>
                 </div>
                 <button type="submit" className="w-full py-6 bg-white text-black font-black rounded-3xl uppercase text-[12px] tracking-[0.5em] shadow-2xl hover:bg-amber-400 transition-all mt-6">Confirm Workflow</button>
              </form>
           </div>
        </div>
      )}

      {selectedFile && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-10 bg-black/99 backdrop-blur-3xl animate-in fade-in duration-300">
           <div className="relative w-full h-full max-w-6xl bg-slate-950 border border-slate-800 rounded-[5rem] flex flex-col overflow-hidden">
              <div className="p-12 border-b border-slate-800/50 flex justify-between items-center bg-black/50">
                 <div>
                    <h3 className="text-3xl font-black text-white tracking-tighter">{selectedFile.name}</h3>
                    <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Asset Indexed • Ready for Neural Learning</p>
                 </div>
                 <button onClick={() => setSelectedFile(null)} className="p-4 text-slate-600 hover:text-white transition-all"><X size={40} /></button>
              </div>
              <div className="flex-grow flex flex-col items-center justify-center p-20 text-center">
                 <div className="p-14 bg-slate-900 rounded-[3rem] mb-12 text-amber-500/80 shadow-[0_0_80px_rgba(245,158,11,0.1)] border border-amber-500/10">
                    <FileText size={100} />
                 </div>
                 <h4 className="text-3xl font-black text-white mb-6 tracking-tight uppercase">Asset Metadata Synced</h4>
                 <p className="text-slate-500 max-w-xl text-lg leading-relaxed mb-12">The AI has processed this digital object. You can now use it as a reference for viral content strategy within the Neural Strategy Engine.</p>
                 <div className="flex gap-6">
                    <button onClick={() => { setActiveTab('ai'); setChatInput(`Based on my file "${selectedFile.name}", what viral TikTok hook should I use?`); setSelectedFile(null); }} className="px-14 py-5 bg-white text-black font-black rounded-[2rem] uppercase text-[11px] tracking-[0.3em] hover:bg-amber-400 transition-all shadow-xl shadow-white/5">Analyze via AI</button>
                    <button className="px-14 py-5 border-2 border-slate-800 text-slate-400 font-black rounded-[2rem] uppercase text-[11px] tracking-[0.3em] hover:bg-slate-900 transition-all">Download Asset</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {isAiLoading && (
        <div className="fixed bottom-10 right-10 z-[5000] bg-white text-black px-10 py-6 rounded-[2.5rem] flex items-center gap-5 animate-bounce shadow-2xl border-4 border-amber-500">
           <BrainCircuit size={32} className="text-amber-600 animate-pulse" />
           <span className="font-black text-[11px] tracking-[0.4em] uppercase">Neural Matrix Processing...</span>
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
