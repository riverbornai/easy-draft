import { Cpu, Activity, ShieldCheck, Share2, UserCheck, AlertCircle } from 'lucide-react';

const TYPE_STYLES = {
  tool:      { dot: 'bg-[#1A4435]',   badge: 'bg-[#E8EDE6] text-[#1A4435]',   icon: Cpu },
  guardrail: { dot: 'bg-[#0D2B22]',   badge: 'bg-[#0D2B22]/10 text-[#0D2B22]', icon: ShieldCheck },
  agent:     { dot: 'bg-[#0D2B22]',   badge: 'bg-[#F2FFEE] text-[#0D2B22]',   icon: Activity },
  handoff:   { dot: 'bg-[#1A4435]',   badge: 'bg-[#1A4435]/10 text-[#1A4435]', icon: Share2 },
  hitl:      { dot: 'bg-emerald-600', badge: 'bg-emerald-50 text-emerald-700', icon: UserCheck },
  error:     { dot: 'bg-red-500',     badge: 'bg-red-50 text-red-600',      icon: AlertCircle },
};

const STATUS_DOT = {
  running: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
  error:   'bg-red-500',
  done:    'bg-[#0D2B22]',
};

export default function AgentLog({ logs = [] }) {
  return (
    <div className="bg-white border border-[#E8EDE6] rounded-[2rem] p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-[11px] font-black text-[#1A4435] uppercase tracking-[0.2em]">Live Agent Trace</h3>
        <div className="flex items-center gap-2 bg-[#F2FFEE] px-3 py-1.5 rounded-lg border border-[#9FCEBE]/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] font-black text-[#0D2B22] uppercase tracking-widest">Live Updates</span>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#1A4435]/40">
          <div className="w-16 h-16 rounded-[1.5rem] bg-[#F2FFEE]/50 flex items-center justify-center mb-4 border border-[#E8EDE6]">
            <Activity size={24} strokeWidth={1.5} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest">Waiting for agent activity...</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
          {logs.map((log, i) => {
            const style = TYPE_STYLES[log.type] ?? TYPE_STYLES.agent;
            const Icon = style.icon;
            return (
              <div key={log.id ?? i} className="flex items-start gap-5 py-4 px-5 rounded-2xl border border-transparent hover:border-[#E8EDE6] hover:bg-[#F2FFEE]/30 transition-all duration-300 fade-in group">
                {/* Timeline visual */}
                <div className="mt-1.5 flex flex-col items-center flex-shrink-0 relative">
                  <span className={`block w-2.5 h-2.5 rounded-full ring-4 ring-white shadow-sm transition-transform group-hover:scale-125 ${STATUS_DOT[log.status] ?? style.dot}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-black text-[#0D2B22] tracking-tight">{log.agent}</span>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest ${style.badge}`}>
                      <Icon size={10} />
                      {log.type}
                    </div>
                  </div>
                  <p className="text-[13px] text-[#0D2B22] leading-relaxed font-semibold opacity-80 group-hover:opacity-100 transition-opacity">{log.msg}</p>
                </div>

                <div className="flex-shrink-0 text-right">
                  <span className="text-[10px] font-black text-[#1A4435] bg-[#E8EDE6] px-2 py-1 rounded-md font-mono tabular-nums border border-[#1A4435]/5">
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
