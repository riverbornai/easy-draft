import { useState, useEffect } from 'react';
import axios from 'axios';
import { Key, Eye, EyeOff, Lock, ShieldAlert, X, Sparkles } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose, forceOpen }) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [anthropicKey, setAnthropicKey] = useState('');
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [error, setError] = useState('');
  const [anthropicError, setAnthropicError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false);
  const [hasAnthropicKey, setHasAnthropicKey] = useState(false);
  const [openaiPreview, setOpenaiPreview] = useState(null);
  const [anthropicPreview, setAnthropicPreview] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setApiKey('');
      setAnthropicKey('');
      setError('');
      setAnthropicError('');
      setSuccess(false);

      axios.get('/api/user/keys')
        .then(({ data }) => {
          setHasOpenAIKey(data.hasOpenAIKey);
          setHasAnthropicKey(data.hasAnthropicKey);
          setOpenaiPreview(data.openaiKeyPreview);
          setAnthropicPreview(data.anthropicKeyPreview);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    const trimmedKey = apiKey.trim();
    const trimmedAnthropicKey = anthropicKey.trim();

    if (!trimmedKey && !hasOpenAIKey) {
      setError('API key cannot be empty.');
      return;
    }
    if (trimmedKey && !trimmedKey.startsWith('sk-')) {
      setError('Invalid format. OpenAI API keys typically start with "sk-".');
      return;
    }
    // Claude/Anthropic key is optional — only validate if the user entered one.
    if (trimmedAnthropicKey && !trimmedAnthropicKey.startsWith('sk-ant-')) {
      setAnthropicError('Invalid format. Anthropic API keys typically start with "sk-ant-".');
      return;
    }

    try {
      const payload = {};
      if (trimmedKey) payload.openaiKey = trimmedKey;
      if (trimmedAnthropicKey) payload.anthropicKey = trimmedAnthropicKey;
      await axios.put('/api/user/keys', payload);

      setSuccess(true);
      setError('');
      setAnthropicError('');
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
      <div className="relative bg-white w-full max-w-[calc(100vw-2rem)] sm:max-w-[520px] rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-300 z-10 overflow-hidden">
        
        {/* ── Gradient Header ── */}
        <div className="relative bg-gradient-to-br from-[#0D2B22] via-[#163D30] to-[#0D2B22] px-5 sm:px-8 pt-8 pb-6">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '20px 20px'
          }} />
          
          {/* Close button */}
          {!forceOpen && (
            <button 
              onClick={onClose}
              className="absolute top-5 right-5 p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={18} />
            </button>
          )}

          {/* Icon + Title */}
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#D4F53C]/15 border border-[#D4F53C]/25 flex items-center justify-center flex-shrink-0">
              <Key size={22} className="text-[#D4F53C]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight leading-tight">
                Configure API Keys
              </h3>
              <p className="text-xs text-[#D4F53C]/70 font-semibold uppercase tracking-wider mt-0.5">
                EasyDraft Platform
              </p>
            </div>
          </div>

          {/* Subtitle */}
          <p className="relative text-sm text-white/55 mt-3.5 leading-relaxed">
            {forceOpen
              ? "Add an OpenAI API key to get started with the platform."
              : "Update or modify your API keys for this workspace."}
          </p>
        </div>

        {/* ── Body ── */}
        <div className="px-5 sm:px-8 pt-6 pb-7">

          {/* Info Cards — side by side */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 flex gap-2.5 rounded-2xl bg-[#F2FFEE] border border-[#0D2B22]/8 p-4">
              <Lock size={15} className="text-[#0D2B22]/50 mt-0.5 flex-shrink-0" />
              <p className="text-[12px] text-[#0D2B22]/70 leading-relaxed">
                Your keys are <strong>encrypted</strong> and linked to <strong>your account</strong>, so they follow you to any device you sign in on.
              </p>
            </div>
            <div className="flex-1 flex gap-2.5 rounded-2xl bg-[#0D2B22]/[0.03] border border-[#0D2B22]/8 p-4">
              <Sparkles size={15} className="text-[#0D2B22]/50 mt-0.5 flex-shrink-0" />
              <p className="text-[12px] text-[#0D2B22]/70 leading-relaxed">
                <strong>Tip:</strong> Add both keys to compare GPT-4o vs Claude scores side by side. One key works fine too.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-5">
            {/* OpenAI Key */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#0D2B22]/50 mb-2 px-0.5">
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
                  placeholder={hasOpenAIKey ? `Saved: ${openaiPreview} — leave blank to keep` : 'sk-proj-...'}
                  className="w-full bg-[#0D2B22]/[0.02] border border-[#E8EDE6] focus:border-[#0D2B22] focus:ring-1 focus:ring-[#0D2B22]/20 rounded-xl py-3.5 pl-4 pr-12 text-[14px] font-mono text-[#0D2B22] outline-none transition-all placeholder-[#0D2B22]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[#0D2B22]/30 hover:text-[#0D2B22] hover:bg-[#0D2B22]/5 transition-all"
                >
                  {showKey ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {error && (
                <div className="flex items-center gap-1.5 mt-2 text-[12px] text-red-500 font-semibold px-0.5 animate-in slide-in-from-top-1 duration-200">
                  <ShieldAlert size={14} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Anthropic Key */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#0D2B22]/50 mb-2 px-0.5">
                Anthropic (Claude) API Key
                <span className="ml-2 text-[10px] font-medium normal-case tracking-normal text-[#0D2B22]/30">optional</span>
              </label>
              <div className="relative">
                <input
                  type={showAnthropicKey ? 'text' : 'password'}
                  value={anthropicKey}
                  onChange={(e) => {
                    setAnthropicKey(e.target.value);
                    setAnthropicError('');
                  }}
                  placeholder={hasAnthropicKey ? `Saved: ${anthropicPreview} — leave blank to keep` : 'sk-ant-...'}
                  className="w-full bg-[#0D2B22]/[0.02] border border-[#E8EDE6] focus:border-[#0D2B22] focus:ring-1 focus:ring-[#0D2B22]/20 rounded-xl py-3.5 pl-4 pr-12 text-[14px] font-mono text-[#0D2B22] outline-none transition-all placeholder-[#0D2B22]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[#0D2B22]/30 hover:text-[#0D2B22] hover:bg-[#0D2B22]/5 transition-all"
                >
                  {showAnthropicKey ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {anthropicError && (
                <div className="flex items-center gap-1.5 mt-2 text-[12px] text-red-500 font-semibold px-0.5 animate-in slide-in-from-top-1 duration-200">
                  <ShieldAlert size={14} className="flex-shrink-0" />
                  <span>{anthropicError}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-1 flex gap-3">
              {!forceOpen && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 border border-[#E8EDE6] text-[#0D2B22]/60 text-[12px] font-bold uppercase tracking-wider py-3.5 rounded-xl hover:bg-[#0D2B22]/[0.03] hover:text-[#0D2B22] hover:border-[#0D2B22]/15 transition-all active:scale-[0.97]"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={success}
                className={`flex-1 bg-[#0D2B22] text-[#D4F53C] text-[12px] font-bold uppercase tracking-wider py-3.5 rounded-xl hover:bg-[#1A4435] transition-all active:scale-[0.97] border border-[#D4F53C]/15 flex items-center justify-center gap-2 ${
                  success ? 'opacity-80 cursor-default bg-[#1A4435]' : ''
                }`}
              >
                {success ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Saved!
                  </span>
                ) : (
                  <span>Save & Proceed</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
