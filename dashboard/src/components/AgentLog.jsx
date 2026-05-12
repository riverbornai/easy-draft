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
    <div className="bg-white border border-gray-100 rounded-xl p-5 h-full">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Live Agent Log
      </h3>

      {logs.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
          No events yet — start a run to see activity
        </div>
      ) : (
        <div className="space-y-0 overflow-y-auto max-h-72">
          {logs.map((log, i) => {
            const style = TYPE_STYLES[log.type] ?? TYPE_STYLES.agent;
            return (
              <div key={log.id ?? i} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0 fade-in">
                {/* Status dot */}
                <div className="mt-1 flex-shrink-0">
                  <span className={`block w-2 h-2 rounded-full ${STATUS_DOT[log.status] ?? 'bg-gray-300'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-semibold text-gray-700">{log.agent}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${style.label}`}>
                      {log.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-snug truncate">{log.msg}</p>
                </div>

                <span className="text-[10px] text-gray-300 flex-shrink-0 font-mono mt-0.5">
                  {log.ts}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
