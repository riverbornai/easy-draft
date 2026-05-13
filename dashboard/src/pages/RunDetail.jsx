import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import PipelineBar from '../components/PipelineBar.jsx';
import AgentLog from '../components/AgentLog.jsx';

export default function RunDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const fetchRun = async () => {
    try {
      const response = await axios.get(`/api/run/status/${id}`);
      setRun(response.data);
      setError(null);
      
      // Stop polling if done or error
      if (response.data.pipelineStatus === 'done' || response.data.pipelineStatus === 'error') {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch (err) {
      setError('Run not found or server error');
      if (pollRef.current) clearInterval(pollRef.current);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (model) => {
    setLoading(true);
    try {
      await axios.post('/api/drafts/approve', { runId: id, model });
      await fetchRun();
    } catch (err) {
      console.error('Failed to approve draft:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (feedback) => {
    if (!feedback?.trim()) return;
    setLoading(true);
    try {
      await axios.post('/api/drafts/reject', { runId: id, feedback });
      await fetchRun();
    } catch (err) {
      console.error('Failed to reject draft:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRun();
    pollRef.current = setInterval(fetchRun, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  if (loading && !run) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        <Loader2 className="animate-spin mr-2" size={20} />
        <span>Loading run details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center mt-20">
        <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">{error}</h2>
        <button 
          onClick={() => navigate('/runs')}
          className="mt-4 text-violet-600 font-medium hover:underline flex items-center justify-center gap-1 mx-auto"
        >
          <ArrowLeft size={16} /> Back to Runs
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/runs')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-2 py-0.5 rounded">
                Run Detail
              </span>
              <span className="text-xs text-gray-400 font-mono">#{id}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{run?.topic || run?.brief?.topic || 'Untitled Run'}</h1>
          </div>
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
          run?.pipelineStatus === 'done' ? 'bg-green-50 border-green-100 text-green-700' :
          run?.pipelineStatus === 'error' ? 'bg-red-50 border-red-100 text-red-700' :
          'bg-violet-50 border-violet-100 text-violet-700'
        }`}>
          {run?.pipelineStatus === 'done' ? <CheckCircle2 size={14} /> :
           run?.pipelineStatus === 'error' ? <AlertCircle size={14} /> :
           <Loader2 size={14} className="animate-spin" />}
          <span className="capitalize">{run?.pipelineStatus}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Pipeline Bar */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <PipelineBar 
            pipelineStatus={run?.pipelineStatus} 
            currentStep={run?.currentStep ?? -1} 
          />
        </div>

        {/* Logs and Details */}
        <div className="grid grid-cols-3 gap-6 items-start">
          <div className="col-span-2 space-y-6">
            {/* Review Section */}
            {run?.pipelineStatus === 'review' && (
              <div className="bg-violet-50 border border-violet-100 rounded-2xl p-8 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Human Review Required</h2>
                    <p className="text-sm text-violet-600 font-medium">Compare the drafts and select the winner</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-white/50 text-violet-600 px-2 py-1 rounded-md border border-violet-100 uppercase tracking-widest">
                      Attempt {run.reviewAttempts || 1}/3
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* GPT-4o Draft */}
                  <div className="bg-white border border-violet-100 rounded-xl p-5 hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Option A (GPT-4o)</span>
                      <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed max-h-[300px] overflow-y-auto pr-2 custom-scrollbar whitespace-pre-wrap mb-4 font-serif italic">
                      {run.gpt4oDraft || "Generating draft..."}
                    </div>
                    <button 
                      onClick={() => handleApprove('gpt4o')}
                      disabled={loading}
                      className="w-full bg-violet-600 text-white font-bold py-2.5 rounded-lg hover:bg-violet-700 transition-all text-xs flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                    >
                      <CheckCircle2 size={14} /> Approve GPT-4o
                    </button>
                  </div>

                  {/* Claude Draft */}
                  <div className="bg-white border border-violet-100 rounded-xl p-5 hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Option B (Claude)</span>
                      <div className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]" />
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed max-h-[300px] overflow-y-auto pr-2 custom-scrollbar whitespace-pre-wrap mb-4 font-serif italic">
                      {run.claudeDraft || "Generating draft..."}
                    </div>
                    <button 
                      onClick={() => handleApprove('claude')}
                      disabled={loading}
                      className="w-full bg-violet-600 text-white font-bold py-2.5 rounded-lg hover:bg-violet-700 transition-all text-xs flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                    >
                      <CheckCircle2 size={14} /> Approve Claude
                    </button>
                  </div>
                </div>

                {/* Reject Section */}
                <div className="border-t border-violet-100 pt-6">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Not satisfied? Provide feedback for re-drafting</p>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="e.g., 'Make it more professional and mention our new pricing...'"
                      className="flex-1 bg-white border border-violet-100 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all"
                      id="feedback-input"
                    />
                    <button 
                      onClick={() => handleReject(document.getElementById('feedback-input').value)}
                      disabled={loading}
                      className="bg-white text-red-500 border border-red-100 font-bold px-6 rounded-xl hover:bg-red-50 transition-all text-xs"
                    >
                      Reject & Redraft
                    </button>
                  </div>
                </div>
              </div>
            )}

            <AgentLog logs={run?.log || []} />
          </div>
          
          <div className="space-y-6">
            {/* Run Info */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Run Info</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Channel</label>
                  <p className="text-sm font-semibold text-gray-700 capitalize">{run?.channel || run?.brief?.channel || '—'}</p>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Tone</label>
                  <p className="text-sm font-semibold text-gray-700 capitalize">{run?.tone || run?.brief?.tone || '—'}</p>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Created At</label>
                  <p className="text-sm font-semibold text-gray-700">
                    {run?.createdAt ? new Date(run.createdAt).toLocaleString() : '—'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Status</label>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      run?.pipelineStatus === 'done' ? 'bg-green-500' :
                      run?.pipelineStatus === 'error' ? 'bg-red-500' :
                      'bg-amber-500 animate-pulse'
                    }`} />
                    <span className="text-xs font-bold text-gray-600 capitalize">{run?.pipelineStatus}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Final Output Link */}
            {run?.pipelineStatus === 'done' && (
              <button 
                onClick={() => navigate('/runs', { state: { selectedRunId: id } })}
                className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2 animate-bounce-slow"
              >
                View Approved Draft
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
