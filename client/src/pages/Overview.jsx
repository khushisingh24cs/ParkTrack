import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FilePlus2,
  Cpu,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fetchOverview } from '../api/client';
import { Badge } from '../components/StatusBadge';

const CATEGORY_CARDS = [
  { name: 'No-Permit', range: 'PV10–PV19', desc: 'Missing or expired parking permit' },
  { name: 'Overstay', range: 'PV20–PV29', desc: 'Exceeded permitted bay duration' },
  { name: 'Wrong-Zone', range: 'PV30–PV39', desc: 'Parked in unauthorized zone or EV bay' },
  { name: 'Obstruction', range: 'PV40–PV49', desc: 'Blocking gates, lanes, or driveways' },
  { name: 'Disabled-Bay', range: 'PV50–PV59', desc: 'Unauthorized use of accessible bay' },
  { name: 'UNMAPPED', range: 'Other PVxx', desc: 'Valid syntax sent for manual review' },
];

export default function Overview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOverview()
      .then(setData)
      .catch((err) => setError(err.response?.data?.error || err.message));
  }, []);

  if (error) {
    return (
      <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-6 text-rose-200">
        <h2 className="font-semibold text-lg mb-1">Unable to load ParkTrack backend</h2>
        <p className="text-sm text-rose-300/90">{error}</p>
        <p className="text-xs text-slate-400 mt-2">
          Make sure the Express server is running on port 5000.
        </p>
      </div>
    );
  }

  if (!data) {
    return <div className="text-slate-400 py-12 text-center">Loading ParkTrack overview...</div>;
  }

  const { kpis, byCategory, recentReports, system } = data;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-navy-800 via-navy-900 to-slate-900 border border-navy-700 p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-medium">
              Centralized Parking Enforcement &amp; Automata Validation
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              ParkTrack Command Overview
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Submit parking violation reports, validate registration numbers and violation codes
              with Deterministic Finite Automata (DFA), auto-dispatch handlers by zone capacity,
              and track resolution in real time.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/submit"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm transition"
            >
              <FilePlus2 className="w-4 h-4" />
              Submit Report
            </Link>
            <Link
              to="/validation-lab"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-navy-700 hover:bg-navy-700/80 border border-slate-600 text-white font-medium text-sm transition"
            >
              <Cpu className="w-4 h-4 text-sky-400" />
              Open Validation Lab
            </Link>
          </div>
        </div>

        {/* Architecture flow */}
        <div className="mt-6 pt-5 border-t border-navy-700/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <ArchStep step="1. React Client" detail="Port 5173 · UI & Dashboards" ok />
          <ArchStep step="2. Express API" detail="Port 5000 · Dispatch & REST" ok />
          <ArchStep
            step="3. Flask Automata"
            detail="Port 5001 · DFA & Regex"
            ok={system.automataOk}
          />
          <ArchStep
            step="4. Data Store"
            detail={system.databaseMode === 'mongodb' ? 'MongoDB Atlas' : 'In-Memory Store'}
            ok
          />
        </div>
      </section>

      {/* KPI Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Total Reports"
          value={kpis.totalReports}
          icon={ShieldCheck}
          accent="text-sky-400"
        />
        <KpiCard
          label="Active Dispatches"
          value={kpis.activeReports}
          icon={Clock}
          accent="text-amber-400"
        />
        <KpiCard
          label="Pending / Review"
          value={kpis.pendingOrReview}
          icon={AlertTriangle}
          accent="text-purple-400"
        />
        <KpiCard
          label="Resolved"
          value={kpis.resolvedReports}
          icon={CheckCircle2}
          accent="text-emerald-400"
        />
        <KpiCard
          label="DFA Rejected"
          value={kpis.rejectedCount}
          icon={XCircle}
          accent="text-rose-400"
        />
      </section>

      {/* Category Mapping + Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl bg-navy-900 border border-navy-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Violation Categories</h3>
            <Link to="/analytics" className="text-xs text-sky-400 hover:underline">
              Analytics →
            </Link>
          </div>
          <div className="space-y-2.5">
            {CATEGORY_CARDS.map((c) => (
              <div
                key={c.name}
                className="flex items-center justify-between p-2.5 rounded-lg bg-navy-800/70 border border-navy-700/70"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge value={c.name} />
                    <span className="text-xs font-mono text-slate-400">{c.range}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{c.desc}</p>
                </div>
                <span className="text-lg font-bold text-white tabular-nums">
                  {byCategory[c.name] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl bg-navy-900 border border-navy-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Recent Violation Reports</h3>
            <Link
              to="/track"
              className="inline-flex items-center gap-1 text-xs text-sky-400 hover:underline"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-navy-700 text-slate-400 text-xs uppercase">
                  <th className="py-2.5 pr-3">ID</th>
                  <th className="py-2.5 pr-3">Vehicle</th>
                  <th className="py-2.5 pr-3">Category</th>
                  <th className="py-2.5 pr-3">Zone</th>
                  <th className="py-2.5 pr-3">Handler</th>
                  <th className="py-2.5 pr-3">Status</th>
                  <th className="py-2.5">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {recentReports.map((r) => (
                  <tr key={r.trackingId} className="hover:bg-navy-800/40">
                    <td className="py-3 pr-3 font-mono text-xs text-sky-300">{r.trackingId}</td>
                    <td className="py-3 pr-3 font-mono text-xs text-white">
                      {r.vehicleNumber}
                      <span className="block text-[11px] text-slate-400">{r.violationCode}</span>
                    </td>
                    <td className="py-3 pr-3">
                      <Badge value={r.category} />
                    </td>
                    <td className="py-3 pr-3 text-xs text-slate-300">{r.zone}</td>
                    <td className="py-3 pr-3 text-xs text-slate-300">
                      {r.assignedHandlerName || <span className="text-slate-500">Unassigned</span>}
                    </td>
                    <td className="py-3 pr-3">
                      <Badge value={r.status} />
                    </td>
                    <td className="py-3 text-xs text-slate-400 whitespace-nowrap">
                      {formatDistanceToNow(new Date(r.updatedAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchStep({ step, detail, ok }) {
  return (
    <div className="rounded-lg bg-navy-900/80 border border-navy-700 px-3 py-2.5 flex items-center justify-between gap-2">
      <div>
        <div className="font-semibold text-white">{step}</div>
        <div className="text-slate-400 text-[11px]">{detail}</div>
      </div>
      <span className={`w-2 h-2 rounded-full shrink-0 ${ok ? 'bg-emerald-400' : 'bg-rose-400'}`} />
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="rounded-xl bg-navy-900 border border-navy-700 p-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-white mt-1 tabular-nums">{value}</p>
      </div>
      <div className={`p-2.5 rounded-lg bg-navy-800 border border-navy-700 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

