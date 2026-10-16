import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  Eye,
  Trash2,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  Layers,
  MapPin
} from 'lucide-react';
import { api } from '../services/api';
import HazardModal from '../components/HazardModal';

export default function HazardList() {
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedHazard, setSelectedHazard] = useState(null);

  // Filters & search
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [severity, setSeverity] = useState('All');
  const [status, setStatus] = useState('All');

  // Updating record state
  const [updatingId, setUpdatingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchHazards = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getHazards({
        category,
        severity,
        status,
        search,
      });
      if (res.success) {
        setHazards(res.hazards);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch hazard registry records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHazards();
  }, [category, severity, status]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchHazards();
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Handle direct in-table status change
  const handleInlineStatusChange = async (hazardId, newStatus) => {
    try {
      setUpdatingId(hazardId);
      const res = await api.updateHazard(hazardId, { status: newStatus });
      setHazards((prev) =>
        prev.map((h) => (h.id === hazardId ? res.hazard : h))
      );
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle confirmed deletion
  const handleConfirmedDelete = async (hazardId) => {
    try {
      await api.deleteHazard(hazardId);
      setHazards((prev) => prev.filter((h) => h.id !== hazardId));
      setDeleteConfirmId(null);
    } catch (err) {
      alert(`Failed to delete record: ${err.message}`);
    }
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

  return (
    <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header and Controls */}
      <div className="bg-[#1c2541] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h1 className="text-xl font-bold text-white tracking-tight">
                Road Hazard Registry
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Complete surveillance database with SQLite persistence and instant triage updates.
            </p>
          </div>

          <button
            onClick={fetchHazards}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, category, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500 transition"
          >
            <option value="All">All Categories</option>
            <option value="Pothole">Pothole</option>
            <option value="Road Crack">Road Crack</option>
            <option value="Open Manhole">Open Manhole</option>
            <option value="Illegal Dumping">Illegal Dumping</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500 transition"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500 transition"
          >
            <option value="All">All Statuses</option>
            <option value="Detected">Detected (Pending)</option>
            <option value="Verified">Verified</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-[#1c2541] border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#0f172a] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <th className="py-3.5 px-4 font-semibold">Hazard ID</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Location</th>
                <th className="py-3.5 px-4 font-semibold">Severity</th>
                <th className="py-3.5 px-4 font-semibold">Date Detected</th>
                <th className="py-3.5 px-4 font-semibold">Status (Editable)</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {hazards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2 text-cyan-400">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Querying database records...</span>
                      </div>
                    ) : (
                      'No matching road hazards found in SQLite database.'
                    )}
                  </td>
                </tr>
              ) : (
                hazards.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/40 transition">
                    {/* ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                      #{h.id}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{h.category}</span>
                        {h.is_demo === 1 && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/80">
                            Demo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 max-w-xs">
                        {h.description || 'No description'}
                      </p>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{h.latitude?.toFixed(4)}, {h.longitude?.toFixed(4)}</span>
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold border ${getSeverityBadge(h.severity)}`}>
                        {h.severity}
                      </span>
                    </td>

                    {/* Date Detected */}
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(h.created_at).toLocaleDateString()}
                    </td>

                    {/* Status with Inline Dropdown for Instant Persistence */}
                    <td className="py-3.5 px-4">
                      <select
                        value={h.status}
                        disabled={updatingId === h.id}
                        onChange={(e) => handleInlineStatusChange(h.id, e.target.value)}
                        className={`text-[11px] font-semibold rounded-lg px-2.5 py-1 border transition focus:outline-none cursor-pointer ${getStatusBadge(
                          h.status
                        )}`}
                      >
                        <option value="Detected" className="bg-slate-900 text-slate-200">
                          Detected
                        </option>
                        <option value="Verified" className="bg-slate-900 text-slate-200">
                          Verified
                        </option>
                        <option value="In Progress" className="bg-slate-900 text-slate-200">
                          In Progress
                        </option>
                        <option value="Resolved" className="bg-slate-900 text-slate-200">
                          Resolved
                        </option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedHazard(h)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition"
                        title="View Full Details"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" />
                        View
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(h.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/60 rounded-md transition"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Count */}
        <div className="p-4 border-t border-slate-800 bg-[#0f172a]/60 flex items-center justify-between text-xs text-slate-400">
          <span>
            Displaying <strong className="text-white">{hazards.length}</strong> recorded road hazards
          </span>
          <span className="text-[11px] text-slate-500">
            Changes persist directly to SQLite database (civicvision.db)
          </span>
        </div>
      </div>

      {/* Confirmation Modal for Direct Delete */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1c2541] border border-rose-700/60 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-white text-base">Delete Hazard #{deleteConfirmId}?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently remove this road hazard record from the SQLite database? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmedDelete(deleteConfirmId)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedHazard && (
        <HazardModal
          hazard={selectedHazard}
          onClose={() => setSelectedHazard(null)}
          onUpdated={(updated) => {
            setHazards((prev) =>
              prev.map((h) => (h.id === updated.id ? updated : h))
            );
            setSelectedHazard(updated);
          }}
          onDeleted={(id) => {
            setHazards((prev) => prev.filter((h) => h.id !== id));
            setSelectedHazard(null);
          }}
        />
      )}
    </div>
  );
}
