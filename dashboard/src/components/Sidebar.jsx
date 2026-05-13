import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Plus, FileText, BarChart2,
  Activity, Cpu, Circle, Clock
} from 'lucide-react';

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/new-run',   icon: Plus,            label: 'New Run'     },
  { to: '/drafts',    icon: FileText,         label: 'Drafts'      },
  { to: '/eval',      icon: BarChart2,        label: 'Eval'        },
  { to: '/history',   icon: Clock,            label: 'History'     },
  { to: '/trace-logs',icon: Activity,         label: 'Trace Logs'  },
];

export default function Sidebar({ apiStatus }) {
  return (
    <aside className="fixed top-0 left-0 h-screen w-56 bg-[#0a0a0a] flex flex-col z-40 border-r border-white/5">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center">
            <Cpu size={14} className="text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-none">AI Content</p>
            <p className="text-white/30 text-[10px] mt-0.5 leading-none">Studio</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* API status */}
      <div className="px-5 py-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <Circle
            size={7}
            className={apiStatus === 'connected' ? 'fill-teal-400 text-teal-400' : 'fill-red-400 text-red-400'}
          />
          <span className="text-white/30 text-[11px]">
            API {apiStatus === 'connected' ? 'connected' : 'offline'}
          </span>
        </div>
      </div>
    </aside>
  );
}
