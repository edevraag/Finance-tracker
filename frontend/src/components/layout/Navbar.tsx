import React from 'react';
import { Menu } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  return (
    <header className="lg:hidden sticky top-0 z-30 h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold font-mono text-base">
            ₹
          </div>
          <span className="font-bold text-white text-sm">Finance Tracker</span>
        </div>
      </div>
    </header>
  );
};
