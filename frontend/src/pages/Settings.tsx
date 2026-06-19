import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Download,
  Upload,
  KeyRound,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { changePassword, apiCall, user, deleteAccount } = useAuth();

  // Delete account states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleteError(null);
    try {
      setDeleteLoading(true);
      await deleteAccount();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Change password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  // Backup & Restore states
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPassword !== confirmPassword) {
      return setPwError('New passwords do not match.');
    }
    if (newPassword.length < 6) {
      return setPwError('New password must be at least 6 characters.');
    }

    try {
      setPwLoading(true);
      await changePassword(currentPassword, newPassword);
      setPwSuccess('Master password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwError(err.message || 'Error updating password.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleBackupExport = async () => {
    try {
      setBackupLoading(true);
      
      // Fetch all collections in parallel
      const [passwords, notes, diary, letters] = await Promise.all([
        apiCall('/passwords').catch(() => []),
        apiCall('/notes').catch(() => []),
        apiCall('/diary').catch(() => []),
        apiCall('/letters').catch(() => [])
      ]);

      const backupData = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        vault: {
          passwords,
          notes,
          diary,
          letters
        }
      };

      // Download trigger
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `secure_vault_backup_${new Date().toLocaleDateString('en-CA')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.removeChild(downloadAnchor);
      
      alert('Backup JSON generated and downloaded successfully.');
    } catch (err: any) {
      alert('Failed to generate vault backup: ' + err.message);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmRestore = window.confirm(
      'Warning: Importing a backup will insert all backed up passwords, notes, diaries, and letters into your current database. Do you wish to proceed?'
    );
    if (!confirmRestore) {
      e.target.value = '';
      return;
    }

    try {
      setRestoreLoading(true);
      setRestoreStatus('Reading backup file...');
      
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const jsonText = event.target?.result as string;
          const backupObj = JSON.parse(jsonText);
          
          if (!backupObj.vault) {
            throw new Error('Invalid vault backup structure.');
          }

          const { passwords = [], notes = [], diary = [], letters = [] } = backupObj.vault;
          
          setRestoreStatus(`Restoring items: 0%`);

          let totalItems = passwords.length + notes.length + diary.length + letters.length;
          let processed = 0;

          // Helper to track progress
          const updateProgress = () => {
            processed++;
            setRestoreStatus(`Restoring items: ${Math.round((processed / totalItems) * 100)}%`);
          };

          // 1. Restore Passwords
          for (const item of passwords) {
            await apiCall('/passwords', {
              method: 'POST',
              body: JSON.stringify({
                website_name: item.website_name,
                username: item.username,
                password: item.password,
                category: item.category,
                notes: item.notes
              })
            }).catch(e => console.error(e));
            updateProgress();
          }

          // 2. Restore Notes
          for (const item of notes) {
            await apiCall('/notes', {
              method: 'POST',
              body: JSON.stringify({
                title: item.title,
                content: item.content
              })
            }).catch(e => console.error(e));
            updateProgress();
          }

          // 3. Restore Diary
          for (const item of diary) {
            await apiCall('/diary', {
              method: 'POST',
              body: JSON.stringify({
                entry_date: item.entry_date.split('T')[0],
                content: item.content
              })
            }).catch(e => console.error(e));
            updateProgress();
          }

          // 4. Restore Letters
          for (const item of letters) {
            await apiCall('/letters', {
              method: 'POST',
              body: JSON.stringify({
                title: item.title,
                content: item.content,
                status: item.status
              })
            }).catch(e => console.error(e));
            updateProgress();
          }

          setRestoreStatus('All vault items restored successfully!');
          setTimeout(() => setRestoreStatus(null), 3000);
        } catch (err: any) {
          alert('Error parsing or saving backup contents: ' + err.message);
          setRestoreStatus(null);
        }
      };

      reader.readAsText(file);
    } catch (err: any) {
      alert('Restore process failed: ' + err.message);
      setRestoreStatus(null);
    } finally {
      setRestoreLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className="flex justify-between items-center bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 text-primary rounded-xl">
            <SettingsIcon size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Vault Settings</h2>
            <p className="text-muted-foreground text-xs">Configure security preferences and backup vault contents.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PASSWORD RESET MODULE */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-2 mb-1">
              <KeyRound size={16} className="text-primary" />
              Update Master Password
            </h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Ensure you choose a strong password containing letters, numbers, and symbols.
            </p>

            {pwError && <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded-lg">{pwError}</div>}
            {pwSuccess && <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] rounded-lg">{pwSuccess}</div>}

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2 px-3 text-xs focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground mb-1">New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2 px-3 text-xs focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2 px-3 text-xs focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={pwLoading}
              className="w-full bg-primary text-primary-foreground hover:bg-indigo-500 py-2 rounded-xl text-xs font-bold shadow-md shadow-primary/10 transition-colors"
            >
              {pwLoading ? 'Updating...' : 'Change Master Password'}
            </button>
          </form>
        </div>

        {/* BACKUP & RESTORE MODULE */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-2 mb-1">
              <ShieldCheck size={16} className="text-primary" />
              Backup & Restore Vault
            </h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              You can export all passwords, diaries, notes, and letters in your vault into a single local JSON file. This file can be imported later to restore your data.
            </p>

            {restoreStatus && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-[10px] rounded-lg flex items-center gap-2 animate-pulse">
                <RefreshCw size={12} className="animate-spin" />
                <span>{restoreStatus}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3.5">
              {/* Backup Trigger */}
              <button
                onClick={handleBackupExport}
                disabled={backupLoading}
                className="flex items-center justify-center gap-2 w-full border border-border bg-muted/20 hover:bg-accent text-foreground py-3 rounded-xl text-xs font-bold transition-colors"
              >
                <Download size={15} />
                <span>{backupLoading ? 'Exporting...' : 'Export Vault Backup JSON'}</span>
              </button>

              {/* Restore Input Trigger */}
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreImport}
                  disabled={restoreLoading}
                  className="hidden"
                  id="restore-file-input"
                />
                <label
                  htmlFor="restore-file-input"
                  className="flex items-center justify-center gap-2 w-full border border-border bg-muted/20 hover:bg-accent text-foreground py-3 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  <Upload size={15} />
                  <span>{restoreLoading ? 'Importing...' : 'Import Vault Backup JSON'}</span>
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-border/60 pt-4 text-[10px] text-muted-foreground space-y-1 bg-muted/25 p-3 rounded-xl">
            <div className="flex justify-between">
              <span>Account Type:</span>
              <span className="font-semibold text-foreground uppercase">Local Encrypted</span>
            </div>
            <div className="flex justify-between">
              <span>Username:</span>
              <span className="font-semibold text-foreground uppercase">{user?.username}</span>
            </div>
            <div className="flex justify-between">
              <span>Registered Mobile:</span>
              <span className="font-semibold text-foreground">{user?.mobile_number}</span>
            </div>
          </div>
        </div>

      </div>

      {/* DANGER ZONE - DELETE ACCOUNT */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl">
            <Trash2 size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-400">Danger Zone</h3>
            <p className="text-[10px] text-muted-foreground">Irreversible operations on your personal vault.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-foreground">Delete Account Permanently</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed max-w-xl">
              Permanently delete your account and all associated encrypted vault contents including passwords, notes, diaries, files, and letters. This action is irreversible and all data will be lost forever.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="sm:self-center bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white py-2 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-md shadow-red-500/10"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-red-500/20 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-foreground">Delete Account Permanently?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This action will permanently delete the account for <span className="font-semibold text-foreground">{user?.email}</span>. All passwords, notes, diaries, letters, and uploaded files will be destroyed. This cannot be undone.
              </p>
            </div>

            {deleteError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded-lg">
                {deleteError}
              </div>
            )}

            <div className="space-y-2 bg-muted/40 p-3 rounded-xl border border-border/40">
              <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                Type <span className="font-bold text-foreground select-all">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-background border border-border focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl py-2 px-3 text-xs focus:outline-none transition-colors"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                  setDeleteError(null);
                }}
                disabled={deleteLoading}
                className="px-4 py-2 border border-border hover:bg-accent text-foreground rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-500/15"
              >
                {deleteLoading ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
