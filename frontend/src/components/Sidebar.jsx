import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  ListFilter,
  ScanEye,
  PlusCircle,
  ShieldAlert,
  Activity,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';

export default function Sidebar() {
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    api.getHealth()
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));

    const interval = setInterval(() => {
      api.getHealth()
        .then(() => setBackendStatus('online'))
        .catch(() => setBackendStatus('offline'));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/map', label: 'Hazard Map', icon: MapPin },
    { to: '/hazards', label: 'Hazard Registry', icon: ListFilter },
    { to: '/detection', label: 'AI Detection', icon: ScanEye },
    { to: '/report', label: 'Report Hazard', icon: PlusCircle },
  ];

  return (
    <aside className="w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ShieldAlert className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-white tracking-tight">CivicVision</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">by Cognitech</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-400 italic leading-snug">
            "Detect Hazards. Map Risks. Build Safer Roads."
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Monitoring & Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800 bg-[#0b132b]/50">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Backend API
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === 'online'
                  ? 'bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse'
                  : backendStatus === 'checking'
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
            />
            <span className="capitalize text-[11px] font-medium text-slate-300">
              {backendStatus}
            </span>
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            Cognitech Core
          </span>
          <span>SQLite 3.x</span>
        </div>
      </div>
    </aside>
  );
}
