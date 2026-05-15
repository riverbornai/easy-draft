import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BarChart2,
  Activity, Cpu, Circle, Clock
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/runs', icon: Clock, label: 'Runs' },
  { to: '/eval', icon: BarChart2, label: 'Eval' },
  { to: '/trace-logs', icon: Activity, label: 'Trace Logs' },
];

export default function Sidebar({ apiStatus }) {
  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-[#0D2B22] flex flex-col z-40 border-r border-[#1A4435] shadow-2xl">
      {/* Logo */}
      <div className="px-6 pt-10 pb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0D2B22] border border-[#1A4435] flex items-center justify-center shadow-lg group">
            <Cpu size={20} className="text-[#D4F53C] group-hover:scale-110 transition-transform" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-white text-lg font-black tracking-tighter leading-none">RIVERBORN</p>
            <p className="text-[#E8EDE6] text-[10px] mt-1 font-bold uppercase tracking-[0.2em] leading-none">Studio</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all duration-300 relative group ${isActive
                ? 'bg-white/5 text-[#D4F53C]'
                : 'text-[#E8EDE6]/40 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#D4F53C] rounded-full shadow-[0_0_12px_rgba(212,245,60,0.4)]" />
                )}
                <Icon size={18} className={isActive ? 'text-[#D4F53C]' : 'group-hover:text-white transition-colors'} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* API status */}
      <div className="px-6 py-6 border-t border-[#1A4435]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Circle
              size={8}
              className={apiStatus === 'connected' ? 'fill-[#D4F53C] text-[#D4F53C]' : 'fill-red-400 text-red-400'}
            />
            {apiStatus === 'connected' && <span className="absolute inset-0 bg-[#D4F53C] rounded-full animate-ping opacity-40" />}
          </div>
          <span className="text-[#E8EDE6]/40 text-[11px] font-bold uppercase tracking-widest">
            API {apiStatus === 'connected' ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
    </aside>
  );
}
