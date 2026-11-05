import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  BarChart3,
  Settings,
  LogOut,
  Wallet,
  X,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/authSlice';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    { name: 'Budgets', path: '/budgets', icon: PieChart },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <span className="text-xl font-bold font-mono">₹</span>
            </div>
            <div>
              <span className="font-bold text-white leading-tight block text-sm">Finance Tracker</span>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Rupee Edition</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center justify-center text-xs shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ME'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || ''}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
