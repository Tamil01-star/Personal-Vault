import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  KeyRound,
  Notebook,
  Calendar,
  Mail,
  FileText,
  Plus,
  ArrowRight,
  Search,
  Lock,
  Clock,
  ExternalLink
} from 'lucide-react';

interface Stats {
  passwords: number;
  notes: number;
  diary: number;
  letters: number;
  files: number;
}

interface DashboardProps {
  setCurrentView: (view: string) => void;
  // Hooks to open modal or forms in other sections
  setSelectedRecordId?: (id: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setCurrentView }) => {
  const { apiCall, getStats, user } = useAuth();
  const [stats, setStats] = useState<Stats>({ passwords: 0, notes: 0, diary: 0, letters: 0, files: 0 });
  const [loading, setLoading] = useState(true);
  
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{
    passwords: any[];
    notes: any[];
    diary: any[];
    letters: any[];
    files: any[];
  }>({ passwords: [], notes: [], diary: [], letters: [], files: [] });
  
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch stats
      const statsData = await getStats();
      setStats(statsData);

      // Fetch items for recent activities
      const [pws, nts, dry, ltrs, fls] = await Promise.all([
        apiCall('/passwords').catch(() => []),
        apiCall('/notes').catch(() => []),
        apiCall('/diary').catch(() => []),
        apiCall('/letters').catch(() => []),
        apiCall('/files').catch(() => [])
      ]);

      // Map to activities
      const activities: any[] = [];
      
      pws.slice(0, 3).forEach((item: any) => {
        activities.push({
          type: 'password',
          title: `Added credentials for ${item.website_name}`,
          time: new Date(item.created_at || item.updated_at),
          description: `Username: ${item.username}`,
          viewId: 'passwords'
        });
      });

      nts.slice(0, 3).forEach((item: any) => {
        activities.push({
          type: 'note',
          title: `Updated note "${item.title}"`,
          time: new Date(item.updated_at || item.created_at),
          description: item.content?.replace(/<[^>]*>/g, '').slice(0, 40) + '...',
          viewId: 'notes'
        });
      });

      dry.slice(0, 3).forEach((item: any) => {
        activities.push({
          type: 'diary',
          title: `Wrote diary entry for ${item.entry_date}`,
          time: new Date(item.updated_at || item.created_at),
          description: item.content?.slice(0, 40) + '...',
          viewId: 'diary'
        });
      });

      ltrs.slice(0, 3).forEach((item: any) => {
        activities.push({
          type: 'letter',
          title: `Drafted letter "${item.title}"`,
          time: new Date(item.updated_at || item.created_at),
          description: `Status: ${item.status}`,
          viewId: 'letters'
        });
      });

      fls.slice(0, 3).forEach((item: any) => {
        activities.push({
          type: 'file',
          title: `Uploaded document "${item.filename}"`,
          time: new Date(item.created_at),
          description: `${(item.file_size / 1024).toFixed(1)} KB`,
          viewId: 'documents'
        });
      });

      // Sort activities descending
      activities.sort((a, b) => b.time.getTime() - a.time.getTime());
      setRecentActivities(activities.slice(0, 5));

    } catch (e) {
      console.error('Error fetching dashboard stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Run global search client-side/server-side
  useEffect(() => {
    if (!globalSearch.trim()) {
      setSearchResults({ passwords: [], notes: [], diary: [], letters: [], files: [] });
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const [pws, nts, dry, ltrs, fls] = await Promise.all([
          apiCall(`/passwords?search=${globalSearch}`).catch(() => []),
          apiCall(`/notes?search=${globalSearch}`).catch(() => []),
          apiCall(`/diary?search=${globalSearch}`).catch(() => []),
          apiCall(`/letters?search=${globalSearch}`).catch(() => []),
          apiCall(`/files?search=${globalSearch}`).catch(() => [])
        ]);

        setSearchResults({
          passwords: pws.slice(0, 3),
          notes: nts.slice(0, 3),
          diary: dry.slice(0, 3),
          letters: ltrs.slice(0, 3),
          files: fls.slice(0, 3)
        });
      } catch (err) {
        console.error('Search error', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [globalSearch]);

  const cards = [
    { id: 'passwords', label: 'Credentials', count: stats.passwords, icon: KeyRound, color: 'text-emerald-500 bg-emerald-500/10' },
    { id: 'notes', label: 'Notes', count: stats.notes, icon: Notebook, color: 'text-indigo-500 bg-indigo-500/10' },
    { id: 'diary', label: 'Diaries', count: stats.diary, icon: Calendar, color: 'text-amber-500 bg-amber-500/10' },
    { id: 'letters', label: 'Letters', count: stats.letters, icon: Mail, color: 'text-pink-500 bg-pink-500/10' },
    { id: 'documents', label: 'Documents', count: stats.files, icon: FileText, color: 'text-cyan-500 bg-cyan-500/10' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval}y ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval}mo ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval}d ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval}h ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval}m ago`;
    return 'Just now';
  };

  const hasSearchResults = 
    searchResults.passwords.length > 0 ||
    searchResults.notes.length > 0 ||
    searchResults.diary.length > 0 ||
    searchResults.letters.length > 0 ||
    searchResults.files.length > 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-card/95 border border-primary/10 p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10" />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {getGreeting()}, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase font-extrabold">{user?.username}</span>
          </h2>
          <p className="text-muted-foreground text-xs mt-1 font-medium">
            Welcome back to your private safe. All documents and credentials are fully encrypted.
          </p>
        </div>
        
        {/* Global Search Bar */}
        <div className="relative w-full md:w-80 z-10">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/80">
            <Search size={15} />
          </span>
          <input
            type="text"
            placeholder="Global search in vault..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full premium-input pl-10 pr-4 py-2 text-xs focus:ring-4 focus:ring-primary/10 transition-all"
          />
        </div>
      </div>

      {/* Global Search Dropdown Results */}
      {globalSearch.trim() && (
        <div className="bg-card/90 backdrop-blur-md border border-border rounded-xl shadow-lg p-5">
          <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Search size={16} className="text-primary" />
              Global Search Results for "{globalSearch}"
            </h3>
            <button
              onClick={() => setGlobalSearch('')}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>

          {!loading && !hasSearchResults ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No matching records found in passwords, notes, diaries, letters, or files.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Passwords Results */}
              {searchResults.passwords.map((item) => (
                <div
                  key={item.id}
                  onClick={() => { setCurrentView('passwords'); setGlobalSearch(''); }}
                  className="p-3 bg-card/60 hover:bg-accent border border-border rounded-xl cursor-pointer flex justify-between items-center transition-colors shadow-sm"
                >
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{item.website_name}</h4>
                    <p className="text-[10px] text-muted-foreground truncate">Username: {item.username}</p>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-medium">Password</span>
                </div>
              ))}

              {/* Notes Results */}
              {searchResults.notes.map((item) => (
                <div
                  key={item.id}
                  onClick={() => { setCurrentView('notes'); setGlobalSearch(''); }}
                  className="p-3 bg-card/60 hover:bg-accent border border-border rounded-xl cursor-pointer flex justify-between items-center transition-colors shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-foreground truncate">{item.title}</h4>
                    <p className="text-[10px] text-muted-foreground truncate">Modified: {new Date(item.updated_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-medium ml-2">Note</span>
                </div>
              ))}

              {/* Diary Results */}
              {searchResults.diary.map((item) => (
                <div
                  key={item.id}
                  onClick={() => { setCurrentView('diary'); setGlobalSearch(''); }}
                  className="p-3 bg-card/60 hover:bg-accent border border-border rounded-xl cursor-pointer flex justify-between items-center transition-colors shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-foreground truncate">Entry: {item.entry_date}</h4>
                    <p className="text-[10px] text-muted-foreground truncate">{item.content}</p>
                  </div>
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-medium ml-2">Diary</span>
                </div>
              ))}

              {/* Letters Results */}
              {searchResults.letters.map((item) => (
                <div
                  key={item.id}
                  onClick={() => { setCurrentView('letters'); setGlobalSearch(''); }}
                  className="p-3 bg-card/60 hover:bg-accent border border-border rounded-xl cursor-pointer flex justify-between items-center transition-colors shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-foreground truncate">{item.title}</h4>
                    <p className="text-[10px] text-muted-foreground truncate">Status: {item.status}</p>
                  </div>
                  <span className="text-[10px] bg-pink-500/10 text-pink-500 px-2 py-0.5 rounded-full font-medium ml-2">Letter</span>
                </div>
              ))}

              {/* Files Results */}
              {searchResults.files.map((item) => (
                <div
                  key={item.id}
                  onClick={() => { setCurrentView('documents'); setGlobalSearch(''); }}
                  className="p-3 bg-card/60 hover:bg-accent border border-border rounded-xl cursor-pointer flex justify-between items-center transition-colors shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-foreground truncate">{item.filename}</h4>
                    <p className="text-[10px] text-muted-foreground truncate">Size: {(item.file_size / 1024).toFixed(1)} KB</p>
                  </div>
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-500 px-2 py-0.5 rounded-full font-medium ml-2">File</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => setCurrentView(card.id)}
              className="bg-card/80 backdrop-blur-md border border-border/80 hover:border-primary/30 p-5 rounded-2xl cursor-pointer hover:shadow-md hover:scale-[1.01] hover:bg-card transition-all duration-300 group relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-xl ${card.color} shadow-sm transition-all duration-300 group-hover:scale-105`}>
                  <Icon size={18} />
                </div>
                {loading ? (
                  <span className="w-8 h-8 rounded bg-muted animate-pulse" />
                ) : (
                  <span className="text-2xl font-extrabold tracking-tight text-foreground bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text">{card.count}</span>
                )}
              </div>
              <h3 className="text-xs font-bold text-muted-foreground mt-4 group-hover:text-primary transition-colors tracking-wide uppercase text-[9px]">
                {card.label}
              </h3>
              <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-1 group-hover:translate-x-0 text-primary">
                <ArrowRight size={14} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Recent Activities & Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activities Panel */}
        <div className="bg-card/85 backdrop-blur-md border border-border/80 rounded-2xl shadow-sm p-6 lg:col-span-2 flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
              <Clock size={16} className="text-primary" />
              Recent Vault Activity
            </h3>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex gap-3 py-3 border-b border-border/50 animate-pulse">
                    <div className="w-8 h-8 rounded bg-muted" />
                    <div className="flex-1 space-y-1.5">
                      <div className="w-1/3 h-3 bg-muted rounded" />
                      <div className="w-1/2 h-2.5 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground flex flex-col items-center gap-2">
                <Lock size={28} className="text-muted-foreground/30" />
                No activities yet. Start adding items to your vault.
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {recentActivities.map((act, index) => (
                  <div
                    key={index}
                    onClick={() => setCurrentView(act.viewId)}
                    className="flex items-start gap-4 py-3.5 hover:bg-accent/40 border border-transparent hover:border-border/30 px-3 rounded-xl cursor-pointer transition-all duration-200 group"
                  >
                    <div className="mt-0.5">
                      {act.type === 'password' && <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500"><KeyRound size={14} /></div>}
                      {act.type === 'note' && <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500"><Notebook size={14} /></div>}
                      {act.type === 'diary' && <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500"><Calendar size={14} /></div>}
                      {act.type === 'letter' && <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-500"><Mail size={14} /></div>}
                      {act.type === 'file' && <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500"><FileText size={14} /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-2">
                        <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {act.title}
                        </h4>
                        <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                          {timeAgo(act.time)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {act.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="border-t border-border mt-4 pt-3.5 flex justify-end">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
              <Lock size={10} /> Fully Encrypted SSL connection active
            </span>
          </div>
        </div>

        {/* Shortcuts Panel */}
        <div className="bg-card/80 backdrop-blur-md border border-border/80 rounded-2xl shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow duration-300">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Plus size={16} className="text-primary" />
            Quick Vault Actions
          </h3>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => setCurrentView('passwords')}
              className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-card hover:bg-accent/40 hover:border-primary/20 text-left transition-all duration-200 shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <KeyRound size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Save Password</h4>
                  <p className="text-[10px] text-muted-foreground">Store app or web login</p>
                </div>
              </div>
              <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </button>

            <button
              onClick={() => setCurrentView('notes')}
              className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-card hover:bg-accent/40 hover:border-primary/20 text-left transition-all duration-200 shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Notebook size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Create Draft Note</h4>
                  <p className="text-[10px] text-muted-foreground">Jot down secure ideas</p>
                </div>
              </div>
              <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </button>

            <button
              onClick={() => setCurrentView('diary')}
              className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-card hover:bg-accent/40 hover:border-primary/20 text-left transition-all duration-200 shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <Calendar size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Write Daily Diary</h4>
                  <p className="text-[10px] text-muted-foreground">Record today's log</p>
                </div>
              </div>
              <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </button>

            <button
              onClick={() => setCurrentView('documents')}
              className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-card hover:bg-accent/40 hover:border-primary/20 text-left transition-all duration-200 shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                  <FileText size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Upload Document</h4>
                  <p className="text-[10px] text-muted-foreground">PDFs, text or images</p>
                </div>
              </div>
              <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
