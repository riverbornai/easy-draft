export default function ScoreCard({ label, value, sub, icon: Icon, trend, color = 'teal' }) {
  const colors = {
    teal:   { bg: 'bg-teal-50',   text: 'text-teal-600',   icon: 'text-teal-400'   },
    purple: { bg: 'bg-violet-50', text: 'text-violet-600', icon: 'text-violet-400' },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-600',  icon: 'text-amber-400'  },
    red:    { bg: 'bg-red-50',    text: 'text-red-600',    icon: 'text-red-400'    },
    gray:   { bg: 'bg-gray-50',   text: 'text-gray-600',   icon: 'text-gray-400'   },
  };
  const c = colors[color] ?? colors.gray;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1.5">{value ?? '—'}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
            <Icon size={17} className={c.icon} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <span className={`text-xs font-medium ${trend >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-xs text-gray-400 ml-1">vs last run</span>
        </div>
      )}
    </div>
  );
}
