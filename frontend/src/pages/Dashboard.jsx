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
      if (Array.isArray(r.data)) {
        setRuns(r.data.slice(0, 5));
      } else {
        console.error('Expected array for runs, got:', r.data);
        setRuns([]);
      }
    } catch (err) {
      console.error('Dashboard refresh error:', err);
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
    <div className="p-6 md:p-8 max-w-6xl mx-auto fade-in">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-[#0D2B22] tracking-tighter">Overview</h1>
          <p className="text-sm text-[#1A4435] mt-1 font-semibold uppercase tracking-wider">Riverborn AI</p>
        </div>
        <button
          onClick={() => navigate('/runs/new')}
          className="flex items-center gap-2 bg-[#0D2B22] text-[#D4F53C] text-xs font-black uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-[#1A4435] hover:shadow-2xl hover:shadow-[#0D2B22]/20 transition-all active:scale-[0.98] border border-[#D4F53C]/20"
        >
          <Plus size={16} strokeWidth={3} />
          <span>New Run</span>
        </button>
      </div>

      {/* ── Metric cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <ScoreCard
          label="Total Content Runs"
          value={metrics?.totalRuns ?? '—'}
          icon={Activity}
          color="forest"
          trend={12}
        />
        <ScoreCard
          label="Avg Quality Score"
          value={metrics?.avgScore ? `${metrics.avgScore}/10` : '—'}
          icon={TrendingUp}
          color="lime"
          trend={5}
        />
        <div className="bg-[#0D2B22] rounded-[2rem] p-8 text-white shadow-2xl shadow-[#0D2B22]/10 flex flex-col justify-between overflow-hidden relative group border border-[#1A4435]">
          <Zap className="absolute -right-8 -top-8 w-40 h-40 text-[#D4F53C] opacity-10 group-hover:scale-110 transition-transform duration-1000" />
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E8EDE6]/60">System Status</p>
            <h4 className="text-2xl font-black mt-2 tracking-tight">Riverborn Online</h4>
          </div>
          <div className="relative z-10 flex items-center gap-2 mt-4">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4F53C] pulse-dot" />
            <span className="text-[11px] font-black text-[#E8EDE6]/80 uppercase tracking-widest">All agents ready</span>
          </div>
        </div>
      </div>

      {/* ── Recent Runs ──────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-xs font-black text-[#0D2B22] uppercase tracking-[0.2em]">Recent Activity</h3>
          <button 
            onClick={() => navigate('/runs')}
            className="text-[11px] font-black text-[#1A4435] uppercase tracking-widest hover:text-[#0D2B22] transition-colors flex items-center gap-1.5"
          >
            View All Runs <ArrowRight size={14} />
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center text-[#1A4435] text-xs font-black uppercase tracking-widest">Gathering intelligence...</div>
          ) : runs.length === 0 ? (
            <div className="bg-[#F2FFEE]/30 border border-[#E8EDE6] rounded-[2.5rem] p-20 text-center">
               <Layout size={64} strokeWidth={1} className="mx-auto text-[#1A4435] mb-6 opacity-40" />
               <p className="text-[#0D2B22] font-black text-lg tracking-tight">No runs yet.</p>
               <p className="text-[#1A4435] font-medium text-sm mt-1">Start your first content pipeline to see activity.</p>
               <button 
                 onClick={() => navigate('/runs/new')}
                 className="mt-8 bg-[#D4F53C] text-[#0D2B22] font-black text-[10px] uppercase tracking-[0.2em] px-8 py-3.5 rounded-full hover:bg-[#c4e436] transition-all"
               >
                 Create First Run
               </button>
            </div>
          ) : (
            runs.map((run) => (
              <div 
                key={run.id || run.sessionId}
                onClick={() => navigate(`/runs/${(run.id || run.sessionId).replace('session_', '')}`)}
                className="group bg-white border border-[#E8EDE6] rounded-3xl p-4 flex items-center gap-6 hover:shadow-2xl hover:shadow-[#0D2B22]/5 hover:border-[#1A4435] transition-all duration-500 cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-500 group-hover:scale-105 border ${
                  run.pipelineStatus === 'done' 
                    ? 'bg-[#F2FFEE] border-[#1A4435]/20 text-[#0D2B22]' 
                    : 'bg-[#E8EDE6] border-[#1A4435]/10 text-[#0D2B22]'
                }`}>
                  {run.pipelineStatus === 'done' ? <Layout size={20} /> : <Clock size={20} className="animate-spin-slow" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black text-[#1A4435] uppercase tracking-wider">#{run.id?.slice(-6) || run.sessionId?.slice(-6)}</span>
                    <span className="text-[10px] font-bold text-[#E8EDE6]">/</span>
                    <span className="text-[10px] font-bold text-[#1A4435] uppercase tracking-widest">{formatDate(run.createdAt)}</span>
                  </div>
                  <h4 className="text-base font-black text-[#0D2B22] truncate group-hover:text-[#1A4435] transition-colors tracking-tight">
                    {run.topic || run.brief?.topic}
                  </h4>
                </div>

                <div className="flex items-center gap-8 pr-2">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-[#1A4435] uppercase tracking-[0.15em] mb-1">Channel</p>
                    <p className="text-xs font-black text-[#0D2B22] capitalize">{run.channel || run.brief?.channel}</p>
                  </div>
                  <div className="text-right w-24">
                    <p className="text-[10px] font-black text-[#1A4435] uppercase tracking-[0.15em] mb-1">Status</p>
                    <div className="flex items-center justify-end gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        run.pipelineStatus === 'done' ? 'bg-[#D4F53C]' : 'bg-amber-400 animate-pulse'
                      }`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        run.pipelineStatus === 'done' ? 'text-[#0D2B22]' : 'text-amber-600'
                      }`}>
                        {run.pipelineStatus || run.status}
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#F2FFEE] border border-[#1A4435]/20 flex items-center justify-center text-[#1A4435] group-hover:bg-[#0D2B22] group-hover:text-[#D4F53C] transition-all duration-500">
                    <ArrowRight size={18} />
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
