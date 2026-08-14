import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, BarChart2,
  Activity, Key, Clock, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/runs', icon: Clock, label: 'Runs' },
  { to: '/eval', icon: BarChart2, label: 'Eval' },
  { to: '/trace-logs', icon: Activity, label: 'Trace Logs' },
];

import { useState } from 'react';
import LogoutModal from './LogoutModal.jsx';

export default function Sidebar({ apiStatus, onManageKey }) {
  const { currentUser, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <>
      <aside className="fixed top-0 left-0 h-screen w-64 bg-[#0D2B22] flex flex-col z-40 border-r border-[#1A4435] shadow-2xl">
        <div className="px-6 pt-8 pb-3">
          <Link to="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="EasyDraft Logo"
              className="h-12 w-auto object-contain hover:scale-[1.02] transition-transform duration-300"
            />
          </Link>
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

        {/* Signed-in user */}
        {currentUser && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-3 bg-[#103227]/40 border border-[#1A4435] rounded-xl p-3">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#1A4435] flex items-center justify-center text-[#D4F53C] text-xs font-black">
                  {(currentUser.email || '?')[0].toUpperCase()}
                </div>
              )}
              <span className="flex-1 min-w-0 text-[#E8EDE6]/70 text-xs truncate">
                {currentUser.email}
              </span>
              <button
                onClick={() => setShowLogoutModal(true)}
                title="Sign out"
                className="text-[#D4F53C] hover:text-white transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        )}

      {/* API & Key Status Panel */}
      <div className="px-4 pt-1 pb-4 mt-auto">
        <div className="bg-[#103227]/40 border border-[#1A4435] rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-sm relative overflow-hidden group">
          {/* Subtle background glow on hover */}
          <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-[#D4F53C]/5 rounded-full blur-2xl group-hover:bg-[#D4F53C]/10 transition-all duration-500" />
          
          {/* Status Header */}
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[#E8EDE6]/50 text-[10px] font-black uppercase tracking-[0.15em]">
              Gateway Status
            </span>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/20 border border-white/5">
              <div className="relative flex h-2 w-2">
                {apiStatus === 'connected' ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4F53C] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4F53C]"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                )}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider ${
                apiStatus === 'connected' ? 'text-[#D4F53C]' : 'text-red-400'
              }`}>
                {apiStatus === 'connected' ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={onManageKey}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 active:scale-[0.97] relative z-10
              bg-[#1A4435] text-[#E8EDE6] border border-[#1A4435] 
              hover:border-[#D4F53C] hover:text-[#D4F53C] hover:shadow-[0_0_20px_rgba(212,245,60,0.15)]"
          >
            <Key size={13} className="transition-transform group-hover:rotate-12 duration-300" />
            <span>Manage API Key</span>
          </button>
        </div>
      </div>
    </aside>

    <LogoutModal
      isOpen={showLogoutModal}
      onClose={() => setShowLogoutModal(false)}
      onConfirm={logout}
    />
    </>
  );
}
