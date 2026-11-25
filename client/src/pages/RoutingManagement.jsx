import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, UserPlus, AlertTriangle } from 'lucide-react';
import {
  createHandler,
  dispatchPendingReports,
  fetchHandlers,
  fetchReports,
  reviewUnmappedReport,
  updateHandler,
  updateReportStatus,
} from '../api/client';
import { Badge } from '../components/StatusBadge';

const ZONES = ['Zone-A', 'Zone-B', 'Zone-C', 'Zone-D'];
const CATEGORIES = ['No-Permit', 'Overstay', 'Wrong-Zone', 'Obstruction', 'Disabled-Bay'];

export default function RoutingManagement() {
  const [handlers, setHandlers] = useState([]);
  const [reports, setReports] = useState([]);
  const [newHandler, setNewHandler] = useState({
    name: '',
    zone: 'Zone-A',
    backupZones: ['Zone-B'],
    maxCapacity: 4,
    phone: '',
  });
  const [reviewChoices, setReviewChoices] = useState({});

  const load = async () => {
    const [hRes, rRes] = await Promise.all([fetchHandlers(), fetchReports()]);
    setHandlers(hRes.handlers);
    setReports(rRes.reports);
  };

  useEffect(() => {
    load().catch(() => toast.error('Failed to load routing data'));
  }, []);

  const handleDispatchPending = async () => {
    try {
      const res = await dispatchPendingReports();
      toast.success(`Dispatched ${res.dispatchedCount} of ${res.totalPending} pending reports`);
      await load();
    } catch {
      toast.error('Batch dispatch failed');
    }
  };

  const handleCapacityOrZone = async (handlerId, patch) => {
    try {
      await updateHandler(handlerId, patch);
      toast.success('Routing rule updated');
      await load();
    } catch {
      toast.error('Update failed');
    }
  };

  const handleAddHandler = async (e) => {
    e.preventDefault();
    try {
      await createHandler(newHandler);
      toast.success('New enforcement handler added');
      setNewHandler({ name: '', zone: 'Zone-A', backupZones: ['Zone-B'], maxCapacity: 4, phone: '' });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not add handler');
    }
  };

  const handleManualReview = async (trackingId) => {
    const category = reviewChoices[trackingId] || 'Obstruction';
    try {
      await reviewUnmappedReport(trackingId, category);
      toast.success(`${trackingId} categorized as ${category} and routed`);
      await load();
    } catch {
      toast.error('Review assignment failed');
    }
  };

  const handleReassign = async (trackingId, assignedHandlerId) => {
    if (!assignedHandlerId) return;
    try {
      await updateReportStatus(trackingId, { assignedHandlerId });
      toast.success(`Reassigned ${trackingId}`);
      await load();
    } catch {
      toast.error('Reassignment failed');
    }
  };

  const manualReviewReports = reports.filter((r) => r.status === 'Manual-Review');
  const pendingReports = reports.filter((r) => r.status === 'Pending');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Routing &amp; Dispatch Management</h2>
          <p className="text-sm text-slate-400 mt-1">
            Configure zone coverage, backup assignments, handler capacity, and review UNMAPPED
            violation codes.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDispatchPending}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm transition"
        >
          <RefreshCw className="w-4 h-4" />
          Auto-Dispatch Pending ({pendingReports.length})
        </button>
      </div>

      {/* Zone Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ZONES.map((z) => {
          const primary = handlers.filter((h) => h.zone === z);
          const available = primary.filter((h) => h.availability === 'Available').length;
          const backups = handlers.filter((h) => (h.backupZones || []).includes(z));
          return (
            <div key={z} className="rounded-xl bg-navy-900 border border-navy-700 p-4 space-y-1.5">
              <div className="font-semibold text-white">{z}</div>
              <div className="text-xs text-slate-300">
                Primary handlers: <span className="text-sky-300 font-semibold">{primary.length}</span>{' '}
                ({available} available)
              </div>
              <div className="text-xs text-slate-400">
                Backup coverage: {backups.map((b) => b.name.split(' ')[0]).join(', ') || 'None'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Review (UNMAPPED) Queue */}
      {manualReviewReports.length > 0 && (
        <div className="rounded-xl bg-purple-500/10 border border-purple-500/30 p-5 space-y-3">
          <div className="flex items-center gap-2 text-purple-200 font-semibold">
            <AlertTriangle className="w-5 h-5 text-purple-300" />
            UNMAPPED Codes Awaiting Manual Review ({manualReviewReports.length})
          </div>
          <div className="space-y-3">
            {manualReviewReports.map((r) => (
              <div
                key={r.trackingId}
                className="rounded-lg bg-navy-900/90 border border-navy-700 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sky-300">{r.trackingId}</span>
                    <span className="font-mono text-white font-bold">{r.vehicleNumber}</span>
                    <Badge value={r.violationCode} />
                    <Badge value="UNMAPPED" />
                  </div>
                  <p className="text-slate-300">
                    {r.zone} · {r.location} — {r.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={reviewChoices[r.trackingId] || 'Obstruction'}
                    onChange={(e) =>
                      setReviewChoices((prev) => ({ ...prev, [r.trackingId]: e.target.value }))
                    }
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-navy-700 text-xs text-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleManualReview(r.trackingId)}
                    className="px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-white text-xs font-semibold"
                  >
                    Approve &amp; Dispatch
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Handler Capacity & Zone Allocation Table */}
      <div className="rounded-xl bg-navy-900 border border-navy-700 p-5 space-y-4">
        <h3 className="font-semibold text-white">Handler Routing Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-navy-700 text-xs text-slate-400 uppercase">
                <th className="py-2.5 pr-3">Handler</th>
                <th className="py-2.5 pr-3">Primary Zone</th>
                <th className="py-2.5 pr-3">Backup Zones</th>
                <th className="py-2.5 pr-3">Availability</th>
                <th className="py-2.5 pr-3">Load / Capacity</th>
                <th className="py-2.5">Max Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800 text-xs">
              {handlers.map((h) => (
                <tr key={h.handlerId}>
                  <td className="py-3 pr-3">
                    <div className="font-medium text-white">{h.name}</div>
                    <div className="text-slate-400 font-mono">{h.handlerId} · {h.badgeNumber}</div>
                  </td>
                  <td className="py-3 pr-3">
                    <select
                      value={h.zone}
                      onChange={(e) => handleCapacityOrZone(h.handlerId, { zone: e.target.value })}
                      className="px-2.5 py-1.5 rounded bg-slate-950 border border-navy-700 text-white"
                    >
                      {ZONES.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 pr-3 text-slate-300">
                    {(h.backupZones || []).join(', ') || 'None'}
                  </td>
                  <td className="py-3 pr-3">
                    <select
                      value={h.availability}
                      onChange={(e) =>
                        handleCapacityOrZone(h.handlerId, { availability: e.target.value })
                      }
                      className="px-2.5 py-1.5 rounded bg-slate-950 border border-navy-700 text-white"
                    >
                      <option value="Available">Available</option>
                      <option value="Busy">Busy</option>
                      <option value="Off-Duty">Off-Duty</option>
                    </select>
                  </td>
                  <td className="py-3 pr-3 font-mono text-slate-200">
                    {h.activeCount} / {h.maxCapacity}
                  </td>
                  <td className="py-3">
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={h.maxCapacity}
                      onChange={(e) =>
                        handleCapacityOrZone(h.handlerId, { maxCapacity: Number(e.target.value) })
                      }
                      className="w-16 px-2 py-1 rounded bg-slate-950 border border-navy-700 text-white text-center"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Reassign + Add Handler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-navy-900 border border-navy-700 p-5 space-y-3">
          <h3 className="font-semibold text-white">Manual Report Reassignment</h3>
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {reports
              .filter((r) => r.status !== 'Resolved' && r.status !== 'Manual-Review')
              .map((r) => (
                <div
                  key={r.trackingId}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-navy-800/70 border border-navy-700 text-xs"
                >
                  <div>
                    <span className="font-mono text-sky-300">{r.trackingId}</span> ·{' '}
                    <span className="text-white">{r.vehicleNumber}</span> ({r.zone})
                  </div>
                  <select
                    value={r.assignedHandlerId || ''}
                    onChange={(e) => handleReassign(r.trackingId, e.target.value)}
                    className="px-2.5 py-1.5 rounded bg-slate-950 border border-navy-700 text-white"
                  >
                    <option value="">Select handler...</option>
                    {handlers.map((h) => (
                      <option key={h.handlerId} value={h.handlerId}>
                        {h.name} ({h.zone})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
          </div>
        </div>

        <form
          onSubmit={handleAddHandler}
          className="rounded-xl bg-navy-900 border border-navy-700 p-5 space-y-3"
        >
          <div className="flex items-center gap-2 font-semibold text-white">
            <UserPlus className="w-4 h-4 text-sky-400" />
            Add Enforcement Handler
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <input
              type="text"
              required
              placeholder="Officer Full Name"
              value={newHandler.name}
              onChange={(e) => setNewHandler((p) => ({ ...p, name: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-slate-950 border border-navy-700 text-white"
            />
            <select
              value={newHandler.zone}
              onChange={(e) => setNewHandler((p) => ({ ...p, zone: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-slate-950 border border-navy-700 text-white"
            >
              {ZONES.map((z) => (
                <option key={z} value={z}>
                  Primary: {z}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={15}
              value={newHandler.maxCapacity}
              onChange={(e) =>
                setNewHandler((p) => ({ ...p, maxCapacity: Number(e.target.value) }))
              }
              placeholder="Max Capacity"
              className="px-3 py-2 rounded-lg bg-slate-950 border border-navy-700 text-white"
            />
            <input
              type="text"
              placeholder="Phone (optional)"
              value={newHandler.phone}
              onChange={(e) => setNewHandler((p) => ({ ...p, phone: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-slate-950 border border-navy-700 text-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs"
          >
            Create Handler
          </button>
        </form>
      </div>
    </div>
  );
}

