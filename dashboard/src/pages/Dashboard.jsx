import { useState, useEffect, useRef } from 'react';
import { useNavigate }                 from 'react-router-dom';
import axios                           from 'axios';
import { Activity, Search, ShieldAlert, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import ScoreCard   from '../components/ScoreCard.jsx';
import PipelineBar from '../components/PipelineBar.jsx';
import AgentLog    from '../components/AgentLog.jsx';

const SCORE_BARS = [
  { key: 'accuracy',         label: 'Accuracy',          color: 'bg-teal-400'   },
  { key: 'toneMatch',        label: 'Tone Match',        color: 'bg-violet-400' },
  { key: 'formatCompliance', label: 'Format Compliance', color: 'bg-blue-400'   },
  { key: 'hookStrength',     label: 'Hook Strength',     color: 'bg-amber-400'  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [metrics,     setMetrics]     = useState(null);
  const [logs,        setLogs]        = useState([]);
  const [evalScores,  setEvalScores]  = useState(null);
  const [activeRunId, setActiveRunId] = useState(null);
  const evtRef = useRef(null);

  // ── Fetch metrics + logs ───────────────────────────────────────────────────
  const refresh = async () => {
    try {
      const [m, l, e] = await Promise.all([
        axios.get('/api/metrics'),
        axios.get('/api/agents/log'),
        axios.get('/api/eval/scores'),
      ]);
      setMetrics(m.data);
      setLogs(l.data);
      setEvalScores(e.data);
      if (m.data.activeRunId) setActiveRunId(m.data.activeRunId);
    } catch (_) {}
  };

  // ── SSE for live updates ───────────────────────────────────────────────────
  useEffect(() => {
    refresh();

    evtRef.current = new EventSource('/api/events');
    evtRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'stage') refresh();
    };

    const poll = setInterval(refresh, 3000);
    return () => {
      clearInterval(poll);
      evtRef.current?.close();
    };
  }, []);

  const isHITL = metrics?.reviewStatus === 'pending' && metrics?.pipelineStatus === 'review';

  return (
    <div className="p-8 max-w-7xl mx-auto fade-in">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Multi-agent content pipeline monitor</p>
        </div>
        <button
          onClick={() => navigate('/new-run')}
          className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <span>New Run</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* ── HITL Banner ───────────────────────────────────────────────────────── */}
      {isHITL && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Human approval required</p>
              <p className="text-xs text-amber-600 mt-0.5">
                The Review Agent is waiting for you to approve or reject the draft.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/drafts')}
            className="flex items-center gap-2 bg-amber-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors flex-shrink-0 ml-4"
          >
            Review now <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* ── Metric cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <ScoreCard
          label="Total Runs"
          value={metrics?.totalRuns ?? '—'}
          icon={Activity}
          color="teal"
          trend={12}
        />
        <ScoreCard
          label="Avg Score"
          value={metrics?.avgScore ? `${metrics.avgScore}/10` : '—'}
          icon={TrendingUp}
          color="purple"
          trend={5}
        />
        <ScoreCard
          label="Guardrail Hits"
          value={metrics?.guardrailHits ?? '—'}
          sub="blocked briefs"
          icon={ShieldAlert}
          color="amber"
        />
        <ScoreCard
          label="Web Searches"
          value={metrics?.webSearches ?? '—'}
          sub="by Research Agent"
          icon={Search}
          color="gray"
        />
      </div>

      {/* ── Pipeline bar ─────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <PipelineBar
          pipelineStatus={metrics?.pipelineStatus ?? 'idle'}
          currentStep={metrics?.currentStep ?? -1}
        />
      </div>

      {/* ── Log + Eval grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Agent log (2/3 width) */}
        <div className="col-span-2">
          <AgentLog logs={logs} />
        </div>

        {/* Eval scores (1/3 width) */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Last Run Scores
          </h3>
          {evalScores ? (
            <div className="space-y-4">
              {SCORE_BARS.map(({ key, label, color }) => {
                const score = evalScores[key] ?? 0;
                const pct   = (score / 10) * 100;
                return (
                  <div key={key}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-xs text-gray-600 font-medium">{label}</span>
                      <span className="text-xs font-bold text-gray-800">{score.toFixed(1)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 mt-3 border-t border-gray-50 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-500">Overall</span>
                <span className="text-base font-bold text-gray-900">
                  {evalScores.overall?.toFixed(1)}/10
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center mt-8">No completed runs yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
