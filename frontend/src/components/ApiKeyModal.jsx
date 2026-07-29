import { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Lock, ShieldAlert, X } from 'lucide-react';
import { encrypt, decrypt } from '../utils/crypto.js';

export default function ApiKeyModal({ isOpen, onClose, forceOpen }) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedEncrypted = localStorage.getItem('openai_api_key');
      if (storedEncrypted) {
        setApiKey(decrypt(storedEncrypted));
      } else {
        setApiKey('');
      }
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('API key cannot be empty.');
      return;
    }
    if (!apiKey.trim().startsWith('sk-')) {
      setError('Invalid format. OpenAI API keys typically start with "sk-".');
      return;
    }

    try {
      const encrypted = encrypt(apiKey.trim());
      localStorage.setItem('openai_api_key', encrypted);
      setSuccess(true);
      setError('');
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      setError('An error occurred while saving the key.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#060F0C]/80 backdrop-blur-md transition-opacity duration-300"
        onClick={() => {
          if (!forceOpen) onClose();
        }}
      />

      {/* Modal Card */}
      <div className="relative bg-white border border-[#E8EDE6] w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300 z-10 overflow-hidden">
        {/* Top-Right Close Button (Only if not forced) */}
        {!forceOpen && (
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full text-[#E8EDE6]/80 hover:text-[#0D2B22] bg-[#E8EDE6]/10 hover:bg-[#E8EDE6]/30 transition-all"
          >
            <X size={18} />
          </button>
        )}

        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-[#0D2B22] border border-[#1A4435] flex items-center justify-center shadow-lg animate-bounce">
            <Key size={28} className="text-[#D4F53C]" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-black text-[#0D2B22] tracking-tight">
            Configure OpenAI Key
          </h3>
          <p className="text-xs text-[#1A4435] font-black uppercase tracking-widest mt-1.5">
            Riverborn AI Platform
          </p>
          <p className="text-sm text-[#0D2B22]/70 mt-3 px-2 leading-relaxed">
            {forceOpen 
              ? "Hey, please add an OpenAI API key so that you can use the application." 
              : "Update or modify your OpenAI API key for this workspace."}
          </p>
        </div>

        {/* Alert Card */}
        <div className="bg-[#F2FFEE] border border-[#1A4435]/20 rounded-2xl p-4 mb-6 flex gap-3 items-start">
          <Lock size={18} className="text-[#0D2B22] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-[#0D2B22]/85 leading-relaxed font-semibold">
            Your key is <strong>encrypted</strong> and stored <strong>locally in your browser</strong>. It is never stored on, nor visible to, our servers.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-[#0D2B22] mb-2 px-1">
              OpenAI API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setError('');
                }}
                placeholder="sk-proj-..."
                className="w-full bg-[#F2FFEE]/30 border border-[#E8EDE6] focus:border-[#0D2B22] focus:ring-1 focus:ring-[#0D2B22] rounded-2xl py-4 pl-4 pr-12 text-sm font-mono text-[#0D2B22] outline-none transition-all placeholder-[#E8EDE6]"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1A4435]/50 hover:text-[#0D2B22] transition-colors"
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-1.5 mt-2.5 text-xs text-red-500 font-bold px-1 animate-in slide-in-from-top-1 duration-200">
                <ShieldAlert size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            {!forceOpen && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-[#E8EDE6] text-[#0D2B22] text-xs font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-[#E8EDE6]/20 transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={success}
              className={`flex-grow bg-[#0D2B22] text-[#D4F53C] text-xs font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-[#1A4435] transition-all active:scale-[0.98] border border-[#D4F53C]/20 flex items-center justify-center gap-2 ${
                success ? 'opacity-80 cursor-default bg-[#1A4435]' : ''
              }`}
            >
              <span>{success ? 'Saved Key!' : 'Save & Proceed'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
