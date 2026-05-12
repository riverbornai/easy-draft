import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, ArrowRight } from 'lucide-react';

const TONES    = ['professional', 'casual', 'thought-leader', 'inspirational', 'educational', 'witty'];
const CHANNELS = [
  { id: 'linkedin', label: 'LinkedIn',  emoji: '💼' },
  { id: 'blog',     label: 'Blog',      emoji: '📝' },
  { id: 'xthread',  label: 'X Thread',  emoji: '🐦' },
  { id: 'email',    label: 'Email',     emoji: '📧' },
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

      <form onSubmit={submit} className="bg-white border border-gray-100 rounded-xl p-7 space-y-6">

        {/* Topic */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Topic <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={3}
            value={form.topic}
            onChange={e => set('topic', e.target.value)}
            placeholder='e.g. "AI trends shaping enterprise software in 2025"'
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
          />
        </div>

        {/* Tone */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Tone</label>
          <select
            value={form.tone}
            onChange={e => set('tone', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all bg-white"
          >
            {TONES.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Audience */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Target Audience <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.audience}
            onChange={e => set('audience', e.target.value)}
            placeholder='e.g. "CTOs and engineering leaders at Series B+ startups"'
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
          />
        </div>

        {/* Channel tabs */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Channel</label>
          <div className="flex gap-2">
            {CHANNELS.map(ch => (
              <button
                key={ch.id}
                type="button"
                onClick={() => set('channel', ch.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-lg border text-xs font-medium transition-all ${
                  form.channel === ch.id
                    ? 'border-violet-400 bg-violet-50 text-violet-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-base">{ch.emoji}</span>
                {ch.label}
              </button>
            ))}
          </div>
        </div>

        {/* Angle (optional) */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Unique Angle <span className="text-gray-300 font-normal normal-case">(optional)</span>
          </label>
          <input
            type="text"
            value={form.angle}
            onChange={e => set('angle', e.target.value)}
            placeholder='e.g. "Focus on the cost reduction argument, not the capability one"'
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
          />
        </div>

        {/* Error */}
        {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-medium py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Starting pipeline...</>
          ) : (
            <>Start Pipeline <ArrowRight size={14} /></>
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
