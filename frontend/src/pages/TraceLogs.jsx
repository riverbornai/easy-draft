import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Filter, Clock, Search, ShieldAlert, Cpu, Share2, UserCheck, AlertCircle, ChevronDown } from 'lucide-react';

const TYPE_STYLES = {
  tool:      { dot: 'bg-[#D4F53C]',   badge: 'bg-[#D4F53C]/10 text-[#0D2B22]', icon: Cpu },
  guardrail: { dot: 'bg-[#0D2B22]',   badge: 'bg-[#0D2B22]/10 text-[#0D2B22]', icon: ShieldAlert },
  agent:     { dot: 'bg-[#9FCEBE]',   badge: 'bg-[#9FCEBE]/20 text-[#0D2B22]', icon: Activity },
  handoff:   { dot: 'bg-[#1A4435]',   badge: 'bg-[#1A4435]/10 text-[#1A4435]', icon: Share2 },
  hitl:      { dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700',   icon: UserCheck },
  error:     { dot: 'bg-red-500',     badge: 'bg-red-50 text-red-600',      icon: AlertCircle },
};

const ALL_AGENTS = ['All','IntakeAgent','ResearchAgent','WriterAgent','ReviewAgent','PublisherAgent','EvalRunner','InputGuardrail','OutputGuardrail'];
const ALL_TYPES  = ['All','tool','guardrail','agent','handoff','hitl','error'];

export default function TraceLogs() {
  const [logs,         setLogs]        = useState([]);
  const [agentFilter,  setAgentFilter] = useState('All');
  const [typeFilter,   setTypeFilter]  = useState('All');
  const [runFilter,    setRunFilter]   = useState('All');

  const fetch = () => {
    axios.get('/api/agents/log', { params: { runId: runFilter } })
      .then(r => setLogs(r.data))
      .catch(()=>{});
  };

  useEffect(() => {
    fetch();
    const poll = setInterval(fetch, 3000);
    return () => clearInterval(poll);
  }, [runFilter]);

  const uniqueRunIds = [...new Set(logs.map(l => l.runId))].filter(id => typeof id === 'string');

  const filtered = logs.filter(l =>
    (agentFilter === 'All' || l.agent === agentFilter) &&
    (typeFilter  === 'All' || l.type  === typeFilter)
  );

  return (
    <div className="p-12 max-w-6xl mx-auto fade-in">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-[#0D2B22] tracking-tighter flex items-center gap-3">
            <Activity size={32} strokeWidth={3} className="text-[#0D2B22]" />
            Trace Logs
          </h1>
          <p className="text-sm text-[#1A4435] mt-2 font-black uppercase tracking-[0.2em]">Timeline monitoring — Live intelligence stream</p>
        </div>
        <div className="flex items-center gap-3 bg-[#F2FFEE] px-5 py-3 rounded-2xl border border-[#9FCEBE]/30 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-dot shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[11px] font-black text-[#0D2B22] uppercase tracking-widest">{filtered.length} Live Events</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-6 mb-10 bg-white border border-[#E8EDE6] rounded-[2rem] p-8 shadow-xl shadow-[#0D2B22]/5 overflow-x-auto items-end">
        <div className="min-w-[180px] flex-1">
          <label className="text-[10px] font-black text-[#1A4435] uppercase tracking-[0.2em] block mb-3 ml-1 flex items-center gap-2">
            <Clock size={12} /> Run Session
          </label>
          <div className="relative group">
            <select
              value={runFilter}
              onChange={e => setRunFilter(e.target.value)}
              className="w-full bg-[#F2FFEE]/30 border border-[#E8EDE6] rounded-xl px-4 py-3 text-xs font-black text-[#0D2B22] focus:outline-none focus:border-[#0D2B22] transition-all cursor-pointer appearance-none pr-10"
            >
              <option value="All">All Historical Runs</option>
              {uniqueRunIds.map(id => <option key={id} value={id}>Session: {id.slice(0,12)}...</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0D2B22] pointer-events-none group-hover:translate-y-[-40%] transition-transform" />
          </div>
        </div>
        <div className="min-w-[180px] flex-1">
          <label className="text-[10px] font-black text-[#1A4435] uppercase tracking-[0.2em] block mb-3 ml-1 flex items-center gap-2">
            <Cpu size={12} /> Intelligence Agent
          </label>
          <div className="relative group">
            <select
              value={agentFilter}
              onChange={e => setAgentFilter(e.target.value)}
              className="w-full bg-[#F2FFEE]/30 border border-[#E8EDE6] rounded-xl px-4 py-3 text-xs font-black text-[#0D2B22] focus:outline-none focus:border-[#0D2B22] transition-all cursor-pointer appearance-none pr-10"
            >
              {ALL_AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0D2B22] pointer-events-none group-hover:translate-y-[-40%] transition-transform" />
          </div>
        </div>
        <div className="min-w-[180px] flex-1">
          <label className="text-[10px] font-black text-[#1A4435] uppercase tracking-[0.2em] block mb-3 ml-1 flex items-center gap-2">
            <Filter size={12} /> Event Category
          </label>
          <div className="relative group">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full bg-[#F2FFEE]/30 border border-[#E8EDE6] rounded-xl px-4 py-3 text-xs font-black text-[#0D2B22] focus:outline-none focus:border-[#0D2B22] transition-all cursor-pointer appearance-none pr-10"
            >
              {ALL_TYPES.map(t => <option key={t} value={t}>{t === 'All' ? 'All Event Types' : t.toUpperCase()}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0D2B22] pointer-events-none group-hover:translate-y-[-40%] transition-transform" />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-[#E8EDE6] rounded-[2rem] shadow-2xl shadow-[#0D2B22]/5 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-[#1A4435]/30">
            <div className="w-20 h-20 rounded-[2rem] bg-[#F2FFEE]/50 border border-[#E8EDE6] flex items-center justify-center mb-6 shadow-inner">
              <Search size={32} strokeWidth={1.5} />
            </div>
            <p className="text-sm font-black uppercase tracking-[0.2em]">No intelligence matches found</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E8EDE6]/50">
            {filtered.map((log, i) => {
              const style = TYPE_STYLES[log.type] ?? TYPE_STYLES.agent;
              const Icon = style.icon;
              return (
                <div key={log.id ?? i} className="flex items-start gap-8 px-10 py-7 hover:bg-[#F2FFEE]/20 transition-all duration-300 fade-in group relative">
                  {/* Timeline dot + line */}
                  <div className="flex flex-col items-center mt-2 flex-shrink-0 relative">
                    <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 z-10 border-4 border-white shadow-md transition-transform group-hover:scale-125 ${style.dot}`} />
                    {i < filtered.length - 1 && (
                      <div className="absolute top-4 w-1 h-32 bg-[#E8EDE6]/40 -z-0 rounded-full" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2.5 flex-wrap">
                      <span className="text-[10px] font-black text-[#0D2B22] bg-[#E8EDE6] px-2.5 py-1 rounded-md border border-[#0D2B22]/5 uppercase tracking-widest font-mono">
                        ID: {log.runId?.slice(0,8)}
                      </span>
                      <span className="text-sm font-black text-[#0D2B22] tracking-tight">{log.agent}</span>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all group-hover:shadow-sm ${style.badge}`}>
                        <Icon size={12} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {log.type}
                        </span>
                      </div>
                      {log.topic && (
                        <span className="text-[10px] font-black text-[#1A4435]/40 uppercase tracking-widest truncate max-w-[200px]">
                          / {log.topic}
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] text-[#0D2B22] leading-relaxed font-semibold">{log.msg}</p>
                  </div>

                  {/* Timestamp */}
                  <div className="flex-shrink-0 text-right">
                    <div className="inline-flex items-center gap-2 bg-[#F2FFEE] border border-[#E8EDE6] px-4 py-2 rounded-xl text-[11px] font-black text-[#0D2B22] font-mono group-hover:bg-white group-hover:shadow-md transition-all duration-300">
                      <Clock size={12} className="text-[#1A4435]" />
                      {log.ts}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
