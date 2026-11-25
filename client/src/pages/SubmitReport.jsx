import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, Cpu, Send, Sparkles } from 'lucide-react';
import { submitReport, validateAutomata } from '../api/client';
import { Badge } from '../components/StatusBadge';

const PRESETS = [
  {
    label: 'Valid · Disabled Bay',
    vehicleNumber: 'KA05AB1234',
    violationCode: 'PV52',
    zone: 'Zone-C',
    location: 'Accessible Bay 01, Main Entrance',
    description: 'Parked in wheelchair bay without permit.',
  },
  {
    label: 'Valid (1-letter series)',
    vehicleNumber: 'KA05A1234',
    violationCode: 'PV24',
    zone: 'Zone-B',
    location: 'Visitor Lot Bay 14',
    description: 'Exceeded 2-hour visitor parking limit.',
  },
  {
    label: 'Unmapped Code (PV99)',
    vehicleNumber: 'MH12DE5678',
    violationCode: 'PV99',
    zone: 'Zone-A',
    location: 'North Wing Service Lane',
    description: 'Unusual parking violation requiring manual review.',
  },
  {
    label: 'Invalid Vehicle Format',
    vehicleNumber: 'K505AB1234',
    violationCode: 'PV12',
    zone: 'Zone-A',
    location: 'North Gate',
    description: 'Invalid registration digit at position 2.',
  },
  {
    label: 'Invalid Violation Code',
    vehicleNumber: 'KA05AB1234',
    violationCode: 'PV1A',
    zone: 'Zone-D',
    location: 'East Wing Gate',
    description: 'Non-digit character at code end.',
  },
];

export default function SubmitReport() {
  const [form, setForm] = useState({
    vehicleNumber: '',
    violationCode: '',
    zone: 'Zone-A',
    location: '',
    reporterName: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [preCheck, setPreCheck] = useState(null);
  const [submissionOutcome, setSubmissionOutcome] = useState(null);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const applyPreset = (p) => {
    setForm({
      vehicleNumber: p.vehicleNumber,
      violationCode: p.violationCode,
      zone: p.zone,
      location: p.location,
      reporterName: 'Demo Presenter',
      description: p.description,
    });
    setPreCheck(null);
    setSubmissionOutcome(null);
  };

  const handlePreCheck = async () => {
    try {
      const res = await validateAutomata(form.vehicleNumber, form.violationCode);
      setPreCheck(res);
      if (res.valid) {
        toast.success('DFA accepted both inputs');
      } else {
        toast.error('DFA rejected one or more inputs');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Automata service unreachable');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmissionOutcome(null);
    try {
      const data = await submitReport(form);
      setSubmissionOutcome({ ok: true, ...data });
      setPreCheck(data.validation);
      toast.success(`Report ${data.report.trackingId} submitted!`);
    } catch (err) {
      const resp = err.response?.data;
      if (err.response?.status === 422 && resp?.validation) {
        setSubmissionOutcome({ ok: false, ...resp });
        setPreCheck(resp.validation);
        toast.error('Rejected by Automata DFA & logged for review');
      } else {
        toast.error(resp?.error || 'Failed to submit report');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Submit Violation Report</h2>
        <p className="text-sm text-slate-400 mt-1">
          Inputs are validated character-by-character by the Python Flask DFA microservice before
          classification and automated handler dispatch.
        </p>
      </div>

      {/* Quick Presets */}
      <div className="rounded-xl bg-navy-900 border border-navy-700 p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300 mb-2.5">
          <Sparkles className="w-4 h-4 text-sky-400" />
          Demo Quick-Fill Presets
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-700 text-xs text-slate-200 transition"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-3 rounded-xl bg-navy-900 border border-navy-700 p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Vehicle Registration Number *
              </label>
              <input
                type="text"
                required
                value={form.vehicleNumber}
                onChange={handleChange('vehicleNumber')}
                placeholder="e.g. KA05AB1234 or KA05A1234"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-navy-700 text-white font-mono text-sm focus:outline-none focus:border-sky-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Pattern: ^[A-Z]&#123;2&#125;[0-9]&#123;2&#125;[A-Z]&#123;1,2&#125;[0-9]&#123;4&#125;$
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Violation Code *
              </label>
              <input
                type="text"
                required
                value={form.violationCode}
                onChange={handleChange('violationCode')}
                placeholder="e.g. PV12, PV24, PV52, PV99"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-navy-700 text-white font-mono text-sm focus:outline-none focus:border-sky-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Pattern: ^PV[0-9]&#123;2&#125;$</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Zone *</label>
              <select
                value={form.zone}
                onChange={handleChange('zone')}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-navy-700 text-white text-sm focus:outline-none focus:border-sky-500"
              >
                <option value="Zone-A">Zone-A (North Gate &amp; Faculty)</option>
                <option value="Zone-B">Zone-B (Main Visitor Lot)</option>
                <option value="Zone-C">Zone-C (Disabled &amp; Hospital Wing)</option>
                <option value="Zone-D">Zone-D (East Wing &amp; EV Bays)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Reporter Name
              </label>
              <input
                type="text"
                value={form.reporterName}
                onChange={handleChange('reporterName')}
                placeholder="Citizen Reporter"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-navy-700 text-white text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Specific Location / Bay *
            </label>
            <input
              type="text"
              required
              value={form.location}
              onChange={handleChange('location')}
              placeholder="e.g. Accessible Bay 02, Near Main Entrance"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-navy-700 text-white text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Observation / Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={handleChange('description')}
              placeholder="Describe the violation details..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-navy-700 text-white text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-semibold text-sm transition"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Validating & Dispatching...' : 'Submit Report'}
            </button>
            <button
              type="button"
              onClick={handlePreCheck}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-navy-800 hover:bg-navy-700 border border-slate-600 text-slate-200 text-sm font-medium transition"
            >
              <Cpu className="w-4 h-4 text-sky-400" />
              Pre-Check DFA
            </button>
          </div>
        </form>

        {/* Live Outcome / DFA Feedback */}
        <div className="lg:col-span-2 space-y-4">
          {submissionOutcome && (
            <div
              className={`rounded-xl border p-5 space-y-3 ${
                submissionOutcome.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-rose-500/10 border-rose-500/30'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-white">
                {submissionOutcome.ok ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Report Accepted ({submissionOutcome.report.trackingId})
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-400" />
                    Submission Rejected by DFA
                  </>
                )}
              </div>

              {submissionOutcome.ok ? (
                <div className="space-y-2 text-xs text-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Category</span>
                    <Badge value={submissionOutcome.report.category} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status</span>
                    <Badge value={submissionOutcome.report.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Assigned Handler</span>
                    <span>
                      {submissionOutcome.report.assignedHandlerName || 'Pending / Manual Review'}
                    </span>
                  </div>
                  <p className="text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-navy-700">
                    {submissionOutcome.report.routingNote}
                  </p>
                  <Link
                    to="/track"
                    className="inline-block text-sky-300 hover:underline font-medium pt-1"
                  >
                    Track in Report Dashboard →
                  </Link>
                </div>
              ) : (
                <div className="text-xs text-rose-200 space-y-2">
                  <p>{submissionOutcome.error}</p>
                  <p className="text-slate-300">
                    This invalid attempt was logged separately under Rejected Submissions in Track
                    Reports.
                  </p>
                </div>
              )}
            </div>
          )}

          {preCheck && (
            <div className="rounded-xl bg-navy-900 border border-navy-700 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">DFA Validation Breakdown</h3>
              <ValidationDetail title="Vehicle Number" data={preCheck.vehicleNumber} />
              <ValidationDetail title="Violation Code" data={preCheck.violationCode} />
            </div>
          )}

          {!preCheck && !submissionOutcome && (
            <div className="rounded-xl bg-navy-900 border border-navy-700 p-5 text-xs text-slate-400 space-y-2">
              <h3 className="text-sm font-semibold text-white">Code Ranges Reference</h3>
              <p>PV10–PV19 → No-Permit</p>
              <p>PV20–PV29 → Overstay</p>
              <p>PV30–PV39 → Wrong-Zone</p>
              <p>PV40–PV49 → Obstruction</p>
              <p>PV50–PV59 → Disabled-Bay</p>
              <p className="text-purple-300 pt-1">
                Valid PVxx outside 10–59 (e.g. PV99) is marked UNMAPPED and held for manual review.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ValidationDetail({ title, data }) {
  if (!data) return null;
  return (
    <div className="rounded-lg bg-navy-800/70 border border-navy-700 p-3 space-y-1.5 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-200">{title}</span>
        <span className={data.dfaResult ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
          {data.dfaResult ? 'ACCEPTED' : 'REJECTED'}
        </span>
      </div>
      <div className="text-slate-400">
        Normalized: <span className="font-mono text-white">{data.normalized || '(empty)'}</span> ·
        DFA/Regex Agree: <span className="text-sky-300">{data.agree ? 'Yes' : 'No'}</span>
      </div>
      {data.errors?.length > 0 && (
        <ul className="text-rose-300 list-disc list-inside">
          {data.errors.map((e, idx) => (
            <li key={idx}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

