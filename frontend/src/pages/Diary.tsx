import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Search,
  BookOpen,
  CalendarCheck,
  AlertTriangle
} from 'lucide-react';

interface DiaryEntry {
  id: number;
  entry_date: string; // YYYY-MM-DD
  content: string;
  created_at: string;
  updated_at: string;
}

export const Diary: React.FC = () => {
  const { apiCall } = useAuth();

  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  // Calendar States
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
  );

  // Active Entry Details
  const [activeEntry, setActiveEntry] = useState<DiaryEntry | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DiaryEntry[]>([]);

  // Deletion Modal
  const [deletingEntry, setDeletingEntry] = useState<DiaryEntry | null>(null);

  const fetchMonthEntries = async () => {
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      // Fetch entries for this month
      const data = await apiCall(`/diary?month=${month}&year=${year}`);
      setEntries(data);

      // Check if there's an entry for the currently selected date
      const selected = data.find((e: DiaryEntry) => {
        // Strip time/timezone off date string if PostgreSQL returns it as ISO
        const datePart = e.entry_date.split('T')[0];
        return datePart === selectedDateStr;
      });

      if (selected) {
        setActiveEntry(selected);
        setEditorContent(selected.content);
      } else {
        // Double check single date query if not found in current month cache (e.g. if selected date is in another month)
        const singleData = await apiCall(`/diary?date=${selectedDateStr}`);
        if (singleData.length > 0) {
          setActiveEntry(singleData[0]);
          setEditorContent(singleData[0].content);
        } else {
          setActiveEntry(null);
          setEditorContent('');
        }
      }
    } catch (err: any) {
      console.error(err.message || 'Error loading diary entries.');
    }
  };

  useEffect(() => {
    fetchMonthEntries();
  }, [currentDate, selectedDateStr]);

  // Run Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const data = await apiCall(`/diary?search=${searchQuery}`);
        setSearchResults(data);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSaveEntry = async () => {
    if (!editorContent.trim()) {
      return alert('Diary entry content cannot be empty.');
    }
    try {
      await apiCall('/diary', {
        method: 'POST',
        body: JSON.stringify({
          entry_date: selectedDateStr,
          content: editorContent
        })
      });
      setIsEditing(false);
      fetchMonthEntries();
    } catch (err: any) {
      alert(err.message || 'Failed to save diary entry.');
    }
  };

  const handleDeleteClick = (entry: DiaryEntry) => {
    setDeletingEntry(entry);
  };

  const confirmDelete = async () => {
    if (!deletingEntry) return;
    try {
      await apiCall(`/diary/${deletingEntry.id}`, { method: 'DELETE' });
      setDeletingEntry(null);
      setActiveEntry(null);
      setEditorContent('');
      fetchMonthEntries();
    } catch (err: any) {
      alert(err.message || 'Failed to delete entry.');
    }
  };

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay(); // 0: Sunday, 1: Monday etc.
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const clickedDate = new Date(year, month, day);
    const dateStr = clickedDate.toLocaleDateString('en-CA'); // format: YYYY-MM-DD
    
    setSelectedDateStr(dateStr);
    setIsEditing(false);
  };

  const handleSearchResultClick = (entry: DiaryEntry) => {
    const datePart = entry.entry_date.split('T')[0];
    const parsedDate = new Date(datePart);
    
    setCurrentDate(parsedDate);
    setSelectedDateStr(datePart);
    setActiveEntry(entry);
    setEditorContent(entry.content);
    setSearchQuery('');
    setSearchResults([]);
    setIsEditing(false);
  };

  // Render Calendar Grid Days
  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const calendarDays = [];

    // Empty spaces for padding first week
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="p-2.5" />);
    }

    // Days numbers
    for (let day = 1; day <= daysInMonth; day++) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const thisDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const isSelected = selectedDateStr === thisDateStr;
      
      // Check if entry exists for this day
      const hasEntry = entries.some(e => {
        const datePart = e.entry_date.split('T')[0];
        return datePart === thisDateStr;
      });

      calendarDays.push(
        <button
          key={day}
          onClick={() => handleDayClick(day)}
          className={`p-2.5 rounded-xl text-xs font-semibold relative flex flex-col items-center justify-center hover:bg-accent hover:text-accent-foreground transition-all duration-150 ${
            isSelected
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-[1.05]'
              : 'text-foreground'
          }`}
        >
          <span>{day}</span>
          {hasEntry && (
            <span
              className={`w-1 h-1 rounded-full absolute bottom-1.5 ${
                isSelected ? 'bg-primary-foreground' : 'bg-amber-500 animate-pulse'
              }`}
            />
          )}
        </button>
      );
    }

    return calendarDays;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <CalendarIcon size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Daily Diary Logs</h2>
            <p className="text-muted-foreground text-xs">Write private logs and search memories chronologically.</p>
          </div>
        </div>

        {/* Search Entries */}
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search diary entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2 pl-8.5 pr-4 text-xs placeholder-muted-foreground focus:outline-none transition-colors"
          />

          {/* Search results dropdown */}
          {searchQuery.trim() && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-30 bg-card border border-border rounded-xl shadow-lg mt-1 max-h-60 overflow-y-auto p-2 space-y-1">
              {searchResults.map(entry => (
                <div
                  key={entry.id}
                  onClick={() => handleSearchResultClick(entry)}
                  className="p-2 hover:bg-accent text-left text-xs rounded-lg cursor-pointer transition-colors"
                >
                  <div className="font-bold text-foreground">{entry.entry_date.split('T')[0]}</div>
                  <p className="text-[10px] text-muted-foreground truncate">{entry.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch">
        
        {/* CALENDAR VIEW PANEL */}
        <div className="bg-card border border-border rounded-2xl p-5 md:col-span-2 shadow-sm flex flex-col justify-between h-[420px]">
          <div>
            {/* Calendar header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <CalendarCheck size={16} className="text-amber-500" />
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1 rounded hover:bg-accent border border-border text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1 rounded hover:bg-accent border border-border text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Weekdays Labels */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-muted-foreground mb-2">
              {weekDays.map(d => <div key={d}>{d}</div>)}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendarDays()}
            </div>
          </div>

          <div className="border-t border-border/60 pt-4 flex justify-between items-center text-[10px] text-muted-foreground">
            <span>Selected: {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
          </div>
        </div>

        {/* DIARY ENTRY DETAILS WORKSPACE */}
        <div className="bg-card border border-border rounded-2xl p-6 md:col-span-3 shadow-sm flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="flex justify-between items-center border-b border-border/80 pb-3 mb-4 flex-wrap gap-2">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                <BookOpen size={16} className="text-amber-500" />
                <span>Diary Log: {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
              </h3>

              {!isEditing && activeEntry && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Edit Log
                  </button>
                  <button
                    onClick={() => handleDeleteClick(activeEntry)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Delete log permanently"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Content pane */}
            {isEditing || !activeEntry ? (
              <div className="space-y-4">
                <textarea
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  placeholder={`Dear Diary, today was...`}
                  rows={9}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3 px-4 text-xs placeholder-muted-foreground focus:outline-none resize-none leading-relaxed transition-colors"
                />
              </div>
            ) : (
              <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap max-h-[280px] overflow-y-auto bg-muted/20 p-4 rounded-xl border border-border/50">
                {activeEntry.content}
              </div>
            )}
          </div>

          {/* Action Row */}
          {(isEditing || !activeEntry) && (
            <div className="flex justify-end gap-2.5 mt-4 pt-3.5 border-t border-border/60">
              {activeEntry && (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditorContent(activeEntry.content);
                  }}
                  className="px-3.5 py-1.5 border border-border rounded-xl text-xs font-semibold hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSaveEntry}
                className="px-4 py-1.5 bg-primary text-primary-foreground hover:bg-indigo-500 rounded-xl text-xs font-semibold shadow-md shadow-primary/10 transition-colors"
              >
                Save Diary Log
              </button>
            </div>
          )}
        </div>

      </div>

      {/* CUSTOM CONFIRM DELETE MODAL */}
      {deletingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-destructive/10 text-destructive rounded-xl shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Delete Diary Entry</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Are you sure you want to permanently delete this diary entry for <strong>{deletingEntry.entry_date.split('T')[0]}</strong>? The entry will be permanently erased.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-border mt-5 pt-4">
              <button
                onClick={() => setDeletingEntry(null)}
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
