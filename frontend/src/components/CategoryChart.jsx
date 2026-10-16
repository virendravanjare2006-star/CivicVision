import React from 'react';
import { Layers, PieChart } from 'lucide-react';

export default function CategoryChart({ categoryData = {}, total = 0 }) {
  const categories = [
    { key: 'Pothole', color: 'from-cyan-500 to-blue-500', barBg: 'bg-cyan-500', border: 'border-cyan-500/40' },
    { key: 'Open Manhole', color: 'from-rose-500 to-red-600', barBg: 'bg-rose-500', border: 'border-rose-500/40' },
    { key: 'Road Crack', color: 'from-amber-400 to-orange-500', barBg: 'bg-amber-400', border: 'border-amber-400/40' },
    { key: 'Illegal Dumping', color: 'from-emerald-400 to-teal-500', barBg: 'bg-emerald-400', border: 'border-emerald-400/40' },
  ];

  return (
    <div className="bg-[#1c2541] border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Hazards by Category</h3>
        </div>
        <span className="text-xs text-slate-400">
          Database Records: <span className="text-cyan-400 font-semibold">{total}</span>
        </span>
      </div>

      <div className="space-y-3.5">
        {categories.map((cat) => {
          const count = categoryData[cat.key] || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <div key={cat.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">{cat.key}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono">{count} incidents</span>
                  <span className="text-xs font-semibold text-cyan-400 w-8 text-right font-mono">
                    {percentage}%
                  </span>
                </div>
              </div>
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${cat.color}`}
                  style={{ width: `${Math.max(percentage, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
