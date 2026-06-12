import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Notebook,
  Search,
  Plus,
  Trash2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const Notes: React.FC = () => {
  const { apiCall } = useAuth();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Active Note State
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  
  // Auto-save states
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  
  // Timer Ref for debouncing
  const autoSaveTimerRef = useRef<any>(null);
  
  // Avoid auto-saving on initial note load
  const isInitialLoad = useRef(true);

  // Content Editable Div Ref
  const editorRef = useRef<HTMLDivElement>(null);

  // Delete Modal States
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);

  const fetchNotes = async (selectNoteId?: number) => {
    try {
      setLoading(true);
      let url = '/notes';
      if (searchQuery) url += `?search=${searchQuery}`;
      
      const data = await apiCall(url);
      setNotes(data);

      if (data.length > 0) {
        if (selectNoteId) {
          const selected = data.find((n: Note) => n.id === selectNoteId);
          if (selected) {
            loadNoteIntoEditor(selected);
            return;
          }
        }
        // Default to first note if none active or selected
        if (!activeNote) {
          loadNoteIntoEditor(data[0]);
        }
      } else {
        setActiveNote(null);
        setEditorTitle('');
        setEditorContent('');
      }
    } catch (err: any) {
      console.error(err.message || 'Failed to retrieve notes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Search input debouncer
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchNotes(activeNote?.id);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const loadNoteIntoEditor = (note: Note) => {
    isInitialLoad.current = true;
    setActiveNote(note);
    setEditorTitle(note.title);
    setEditorContent(note.content);
    setAutoSaveStatus('idle');
    if (editorRef.current) {
      editorRef.current.innerHTML = note.content;
    }
    // Set initial load false in next tick
    setTimeout(() => {
      isInitialLoad.current = false;
    }, 100);
  };

  // Trigger Auto Save on changes
  useEffect(() => {
    if (isInitialLoad.current || !activeNote) return;

    // Set saving status
    setAutoSaveStatus('saving');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set 2 seconds debounce timer for auto save
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const payload = {
          title: editorTitle || 'Untitled Note',
          content: editorContent
        };
        
        await apiCall(`/notes/${activeNote.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });

        // Update list inline without loading state to avoid cursor jumping
        setNotes(prevNotes => 
          prevNotes.map(n => n.id === activeNote.id ? { ...n, title: payload.title, content: payload.content, updated_at: new Date().toISOString() } : n)
        );

        setAutoSaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        setAutoSaveStatus('error');
      }
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [editorTitle, editorContent]);

  const handleCreateNote = async () => {
    try {
      const payload = { title: 'Untitled Note', content: '<p></p>' };
      const res = await apiCall('/notes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      // Refresh and select new note
      await fetchNotes(res.note.id);
    } catch (err: any) {
      alert(err.message || 'Failed to create note.');
    }
  };

  const handleDeleteClick = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingNote(note);
  };

  const confirmDelete = async () => {
    if (!deletingNote) return;
    try {
      await apiCall(`/notes/${deletingNote.id}`, { method: 'DELETE' });
      setDeletingNote(null);
      
      // If we deleted the active note, set active note to null
      if (activeNote && activeNote.id === deletingNote.id) {
        setActiveNote(null);
      }
      fetchNotes();
    } catch (err: any) {
      alert(err.message || 'Failed to delete note.');
    }
  };

  // Rich Text Editor Toolbar Helpers
  const execCmd = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setEditorContent(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8.5rem)] flex flex-col md:flex-row gap-6 items-stretch">
      
      {/* LEFT COLUMN: NOTES LIST */}
      <div className="w-full md:w-80 bg-card border border-border rounded-2xl flex flex-col overflow-hidden shrink-0 shadow-sm">
        {/* Header & Add Button */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Notebook size={18} className="text-primary" />
            <h3 className="text-xs font-bold text-foreground">My Notes</h3>
          </div>
          
          <button
            onClick={handleCreateNote}
            className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors"
            title="Create a new note"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Search Notes */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-muted-foreground">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-1.5 pl-8 pr-3 text-xs placeholder-muted-foreground focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Notes Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {loading && notes.length === 0 ? (
            [1, 2, 3].map((n) => (
              <div key={n} className="p-4 space-y-2 animate-pulse">
                <div className="w-1/2 h-3 bg-muted rounded" />
                <div className="w-4/5 h-2.5 bg-muted rounded" />
              </div>
            ))
          ) : notes.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              No notes. Click "+" to create one.
            </div>
          ) : (
            notes.map((note) => {
              const isActive = activeNote && activeNote.id === note.id;
              // Strip HTML tags for note snippet
              const textSnippet = note.content ? note.content.replace(/<[^>]*>/g, '') : 'Empty note';
              
              return (
                <div
                  key={note.id}
                  onClick={() => loadNoteIntoEditor(note)}
                  className={`p-4 cursor-pointer hover:bg-accent/40 transition-colors flex justify-between items-start gap-2 relative group ${
                    isActive ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-xs font-bold truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {note.title || 'Untitled Note'}
                    </h4>
                    <p className="text-[10px] text-muted-foreground truncate mt-1">
                      {textSnippet}
                    </p>
                    <span className="text-[9px] text-muted-foreground/80 flex items-center gap-1 mt-2">
                      <Clock size={10} />
                      {new Date(note.updated_at).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteClick(note, e)}
                    className="p-1 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete note permanently"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: RICH TEXT EDITOR WORKSPACE */}
      <div className="flex-1 bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-sm">
        {activeNote ? (
          <>
            {/* Editor Header Title & Auto Save Status */}
            <div className="p-4 border-b border-border flex justify-between items-center gap-4 flex-wrap">
              <input
                type="text"
                value={editorTitle}
                onChange={(e) => setEditorTitle(e.target.value)}
                placeholder="Note Title"
                className="bg-transparent border-none text-md font-bold tracking-tight text-foreground placeholder-muted-foreground focus:outline-none flex-1"
              />

              {/* Autosave display */}
              <div className="flex items-center gap-1.5 text-[10px]">
                {autoSaveStatus === 'saving' && (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    Saving draft...
                  </span>
                )}
                {autoSaveStatus === 'saved' && (
                  <span className="text-emerald-500 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={12} />
                    Saved {lastSavedTime ? `at ${lastSavedTime}` : ''}
                  </span>
                )}
                {autoSaveStatus === 'error' && (
                  <span className="text-destructive font-semibold">
                    Auto-save failed
                  </span>
                )}
              </div>
            </div>

            {/* Rich Editor Formatting Toolbar */}
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

            {/* Editor editable pane */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div
                ref={editorRef}
                contentEditable
                className="w-full h-full min-h-[300px] focus:outline-none rich-editor-content text-sm text-foreground leading-relaxed"
                onInput={(e) => setEditorContent(e.currentTarget.innerHTML)}
                style={{ outline: 'none' }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Notebook size={40} className="text-muted-foreground/30" />
            <h3 className="text-xs font-bold text-foreground">No Note Selected</h3>
            <p className="text-xs text-muted-foreground">Select a note from the left sidebar or click "+" to create one.</p>
          </div>
        )}
      </div>

      {/* CUSTOM CONFIRM DELETE MODAL */}
      {deletingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-destructive/10 text-destructive rounded-xl shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Delete Personal Note</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Are you sure you want to permanently delete note <strong>"{deletingNote.title || 'Untitled Note'}"</strong>? The contents will be deleted permanently from your database.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-border mt-5 pt-4">
              <button
                onClick={() => setDeletingNote(null)}
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

      {/* Mobile Floating Action Button (FAB) */}
      <button
        onClick={handleCreateNote}
        className="md:hidden fixed bottom-20 right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform"
        aria-label="Create new note"
      >
        <Plus size={24} />
      </button>

    </div>
  );
};
