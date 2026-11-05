import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { loginUser, clearAuthError } from '../store/authSlice';

export const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    dispatch(clearAuthError());
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    const res = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(res)) {
      navigate('/dashboard');
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@example.com');
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 font-bold font-mono text-2xl">
            ₹
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          Welcome back
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Sign in to your Personal Finance Tracker (₹)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900/90 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-800">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/25 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm text-white placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm text-white placeholder-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/40 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Fill Button */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full py-2 px-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Fill Demo Presentation Account
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-emerald-400 hover:text-emerald-300">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
