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
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } hidden md:flex`}
      >
        {/* Top Header & Logo */}
        <div>
          <div className="h-16 flex items-center px-6 border-b border-border gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20">
              <ShieldAlert size={18} className="rotate-180" />
            </div>
            <div>
              <h1 className="text-md font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
                Secure Vault
              </h1>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
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
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/15 scale-[1.01]'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Actions Footer */}
        <div className="p-4 border-t border-border space-y-4 bg-muted/30">
          {user && (
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-inner uppercase">
                {user.username.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold text-foreground truncate uppercase tracking-wide">
                  {user.username}
                </h4>
                <p className="text-[11px] text-muted-foreground truncate">
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
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-border text-xs font-medium hover:bg-accent transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={14} className="text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon size={14} className="text-indigo-400" />
                  <span>Dark</span>
                </>
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-red-200/20 bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive hover:text-destructive-foreground transition-all duration-200"
            >
              <LogOut size={14} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
