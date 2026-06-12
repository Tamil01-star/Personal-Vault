import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  KeyRound,
  Fingerprint,
  Smartphone,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Sun,
  Moon,
  Eye,
  EyeOff,
  FileCheck
} from 'lucide-react';

interface Stats {
  passwords: number;
  notes: number;
  diary: number;
  letters: number;
  files: number;
}

export const Profile: React.FC = () => {
  const { user, changePassword, apiCall, getStats, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [stats, setStats] = useState<Stats>({ passwords: 0, notes: 0, diary: 0, letters: 0, files: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  // Mock Android Settings
  const [biometricsEnabled, setBiometricsEnabled] = useState(() => localStorage.getItem('mock_biometrics') === 'true');
  const [faceUnlockEnabled, setFaceUnlockEnabled] = useState(() => localStorage.getItem('mock_face_unlock') === 'true');
  const [pinLockEnabled, setPinLockEnabled] = useState(() => localStorage.getItem('mock_pin_lock') === 'true');
  const [pinCode, setPinCode] = useState(() => localStorage.getItem('mock_pin_code') || '');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [tempPin, setTempPin] = useState('');

  // Backup & Restore
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const data = await getStats();
        setStats(data);
      } catch (e) {
        console.error(e);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

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
      setPwSuccess('Master password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwError(err.message || 'Error updating password.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleToggleBiometrics = () => {
    const newVal = !biometricsEnabled;
    setBiometricsEnabled(newVal);
    localStorage.setItem('mock_biometrics', String(newVal));
  };

  const handleToggleFaceUnlock = () => {
    const newVal = !faceUnlockEnabled;
    setFaceUnlockEnabled(newVal);
    localStorage.setItem('mock_face_unlock', String(newVal));
  };

  const handleTogglePin = () => {
    if (pinLockEnabled) {
      setPinLockEnabled(false);
      setPinCode('');
      localStorage.removeItem('mock_pin_lock');
      localStorage.removeItem('mock_pin_code');
    } else {
      setTempPin('');
      setIsPinModalOpen(true);
    }
  };

  const handleSavePin = () => {
    if (tempPin.length !== 4 || !/^\d+$/.test(tempPin)) {
      return alert('PIN must be exactly 4 digits.');
    }
    setPinCode(tempPin);
    setPinLockEnabled(true);
    localStorage.setItem('mock_pin_lock', 'true');
    localStorage.setItem('mock_pin_code', tempPin);
    setIsPinModalOpen(false);
  };

  const handleBackupExport = async () => {
    try {
      setBackupLoading(true);
      const [passwords, notes, diary, letters] = await Promise.all([
        apiCall('/passwords').catch(() => []),
        apiCall('/notes').catch(() => []),
        apiCall('/diary').catch(() => []),
        apiCall('/letters').catch(() => [])
      ]);

      const backupData = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        vault: { passwords, notes, diary, letters }
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `vault_backup_${new Date().toLocaleDateString('en-CA')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.removeChild(downloadAnchor);
    } catch (err: any) {
      alert('Backup failed: ' + err.message);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const proceed = window.confirm('Importing will add backup items into your current vault. Proceed?');
    if (!proceed) return;

    try {
      setRestoreLoading(true);
      setRestoreStatus('Reading file...');
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const backupObj = JSON.parse(event.target?.result as string);
          if (!backupObj.vault) throw new Error('Invalid vault file.');

          const { passwords = [], notes = [], diary = [], letters = [] } = backupObj.vault;
          const total = passwords.length + notes.length + diary.length + letters.length;
          let count = 0;

          const tick = () => {
            count++;
            setRestoreStatus(`Restoring items: ${Math.round((count / total) * 100)}%`);
          };

          for (const item of passwords) {
            await apiCall('/passwords', { method: 'POST', body: JSON.stringify({ website_name: item.website_name, username: item.username, password: item.password, category: item.category, notes: item.notes }) }).catch(() => {});
            tick();
          }
          for (const item of notes) {
            await apiCall('/notes', { method: 'POST', body: JSON.stringify({ title: item.title, content: item.content }) }).catch(() => {});
            tick();
          }
          for (const item of diary) {
            await apiCall('/diary', { method: 'POST', body: JSON.stringify({ entry_date: item.entry_date.split('T')[0], content: item.content }) }).catch(() => {});
            tick();
          }
          for (const item of letters) {
            await apiCall('/letters', { method: 'POST', body: JSON.stringify({ title: item.title, content: item.content, status: item.status }) }).catch(() => {});
            tick();
          }

          setRestoreStatus('Vault restored successfully!');
          setTimeout(() => setRestoreStatus(null), 3500);
        } catch (err: any) {
          alert('Import failed: ' + err.message);
          setRestoreStatus(null);
        }
      };
      reader.readAsText(file);
    } catch (e: any) {
      alert('Restore failed: ' + e.message);
      setRestoreStatus(null);
    } finally {
      setRestoreLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-6">
      
      {/* Top Profile Header card */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col items-center text-center relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-extrabold text-xl shadow-inner mb-3 uppercase select-none">
          {user?.username.slice(0, 2)}
        </div>
        <h2 className="text-lg font-bold text-foreground uppercase tracking-wide">{user?.username}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{user?.mobile_number}</p>
        
        {/* Sign out */}
        <button
          onClick={logout}
          className="mt-4 border border-red-500/20 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground px-4 py-1.5 rounded-xl text-xs font-bold transition-all"
        >
          Sign Out of Vault
        </button>
      </div>

      {/* Vault Statistics Block */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
          <FileCheck size={16} className="text-primary" />
          Vault Summary
        </h3>
        
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 bg-muted/30 rounded-xl">
            <span className="block text-base font-bold text-foreground">
              {statsLoading ? '...' : stats.passwords}
            </span>
            <span className="text-[10px] text-muted-foreground">Logins</span>
          </div>
          <div className="p-3 bg-muted/30 rounded-xl">
            <span className="block text-base font-bold text-foreground">
              {statsLoading ? '...' : stats.notes}
            </span>
            <span className="text-[10px] text-muted-foreground">Notes</span>
          </div>
          <div className="p-3 bg-muted/30 rounded-xl">
            <span className="block text-base font-bold text-foreground">
              {statsLoading ? '...' : stats.diary}
            </span>
            <span className="text-[10px] text-muted-foreground">Diaries</span>
          </div>
        </div>
      </div>

      {/* Grid: App Settings & Security */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* MOCK ANDROID SECURITY PARAMETERS */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-foreground flex items-center gap-2 mb-1">
              <Smartphone size={16} className="text-primary" />
              Android Hardware Security
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Configure hardware lock controls for WebView Capacitor wrappers.
            </p>
          </div>

          <div className="space-y-3">
            {/* Toggle Biometrics */}
            <div className="flex items-center justify-between p-3.5 bg-muted/20 border border-border/80 rounded-xl">
              <div className="flex items-center gap-2.5">
                <Fingerprint size={18} className="text-primary" />
                <div className="text-left">
                  <h4 className="text-xs font-bold text-foreground">Biometric Authentication</h4>
                  <p className="text-[9px] text-muted-foreground">Use Fingerprint or FaceID to unlock</p>
                </div>
              </div>
              <button
                onClick={handleToggleBiometrics}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  biometricsEnabled ? 'bg-primary' : 'bg-slate-700'
                }`}
              >
                <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${
                  biometricsEnabled ? 'right-0.5' : 'left-0.5'
                }`} />
              </button>
            </div>

            {/* Toggle FaceID */}
            <div className="flex items-center justify-between p-3.5 bg-muted/20 border border-border/80 rounded-xl">
              <div className="flex items-center gap-2.5">
                <Shield size={18} className="text-primary" />
                <div className="text-left">
                  <h4 className="text-xs font-bold text-foreground">Face Unlock support</h4>
                  <p className="text-[9px] text-muted-foreground">Confirm unlock using camera feeds</p>
                </div>
              </div>
              <button
                onClick={handleToggleFaceUnlock}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  faceUnlockEnabled ? 'bg-primary' : 'bg-slate-700'
                }`}
              >
                <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${
                  faceUnlockEnabled ? 'right-0.5' : 'left-0.5'
                }`} />
              </button>
            </div>

            {/* Toggle PIN Lock */}
            <div className="flex items-center justify-between p-3.5 bg-muted/20 border border-border/80 rounded-xl">
              <div className="flex items-center gap-2.5">
                <Smartphone size={18} className="text-primary" />
                <div className="text-left">
                  <h4 className="text-xs font-bold text-foreground">App PIN Lock</h4>
                  <p className="text-[9px] text-muted-foreground">
                    {pinLockEnabled ? `Active: PIN Code (${pinCode})` : 'Set a 4-digit code lock'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleTogglePin}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  pinLockEnabled ? 'bg-primary' : 'bg-slate-700'
                }`}
              >
                <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${
                  pinLockEnabled ? 'right-0.5' : 'left-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* ACCOUNT MASTER PASSWORD CONTROL */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <form onSubmit={handlePasswordChange} className="space-y-3.5">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-2 mb-1">
              <KeyRound size={16} className="text-primary" />
              Change Vault Master Password
            </h3>
            
            {pwError && <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded-lg">{pwError}</div>}
            {pwSuccess && <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] rounded-lg">{pwSuccess}</div>}

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2 px-3 text-xs focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground mb-1">New Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2 px-3 text-xs focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Confirm New Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
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
              {pwLoading ? 'Saving...' : 'Update Master Password'}
            </button>
          </form>
        </div>

        {/* SYSTEM THEME ADJUSTMENTS */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-2 mb-1">
            <Sun size={16} className="text-primary" />
            Display Theme
          </h3>
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className={`flex-1 py-3 border rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 hover:bg-accent ${
                theme === 'light' ? 'bg-primary/5 border-primary text-primary' : 'border-border text-muted-foreground'
              }`}
            >
              <Sun size={16} />
              <span>Light Mode</span>
            </button>
            <button
              onClick={toggleTheme}
              className={`flex-1 py-3 border rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 hover:bg-accent ${
                theme === 'dark' ? 'bg-primary/5 border-primary text-primary' : 'border-border text-muted-foreground'
              }`}
            >
              <Moon size={16} />
              <span>Dark Mode</span>
            </button>
          </div>
        </div>

        {/* DATA BACKUP & DATA RESTORATION IMPORT */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
              <Shield size={16} className="text-primary" />
              Backup & Recovery
            </h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Export passwords, notes, diaries, and letters in one JSON backup file.
            </p>

            {restoreStatus && (
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-[10px] rounded-lg flex items-center gap-2 animate-pulse">
                <RefreshCw size={12} className="animate-spin" />
                <span>{restoreStatus}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleBackupExport}
                disabled={backupLoading}
                className="flex items-center justify-center gap-1.5 border border-border bg-muted/20 hover:bg-accent text-foreground py-2 rounded-xl text-xs font-bold transition-colors"
              >
                <Download size={14} />
                <span>Backup</span>
              </button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreImport}
                  disabled={restoreLoading}
                  className="hidden"
                  id="profile-restore-input"
                />
                <label
                  htmlFor="profile-restore-input"
                  className="flex items-center justify-center gap-1.5 border border-border bg-muted/20 hover:bg-accent text-foreground py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  <Upload size={14} />
                  <span>Restore</span>
                </label>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* MOCK PIN CODE REGISTRATION MODAL */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
            <h3 className="text-xs font-bold text-foreground mb-3 text-center">Set 4-Digit Security PIN</h3>
            <p className="text-[10px] text-muted-foreground text-center mb-4">
              Enter a 4-digit code to mock app-lock features.
            </p>

            <input
              type="password"
              maxLength={4}
              pattern="\d*"
              placeholder="••••"
              value={tempPin}
              onChange={(e) => setTempPin(e.target.value.replace(/\D/g, ''))}
              className="w-28 mx-auto block bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2 px-3 text-center text-lg tracking-[0.75rem] text-foreground focus:outline-none transition-colors"
            />

            <div className="flex gap-2 border-t border-border pt-4 mt-6">
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="flex-1 py-1.5 border border-border rounded-xl text-xs font-semibold hover:bg-accent text-center"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePin}
                className="flex-1 py-1.5 bg-primary text-primary-foreground hover:bg-indigo-500 rounded-xl text-xs font-semibold shadow-sm text-center"
              >
                Save PIN
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
