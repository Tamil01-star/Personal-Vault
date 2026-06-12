import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  KeyRound,
  Search,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Edit,
  Sparkles,
  Lock,
  AlertTriangle
} from 'lucide-react';

interface PasswordRecord {
  id: number;
  website_name: string;
  username: string;
  encrypted_password?: string;
  password?: string;
  category: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export const Passwords: React.FC = () => {
  const { apiCall } = useAuth();
  
  const [records, setRecords] = useState<PasswordRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Copy state
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  // Reveal passwords list state
  const [revealedIds, setRevealedIds] = useState<number[]>([]);
  
  // Peek password in form drawer state
  const [showPassword, setShowPassword] = useState(false);

  // Modal / Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PasswordRecord | null>(null);
  const [websiteName, setWebsiteName] = useState('');
  const [username, setUsername] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [category, setCategory] = useState('General');
  const [notes, setNotes] = useState('');

  // Delete Confirmation Modal States
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingName, setDeletingName] = useState('');

  // Password Generator States
  const [genLength, setGenLength] = useState(16);
  const [genUpper, setGenUpper] = useState(true);
  const [genLower, setGenLower] = useState(true);
  const [genDigits, setGenDigits] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);

  const categories = ['All', 'General', 'Social', 'Banking', 'Work', 'Shopping', 'Personal'];

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let endpoint = '/passwords';
      const params: string[] = [];
      if (selectedCategory !== 'All') params.push(`category=${selectedCategory}`);
      if (searchQuery) params.push(`search=${searchQuery}`);
      if (params.length > 0) endpoint += `?${params.join('&')}`;

      const data = await apiCall(endpoint);
      setRecords(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch password records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedCategory]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchRecords();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleReveal = (id: number) => {
    if (revealedIds.includes(id)) {
      setRevealedIds(revealedIds.filter(item => item !== id));
    } else {
      setRevealedIds([...revealedIds, id]);
    }
  };

  const handleOpenCreateForm = () => {
    setEditingRecord(null);
    setWebsiteName('');
    setUsername('');
    setPasswordValue('');
    setCategory('General');
    setNotes('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (rec: PasswordRecord) => {
    setEditingRecord(rec);
    setWebsiteName(rec.website_name);
    setUsername(rec.username);
    setPasswordValue(rec.password || '');
    setCategory(rec.category);
    setNotes(rec.notes);
    setIsFormOpen(true);
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteName || !username || !passwordValue) {
      return alert('Website name, username, and password are required.');
    }

    try {
      const payload = { website_name: websiteName, username, password: passwordValue, category, notes };
      
      if (editingRecord) {
        await apiCall(`/passwords/${editingRecord.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiCall('/passwords', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      
      setIsFormOpen(false);
      fetchRecords();
    } catch (err: any) {
      alert(err.message || 'Error saving password record.');
    }
  };

  const handleDeleteClick = (id: number, website: string) => {
    setDeletingId(id);
    setDeletingName(website);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await apiCall(`/passwords/${deletingId}`, { method: 'DELETE' });
      setDeletingId(null);
      fetchRecords();
    } catch (err: any) {
      alert(err.message || 'Failed to delete record.');
    }
  };

  // Password Generator
  const generatePassword = () => {
    let charset = '';
    if (genLower) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (genUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (genDigits) charset += '0123456789';
    if (genSymbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    if (!charset) {
      alert('Please check at least one criteria option.');
      return;
    }

    let password = '';
    for (let i = 0; i < genLength; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    setPasswordValue(password);
  };

  // Password strength checker
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: 'None', score: 0, color: 'bg-slate-700', text: 'text-slate-500' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 14) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { label: 'Weak', score: 20, color: 'bg-red-500', text: 'text-red-400' };
    if (score <= 4) return { label: 'Medium', score: 60, color: 'bg-amber-500', text: 'text-amber-400' };
    return { label: 'Strong', score: 100, color: 'bg-emerald-500', text: 'text-emerald-400' };
  };

  const strength = getPasswordStrength(passwordValue);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Top Header & Search Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <KeyRound size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Password Credentials</h2>
            <p className="text-muted-foreground text-xs">Securely generate, encrypt, and manage your credentials.</p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleOpenCreateForm}
          className="bg-primary text-primary-foreground hover:bg-indigo-500 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-all"
        >
          <Plus size={16} />
          <span>New Password</span>
        </button>
      </div>

      {/* Filters & Searching */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search credentials by website, username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2.5 pl-10 pr-4 text-xs placeholder-muted-foreground focus:outline-none transition-colors"
          />
        </div>

        {/* Category filtering pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                  : 'bg-card border-border text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Password Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-card border border-border p-5 rounded-2xl h-44 animate-pulse space-y-4">
              <div className="flex justify-between">
                <div className="w-1/3 h-4 bg-muted rounded" />
                <div className="w-8 h-8 rounded bg-muted" />
              </div>
              <div className="space-y-2">
                <div className="w-2/3 h-3 bg-muted rounded" />
                <div className="w-1/2 h-3 bg-muted rounded" />
              </div>
              <div className="w-full h-8 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl">
          {error}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl flex flex-col items-center gap-3">
          <Lock size={36} className="text-muted-foreground/30" />
          <h3 className="text-sm font-bold text-foreground">No Credentials Found</h3>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            Click "New Password" to store your first website app credentials encrypted in your vault.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((rec) => {
            const isRevealed = revealedIds.includes(rec.id);
            const isCopied = copiedId === rec.id;
            return (
              <div
                key={rec.id}
                className="bg-card/80 backdrop-blur-md border border-border/80 hover:border-primary/25 rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] hover:bg-card transition-all duration-300 flex flex-col justify-between relative overflow-hidden group animate-in fade-in-50 duration-200"
              >
                {/* Card Top */}
                <div>
                  <div className="flex justify-between items-start gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      {/* Logo placeholder */}
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 border border-primary/10 flex items-center justify-center text-primary font-bold text-sm shadow-sm select-none">
                        {rec.website_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {rec.category}
                        </span>
                        <h3 className="text-sm font-bold text-foreground mt-1 truncate group-hover:text-primary transition-colors">
                          {rec.website_name}
                        </h3>
                      </div>
                    </div>

                    {/* Quick Edit/Delete Panel */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditForm(rec)}
                        className="p-1.5 rounded-lg text-muted-foreground/70 hover:bg-accent hover:text-foreground transition-all duration-150"
                        title="Edit credentials"
                      >
                        <Edit size={13.5} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(rec.id, rec.website_name)}
                        className="p-1.5 rounded-lg text-muted-foreground/70 hover:bg-rose-500/10 hover:text-rose-600 transition-all duration-150"
                        title="Delete permanently"
                      >
                        <Trash2 size={13.5} />
                      </button>
                    </div>
                  </div>

                  {/* Credentials Fields */}
                  <div className="space-y-2.5 text-xs bg-muted/20 border border-border/40 p-3.5 rounded-xl font-medium">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">Username:</span>
                      <span className="font-semibold text-foreground truncate pl-4 select-all">{rec.username}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-muted-foreground font-semibold shrink-0">Password:</span>
                      <span className="font-mono text-foreground font-bold truncate select-all">
                        {isRevealed ? rec.password : '••••••••••••'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Row */}
                <div className="mt-4 pt-3 border-t border-border/60 flex justify-between items-center gap-2">
                  <span className="text-[9px] text-muted-foreground font-medium">
                    Updated: {new Date(rec.updated_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Show/Hide */}
                    <button
                      onClick={() => toggleReveal(rec.id)}
                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-all shadow-sm"
                      title={isRevealed ? 'Hide Password' : 'Show Password'}
                    >
                      {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    
                    {/* Copy */}
                    <button
                      onClick={() => handleCopy(rec.id, rec.password || '')}
                      className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                        isCopied 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 shadow-sm shadow-emerald-500/5' 
                          : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground shadow-sm'
                      }`}
                      title="Copy Password"
                    >
                      {isCopied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE/EDIT RECORD POPUP DRAWER MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-foreground mb-4">
              {editingRecord ? `Edit ${websiteName} Credentials` : 'Create Password Record'}
            </h3>

            <form onSubmit={handleSaveRecord} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Form fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Website / App Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google, Gmail, Netflix"
                    value={websiteName}
                    onChange={(e) => setWebsiteName(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2 px-3 text-xs placeholder-muted-foreground focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Username / Email</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. user@gmail.com, myusername"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2 px-3 text-xs placeholder-muted-foreground focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter credentials password"
                      value={passwordValue}
                      onChange={(e) => setPasswordValue(e.target.value)}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2 pl-3 pr-10 text-xs placeholder-muted-foreground focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  
                  {/* Strength Bar */}
                  {passwordValue && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">Complexity:</span>
                        <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1">
                        <div className={`h-1 rounded-full transition-all duration-300 ${strength.color}`} style={{ width: `${strength.score}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2 px-2 text-xs focus:outline-none transition-colors"
                    >
                      {categories.slice(1).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Notes</label>
                  <textarea
                    placeholder="Add extra descriptions or login links..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2 px-3 text-xs placeholder-muted-foreground focus:outline-none resize-none transition-colors"
                  />
                </div>
              </div>

              {/* Password Generator Sidebar */}
              <div className="bg-muted/30 border border-border/80 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-3">
                    <Sparkles size={14} className="text-indigo-400" />
                    Vault Password Generator
                  </h4>

                  {/* Length */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                      <span>Length:</span>
                      <span className="text-primary font-bold">{genLength} chars</span>
                    </div>
                    <input
                      type="range"
                      min={6}
                      max={64}
                      value={genLength}
                      onChange={(e) => setGenLength(parseInt(e.target.value))}
                      className="w-full accent-primary bg-muted rounded-lg appearance-none h-1 cursor-pointer"
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-400">
                    <label className="flex items-center gap-2 cursor-pointer hover:text-foreground">
                      <input type="checkbox" checked={genUpper} onChange={(e) => setGenUpper(e.target.checked)} className="rounded text-primary focus:ring-0 bg-transparent border-slate-700" />
                      <span>Uppercase (A-Z)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:text-foreground">
                      <input type="checkbox" checked={genLower} onChange={(e) => setGenLower(e.target.checked)} className="rounded text-primary focus:ring-0 bg-transparent border-slate-700" />
                      <span>Lowercase (a-z)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:text-foreground">
                      <input type="checkbox" checked={genDigits} onChange={(e) => setGenDigits(e.target.checked)} className="rounded text-primary focus:ring-0 bg-transparent border-slate-700" />
                      <span>Digits (0-9)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:text-foreground">
                      <input type="checkbox" checked={genSymbols} onChange={(e) => setGenSymbols(e.target.checked)} className="rounded text-primary focus:ring-0 bg-transparent border-slate-700" />
                      <span>Symbols (@#$)</span>
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={generatePassword}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-accent hover:text-primary py-2 rounded-xl text-xs font-bold border border-border flex items-center justify-center gap-1.5 transition-all mt-4"
                >
                  <Sparkles size={13} />
                  <span>Generate Credentials</span>
                </button>
              </div>

              {/* Form Buttons */}
              <div className="md:col-span-2 flex justify-end gap-2.5 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-semibold hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground hover:bg-indigo-500 rounded-xl text-xs font-semibold shadow-md shadow-primary/10 transition-colors"
                >
                  {editingRecord ? 'Save Changes' : 'Encrypt & Save'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM DELETE MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-destructive/10 text-destructive rounded-xl shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Confirm Permanent Deletion</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Are you sure you want to delete the credentials for <strong>"{deletingName}"</strong>? This will permanently remove the record from your vault database. This action is irreversible.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-border mt-5 pt-4">
              <button
                onClick={() => setDeletingId(null)}
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
        onClick={handleOpenCreateForm}
        className="md:hidden fixed bottom-20 right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform"
        aria-label="Create new password"
      >
        <Plus size={24} />
      </button>

    </div>
  );
};
