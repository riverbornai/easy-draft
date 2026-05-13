import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, ArrowRight, Linkedin, FileText, Mail, Facebook } from 'lucide-react';

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
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-[#0077B5]' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-[#1877F2]' },
  { id: 'blog',     label: 'Blog',     icon: FileText, color: 'text-[#FF4B11]' },
  { id: 'xthread',  label: 'X Thread', icon: XIcon,    color: 'text-black' },
  { id: 'email',    label: 'Email',    icon: Mail,     color: 'text-[#EA4335]' },
];

export default function NewRun() {
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
        audience: form.audience.join(', ') // Send as comma-separated string for backend compatibility
      });
      console.log('DEBUG - API Full Response:', response);
      const data = response.data;
      const runId = data.runId || data.sessionId || data.id || (typeof data === 'string' ? data : null);
      
      if (runId && typeof runId === 'string') {
        console.log('DEBUG - Navigating to:', runId);
        navigate(`/run/${runId}`);
      } else {
        console.error('DEBUG - Invalid Response Body:', data);
        alert('Server Response Error: ' + JSON.stringify(data));
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
    <div className="p-8 max-w-2xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">New Run</h1>
        <p className="text-sm text-gray-400 mt-1">Define your content brief to start the pipeline</p>
      </div>

      <form onSubmit={submit} className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-7">
        
        {/* Topic */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 ml-1">
            Topic <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.topic}
            onChange={e => set('topic', e.target.value)}
            placeholder='e.g. "Future of AI in Software Engineering"'
            className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all duration-200"
          />
        </div>

        {/* Context */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 ml-1">
            Context <span className="text-gray-300 font-normal normal-case ml-1">(additional details for the AI)</span>
          </label>
          <textarea
            rows={4}
            value={form.context}
            onChange={e => set('context', e.target.value)}
            placeholder='Provide background, specific points to cover, or source materials...'
            className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-900 placeholder-gray-300 resize-none focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all duration-200"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Tone */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Tone</label>
            <select
              value={form.tone}
              onChange={e => set('tone', e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-5 py-3 text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all duration-200 cursor-pointer appearance-none"
            >
              {TONES.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Audience - Custom Multi-select Tags */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 ml-1">
              Target Audience <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div 
                tabIndex="0"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3 py-2 min-h-[46px] flex flex-wrap gap-1.5 focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all duration-200 cursor-pointer relative pr-10"
              >
                {form.audience.length === 0 ? (
                  <span className="text-gray-300 text-sm py-1 px-2">Select audience types...</span>
                ) : (
                  form.audience.map(aud => (
                    <span key={aud} className="bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 animate-in zoom-in-95 duration-150">
                      {aud}
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); toggleAudience(aud); }} 
                        className="hover:text-violet-900 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
                  <ArrowRight size={14} className="rotate-90" />
                </div>
              </div>
              
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto p-2 fade-in">
                    {AUDIENCES.map(aud => (
                      <button
                        key={aud}
                        type="button"
                        onClick={() => { toggleAudience(aud); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          form.audience.includes(aud) ? 'bg-violet-50 text-violet-700' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          {aud}
                          {form.audience.includes(aud) && <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Channel tabs */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Channel</label>
          <div className="grid grid-cols-5 gap-2.5">
            {CHANNELS.map(ch => (
              <button
                key={ch.id}
                type="button"
                onClick={() => set('channel', ch.id)}
                className={`flex flex-col items-center gap-2.5 py-4 rounded-xl border text-[11px] font-bold transition-all duration-200 ${
                  form.channel === ch.id
                    ? 'border-violet-500 bg-violet-50/50 text-violet-700 shadow-sm shadow-violet-100'
                    : 'border-gray-100 bg-gray-50/30 text-gray-400 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-600'
                }`}
              >
                <ch.icon size={18} className={form.channel === ch.id ? 'text-violet-600' : ch.color} />
                {ch.label}
              </button>
            ))}
          </div>
        </div>

        {/* Angle (optional) */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 ml-1">
            Unique Angle <span className="text-gray-300 font-normal normal-case ml-1">(optional)</span>
          </label>
          <input
            type="text"
            value={form.angle}
            onChange={e => set('angle', e.target.value)}
            placeholder='e.g. "Focus on ROI over features"'
            className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-5 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all duration-200"
          />
        </div>

        {/* Error */}
        {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl border border-red-100 animate-shake">{error}</p>}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-200 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Starting pipeline...</>
          ) : (
            <>
              Start Pipeline 
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* Brief preview */}
      {(form.topic || form.audience) && (
        <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-4 fade-in">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Brief Preview</p>
          <div className="space-y-1 text-xs text-gray-600">
            {form.topic    && <p><span className="font-medium">Topic:</span> {form.topic}</p>}
            {form.audience && <p><span className="font-medium">Audience:</span> {form.audience}</p>}
            <p><span className="font-medium">Tone:</span> {form.tone} · <span className="font-medium">Channel:</span> {form.channel}</p>
            {form.angle    && <p><span className="font-medium">Angle:</span> {form.angle}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
