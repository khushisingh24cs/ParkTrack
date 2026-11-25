import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, Play, CheckCircle2 } from 'lucide-react';
import { fetchHandlers, fetchReports, updateHandler, updateReportStatus } from '../api/client';
import { Badge } from '../components/StatusBadge';

export default function HandlerDashboard() {
  const [handlers, setHandlers] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedHandlerId, setSelectedHandlerId] = useState('ALL');
  const [notes, setNotes] = useState({});

  const load = async () => {
    const [hRes, rRes] = await Promise.all([fetchHandlers(), fetchReports()]);
    setHandlers(hRes.handlers);
    setReports(rRes.reports);
  };

  useEffect(() => {
    load().catch(() => toast.error('Failed to load handler dashboard'));
  }, []);

  const handleAvailabilityChange = async (handlerId, availability) => {
    try {
      await updateHandler(handlerId, { availability });
      toast.success(`Availability updated to ${availability}`);
      await load();
    } catch {
      toast.error('Could not update availability');
    }
  };

  const handleReportUpdate = async (trackingId, status) => {
    try {
      await updateReportStatus(trackingId, {
        status,
        resolutionNote: notes[trackingId] || '',
      });
      toast.success(`${trackingId} marked ${status}`);
      await load();
    } catch {
      toast.error('Failed to update report');
    }
  };

  const visibleReports = reports.filter((r) => {
    if (!r.assignedHandlerId) return false;
    if (selectedHandlerId === 'ALL') return true;
    return r.assignedHandlerId === selectedHandlerId;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Handler Dashboard</h2>
        <p className="text-sm text-slate-400 mt-1">
          Enforcement personnel view assigned reports, update status, and manage duty capacity.
        </p>
      </div>

      {/* Handler Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {handlers.map((h) => {
          const isSelected = selectedHandlerId === h.handlerId;
          const pct = Math.min(100, Math.round((h.activeCount / h.maxCapacity) * 100));
          return (
            <div
              key={h.handlerId}
              className={`rounded-xl bg-navy-900 border p-4 space-y-3 transition ${
                isSelected ? 'border-sky-400' : 'border-navy-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedHandlerId(isSelected ? 'ALL' : h.handlerId)}
                  className="text-left"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    <span className="font-semibold text-white">{h.name}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {h.badgeNumber} · Primary: {h.zone}
                    {h.backupZones?.length > 0 ? ` · Backup: ${h.backupZones.join(', ')}` : ''}
                  </p>
                </button>
                <Badge value={h.availability} />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>
                    Workload: {h.activeCount}/{h.maxCapacity} active
                  </span>
                  <span>{h.resolvedCount} resolved</span>
                </div>
                <div className="h-2 rounded-full bg-navy-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      pct >= 100 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-400' : 'bg-sky-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <select
                  value={h.availability}
                  onChange={(e) => handleAvailabilityChange(h.handlerId, e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-navy-700 text-xs text-white"
                >
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                  <option value="Off-Duty">Off-Duty</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSelectedHandlerId(isSelected ? 'ALL' : h.handlerId)}
                  className="text-xs text-sky-400 hover:underline"
                >
                  {isSelected ? 'Show All Handlers' : 'Filter Assigned →'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assigned Reports Queue */}
      <div className="rounded-xl bg-navy-900 border border-navy-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">
            Assigned Reports ({visibleReports.length})
          </h3>
          {selectedHandlerId !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedHandlerId('ALL')}
              className="text-xs text-sky-400 hover:underline"
            >
              Clear handler filter
            </button>
          )}
        </div>

        <div className="space-y-3">
          {visibleReports.map((r) => (
            <div
              key={r.trackingId}
              className="rounded-lg bg-navy-800/70 border border-navy-700 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-sky-300">{r.trackingId}</span>
                  <span className="font-mono text-sm font-bold text-white">{r.vehicleNumber}</span>
                  <Badge value={r.category} />
                  <Badge value={r.priority} />
                  <Badge value={r.status} />
                </div>
                <p className="text-xs text-slate-300">
                  {r.zone} · {r.location} · Handler:{' '}
                  <span className="text-white font-medium">{r.assignedHandlerName}</span>
                </p>
                {r.description && <p className="text-xs text-slate-400">{r.description}</p>}
              </div>

              {r.status !== 'Resolved' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Resolution / field note..."
                    value={notes[r.trackingId] ?? r.resolutionNote ?? ''}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [r.trackingId]: e.target.value }))
                    }
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-navy-700 text-xs text-white w-56"
                  />
                  {r.status === 'Assigned' && (
                    <button
                      type="button"
                      onClick={() => handleReportUpdate(r.trackingId, 'In-Progress')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-medium"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Start
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleReportUpdate(r.trackingId, 'Resolved')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolve
                  </button>
                </div>
              ) : (
                <div className="text-xs text-emerald-300">
                  Resolved{r.resolutionNote ? `: ${r.resolutionNote}` : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

