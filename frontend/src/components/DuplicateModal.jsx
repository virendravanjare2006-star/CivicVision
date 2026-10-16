import React from 'react';
import { AlertCircle, MapPin, ArrowRight, ShieldAlert, Check } from 'lucide-react';

export default function DuplicateModal({
  duplicateData,
  onConfirmForce,
  onViewExisting,
  onCancel,
  isSubmitting
}) {
  if (!duplicateData) return null;

  const existing = duplicateData.existing_hazard;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#1c2541] border border-amber-600/50 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-amber-950/40 border-b border-amber-800/40 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Potential Duplicate Hazard Detected</h2>
            <p className="text-xs text-amber-300">
              Geographic Proximity Duplicate Alert
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-300 text-sm leading-relaxed">
            An unresolved <strong className="text-amber-400">{existing.category}</strong> report already exists within{' '}
            <strong className="text-white">{existing.distance_meters} meters</strong> of your specified GPS coordinates.
          </p>

          {/* Existing Hazard Summary Box */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-cyan-400 font-bold">Hazard #{existing.id}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Status: {existing.status}
              </span>
            </div>

            <p className="text-slate-200 text-xs italic">
              "{existing.description || 'No description available'}"
            </p>

            <div className="flex items-center gap-2 text-slate-400 text-[11px] pt-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Location: {existing.latitude?.toFixed(4)}, {existing.longitude?.toFixed(4)} ({existing.distance_meters}m away)</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg text-slate-400 leading-normal">
            To prevent civic record bloat and redundant maintenance dispatches, you may inspect the existing record or proceed with a separate incident entry.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-700/80 bg-[#0f172a]/60 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            Cancel & Edit Coordinates
          </button>

          <button
            type="button"
            onClick={() => onViewExisting(existing.id)}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-cyan-300 bg-cyan-950/70 border border-cyan-700/50 hover:bg-cyan-900/70 rounded-lg transition flex items-center justify-center gap-1.5"
          >
            <span>View Existing Record</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirmForce}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 rounded-lg transition shadow-md shadow-amber-500/20"
          >
            {isSubmitting ? 'Submitting...' : 'Submit As Separate Hazard Anyway'}
          </button>
        </div>
      </div>
    </div>
  );
}
