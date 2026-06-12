import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Passwords } from './pages/Passwords';
import { Notes } from './pages/Notes';
import { Diary } from './pages/Diary';
import { Letters } from './pages/Letters';
import { Documents } from './pages/Documents';
import { Profile } from './pages/Profile';
import { ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090f1d] text-white">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25 mb-4 animate-bounce">
          <ShieldCheck size={28} />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading Secure Repository...
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Auth />;
  }

  // Authenticated Layout
  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300">
      {/* Desktop Sidebar (visible on md screens and larger) */}
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

      {/* Main Content Workspace (adds padding-left on md screens, adds padding-bottom on mobile for BottomNav) */}
      <main className="flex-1 flex flex-col min-h-screen md:pl-64 pb-16 md:pb-0">
        
        {/* Sticky Header */}
        <header className="h-16 border-b border-border bg-card/40 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
          <div className="md:hidden flex items-center gap-1.5">
            <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
              Secure Vault
            </h1>
          </div>
          <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <ShieldCheck size={11} />
              <span>Vault Secure</span>
            </div>
          </div>
        </header>

        {/* Dynamic page content wrapper */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {currentView === 'dashboard' && <Dashboard setCurrentView={setCurrentView} />}
          {currentView === 'passwords' && <Passwords />}
          {currentView === 'notes' && <Notes />}
          {currentView === 'diary' && <Diary />}
          {currentView === 'letters' && <Letters />}
          {currentView === 'documents' && <Documents />}
          {currentView === 'profile' && <Profile />}
        </div>
      </main>

      {/* Mobile Bottom Navigation (visible only on mobile viewports) */}
      <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
};
