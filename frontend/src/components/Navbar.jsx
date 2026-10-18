import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, PlusCircle, Sparkles } from 'lucide-react';

export default function Navbar({ user, onLogout, authError }) {
  const location = useLocation();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/dashboard':
        return 'Infrastructure Overview';
      case '/map':
        return 'Interactive Hazard Map';
      case '/hazards':
        return 'Hazard Registry & Management';
      case '/detection':
        return 'AI Image Detection Studio';
      case '/report':
        return 'Report Field Road Hazard';
      default:
        return 'Smart City Operations';
    }
  };

  return (
    <header className="relative h-16 bg-[#0f172a]/95 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
          {getPageTitle(location.pathname)}
        </h1>
        <p className="text-xs text-slate-400">
          CivicVision Smart Road Quality Surveillance
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden md:block text-xs text-slate-400">{user.email}</span>
        <Link
          to="/detection"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-700/50 hover:bg-cyan-900/60 transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Detection</span>
        </Link>

        <Link
          to="/report"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 shadow-md shadow-cyan-500/20 transition active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report Hazard</span>
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 border border-slate-700 hover:bg-slate-800 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </div>
      {authError && (
        <p role="alert" className="absolute right-6 top-14 z-10 rounded-lg border border-rose-900/70 bg-rose-950 px-3 py-2 text-xs text-rose-300">
          {authError}
        </p>
      )}
    </header>
  );
}
