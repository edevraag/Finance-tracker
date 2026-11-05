import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">404</h1>
        <h2 className="text-base font-bold text-slate-200 mt-1">Page Not Found</h2>
        <p className="text-xs text-slate-400 mt-2">
          The page you requested doesn't exist or has been moved.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};
