import { useEffect, useState } from 'react';
import { Search, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fetchRejected, fetchReports } from '../api/client';
import { Badge } from '../components/StatusBadge';

const STEPS = ['Pending', 'Assigned', 'In-Progress', 'Resolved'];

export default function TrackReports() {
  const [tab, setTab] = useState('valid');
  const [reports, setReports] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [repData, rejData] = await Promise.all([
        fetchReports({ search, status: statusFilter, category: categoryFilter }),
        fetchRejected(),
      ]);
      setReports(repData.reports);
      setRejected(rejData.rejected);
      if (repData.reports.length > 0 && !selected) {
        setSelected(repData.reports[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Track Reports</h2>
          <p className="text-sm text-slate-400 mt-1">
            Monitor report progress, handler assignments, and DFA rejection logs.
          </p>
        </div>
        <div className="inline-flex rounded-lg bg-navy-900 border border-navy-700 p-1">
          <button
            type="button"
            onClick={() => setTab('valid')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition ${
              tab === 'valid' ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-300'
            }`}
          >
            Reports ({reports.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('rejected')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition ${
              tab === 'rejected' ? 'bg-rose-500 text-white font-semibold' : 'text-slate-300'
            }`}
          >
            Rejected Submissions ({rejected.length})
          </button>
        </div>
      </div>

      {tab === 'valid' ? (
        <>
          {/* Filters */}
          <form
            onSubmit={handleSearch}
            className="rounded-xl bg-navy-900 border border-navy-700 p-4 grid grid-cols-1 sm:grid-cols-4 gap-3"
          >
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tracking ID, vehicle number, code, or location..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-navy-700 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-950 border border-navy-700 text-sm text-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="In-Progress">In-Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Manual-Review">Manual-Review</option>
            </select>
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-navy-700 text-sm text-white"
              >
                <option value="ALL">All Categories</option>
                <option value="No-Permit">No-Permit</option>
                <option value="Overstay">Overstay</option>
                <option value="Wrong-Zone">Wrong-Zone</option>
                <option value="Obstruction">Obstruction</option>
                <option value="Disabled-Bay">Disabled-Bay</option>
                <option value="UNMAPPED">UNMAPPED</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-semibold"
              >
                Go
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List */}
            <div className="lg:col-span-2 rounded-xl bg-navy-900 border border-navy-700 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-slate-400 text-sm">Loading reports...</div>
              ) : reports.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No reports match the current filters.
                </div>
              ) : (
                <div className="divide-y divide-navy-800">
                  {reports.map((r) => (
                    <button
                      key={r.trackingId}
                      type="button"
                      onClick={() => setSelected(r)}
                      className={`w-full text-left p-4 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                        selected?.trackingId === r.trackingId
                          ? 'bg-navy-800/90 border-l-2 border-l-sky-400'
                          : 'hover:bg-navy-800/40'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-sky-300">
                            {r.trackingId}
                          </span>
                          <span className="font-mono text-sm font-bold text-white">
                            {r.vehicleNumber}
                          </span>
                          <Badge value={r.category} />
                          <Badge value={r.priority} />
                        </div>
                        <p className="text-xs text-slate-300">
                          {r.zone} · {r.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge value={r.status} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Detail pane */}
            <div className="rounded-xl bg-navy-900 border border-navy-700 p-5 space-y-5 h-fit">
              {selected ? (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono text-sky-400">{selected.trackingId}</span>
                      <h3 className="text-lg font-bold text-white font-mono">
                        {selected.vehicleNumber}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Code: <span className="font-mono text-slate-200">{selected.violationCode}</span> ·{' '}
                        {selected.zone}
                      </p>
                    </div>
                    <Badge value={selected.status} />
                  </div>

                  {/* Stepper */}
                  {selected.status === 'Manual-Review' ? (
                    <div className="rounded-lg bg-purple-500/10 border border-purple-500/30 p-3 text-xs text-purple-200 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        Held in Manual Review because code {selected.violationCode} is UNMAPPED.
                        Assign a category in Routing Management to dispatch.
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-1.5">
                      {STEPS.map((step, i) => {
                        const activeIdx = STEPS.indexOf(selected.status);
                        const reached = activeIdx >= i;
                        return (
                          <div key={step} className="space-y-1">
                            <div
                              className={`h-1.5 rounded-full ${
                                reached ? 'bg-sky-400' : 'bg-navy-700'
                              }`}
                            />
                            <div
                              className={`text-[10px] text-center ${
                                reached ? 'text-sky-300 font-medium' : 'text-slate-500'
                              }`}
                            >
                              {step}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-2 text-xs">
                    <DetailRow label="Location" value={selected.location} />
                    <DetailRow label="Reporter" value={selected.reporterName} />
                    <DetailRow
                      label="Assigned Handler"
                      value={selected.assignedHandlerName || 'Unassigned'}
                    />
                    <DetailRow label="Classification" value={selected.classificationReason} />
                    <DetailRow label="Routing Note" value={selected.routingNote} />
                    {selected.resolutionNote && (
                      <DetailRow label="Resolution" value={selected.resolutionNote} />
                    )}
                  </div>

                  <div className="border-t border-navy-700 pt-4 space-y-2.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Status Timeline
                    </h4>
                    <div className="space-y-2.5">
                      {(selected.history || []).map((h, idx) => (
                        <div key={idx} className="flex gap-2.5 text-xs">
                          {h.status === 'Resolved' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <Clock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="font-medium text-slate-200">{h.status}</div>
                            <div className="text-slate-400">{h.note}</div>
                            <div className="text-[10px] text-slate-500">
                              {format(new Date(h.timestamp), 'MMM d, HH:mm')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-400">Select a report to view details.</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl bg-navy-900 border border-navy-700 overflow-hidden">
          {rejected.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No rejected submissions.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-navy-700 text-xs text-slate-400 uppercase">
                  <th className="p-4">Vehicle Input</th>
                  <th className="p-4">Code Input</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">DFA Rejection Reasons</th>
                  <th className="p-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800 text-xs">
                {rejected.map((item, idx) => (
                  <tr key={item._id || idx}>
                    <td className="p-4 font-mono text-rose-300">{item.vehicleNumber || '(empty)'}</td>
                    <td className="p-4 font-mono text-rose-300">{item.violationCode || '(empty)'}</td>
                    <td className="p-4 text-slate-300">
                      {item.zone} · {item.location}
                    </td>
                    <td className="p-4 text-rose-200 space-y-1">
                      {[...(item.vehicleErrors || []), ...(item.codeErrors || [])].map((e, i) => (
                        <div key={i}>• {e}</div>
                      ))}
                    </td>
                    <td className="p-4 text-slate-400">
                      {format(new Date(item.createdAt), 'MMM d, HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className="text-slate-200 text-right">{value || '—'}</span>
    </div>
  );
}

