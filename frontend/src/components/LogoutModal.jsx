import { useState } from 'react';
import { LogOut, X } from 'lucide-react';

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogout = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-md bg-[#0D2B22] border border-[#1A4435] rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Accent Blur */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#D4F53C]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#E8EDE6]/40 hover:text-white transition-colors p-1 rounded-full hover:bg-white/5"
        >
          <X size={18} />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D4F53C]/10 border border-[#D4F53C]/20 flex items-center justify-center text-[#D4F53C] shrink-0">
            <LogOut size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-white">Sign Out Confirmation</h3>
            <p className="text-xs text-[#E8EDE6]/50">Are you sure you want to sign out?</p>
          </div>
        </div>

        {/* Description Body */}
        <div className="bg-[#103227]/50 border border-[#1A4435] rounded-2xl p-4 text-xs text-[#E8EDE6]/70 leading-relaxed">
          Logging out will end your active session. You will need to sign in again to create content and access saved agent runs.
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1A4435]/50 text-[#E8EDE6]/70 hover:bg-[#1A4435] hover:text-white border border-[#1A4435] transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-[#D4F53C] hover:bg-[#E2FF54] text-[#0D2B22] shadow-lg shadow-[#D4F53C]/10 transition-all duration-200 active:scale-95 disabled:opacity-50"
          >
            <LogOut size={14} />
            <span>{loading ? 'Signing out...' : 'Yes, Sign Out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
