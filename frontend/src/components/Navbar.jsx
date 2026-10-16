import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle, Radio, Sparkles } from 'lucide-react';

export default function Navbar() {
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
    <header className="h-16 bg-[#0f172a]/95 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
          {getPageTitle(location.pathname)}
        </h1>
        <p className="text-xs text-slate-400">
          CivicVision Smart Road Quality Surveillance
        </p>
      </div>

      <div className="flex items-center gap-3">
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
      </div>
    </header>
  );
}
