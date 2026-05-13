import { useState, useEffect } from 'react';
import axios from 'axios';

const TYPE_STYLES = {
  tool:      { dot: 'bg-teal-400',   badge: 'bg-teal-50 text-teal-600'   },
  guardrail: { dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-600'  },
  agent:     { dot: 'bg-violet-400', badge: 'bg-violet-50 text-violet-600'},
  handoff:   { dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-600'   },
  hitl:      { dot: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700'  },
  error:     { dot: 'bg-red-400',    badge: 'bg-red-50 text-red-600'     },
};

const ALL_AGENTS = ['All','IntakeAgent','ResearchAgent','WriterAgent','ReviewAgent','PublisherAgent','EvalRunner','InputGuardrail','OutputGuardrail'];
const ALL_TYPES  = ['All','tool','guardrail','agent','handoff','hitl','error'];

export default function TraceLogs() {
  const [logs,         setLogs]        = useState([]);
  const [agentFilter,  setAgentFilter] = useState('All');
  const [typeFilter,   setTypeFilter]  = useState('All');

  useEffect(() => {
    const fetch = () => axios.get('/api/agents/log').then(r => setLogs(r.data)).catch(()=>{});
    fetch();
    const poll = setInterval(fetch, 3000);
    return () => clearInterval(poll);
  }, []);

  const filtered = logs.filter(l =>
    (agentFilter === 'All' || l.agent === agentFilter) &&
    (typeFilter  === 'All' || l.type  === typeFilter)
  );

  return (
    <div className="p-8 max-w-5xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Trace Logs</h1>
        <p className="text-sm text-gray-400 mt-1">Live event timeline — monitoring every agent decision and tool call</p>
      </div>

      {/* Filters */}
      <div className="flex gap-6 mb-8 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex-1">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2.5 ml-1">Agent Filter</label>
          <select
            value={agentFilter}
            onChange={e => setAgentFilter(e.target.value)}
            className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-700 focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all cursor-pointer appearance-none"
          >
            {ALL_AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2.5 ml-1">Event Type</label>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-700 focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all cursor-pointer appearance-none"
          >
            {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-end pb-1">
          <div className="bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
            <span className="text-[11px] font-bold text-gray-500">{filtered.length} <span className="text-gray-300 ml-1">EVENTS</span></span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-300">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
              <span className="text-xl">🔍</span>
            </div>
            <p className="text-sm font-medium">No events match the current filter</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((log, i) => {
              const style = TYPE_STYLES[log.type] ?? TYPE_STYLES.agent;
              return (
                <div key={log.id ?? i} className="flex items-start gap-5 px-6 py-5 hover:bg-gray-50/30 transition-all fade-in group">
                  {/* Timeline dot + line */}
                  <div className="flex flex-col items-center mt-1.5 flex-shrink-0 relative">
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 z-10 border-2 border-white shadow-sm ${style.dot}`} />
                    {i < filtered.length - 1 && (
                      <span className="absolute top-3 w-0.5 h-20 bg-gray-100 -z-0" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-sm font-bold text-gray-900">{log.agent}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-tight px-2 py-0.5 rounded-md ${style.badge}`}>
                        {log.type}
                      </span>
                      {log.status === 'active' && (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-violet-500 bg-violet-50 px-2 py-0.5 rounded-md">
                          <span className="w-1 h-1 rounded-full bg-violet-500 animate-pulse" />
                          RUNNING
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-gray-600 leading-relaxed font-medium">{log.msg}</p>
                  </div>

                  {/* Timestamp */}
                  <div className="flex-shrink-0 text-right mt-1">
                    <span className="text-[11px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 font-mono group-hover:bg-white group-hover:border-gray-200 transition-all">
                      {log.ts}
                    </span>
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
