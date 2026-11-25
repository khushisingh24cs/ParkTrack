import { useState } from 'react';
import toast from 'react-hot-toast';
import { Play, CheckCircle2, XCircle, Cpu, Layers } from 'lucide-react';
import { classifyAutomata, compareAutomata, validateAutomata } from '../api/client';
import { Badge } from '../components/StatusBadge';

const VEHICLE_STATES = ['q0', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'];
const CODE_STATES = ['q0', 'q1', 'q2', 'q3', 'q4'];

const VEHICLE_EDGE_LABELS = {
  'q0-q1': 'A-Z',
  'q1-q2': 'A-Z',
  'q2-q3': '0-9',
  'q3-q4': '0-9',
  'q4-q5': 'A-Z',
  'q5-q6': 'A-Z',
  'q6-q7': '0-9',
  'q7-q8': '0-9',
  'q8-q9': '0-9',
  'q9-q10': '0-9',
};

const CODE_EDGE_LABELS = {
  'q0-q1': 'P',
  'q1-q2': 'V',
  'q2-q3': '0-9',
  'q3-q4': '0-9',
};

export default function ValidationLab() {
  const [vehicleInput, setVehicleInput] = useState('KA05AB1234');
  const [codeInput, setCodeInput] = useState('PV52');
  const [validation, setValidation] = useState(null);
  const [classification, setClassification] = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runValidation = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const val = await validateAutomata(vehicleInput, codeInput);
      setValidation(val);

      if (val.violationCode?.dfaResult) {
        const cls = await classifyAutomata(val.violationCode.normalized, '');
        setClassification(cls);
      } else {
        setClassification(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Automata service unreachable');
    } finally {
      setLoading(false);
    }
  };

  const runBatchCompare = async () => {
    try {
      const res = await compareAutomata();
      setCompareResult(res);
      toast.success(
        res.allAgree
          ? 'All test strings: DFA and Regex agree 100%'
          : 'Disagreement detected!'
      );
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not run comparison');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Automata &amp; Regex Validation Lab</h2>
          <p className="text-sm text-slate-400 mt-1">
            Inspect Deterministic Finite Automata state transitions, compare against Regular
            Expressions, and verify violation code category mapping.
          </p>
        </div>
        <button
          type="button"
          onClick={runBatchCompare}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-navy-800 hover:bg-navy-700 border border-sky-500/40 text-sky-300 text-xs font-semibold transition"
        >
          <Layers className="w-4 h-4" />
          Run Batch DFA vs Regex Check
        </button>
      </div>

      {/* Interactive Tester */}
      <form
        onSubmit={runValidation}
        className="rounded-xl bg-navy-900 border border-navy-700 p-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
      >
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Vehicle Registration (^[A-Z]&#123;2&#125;[0-9]&#123;2&#125;[A-Z]&#123;1,2&#125;[0-9]&#123;4&#125;$)
          </label>
          <input
            type="text"
            value={vehicleInput}
            onChange={(e) => setVehicleInput(e.target.value)}
            placeholder="KA05AB1234"
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-navy-700 text-white font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Violation Code (^PV[0-9]&#123;2&#125;$)
          </label>
          <input
            type="text"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="PV52"
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-navy-700 text-white font-mono text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm transition"
        >
          <Play className="w-4 h-4" />
          {loading ? 'Tracing DFA...' : 'Run DFA Trace'}
        </button>
      </form>

      {/* Quick samples */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          ['KA05AB1234', 'PV52'],
          ['KA05A1234', 'PV24'],
          ['ka-01 ab 1234', 'pv12'],
          ['K505AB1234', 'PV99'],
          ['KA05AB123', 'PV1A'],
        ].map(([v, c]) => (
          <button
            key={`${v}-${c}`}
            type="button"
            onClick={() => {
              setVehicleInput(v);
              setCodeInput(c);
            }}
            className="px-3 py-1 rounded-full bg-navy-900 border border-navy-700 hover:border-sky-500/50 text-slate-300 font-mono"
          >
            {v} / {c}
          </button>
        ))}
      </div>

      {/* Visual State Diagrams & Traces */}
      {validation && (
        <div className="space-y-6">
          <TraceSection
            title="Vehicle Registration DFA"
            regex="^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$"
            data={validation.vehicleNumber}
            states={VEHICLE_STATES}
            acceptState="q10"
            edgeLabels={VEHICLE_EDGE_LABELS}
            shortcutEdge={{ from: 'q5', to: 'q7', label: '0-9 (1-letter series)' }}
          />

          <TraceSection
            title="Violation Code DFA"
            regex="^PV[0-9]{2}$"
            data={validation.violationCode}
            states={CODE_STATES}
            acceptState="q4"
            edgeLabels={CODE_EDGE_LABELS}
            extraBadge={classification && <Badge value={classification.category} />}
            extraNote={classification?.reason}
          />
        </div>
      )}

      {/* Batch Comparison Output */}
      {compareResult && (
        <div className="rounded-xl bg-navy-900 border border-navy-700 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              DFA vs Regex Equivalence Matrix ({compareResult.results.length} test cases)
            </h3>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                compareResult.allAgree
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-rose-500/15 text-rose-300'
              }`}
            >
              {compareResult.allAgree ? '100% Equivalence Verified' : 'Mismatch Found'}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-navy-700 text-slate-400 uppercase">
                  <th className="py-2 pr-3">Raw Input</th>
                  <th className="py-2 pr-3">Normalized</th>
                  <th className="py-2 pr-3">Vehicle DFA / Regex</th>
                  <th className="py-2">Code DFA / Regex</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800 font-mono">
                {compareResult.results.map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-2 pr-3 text-slate-300">{JSON.stringify(row.input)}</td>
                    <td className="py-2 pr-3 text-white">{row.normalized || '(empty)'}</td>
                    <td className="py-2 pr-3">
                      <span className={row.vehicle.dfa ? 'text-emerald-400' : 'text-slate-400'}>
                        {String(row.vehicle.dfa)}
                      </span>{' '}
                      / {String(row.vehicle.regex)}{' '}
                      <span className="text-sky-400">
                        {row.vehicle.agree ? '✓' : '✗'}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className={row.code.dfa ? 'text-emerald-400' : 'text-slate-400'}>
                        {String(row.code.dfa)}
                      </span>{' '}
                      / {String(row.code.regex)}{' '}
                      <span className="text-sky-400">{row.code.agree ? '✓' : '✗'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TraceSection({
  title,
  regex,
  data,
  states,
  acceptState,
  edgeLabels,
  shortcutEdge,
  extraBadge,
  extraNote,
}) {
  if (!data) return null;
  const visited = new Set(['q0', ...(data.trace || []).map((t) => t.to)]);
  const lastStep = data.trace?.[data.trace.length - 1];
  const finalState = lastStep ? lastStep.to : 'q0';

  return (
    <div className="rounded-xl bg-navy-900 border border-navy-700 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2">
            {data.dfaResult ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400" />
            )}
            {title}
            {extraBadge}
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{regex}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2.5 py-1 rounded bg-navy-800 border border-navy-700 font-mono">
            Normalized: <strong className="text-white">{data.normalized || '(empty)'}</strong>
          </span>
          <span className="px-2.5 py-1 rounded bg-navy-800 border border-navy-700">
            DFA: <strong className={data.dfaResult ? 'text-emerald-400' : 'text-rose-400'}>{String(data.dfaResult)}</strong>
          </span>
          <span className="px-2.5 py-1 rounded bg-navy-800 border border-navy-700">
            Regex: <strong className={data.regexResult ? 'text-emerald-400' : 'text-rose-400'}>{String(data.regexResult)}</strong>
          </span>
          <span className="px-2.5 py-1 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300">
            {data.agree ? 'DFA = Regex' : 'Mismatch'}
          </span>
        </div>
      </div>

      {extraNote && (
        <div className="text-xs text-slate-300 bg-navy-800/70 border border-navy-700 rounded-lg px-3 py-2">
          {extraNote}
        </div>
      )}

      {/* Visual State Chain */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center gap-1.5 min-w-max py-2">
          {states.map((st, idx) => {
            const isVisited = visited.has(st);
            const isAccept = st === acceptState;
            const isCurrentEnd = finalState === st;
            const nextSt = states[idx + 1];
            const edgeLabel = nextSt ? edgeLabels[`${st}-${nextSt}`] : null;
            return (
              <div key={st} className="flex items-center gap-1.5">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-mono font-bold border-2 transition ${
                    isCurrentEnd && data.dfaResult
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : isVisited
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                      : 'bg-slate-950 border-navy-700 text-slate-500'
                  } ${isAccept ? 'ring-2 ring-offset-2 ring-offset-navy-900 ring-emerald-500/50' : ''}`}
                  title={isAccept ? `${st} (Accepting State)` : st}
                >
                  {st}
                </div>
                {nextSt && (
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-mono text-slate-400">{edgeLabel}</span>
                    <span className="text-slate-500 text-xs leading-none">→</span>
                  </div>
                )}
              </div>
            );
          })}
          {finalState === 'dead' && (
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-rose-400 text-xs">→</span>
              <div className="px-3 h-10 rounded-full flex items-center justify-center text-xs font-mono font-bold bg-rose-500/20 border-2 border-rose-400 text-rose-300">
                DEAD
              </div>
            </div>
          )}
        </div>
        {shortcutEdge && (
          <p className="text-[11px] text-slate-400 font-mono">
            Optional branch: {shortcutEdge.from} → {shortcutEdge.to} on {shortcutEdge.label}
          </p>
        )}
      </div>

      {data.errors?.length > 0 && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-200">
          {data.errors.map((err, idx) => (
            <div key={idx}>• {err}</div>
          ))}
        </div>
      )}

      {/* Transition Trace Table */}
      {data.trace?.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-mono">
            <thead>
              <tr className="border-b border-navy-700 text-slate-400">
                <th className="py-1.5 pr-4">Step</th>
                <th className="py-1.5 pr-4">Char</th>
                <th className="py-1.5 pr-4">From State</th>
                <th className="py-1.5">To State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800">
              {data.trace.map((step) => (
                <tr key={step.position}>
                  <td className="py-1.5 pr-4 text-slate-400">#{step.position}</td>
                  <td className="py-1.5 pr-4 text-white font-bold">&apos;{step.char}&apos;</td>
                  <td className="py-1.5 pr-4 text-slate-300">{step.from}</td>
                  <td
                    className={`py-1.5 font-semibold ${
                      step.to === 'dead' ? 'text-rose-400' : 'text-sky-300'
                    }`}
                  >
                    {step.to}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

