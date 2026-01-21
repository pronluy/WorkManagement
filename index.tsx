
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
  Lock,
  LogOut,
  User,
  ShieldCheck,
  Coins,
  Key,
  ExternalLink,
  Table as TableIcon
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import * as XLSX from "https://esm.sh/xlsx";

// --- Types ---
type Platform = 'TikTok' | 'Facebook' | 'Telegram';
type ContentStatus = 'Idea' | 'Source' | 'Editing' | 'Ready' | 'Posted';
type TabType = 'dashboard' | 'pipeline' | 'ai' | 'notes' | 'storage' | 'accounts';

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
  platform: Platform;
  status: ContentStatus;
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
  url: string;
  uploadedAt: string;
  data?: any[][]; // For spreadsheet data
}

// --- Mock Data ---
const INITIAL_ACCOUNTS: Account[] = [
  { id: 'tt-1', name: 'Main Buzz', platform: 'TikTok', niche: 'Movies', followers: 4500, targetFollowers: 10000, views: 125000, targetViews: 500000 },
  { id: 'tt-2', name: 'Meme Central', platform: 'TikTok', niche: 'Memes', followers: 2300, targetFollowers: 5000, views: 89000, targetViews: 200000 },
  { id: 'fb-1', name: 'Lifestyle Page', platform: 'Facebook', niche: 'Lifestyle', followers: 1200, targetFollowers: 10000, views: 15000, targetViews: 100000 },
  { id: 'tg-1', name: 'News Hub', platform: 'Telegram', niche: 'News', followers: 800, targetFollowers: 10000, views: 4200, targetViews: 20000 },
];

const INITIAL_WORKFLOW: WorkflowItem[] = [
  { id: 'w1', title: 'Funny Cat Video Re-edit', platform: 'TikTok', status: 'Editing', endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'w2', title: 'Movie Scene Breakdown', platform: 'Facebook', status: 'Idea', endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
];

const PLATFORMS: Platform[] = ['TikTok', 'Facebook', 'Telegram'];

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [workflow, setWorkflow] = useState<WorkflowItem[]>(INITIAL_WORKFLOW);
  const [notes, setNotes] = useState<Note[]>([]);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [viewingFile, setViewingFile] = useState<StoredFile | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newItemPlatform, setNewItemPlatform] = useState<Platform>('TikTok');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'pronluy' && password === 'luy372004') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  const PlatformIcon = ({ platform, className = "" }: { platform: Platform, className?: string }) => {
    switch (platform) {
      case 'TikTok': return <Music2 className={`${className} text-pink-500`} size={18} />;
      case 'Facebook': return <Facebook className={`${className} text-blue-500`} size={18} />;
      case 'Telegram': return <TelegramIcon className={`${className} text-sky-500`} size={18} />;
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user' as const, text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsAiLoading(true);
    
    setTimeout(() => {
      setChatHistory(prev => [...prev, { role: 'model', text: "⚠️ ប្រព័ន្ធ AI កំពុងត្រូវបានផ្អាកដំណើរការបណ្ដោះអាសន្ន។ សូមប្រើប្រាស់មុខងារគ្រប់គ្រងការងារផ្សេងៗទៀត។" }]);
      setIsAiLoading(false);
    }, 1000);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleSaveAccountEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    setAccounts(prev => prev.map(a => a.id === editingAccount.id ? editingAccount : a));
    setEditingAccount(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded) return;

    for (const file of Array.from(uploaded)) {
      const reader = new FileReader();
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');
      
      reader.onload = async (event) => {
        let spreadsheetData: any[][] | undefined = undefined;
        let fileUrl = "";

        if (isExcel) {
          try {
            const data = event.target?.result;
            // Using raw: false tells the library to use the formatted text (e.g. 1/20/2026) instead of raw values (e.g. 46042)
            const workbook = XLSX.read(data, { type: isExcel ? 'array' : 'binary', cellDates: true, cellNF: true });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            spreadsheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];
            
            // For Excel files, generate a blob URL if it was read as array buffer
            const blob = new Blob([data as ArrayBuffer], { type: file.type });
            fileUrl = URL.createObjectURL(blob);
          } catch (err) {
            console.error("Excel Parsing Error", err);
          }
        } else {
          fileUrl = event.target?.result as string;
        }

        const newFile: StoredFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: `${(file.size / 1024).toFixed(1)} KB`,
          url: fileUrl,
          uploadedAt: new Date().toISOString(),
          data: spreadsheetData
        };
        setFiles(prev => [newFile, ...prev]);
      };

      if (isExcel) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsDataURL(file);
      }
    }
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="flex flex-col items-center text-center">
            <div className="relative w-24 h-24 rounded-full border-4 border-amber-500 bg-slate-900 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.2)] mb-6">
              <span className="text-amber-500 font-black text-4xl tracking-tighter">PL</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Pron Luy</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.5em] opacity-80">Secure Access Protocol</p>
          </div>
          <form onSubmit={handleLogin} className="bg-slate-900/40 border border-slate-800/50 p-10 rounded-[3rem] space-y-6 backdrop-blur-xl">
            {loginError && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-3"><AlertCircle size={16} /> {loginError}</div>}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all" />
            </div>
            <button type="submit" className="w-full py-5 bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-black font-black rounded-2xl uppercase text-[11px] tracking-[0.3em] shadow-xl transition-all">Unlock System</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-300 font-sans">
      <aside className="fixed left-0 top-0 bottom-0 w-20 md:w-64 bg-slate-950 border-r border-slate-900 z-50 flex flex-col">
        <div className="p-8 flex items-center gap-4">
           <div className="relative w-12 h-12 rounded-full border-2 border-amber-500/50 bg-slate-900 flex items-center justify-center shadow-lg group cursor-pointer" onClick={() => setActiveTab('dashboard')}>
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
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all group ${activeTab === tab.id ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-lg' : 'hover:bg-slate-900 text-slate-500'}`}>
              <tab.icon size={20} className={activeTab === tab.id ? 'text-amber-500' : 'group-hover:text-slate-300'} />
              <span className="font-bold text-xs hidden md:block uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-900">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 p-3.5 rounded-2xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all">
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
          <button onClick={() => setIsAddingItem(true)} className="bg-white text-black px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-400 transition-all shadow-xl">New Idea</button>
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
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {accounts.map(acc => (
                      <div key={acc.id} onClick={() => setEditingAccount(acc)} className="bg-slate-950 border border-slate-800 p-5 rounded-3xl hover:border-amber-500/40 transition-all group cursor-pointer">
                        <div className="flex justify-between items-start mb-4">
                          <PlatformIcon platform={acc.platform} className="scale-75" />
                          <Edit2 size={12} className="text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-white font-black text-[12px] truncate mb-3">{acc.name}</p>
                        <div className="space-y-3">
                          <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase"><span>FLW</span><span className="text-amber-500">{formatNumber(acc.followers)}</span></div>
                          <div className="w-full bg-slate-900 h-1 rounded-full"><div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (acc.followers/acc.targetFollowers)*100)}%` }} /></div>
                          <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase"><span>VWS</span><span className="text-sky-400">{formatNumber(acc.views)}</span></div>
                          <div className="w-full bg-slate-900 h-1 rounded-full"><div className="h-full bg-sky-500" style={{ width: `${Math.min(100, (acc.views/acc.targetViews)*100)}%` }} /></div>
                        </div>
                      </div>
                    ))}
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

          {activeTab === 'ai' && (
            <div className="max-w-5xl mx-auto animate-in fade-in duration-700">
               <div className="bg-slate-900/40 border border-slate-800/80 p-10 rounded-[3rem] min-h-[650px] flex flex-col relative overflow-hidden backdrop-blur-xl">
                  <div className="flex items-center gap-6 mb-12">
                     <div className="p-5 bg-amber-500 text-black rounded-3xl shadow-xl shadow-amber-500/10"><Sparkles size={32} /></div>
                     <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest">AI Strategist</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Creative Brain Offline</p>
                     </div>
                  </div>
                  <div className="flex-grow space-y-8 overflow-y-auto mb-10 pr-4">
                    {chatHistory.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30 grayscale">
                        <BrainCircuit size={80} className="text-amber-500" />
                        <p className="font-black text-sm uppercase tracking-[0.6em]">System Awaiting Command...</p>
                      </div>
                    )}
                    {chatHistory.map((m, i) => (
                      <div key={i} className={`flex flex-col gap-3 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-6 rounded-[2rem] max-w-[80%] text-sm font-khmer leading-relaxed ${m.role === 'user' ? 'bg-amber-500 text-black font-bold shadow-xl' : 'bg-slate-800/80 text-slate-200 border border-slate-700/50'}`}>
                           {m.text}
                        </div>
                      </div>
                    ))}
                    {isAiLoading && <div className="flex items-center gap-4 text-amber-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse"><Loader2 size={16} className="animate-spin" /> Core Brain Processing...</div>}
                  </div>
                  <div className="flex gap-4 bg-black/40 p-3 rounded-[2.5rem] border border-slate-800/50 shadow-inner">
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="Ask for strategy or ideas..." className="flex-grow bg-transparent px-6 py-4 text-white text-sm outline-none placeholder:text-slate-800" />
                    <button onClick={handleChat} disabled={!chatInput.trim() || isAiLoading} className="bg-white text-black p-4 rounded-full hover:bg-amber-400 transition-all shadow-lg">
                       <Send size={24} />
                    </button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
               <div className="bg-slate-900/40 border border-slate-800 p-10 rounded-[3rem]">
                  <textarea value={newNoteContent} onChange={e => setNewNoteContent(e.target.value)} placeholder="Log your success or strategy thoughts..." className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] p-8 text-white text-sm font-khmer min-h-[160px] outline-none focus:border-amber-500/50" />
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
                             {n.platform && <PlatformIcon platform={n.platform} />}
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
                </div>
                {PLATFORMS.map(platform => (
                  <div key={platform} className="space-y-8">
                     <div className="flex items-center gap-6"><PlatformIcon platform={platform} className="scale-150" /><h3 className="text-[12px] font-black text-white uppercase tracking-[0.5em]">{platform} Ecosystem</h3><div className="flex-grow h-px bg-slate-900" /></div>
                     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {accounts.filter(a => a.platform === platform).map(a => (
                          <div key={a.id} onClick={() => setEditingAccount(a)} className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem] hover:border-amber-500/40 transition-all group cursor-pointer">
                             <div className="flex justify-between mb-4">
                                <p className="text-white font-black text-[14px] truncate">{a.name}</p>
                                <Edit2 size={12} className="text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                             </div>
                             <div className="space-y-4">
                               <div className="flex justify-between text-[9px] font-black text-slate-500"><span>F</span><span className="text-amber-500">{formatNumber(a.followers)}</span></div>
                               <div className="flex justify-between text-[9px] font-black text-slate-500"><span>V</span><span className="text-sky-400">{formatNumber(a.views)}</span></div>
                             </div>
                          </div>
                        ))}
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
                     <input 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search digital assets..." 
                      className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] pl-16 pr-6 py-4 text-sm text-white outline-none focus:border-amber-500/40 transition-all" 
                     />
                  </div>
                  <label className="flex items-center gap-4 bg-white text-black px-12 py-4.5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] cursor-pointer hover:bg-amber-400 transition-all">
                     <UploadCloud size={24} /> Upload Content
                     <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                  </label>
               </div>
               
               {filteredFiles.length === 0 ? (
                 <div className="text-center py-40 border-2 border-dashed border-slate-900 rounded-[4rem] opacity-20 grayscale">
                    <HardDrive size={80} className="mx-auto mb-8 text-amber-500" />
                    <p className="font-black text-lg uppercase tracking-[0.6em]">{searchQuery ? 'No results found' : 'Digital Vault Empty'}</p>
                    <p className="text-xs uppercase font-bold mt-2">Upload assets to see them here.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    {filteredFiles.map(file => (
                      <div key={file.id} className="group relative bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem] hover:border-amber-500/40 transition-all hover:-translate-y-1">
                         <div 
                          className="w-full aspect-square bg-slate-950 rounded-2xl mb-4 flex items-center justify-center overflow-hidden cursor-pointer"
                          onClick={() => setViewingFile(file)}
                         >
                            {file.type.startsWith('image/') ? (
                              <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                            ) : file.type.includes('pdf') || file.name.endsWith('.pdf') ? (
                              <FileIcon size={40} className="text-red-500" />
                            ) : file.data ? (
                              <FileSpreadsheet size={40} className="text-emerald-500" />
                            ) : (
                              <FileIcon size={40} className="text-slate-700" />
                            )}
                         </div>
                         <div className="space-y-1">
                            <p className="text-white font-bold text-xs truncate" title={file.name}>{file.name}</p>
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{file.size}</span>
                              <button 
                                onClick={() => setFiles(prev => prev.filter(f => f.id !== file.id))}
                                className="text-slate-700 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}
        </section>
      </main>

      {/* Adding Idea Modal */}
      {isAddingItem && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/98 backdrop-blur-2xl animate-in fade-in duration-300">
           <div className="bg-slate-950 border border-slate-800 w-full max-w-2xl rounded-[4rem] p-16 shadow-[0_0_100px_rgba(245,158,11,0.1)] relative">
              <button onClick={() => setIsAddingItem(false)} className="absolute top-8 right-8 p-4 text-slate-600 hover:text-white transition-all"><X size={32} /></button>
              <h2 className="text-4xl font-black text-white tracking-tighter mb-12 uppercase">Inject Viral Idea</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const newItem: WorkflowItem = {
                  id: Math.random().toString(),
                  title: fd.get('title') as string,
                  platform: newItemPlatform,
                  status: 'Idea',
                  endDate: fd.get('end') as string
                };
                setWorkflow(prev => [...prev, newItem]);
                setIsAddingItem(false);
              }} className="space-y-10">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] px-2">Concept Title</label>
                    <input name="title" required placeholder="Describe your idea..." className="w-full bg-slate-900 border border-slate-800 rounded-3xl px-8 py-5 text-white focus:border-amber-500 outline-none transition-all" />
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
                       <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] px-2">End Cycle</label>
                       <input name="end" type="date" required defaultValue={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white outline-none" />
                    </div>
                 </div>
                 <button type="submit" className="w-full py-6 bg-white text-black font-black rounded-3xl uppercase text-[12px] tracking-[0.5em] shadow-2xl hover:bg-amber-400 transition-all mt-6">Confirm Workflow</button>
              </form>
           </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/98 backdrop-blur-2xl animate-in fade-in duration-300">
           <div className="bg-slate-950 border border-slate-800 w-full max-w-2xl rounded-[4rem] p-16 shadow-[0_0_100px_rgba(56,189,248,0.1)] relative">
              <button onClick={() => setEditingAccount(null)} className="absolute top-8 right-8 p-4 text-slate-600 hover:text-white transition-all"><X size={32} /></button>
              <h2 className="text-4xl font-black text-white tracking-tighter mb-12 uppercase flex items-center gap-4">
                <PlatformIcon platform={editingAccount.platform} className="scale-125" />
                Edit Account
              </h2>
              <form onSubmit={handleSaveAccountEdit} className="space-y-8">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] px-2">Name</label>
                        <input value={editingAccount.name} onChange={e => setEditingAccount({...editingAccount, name: e.target.value})} required className="w-full bg-slate-900 border border-slate-800 rounded-3xl px-8 py-4 text-white focus:border-amber-500 outline-none" />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] px-2">Niche</label>
                        <input value={editingAccount.niche} onChange={e => setEditingAccount({...editingAccount, niche: e.target.value})} required className="w-full bg-slate-900 border border-slate-800 rounded-3xl px-8 py-4 text-white focus:border-amber-500 outline-none" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-amber-500/80 uppercase tracking-[0.4em] px-2">Followers</label>
                        <input type="number" value={editingAccount.followers} onChange={e => setEditingAccount({...editingAccount, followers: parseInt(e.target.value) || 0})} required className="w-full bg-slate-900 border border-slate-800 rounded-3xl px-8 py-4 text-white focus:border-amber-500 outline-none" />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] px-2">Target Followers</label>
                        <input type="number" value={editingAccount.targetFollowers} onChange={e => setEditingAccount({...editingAccount, targetFollowers: parseInt(e.target.value) || 1})} required className="w-full bg-slate-900 border border-slate-800 rounded-3xl px-8 py-4 text-white focus:border-amber-500 outline-none" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-sky-400/80 uppercase tracking-[0.4em] px-2">Views</label>
                        <input type="number" value={editingAccount.views} onChange={e => setEditingAccount({...editingAccount, views: parseInt(e.target.value) || 0})} required className="w-full bg-slate-900 border border-slate-800 rounded-3xl px-8 py-4 text-white focus:border-amber-500 outline-none" />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] px-2">Target Views</label>
                        <input type="number" value={editingAccount.targetViews} onChange={e => setEditingAccount({...editingAccount, targetViews: parseInt(e.target.value) || 1})} required className="w-full bg-slate-900 border border-slate-800 rounded-3xl px-8 py-4 text-white focus:border-amber-500 outline-none" />
                    </div>
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setEditingAccount(null)} className="flex-1 py-5 border border-slate-800 text-slate-500 font-black rounded-3xl uppercase text-[12px] tracking-[0.5em] hover:bg-slate-900">Cancel</button>
                    <button type="submit" className="flex-2 py-5 bg-white text-black font-black rounded-3xl uppercase text-[12px] tracking-[0.5em] shadow-2xl hover:bg-amber-400">Update Stats</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Modern Enhanced File Viewer Modal */}
      {viewingFile && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-300">
           <div className="bg-slate-950 border border-slate-800 w-full max-w-[95vw] h-[90vh] rounded-[4rem] p-8 md:p-12 shadow-[0_0_150px_rgba(245,158,11,0.05)] relative flex flex-col">
              <button onClick={() => setViewingFile(null)} className="absolute top-8 right-8 p-4 text-slate-600 hover:text-white transition-all z-50 bg-black/40 rounded-full"><X size={32} /></button>
              
              <div className="flex-grow flex flex-col md:flex-row gap-8 md:gap-12 overflow-hidden">
                <div className="flex-grow bg-black/80 rounded-[2.5rem] flex items-center justify-center overflow-auto border border-white/5 relative shadow-inner">
                    {viewingFile.type.startsWith('image/') ? (
                      <img src={viewingFile.url} alt={viewingFile.name} className="max-w-full max-h-full object-contain p-4" />
                    ) : viewingFile.type.includes('pdf') || viewingFile.name.endsWith('.pdf') ? (
                      <iframe src={viewingFile.url} title={viewingFile.name} className="w-full h-full border-none rounded-[2rem]" />
                    ) : viewingFile.data ? (
                      <div className="w-full h-full bg-slate-950 p-6 md:p-10 overflow-auto">
                        <div className="min-w-full inline-block align-middle">
                          <table className="min-w-full divide-y divide-slate-800 border-collapse">
                            <thead className="sticky top-0 bg-slate-950 z-10">
                              <tr>
                                {viewingFile.data[0]?.map((header, idx) => (
                                  <th key={idx} className="px-6 py-4 text-left text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] bg-slate-900/50 border border-slate-800">
                                    {header || `Col ${idx + 1}`}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900 bg-transparent">
                              {viewingFile.data.slice(1).map((row, rowIdx) => (
                                <tr key={rowIdx} className="hover:bg-white/5 transition-colors">
                                  {row.map((cell, cellIdx) => (
                                    <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-[12px] text-slate-300 border border-slate-900 font-medium">
                                      {cell?.toString() || ''}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-8 p-20 text-center">
                        <FileIcon size={140} className="text-slate-800" />
                        <div className="space-y-4">
                          <h4 className="text-white font-black uppercase tracking-widest">Full Preview Unavailable</h4>
                          <p className="text-slate-500 text-xs font-bold leading-relaxed max-w-xs mx-auto">This file type is indexed but cannot be parsed for live view. Use External Link to try system-native viewing.</p>
                        </div>
                      </div>
                    )}
                </div>
                
                <div className="w-full md:w-96 flex flex-col justify-center shrink-0">
                   <div className="mb-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                           {viewingFile.data ? <TableIcon size={24} /> : <FileIcon size={24} />}
                        </div>
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em]">Asset Metadata</span>
                      </div>
                      <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-tight break-all">{viewingFile.name}</h3>
                   </div>
                   
                   <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/30 p-5 rounded-[1.5rem] border border-white/5">
                           <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">Digital Size</label>
                           <p className="text-white font-black text-[14px]">{viewingFile.size}</p>
                        </div>
                        <div className="bg-slate-900/30 p-5 rounded-[1.5rem] border border-white/5">
                           <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">Format</label>
                           <p className="text-white font-black text-[14px] truncate">{viewingFile.type.split('/')[1] || 'Unknown'}</p>
                        </div>
                      </div>
                      
                      <div className="bg-slate-900/30 p-5 rounded-[1.5rem] border border-white/5">
                         <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">Uploaded Cycle</label>
                         <p className="text-white font-black text-[14px]">{new Date(viewingFile.uploadedAt).toLocaleString()}</p>
                      </div>
                      
                      <div className="pt-6 flex flex-col gap-4">
                        <button 
                          onClick={() => {
                            const newWindow = window.open();
                            if (newWindow) {
                              newWindow.document.write(`<iframe src="${viewingFile.url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                              newWindow.document.title = viewingFile.name;
                            }
                          }}
                          className="w-full py-5 bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black rounded-2xl uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-amber-500 hover:text-black transition-all"
                        >
                          <ExternalLink size={18} /> Focus Mode (New Window)
                        </button>
                        <a href={viewingFile.url} download={viewingFile.name} className="w-full py-5 bg-white text-black font-black rounded-2xl uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-amber-400 transition-all shadow-xl shadow-white/5">
                          <Download size={18} /> Secure Download
                        </a>
                        <button 
                          onClick={() => { setFiles(prev => prev.filter(f => f.id !== viewingFile.id)); setViewingFile(null); }}
                          className="w-full py-5 bg-red-500/10 text-red-500 border border-red-500/20 font-black rounded-2xl uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 size={18} /> Purge Object
                        </button>
                      </div>
                   </div>
                </div>
              </div>
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
