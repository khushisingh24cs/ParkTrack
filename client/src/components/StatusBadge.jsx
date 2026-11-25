const STYLES = {
  // Statuses
  Resolved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Assigned: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  'In-Progress': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  Pending: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  'Manual-Review': 'bg-purple-500/15 text-purple-300 border-purple-500/30',

  // Categories
  'Disabled-Bay': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  Obstruction: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  'Wrong-Zone': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  Overstay: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'No-Permit': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  UNMAPPED: 'bg-purple-500/15 text-purple-300 border-purple-500/30',

  // Priority & Availability
  High: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  Medium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  Low: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  Available: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Busy: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'Off-Duty': 'bg-slate-600/20 text-slate-400 border-slate-600/40',
};

export function Badge({ value, className = '' }) {
  const style = STYLES[value] || 'bg-slate-700/40 text-slate-300 border-slate-600';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      {value}
    </span>
  );
}

