const TYPE_STYLES = {
  tool:      { dot: 'bg-teal-400',   label: 'bg-teal-50 text-teal-600'   },
  guardrail: { dot: 'bg-amber-400',  label: 'bg-amber-50 text-amber-600'  },
  agent:     { dot: 'bg-violet-400', label: 'bg-violet-50 text-violet-600'},
  handoff:   { dot: 'bg-blue-400',   label: 'bg-blue-50 text-blue-600'   },
  hitl:      { dot: 'bg-amber-400',  label: 'bg-amber-50 text-amber-600'  },
  error:     { dot: 'bg-red-400',    label: 'bg-red-50 text-red-600'     },
};

const STATUS_DOT = {
  success: 'bg-teal-400',
  active:  'bg-violet-400 pulse-dot',
  warning: 'bg-amber-400',
  error:   'bg-red-400',
};

export default function AgentLog({ logs = [] }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 h-full shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          Live Agent Log
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-tight">Live Updates</span>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-300">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3">
            <span className="text-lg">⏲</span>
          </div>
          <p className="text-sm font-medium">Waiting for activity...</p>
        </div>
      ) : (
        <div className="space-y-1 overflow-y-auto max-h-[340px] pr-2 custom-scrollbar">
          {logs.map((log, i) => {
            const style = TYPE_STYLES[log.type] ?? TYPE_STYLES.agent;
            return (
              <div key={log.id ?? i} className="flex items-start gap-4 py-3 px-3 rounded-xl border border-transparent hover:border-gray-100 hover:bg-gray-50/50 transition-all duration-200 fade-in group">
                {/* Status dot */}
                <div className="mt-1.5 flex-shrink-0">
                  <span className={`block w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${STATUS_DOT[log.status] ?? 'bg-gray-200'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="text-xs font-bold text-gray-800">{log.agent}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-tight px-2 py-0.5 rounded-md ${style.label}`}>
                      {log.type}
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-600 leading-snug truncate group-hover:text-gray-900 transition-colors">{log.msg}</p>
                </div>

                <div className="flex-shrink-0 text-right">
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 font-mono group-hover:bg-white group-hover:border-gray-200 transition-all">
                    {log.ts}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
