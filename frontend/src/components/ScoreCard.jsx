export default function ScoreCard({ label, value, sub, icon: Icon, trend, color = 'teal' }) {
  const colors = {
    forest: { 
      bg: 'bg-[#F2FFEE] border-[#9FCEBE]/40', 
      text: 'text-[#0D2B22]', 
      icon: 'text-[#0D2B22]', 
      badge: 'bg-[#0D2B22]/5 text-[#0D2B22]',
      glow: 'from-[#0D2B22]/10'
    },
    lime: { 
      bg: 'bg-[#D4F53C]/10 border-[#D4F53C]/30', 
      text: 'text-[#0D2B22]', 
      icon: 'text-[#0D2B22]', 
      badge: 'bg-[#D4F53C]/20 text-[#0D2B22]',
      glow: 'from-[#D4F53C]/10'
    },
    teal:   { 
      bg: 'bg-emerald-50/50', 
      text: 'text-emerald-600', 
      icon: 'text-emerald-500', 
      badge: 'bg-emerald-100/50 text-emerald-700',
      glow: 'from-emerald-200/20'
    },
    purple: { 
      bg: 'bg-indigo-50/50', 
      text: 'text-indigo-600', 
      icon: 'text-indigo-500', 
      badge: 'bg-indigo-100/50 text-indigo-700',
      glow: 'from-indigo-200/20'
    },
    amber:  { 
      bg: 'bg-orange-50/50', 
      text: 'text-orange-600', 
      icon: 'text-orange-500', 
      badge: 'bg-orange-100/50 text-orange-700',
      glow: 'from-orange-200/20'
    },
    red:    { 
      bg: 'bg-rose-50/50', 
      text: 'text-rose-600', 
      icon: 'text-rose-500', 
      badge: 'bg-rose-100/50 text-rose-700',
      glow: 'from-rose-200/20'
    },
    gray:   { 
      bg: 'bg-slate-50/50', 
      text: 'text-slate-600', 
      icon: 'text-slate-500', 
      badge: 'bg-slate-100/50 text-slate-700',
      glow: 'from-slate-200/20'
    },
  };
  
  const c = colors[color] ?? colors.gray;

  return (
    <div className="group relative bg-white border border-[#E8EDE6] rounded-[2rem] p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ease-out overflow-hidden">
      {/* Decorative background glow on hover */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${c.glow} to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[10px] font-black text-[#1A4435] uppercase tracking-[0.2em]">{label}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-4xl font-black text-[#0D2B22] tracking-tighter">{value ?? '—'}</p>
          </div>
          {sub && <p className="text-xs text-[#1A4435] font-semibold mt-1">{sub}</p>}
        </div>
        
        {Icon && (
          <div className={`w-12 h-12 rounded-2xl ${c.bg} border flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-500`}>
            <Icon size={22} className={c.icon} />
          </div>
        )}
      </div>

      {(trend !== undefined || trend === 0) && (
        <div className="mt-5 flex items-center gap-2 relative z-10">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-[10px] font-bold text-[#1A4435] uppercase tracking-widest">vs last run</span>
        </div>
      )}
    </div>
  );
}
