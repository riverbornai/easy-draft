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
    <div className="p-8 max-w-4xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trace Logs</h1>
        <p className="text-sm text-gray-400 mt-1">Event timeline — every tool call, guardrail, handoff, and HITL event</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 bg-white border border-gray-100 rounded-xl p-4">
        <div className="flex-1">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Agent</label>
          <select
            value={agentFilter}
            onChange={e => setAgentFilter(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-white focus:outline-none focus:border-violet-400"
          >
            {ALL_AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Event Type</label>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-white focus:outline-none focus:border-violet-400"
          >
            {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <span className="text-xs text-gray-400 mb-2">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            No events match the current filter
          </div>
        ) : filtered.map((log, i) => {
          const style = TYPE_STYLES[log.type] ?? TYPE_STYLES.agent;
          return (
            <div key={log.id ?? i} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors fade-in">
              {/* Timeline dot + line */}
              <div className="flex flex-col items-center mt-1 flex-shrink-0">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${style.dot}`} />
                {i < filtered.length - 1 && <span className="w-px h-full bg-gray-100 mt-1.5 min-h-[20px]" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-xs font-semibold text-gray-800">{log.agent}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${style.badge}`}>
                    {log.type}
                  </span>
                  {log.status === 'active' && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-violet-50 text-violet-500 pulse-dot">
                      running
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{log.msg}</p>
              </div>

              <span className="text-[10px] text-gray-300 font-mono flex-shrink-0 mt-1">{log.ts}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
