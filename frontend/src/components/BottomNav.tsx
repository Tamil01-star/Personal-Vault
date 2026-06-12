import React from 'react';
import { Home, KeyRound, Notebook, FileText, User } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, setCurrentView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'passwords', label: 'Passwords', icon: KeyRound },
    { id: 'notes', label: 'Notes', icon: Notebook },
    { id: 'documents', label: 'Files', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border/80 flex items-center justify-around h-16 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur-md bg-card/90">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`flex-1 h-full min-h-[48px] flex flex-col items-center justify-center gap-1 select-none active:scale-95 transition-all duration-150 ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
            id={`bottom-nav-${item.id}`}
            aria-label={item.label}
          >
            <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-primary/10' : ''}`}>
              <Icon size={18} />
            </div>
            <span className="text-[9px] font-bold tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
