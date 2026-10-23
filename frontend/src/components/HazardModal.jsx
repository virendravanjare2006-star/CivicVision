import React, { useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  ExternalLink,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { api, getUploadUrl } from '../services/api';

export default function HazardModal({ hazard, onClose, onUpdated, onDeleted }) {
  const [status, setStatus] = useState(hazard?.status || 'Detected');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!hazard) return null;

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      setError('');
      setSuccessMessage('');
      const res = await api.updateHazard(hazard.id, { status: newStatus });
      setStatus(newStatus);
      setSuccessMessage(`Status updated to ${newStatus}`);
      if (onUpdated) onUpdated(res.hazard);
    } catch (err) {
      setError(err.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError('');
      await api.deleteHazard(hazard.id);
      if (onDeleted) onDeleted(hazard.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete hazard record.');
      setDeleting(false);
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

  const imageUrl = hazard.image_path ? getUploadUrl(hazard.image_path) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#1c2541] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700/80 bg-[#0f172a]/60">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-800 text-cyan-400 border border-slate-700">
              #{hazard.id}
            </span>
            <h2 className="text-lg font-bold text-white">{hazard.category}</h2>
            {hazard.is_demo === 1 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800">
                Demo Record
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 text-xs text-rose-300 bg-rose-950/60 border border-rose-800 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Image & Key Attributes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Visual Preview */}
            <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center min-h-[190px]">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={hazard.category}
                  className="w-full h-48 object-cover hover:scale-105 transition duration-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60';
                  }}
                />
              ) : (
                <div className="p-6 text-center text-slate-500">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No visual evidence uploaded</p>
                </div>
              )}
            </div>

            {/* Attributes */}
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400">Severity Level:</span>
                <div className="mt-1">
                  <span className={`inline-block px-2.5 py-1 rounded-md font-semibold border ${getSeverityBadge(hazard.severity)}`}>
                    {hazard.severity} Severity
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400">Current Status:</span>
                <div className="mt-1">
                  <span className={`inline-block px-2.5 py-1 rounded-md font-semibold border ${getStatusBadge(status)}`}>
                    {status}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400">Detection Source:</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                    hazard.detection_source === 'Actual AI Inference'
                      ? 'bg-cyan-950/60 text-cyan-300 border-cyan-700/60'
                      : hazard.detection_source === 'Demonstration Mode'
                      ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {hazard.detection_source || 'Manual Report'}
                  </span>
                  {hazard.confidence && (
                    <span className="text-slate-400 font-mono">
                      ({Math.round(hazard.confidence * 100)}% conf)
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-400">GPS Coordinates:</span>
                <div className="mt-1 font-mono text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{hazard.latitude?.toFixed(5)}, {hazard.longitude?.toFixed(5)}</span>
                  <a
                    href={`https://www.google.com/maps?q=${hazard.latitude},${hazard.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 ml-1 p-0.5"
                    title="Open in Google Maps"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Incident Description & Notes
            </h3>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-200 leading-relaxed">
              {hazard.description || 'No additional field notes provided.'}
            </div>
          </div>

          {/* Status Change Section */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Update Investigation Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['Detected', 'Verified', 'In Progress', 'Resolved'].map((st) => (
                <button
                  key={st}
                  type="button"
                  disabled={updating}
                  onClick={() => handleStatusChange(st)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition border ${
                    status === st
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {updating && status === st ? 'Saving...' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              Logged: {new Date(hazard.created_at).toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              Last Updated: {new Date(hazard.updated_at).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700/80 bg-[#0f172a]/60">
          <div>
            {!showConfirmDelete ? (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-900/60 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-300 font-medium">Confirm delete?</span>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="text-xs bg-rose-600 hover:bg-rose-500 text-white font-semibold px-2.5 py-1 rounded transition"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
