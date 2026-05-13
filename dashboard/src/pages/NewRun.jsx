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
    topic: '', tone: 'professional', audience: '', channel: 'linkedin', angle: '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.topic.trim() || !form.audience.trim()) {
      setError('Topic and audience are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/run/start', form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to start pipeline.');
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
          <textarea
            rows={4}
            value={form.topic}
            onChange={e => set('topic', e.target.value)}
            placeholder='e.g. "Future of AI in Software Engineering"'
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

          {/* Audience */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 ml-1">
              Target Audience <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.audience}
              onChange={e => set('audience', e.target.value)}
              placeholder='e.g. "Tech Leads"'
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-5 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all duration-200"
            />
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
