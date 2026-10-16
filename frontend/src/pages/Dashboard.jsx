import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  MapPin,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Flame
} from 'lucide-react';
import { api } from '../services/api';
import CategoryChart from '../components/CategoryChart';
import HazardModal from '../components/HazardModal';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedHazard, setSelectedHazard] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getDashboard();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to CivicVision backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleHazardUpdated = (updatedHazard) => {
    // Refresh dashboard numbers when a hazard status changes
    fetchDashboardData();
    setSelectedHazard(updatedHazard);
  };

  const handleHazardDeleted = () => {
    fetchDashboardData();
    setSelectedHazard(null);
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'Critical':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'High':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Resolved':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'In Progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'Verified':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      default:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading live road infrastructure telemetry...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-md mx-auto p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-center space-y-4">
          <AlertOctagon className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-base font-bold text-white">Connection Error</h2>
          <p className="text-xs text-rose-200">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { summary, by_category, recent_hazards, high_priority_hazards } = data || {};

  return (
    <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1c2541] via-[#1e293b] to-[#1c2541] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Cognitech Surveillance Network
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              Live SQLite Data
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            CivicVision Road Quality Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous pothole detection, structural road crack mapping, and hazard triage platform.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/map"
            className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 shadow transition flex items-center gap-1.5"
          >
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>Open Hazard Map</span>
          </Link>
          <Link
            to="/hazards"
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow-md shadow-cyan-500/20 transition flex items-center gap-1.5"
          >
            <span>View All Hazards</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 4 Summary Cards (Section 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Hazards */}
        <div className="bg-[#1c2541] border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Hazards
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {summary?.total_hazards ?? 0}
            </span>
            <span className="text-xs text-slate-400 ml-2">records</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
            <span>Aggregated across all city corridors</span>
          </div>
        </div>

        {/* Card 2: High-Severity Hazards */}
        <div className="bg-[#1c2541] border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              High Severity
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-rose-400 tracking-tight font-mono">
              {summary?.high_severity_hazards ?? 0}
            </span>
            <span className="text-xs text-slate-400 ml-2">Critical & High</span>
          </div>
          <div className="mt-3 text-[11px] text-rose-300/80 flex items-center gap-1">
            <span>Requires urgent municipal intervention</span>
          </div>
        </div>

        {/* Card 3: Awaiting Verification */}
        <div className="bg-[#1c2541] border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Awaiting Verification
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-amber-400 tracking-tight font-mono">
              {summary?.awaiting_verification ?? 0}
            </span>
            <span className="text-xs text-slate-400 ml-2">status: Detected</span>
          </div>
          <div className="mt-3 text-[11px] text-amber-300/80 flex items-center gap-1">
            <span>Pending civil engineer inspection</span>
          </div>
        </div>

        {/* Card 4: Resolved Hazards */}
        <div className="bg-[#1c2541] border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Resolved Hazards
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-emerald-400 tracking-tight font-mono">
              {summary?.resolved_hazards ?? 0}
            </span>
            <span className="text-xs text-slate-400 ml-2">fixed</span>
          </div>
          <div className="mt-3 text-[11px] text-emerald-300/80 flex items-center gap-1">
            <span>Roadway restored to safe condition</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Category Chart + High Priority Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Category Chart */}
        <div className="lg:col-span-1">
          <CategoryChart
            categoryData={by_category || {}}
            total={summary?.total_hazards || 0}
          />
        </div>

        {/* Right Column: Highest-Priority Hazards */}
        <div className="lg:col-span-2 bg-[#1c2541] border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-semibold text-white">Highest-Priority Hazards</h3>
              </div>
              <span className="text-xs text-slate-400">Unresolved Critical / High</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(high_priority_hazards || []).slice(0, 4).map((h) => (
                <div
                  key={h.id}
                  onClick={() => setSelectedHazard(h)}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">#{h.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getSeverityBadge(h.severity)}`}>
                      {h.severity}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition">
                    {h.category}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {h.description || 'No description available'}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-slate-800/80">
                    <span className={`px-1.5 py-0.5 rounded font-medium ${getStatusBadge(h.status)}`}>
                      {h.status}
                    </span>
                    <span className="text-cyan-400 flex items-center gap-0.5">
                      View <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Sorted by risk impact hierarchy</span>
            <Link to="/map" className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1">
              Locate on Map <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recently Detected Hazards Section */}
      <div className="bg-[#1c2541] border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Recently Detected Hazards</h3>
          </div>
          <Link
            to="/hazards"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
          >
            All Hazards Registry <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-3 pl-2">ID</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Severity</th>
                <th className="pb-3">GPS Location</th>
                <th className="pb-3">Detection Source</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(recent_hazards || []).map((h) => (
                <tr key={h.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 pl-2 font-mono text-cyan-400 font-semibold">#{h.id}</td>
                  <td className="py-3 font-medium text-white flex items-center gap-2">
                    <span>{h.category}</span>
                    {h.is_demo === 1 && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800">
                        Demo
                      </span>
                    )}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded font-semibold border ${getSeverityBadge(h.severity)}`}>
                      {h.severity}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-slate-300">
                    {h.latitude?.toFixed(4)}, {h.longitude?.toFixed(4)}
                  </td>
                  <td className="py-3">
                    <span className="text-[11px] text-slate-400">
                      {h.detection_source || 'Manual'}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded font-medium border ${getStatusBadge(h.status)}`}>
                      {h.status}
                    </span>
                  </td>
                  <td className="py-3 text-right pr-2">
                    <button
                      onClick={() => setSelectedHazard(h)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Hazard Modal */}
      {selectedHazard && (
        <HazardModal
          hazard={selectedHazard}
          onClose={() => setSelectedHazard(null)}
          onUpdated={handleHazardUpdated}
          onDeleted={handleHazardDeleted}
        />
      )}
    </div>
  );
}
