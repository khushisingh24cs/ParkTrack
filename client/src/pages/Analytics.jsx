import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';
import { fetchAnalytics } from '../api/client';

const PIE_COLORS = ['#94a3b8', '#38bdf8', '#f59e0b', '#10b981', '#a855f7'];

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchAnalytics().then(setData);
  }, []);

  if (!data) {
    return <div className="text-slate-400 py-12 text-center">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Enforcement Analytics</h2>
        <p className="text-sm text-slate-400 mt-1">
          Violation patterns, zone enforcement distribution, handler performance, and validation
          outcomes.
        </p>
      </div>

      {/* Validation summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Valid & Mapped Reports"
          value={data.validationSummary.validMapped}
          accent="text-emerald-400"
        />
        <SummaryCard
          label="UNMAPPED (Manual Review)"
          value={data.validationSummary.unmapped}
          accent="text-purple-400"
        />
        <SummaryCard
          label="Rejected by DFA"
          value={data.validationSummary.rejected}
          accent="text-rose-400"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Reports by Violation Category">
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={data.byCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0b1530', borderColor: '#1a2b57', color: '#fff' }}
              />
              <Bar dataKey="count" fill="#38bdf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Report Status Distribution">
          <ResponsiveContainer width="100%" height={270}>
            <PieChart>
              <Pie
                data={data.byStatus.filter((s) => s.count > 0)}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {data.byStatus.map((entry, idx) => (
                  <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0b1530', borderColor: '#1a2b57', color: '#fff' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Enforcement Activity by Zone">
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={data.byZone}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="zone" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0b1530', borderColor: '#1a2b57', color: '#fff' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="active" name="Active" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Handler Workload vs Capacity">
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={data.byHandler}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0b1530', borderColor: '#1a2b57', color: '#fff' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="active" name="Active Load" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="capacity" name="Max Capacity" fill="#475569" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, accent }) {
  return (
    <div className="rounded-xl bg-navy-900 border border-navy-700 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent}`}>{value}</div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-xl bg-navy-900 border border-navy-700 p-5 space-y-3">
      <h3 className="font-semibold text-white text-sm">{title}</h3>
      {children}
    </div>
  );
}

