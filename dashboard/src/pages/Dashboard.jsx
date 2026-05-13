import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity, TrendingUp, ArrowRight, Clock, Plus, Layout, Zap } from 'lucide-react';
import ScoreCard from '../components/ScoreCard.jsx';

export default function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const [m, r] = await Promise.all([
        axios.get('/api/metrics'),
        axios.get('/api/run/list'),
      ]);
      setMetrics(m.data);
      setRuns(r.data.slice(0, 5)); // Only show last 5 runs on dashboard
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const poll = setInterval(refresh, 5000);
    return () => clearInterval(poll);
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-10 max-w-6xl mx-auto fade-in">
      {/* Header */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Welcome back</h1>
          <p className="text-sm text-gray-400 mt-1 font-medium">Here's what's happening with your content studio.</p>
        </div>
        <button
          onClick={() => navigate('/runs/new')}
          className="flex items-center gap-2 bg-gray-900 text-white text-sm font-bold px-6 py-3.5 rounded-xl hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-200 transition-all active:scale-[0.98]"
        >
          <Plus size={16} />
          <span>New Run</span>
        </button>
      </div>

      {/* ── Metric cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-6 mb-12">
        <ScoreCard
          label="Total Content Runs"
          value={metrics?.totalRuns ?? '—'}
          icon={Activity}
          color="teal"
          trend={12}
        />
        <ScoreCard
          label="Avg Quality Score"
          value={metrics?.avgScore ? `${metrics.avgScore}/10` : '—'}
          icon={TrendingUp}
          color="purple"
          trend={5}
        />
        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-violet-200 flex flex-col justify-between overflow-hidden relative group">
          <Zap className="absolute -right-4 -top-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">System Status</p>
            <h4 className="text-xl font-bold mt-1">Studio Online</h4>
          </div>
          <div className="relative z-10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold opacity-80 uppercase">All agents ready</span>
          </div>
        </div>
      </div>

      {/* ── Recent Runs ──────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Recent Activity</h3>
          <button 
            onClick={() => navigate('/runs')}
            className="text-[11px] font-black text-violet-600 uppercase tracking-widest hover:text-violet-700 transition-colors flex items-center gap-1"
          >
            View All Runs <ArrowRight size={12} />
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Loading activity...</div>
          ) : runs.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center">
               <Layout size={48} className="mx-auto text-gray-100 mb-4" />
               <p className="text-gray-400 font-medium text-sm">No runs yet. Start your first content pipeline!</p>
               <button 
                 onClick={() => navigate('/runs/new')}
                 className="mt-6 text-violet-600 font-bold text-xs uppercase tracking-widest hover:underline"
               >
                 Create New Run
               </button>
            </div>
          ) : (
            runs.map((run) => (
              <div 
                key={run.id || run.sessionId}
                onClick={() => navigate(`/runs/${(run.id || run.sessionId).replace('session_', '')}`)}
                className="group bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-6 hover:shadow-xl hover:shadow-gray-100 hover:border-violet-100 transition-all cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  run.pipelineStatus === 'done' ? 'bg-emerald-50 text-emerald-500' : 'bg-violet-50 text-violet-500'
                }`}>
                  {run.pipelineStatus === 'done' ? <Layout size={20} /> : <Clock size={20} className="animate-spin-slow" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-tight">#{run.id?.slice(-6) || run.sessionId?.slice(-6)}</span>
                    <span className="text-[10px] font-bold text-gray-400">·</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{formatDate(run.createdAt)}</span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-violet-600 transition-colors">
                    {run.topic || run.brief?.topic}
                  </h4>
                </div>

                <div className="flex items-center gap-8 pr-4">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Channel</p>
                    <p className="text-xs font-bold text-gray-700 capitalize">{run.channel || run.brief?.channel}</p>
                  </div>
                  <div className="text-right w-24">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Status</p>
                    <div className="flex items-center justify-end gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        run.pipelineStatus === 'done' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                      }`} />
                      <span className={`text-[10px] font-black uppercase ${
                        run.pipelineStatus === 'done' ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {run.pipelineStatus || run.status}
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-violet-50 group-hover:text-violet-500 transition-all">
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
