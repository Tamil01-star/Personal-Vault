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
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-40 bg-card/90 border border-border flex items-center justify-around h-16 shadow-lg backdrop-blur-md rounded-2xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`flex-1 h-full min-h-[48px] flex flex-col items-center justify-center gap-1 select-none active:scale-95 transition-all duration-150 ${
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
            id={`bottom-nav-${item.id}`}
            aria-label={item.label}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary scale-110 shadow-sm shadow-primary/5' : 'text-muted-foreground'}`}>
              <Icon size={19} />
            </div>
            <span className={`text-[8px] font-bold tracking-wider uppercase ${isActive ? 'text-primary' : 'text-muted-foreground/80'}`}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
