import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  KeyRound,
  Notebook,
  Calendar,
  Mail,
  FileText,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  ShieldAlert
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'passwords', label: 'Passwords', icon: KeyRound },
    { id: 'notes', label: 'Personal Notes', icon: Notebook },
    { id: 'diary', label: 'Daily Diary', icon: Calendar },
    { id: 'letters', label: 'Personal Letters', icon: Mail },
    { id: 'documents', label: 'Documents & Files', icon: FileText },
    { id: 'settings', label: 'Vault Settings', icon: Settings },
  ];

  const toggleMobileMenu = () => setIsOpen(!isOpen);

  const handleNavClick = (viewId: string) => {
    setCurrentView(viewId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card text-foreground border border-border shadow-md hover:bg-accent transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={toggleMobileMenu}
          className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed z-40 w-64 bg-card border-r md:border border-border flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:top-4 md:bottom-4 md:left-4 md:h-[calc(100vh-2rem)] md:rounded-2xl md:shadow-sm`}
      >
        {/* Top Header & Logo */}
        <div>
          <div className="h-16 flex items-center px-6 border-b border-border gap-2.5">
            <div className="w-8.5 h-8.5 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/10">
              <ShieldAlert size={18} className="rotate-180" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                Secure Vault
              </h1>
              <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                Personal Repository
              </span>
            </div>
          </div>
 
          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10 scale-[1.01]'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground transition-colors'} />
                  {item.label}
                  {isActive && (
                    <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
 
        {/* User Profile & Actions Footer */}
        <div className="p-4 border-t border-border space-y-4 bg-muted/20 md:rounded-b-2xl">
          {user && (
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-inner uppercase">
                {user.username.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold text-foreground truncate uppercase tracking-wide">
                  {user.username}
                </h4>
                <p className="text-[10px] text-muted-foreground truncate font-medium">
                  {user.mobile_number}
                </p>
              </div>
            </div>
          )}
 
          {/* Action Row */}
          <div className="flex items-center justify-between gap-2">
            {/* Dark Mode Switcher */}
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-border bg-card text-xs font-medium hover:bg-accent/60 transition-colors shadow-sm"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={13} className="text-amber-500" />
                  <span className="text-[10px]">Light</span>
                </>
              ) : (
                <>
                  <Moon size={13} className="text-indigo-500" />
                  <span className="text-[10px]">Dark</span>
                </>
              )}
            </button>
 
            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-rose-200/20 bg-rose-500/10 text-rose-600 text-xs font-medium hover:bg-gradient-to-r hover:from-rose-500 hover:to-red-600 hover:text-white hover:border-transparent transition-all duration-200 shadow-sm"
            >
              <LogOut size={13} />
              <span className="text-[10px]">Log out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
