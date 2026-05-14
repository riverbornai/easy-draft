import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, ArrowRight, Linkedin, FileText, Mail, Facebook, ChevronDown } from 'lucide-react';

const XIcon = ({ size = 16, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TONES    = ['professional', 'casual', 'thought-leader', 'inspirational', 'educational', 'witty'];
const AUDIENCES = ['Tech Leads', 'SaaS Founders', 'Marketing Managers', 'Content Creators', 'HR Professionals', 'Software Engineers', 'Product Managers'];
const CHANNELS = [
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-[#0D2B22]' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-[#0D2B22]' },
  { id: 'blog',     label: 'Blog',     icon: FileText, color: 'text-[#1A4435]' },
  { id: 'xthread',  label: 'X Thread', icon: XIcon,    color: 'text-[#0D2B22]' },
  { id: 'email',    label: 'Email',    icon: Mail,     color: 'text-[#1A4435]' },
];

export default function NewRunForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    topic: '', context: '', tone: 'professional', audience: [], channel: 'linkedin', angle: '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleAudience = (aud) => {
    set('audience', form.audience.includes(aud) 
      ? form.audience.filter(a => a !== aud) 
      : [...form.audience, aud]
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.topic.trim() || form.audience.length === 0) {
      setError('Topic and at least one audience type are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await axios.post('/api/run/start', {
        ...form,
        audience: form.audience.join(', ')
      });
      const data = response.data;
      const runId = data.runId || data.sessionId || data.id || (typeof data === 'string' ? data : null);

      if (runId && typeof runId === 'string') {
        const displayId = runId.replace('session_', '');
        navigate(`/runs/${displayId}`);
      } else {
        throw new Error('Server did not return a valid Run ID.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to start pipeline.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in max-w-3xl mx-auto pt-6 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#0D2B22] leading-tight tracking-tight">Create New Run</h1>
        <p className="text-sm text-[#1A4435] font-semibold uppercase tracking-wider mt-2">Define your content brief to start the automated pipeline</p>
      </div>

      <form onSubmit={submit} className="bg-white border border-[#E8EDE6] rounded-[2.5rem] p-10 shadow-sm space-y-8">
        
        {/* Topic */}
        <div>
          <label className="block text-[11px] font-black text-[#1A4435] uppercase tracking-[0.2em] mb-3 ml-1">
            Topic <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.topic}
            onChange={e => set('topic', e.target.value)}
            placeholder='e.g. "Future of AI in Software Engineering"'
            className="w-full bg-[#F2FFEE]/30 border border-[#E8EDE6] rounded-2xl px-6 py-4 text-[#0D2B22] placeholder-[#1A4435]/50 focus:outline-none focus:bg-white focus:border-[#0D2B22] focus:ring-4 focus:ring-[#0D2B22]/5 transition-all duration-300"
          />
        </div>

        {/* Context */}
        <div>
          <label className="block text-[11px] font-black text-[#1A4435] uppercase tracking-[0.2em] mb-3 ml-1">
            Context <span className="text-[#1A4435]/60 font-normal normal-case ml-1 font-medium">(additional details for the AI)</span>
          </label>
          <textarea
            rows={4}
            value={form.context}
            onChange={e => set('context', e.target.value)}
            placeholder='Provide background, specific points to cover, or source materials...'
            className="w-full bg-[#F2FFEE]/30 border border-[#E8EDE6] rounded-2xl px-6 py-4 text-[#0D2B22] placeholder-[#1A4435]/50 resize-none focus:outline-none focus:bg-white focus:border-[#0D2B22] focus:ring-4 focus:ring-[#0D2B22]/5 transition-all duration-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Tone */}
          <div>
            <label className="block text-[11px] font-black text-[#1A4435] uppercase tracking-[0.2em] mb-3 ml-1">Tone</label>
            <div className="relative">
              <select
                value={form.tone}
                onChange={e => set('tone', e.target.value)}
                className="w-full bg-[#F2FFEE]/30 border border-[#E8EDE6] rounded-2xl px-6 py-4 text-[#0D2B22] focus:outline-none focus:bg-white focus:border-[#0D2B22] focus:ring-4 focus:ring-[#0D2B22]/5 transition-all duration-300 cursor-pointer appearance-none font-black uppercase text-[10px] tracking-widest"
              >
                {TONES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#1A4435]">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          {/* Audience */}
          <div>
            <label className="block text-[11px] font-black text-[#1A4435] uppercase tracking-[0.2em] mb-3 ml-1">
              Target Audience <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div 
                tabIndex="0"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full bg-[#F2FFEE]/30 border border-[#E8EDE6] rounded-2xl px-4 py-3 min-h-[58px] flex flex-wrap gap-2 focus:bg-white focus:border-[#0D2B22] focus:ring-4 focus:ring-[#0D2B22]/5 transition-all duration-300 cursor-pointer relative pr-12 items-center"
              >
                {form.audience.length === 0 ? (
                  <span className="text-[#1A4435] text-sm px-2 font-medium">Select target audience...</span>
                ) : (
                  form.audience.map(aud => (
                    <span key={aud} className="bg-[#D4F53C]/20 text-[#0D2B22] text-[10px] font-black px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border border-[#1A4435]/30 animate-in zoom-in-95 duration-200 uppercase tracking-widest">
                      {aud}
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); toggleAudience(aud); }} 
                        className="hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[#1A4435] pointer-events-none">
                  <ChevronDown size={14} />
                </div>
              </div>
              
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute top-full left-0 w-full mt-3 bg-white border border-[#E8EDE6] rounded-2xl shadow-2xl z-20 max-h-60 overflow-y-auto p-2 animate-in slide-in-from-top-2 duration-300 flex flex-col gap-2">
                    {AUDIENCES.map(aud => (
                      <button
                        key={aud}
                        type="button"
                        onClick={() => { toggleAudience(aud); }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between ${
                          form.audience.includes(aud) 
                            ? 'bg-[#F2FFEE] text-[#0D2B22]' 
                            : 'text-[#1A4435] hover:bg-[#F2FFEE]/50'
                        }`}
                      >
                        {aud}
                        {form.audience.includes(aud) && (
                          <div className="w-4 h-4 rounded-full bg-[#0D2B22] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#D4F53C]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Channel */}
        <div>
          <label className="block text-[11px] font-black text-[#1A4435] uppercase tracking-[0.2em] mb-4 ml-1">Channel</label>
          <div className="grid grid-cols-5 gap-3">
            {CHANNELS.map(ch => (
              <button
                key={ch.id}
                type="button"
                onClick={() => set('channel', ch.id)}
                className={`flex flex-col items-center gap-3 py-5 rounded-2xl border text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                  form.channel === ch.id
                    ? 'border-[#0D2B22] bg-[#F2FFEE] text-[#0D2B22] shadow-sm shadow-[#0D2B22]/10 scale-[1.02]'
                    : 'border-[#E8EDE6] bg-[#F2FFEE]/30 text-[#1A4435] hover:border-[#1A4435] hover:bg-[#F2FFEE]/50 hover:text-[#0D2B22]'
                }`}
              >
                <ch.icon size={20} className={form.channel === ch.id ? 'text-[#0D2B22]' : ch.color} />
                {ch.label}
              </button>
            ))}
          </div>
        </div>

        {/* Angle */}
        <div>
          <label className="block text-[11px] font-black text-[#1A4435] uppercase tracking-[0.2em] mb-3 ml-1">
            Unique Angle <span className="text-[#1A4435]/60 font-normal normal-case ml-1 font-medium">(optional)</span>
          </label>
          <input
            type="text"
            value={form.angle}
            onChange={e => set('angle', e.target.value)}
            placeholder='e.g. "Focus on ROI over features"'
            className="w-full bg-[#F2FFEE]/30 border border-[#E8EDE6] rounded-2xl px-6 py-4 text-[#0D2B22] placeholder-[#1A4435]/50 focus:outline-none focus:bg-white focus:border-[#0D2B22] focus:ring-4 focus:ring-[#0D2B22]/5 transition-all duration-300"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 text-sm text-red-500 bg-red-50/50 px-6 py-4 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-1">
            <span className="font-bold uppercase text-[10px] bg-red-100 px-2 py-0.5 rounded">Error</span>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-[#0D2B22] text-[#D4F53C] font-black uppercase tracking-widest text-xs py-5 rounded-2xl hover:bg-[#1A4435] hover:shadow-2xl hover:shadow-[#0D2B22]/20 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Starting pipeline...</>
          ) : (
            <>
              Launch Agent Pipeline 
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
