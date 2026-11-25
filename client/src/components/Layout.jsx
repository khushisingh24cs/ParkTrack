import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus2,
  SearchCheck,
  ShieldCheck,
  Route,
  BarChart3,
  Cpu,
  Menu,
  X,
  Car,
} from 'lucide-react';
import { fetchHealth } from '../api/client';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/submit', label: 'Report Submission', icon: FilePlus2 },
  { to: '/track', label: 'Track Reports', icon: SearchCheck },
  { to: '/handlers', label: 'Handler Dashboard', icon: ShieldCheck },
  { to: '/routing', label: 'Routing Management', icon: Route },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/validation-lab', label: 'Validation Lab', icon: Cpu },
];

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await fetchHealth();
        if (active) setHealth(data);
      } catch {
        if (active) setHealth({ ok: false });
      }
    };
    load();
    const id = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const navContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-navy-700">
        <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
          <Car className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white">ParkTrack</h1>
          <p className="text-[11px] text-slate-400">Violation Enforcement</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                  : 'text-slate-300 hover:bg-navy-700/70 hover:text-white border border-transparent'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-navy-700 space-y-2 text-xs">
        <div className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">
          System Services
        </div>
        <StatusRow
          label="Express API (:5000)"
          ok={Boolean(health?.ok)}
          detail={health?.ok ? 'Online' : 'Offline'}
        />
        <StatusRow
          label="Database"
          ok={Boolean(health?.ok)}
          detail={
            !health?.ok
              ? 'Unavailable'
              : health.database?.mode === 'mongodb'
              ? 'MongoDB Atlas'
              : 'In-Memory'
          }
        />
        <StatusRow
          label="Flask Automata (:5001)"
          ok={Boolean(health?.automata?.ok)}
          detail={health?.automata?.ok ? 'Ready' : 'Offline'}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-navy-900 border-r border-navy-700">
        <div className="sticky top-0 h-screen">{navContent}</div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 bg-navy-900 border-r border-navy-700 h-full">
            {navContent}
          </div>
          <div
            className="flex-1 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-navy-900/90 backdrop-blur border-b border-navy-700 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:bg-navy-700"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="text-sm text-slate-300 hidden sm:inline">
              Parking Violation Reporting &amp; Automata-Driven Enforcement
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                health?.automata?.ok
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  health?.automata?.ok ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
              Automata {health?.automata?.ok ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function StatusRow({ label, ok, detail }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-400 truncate">{label}</span>
      <span className={`font-medium ${ok ? 'text-emerald-400' : 'text-rose-400'}`}>
        {detail}
      </span>
    </div>
  );
}

