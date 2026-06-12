import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Search,
  Plus,
  Trash2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface Letter {
  id: number;
  title: string;
  content: string;
  status: 'draft' | 'saved';
  created_at: string;
  updated_at: string;
}

export const Letters: React.FC = () => {
  const { apiCall } = useAuth();

  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'saved'>('all');

  // Active Letter
  const [activeLetter, setActiveLetter] = useState<Letter | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorStatus, setEditorStatus] = useState<'draft' | 'saved'>('draft');

  const editorRef = useRef<HTMLDivElement>(null);

  // Deletion Modal
  const [deletingLetter, setDeletingLetter] = useState<Letter | null>(null);

  const fetchLetters = async (selectLetterId?: number) => {
    try {
      setLoading(true);
      
      let endpoint = '/letters';
      const params = [];
      if (statusFilter !== 'all') params.push(`status=${statusFilter}`);
      if (searchQuery) params.push(`search=${searchQuery}`);
      if (params.length > 0) endpoint += `?${params.join('&')}`;

      const data = await apiCall(endpoint);
      setLetters(data);

      if (data.length > 0) {
        if (selectLetterId) {
          const selected = data.find((l: Letter) => l.id === selectLetterId);
          if (selected) {
            loadLetterIntoEditor(selected);
            return;
          }
        }
        if (!activeLetter || !data.some((l: Letter) => l.id === activeLetter.id)) {
          loadLetterIntoEditor(data[0]);
        }
      } else {
        setActiveLetter(null);
        setEditorTitle('');
        setEditorContent('');
        setEditorStatus('draft');
      }
    } catch (err: any) {
      console.error(err.message || 'Error fetching letters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, [statusFilter]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchLetters(activeLetter?.id);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const loadLetterIntoEditor = (letter: Letter) => {
    setActiveLetter(letter);
    setEditorTitle(letter.title);
    setEditorContent(letter.content);
    setEditorStatus(letter.status);
    if (editorRef.current) {
      editorRef.current.innerHTML = letter.content;
    }
  };

  const handleCreateLetter = async () => {
    try {
      const payload = { title: 'New Letter Draft', content: '<p></p>', status: 'draft' };
      const res = await apiCall('/letters', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await fetchLetters(res.letter.id);
    } catch (err: any) {
      alert(err.message || 'Failed to create letter.');
    }
  };

  const handleSaveLetter = async () => {
    if (!activeLetter) return;
    if (!editorTitle.trim()) return alert('Letter title is required.');

    try {
      const payload = {
        title: editorTitle,
        content: editorContent,
        status: editorStatus
      };

      await apiCall(`/letters/${activeLetter.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      // Update list
      setLetters(prev =>
        prev.map(l => l.id === activeLetter.id ? { ...l, ...payload, updated_at: new Date().toISOString() } : l)
      );
      
      alert('Letter saved successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to save letter.');
    }
  };

  const handleDeleteClick = (letter: Letter, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingLetter(letter);
  };

  const confirmDelete = async () => {
    if (!deletingLetter) return;
    try {
      await apiCall(`/letters/${deletingLetter.id}`, { method: 'DELETE' });
      setDeletingLetter(null);
      if (activeLetter && activeLetter.id === deletingLetter.id) {
        setActiveLetter(null);
      }
      fetchLetters();
    } catch (err: any) {
      alert(err.message || 'Failed to delete letter.');
    }
  };

  // Editor helpers
  const execCmd = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setEditorContent(editorRef.current.innerHTML);
    }
  };

  // Word counter
  const getWordCount = (html: string) => {
    const text = html.replace(/<[^>]*>/g, '').trim();
    if (!text) return 0;
    return text.split(/\s+/).length;
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8.5rem)] flex flex-col md:flex-row gap-6 items-stretch">
      
      {/* LEFT PANEL: LETTERS LIST */}
      <div className="w-full md:w-80 bg-card border border-border rounded-2xl flex flex-col overflow-hidden shrink-0 shadow-sm">
        
        {/* Header & Add Button */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-primary" />
            <h3 className="text-xs font-bold text-foreground">Letters Library</h3>
          </div>
          
          <button
            onClick={handleCreateLetter}
            className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors"
            title="Compose new letter"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Searching & Filter pills */}
        <div className="p-3 border-b border-border space-y-2 bg-muted/20">
          {/* Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-muted-foreground">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search letters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-1.5 pl-8 pr-3 text-xs placeholder-muted-foreground focus:outline-none transition-colors"
            />
          </div>
          
          {/* Filter Status */}
          <div className="flex gap-1">
            {(['all', 'draft', 'saved'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors uppercase tracking-wider ${
                  statusFilter === f
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-background border-border text-muted-foreground hover:bg-accent'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Letters list items */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {loading && letters.length === 0 ? (
            [1, 2, 3].map((n) => (
              <div key={n} className="p-4 space-y-2 animate-pulse">
                <div className="w-1/2 h-3 bg-muted rounded" />
                <div className="w-4/5 h-2.5 bg-muted rounded" />
              </div>
            ))
          ) : letters.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              No letters. Click "+" to write one.
            </div>
          ) : (
            letters.map((letter) => {
              const isActive = activeLetter && activeLetter.id === letter.id;
              const textSnippet = letter.content ? letter.content.replace(/<[^>]*>/g, '') : 'No content';
              
              return (
                <div
                  key={letter.id}
                  onClick={() => loadLetterIntoEditor(letter)}
                  className={`p-4 cursor-pointer hover:bg-accent/40 transition-colors flex justify-between items-start gap-2 relative group ${
                    isActive ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${letter.status === 'saved' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                      <h4 className={`text-xs font-bold truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {letter.title || 'Untitled Letter'}
                      </h4>
                    </div>
                    
                    <p className="text-[10px] text-muted-foreground truncate mt-1">
                      {textSnippet}
                    </p>
                    <span className="text-[9px] text-muted-foreground/80 flex items-center gap-1 mt-2">
                      <Clock size={10} />
                      {new Date(letter.updated_at).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteClick(letter, e)}
                    className="p-1 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete letter permanently"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL: EDITOR WORKSPACE */}
      <div className="flex-1 bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-sm">
        {activeLetter ? (
          <>
            {/* Editor Top Title/Status block */}
            <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/10">
              <input
                type="text"
                value={editorTitle}
                onChange={(e) => setEditorTitle(e.target.value)}
                placeholder="Letter Subject / Title"
                className="bg-transparent border-none text-md font-bold tracking-tight text-foreground placeholder-muted-foreground focus:outline-none flex-1 w-full"
              />

              {/* Status Select & Save Trigger */}
              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                <select
                  value={editorStatus}
                  onChange={(e) => setEditorStatus(e.target.value as 'draft' | 'saved')}
                  className="bg-background border border-border focus:border-primary rounded-lg py-1 px-2.5 text-[10px] font-bold uppercase focus:outline-none tracking-wide"
                >
                  <option value="draft">Draft</option>
                  <option value="saved">Completed</option>
                </select>

                <button
                  onClick={handleSaveLetter}
                  className="bg-primary text-primary-foreground hover:bg-indigo-500 py-1.5 px-3.5 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle size={13} />
                  <span>Save Letter</span>
                </button>
              </div>
            </div>

            {/* Rich Editor formatting tools */}
            <div className="px-4 py-2 border-b border-border bg-muted/20 flex flex-wrap items-center gap-1">
              <button
                onClick={() => execCmd('bold')}
                className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Bold"
              >
                <Bold size={14} />
              </button>
              <button
                onClick={() => execCmd('italic')}
                className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Italic"
              >
                <Italic size={14} />
              </button>
              <button
                onClick={() => execCmd('underline')}
                className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Underline"
              >
                <Underline size={14} />
              </button>
              
              <div className="w-[1px] h-4 bg-border mx-1" />

              <button
                onClick={() => execCmd('insertUnorderedList')}
                className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Bullet List"
              >
                <List size={14} />
              </button>
              <button
                onClick={() => execCmd('insertOrderedList')}
                className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Numbered List"
              >
                <ListOrdered size={14} />
              </button>
              <button
                onClick={() => execCmd('formatBlock', 'blockquote')}
                className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Blockquote"
              >
                <Quote size={14} />
              </button>
            </div>

            {/* Content Pane */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div
                ref={editorRef}
                contentEditable
                className="w-full h-full min-h-[300px] focus:outline-none rich-editor-content text-sm text-foreground leading-relaxed"
                onInput={(e) => setEditorContent(e.currentTarget.innerHTML)}
                style={{ outline: 'none' }}
              />
            </div>

            {/* Word count footer */}
            <div className="px-4 py-2 border-t border-border bg-muted/10 flex justify-between text-[10px] text-muted-foreground">
              <span>Words: {getWordCount(editorContent)}</span>
              <span>Last Saved: {new Date(activeLetter.updated_at).toLocaleString()}</span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Mail size={40} className="text-muted-foreground/30" />
            <h3 className="text-xs font-bold text-foreground">No Letter Selected</h3>
            <p className="text-xs text-muted-foreground">Select a letter from the catalog or click "+" to write one.</p>
          </div>
        )}
      </div>

      {/* CUSTOM CONFIRM DELETE MODAL */}
      {deletingLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-destructive/10 text-destructive rounded-xl shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Delete Personal Letter</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Are you sure you want to permanently delete letter <strong>"{deletingLetter.title || 'Untitled Letter'}"</strong>? The contents will be deleted permanently.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-border mt-5 pt-4">
              <button
                onClick={() => setDeletingLetter(null)}
                className="px-3.5 py-1.5 border border-border rounded-xl text-xs font-semibold hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3.5 py-1.5 bg-destructive text-destructive-foreground hover:bg-red-500 rounded-xl text-xs font-semibold shadow-md shadow-destructive/10 transition-colors"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
