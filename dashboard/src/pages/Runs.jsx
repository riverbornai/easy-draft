import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { Clock, Calendar, ChevronRight, FileText, ExternalLink, Copy, Check, Plus, Activity, Layout, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import PipelineBar from '../components/PipelineBar.jsx';
import AgentLog from '../components/AgentLog.jsx';
import NewRunForm from '../components/NewRunForm.jsx';

export default function Runs() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('output'); // 'output' | 'pipeline'
  const isCreating = location.pathname === '/runs/new';
  const pollRef = useRef(null);

  useEffect(() => {
    fetchRuns();
  }, []);

  useEffect(() => {
    const handleRunSelection = async () => {
      if (runs.length > 0) {
        if (isCreating) {
          setSelectedRun(null);
          return;
        }

        const targetId = id || location.state?.selectedRunId;
        if (targetId) {
          let run = runs.find(r => {
            const rId = r.id || r.sessionId;
            return rId === targetId || rId.replace('session_', '') === targetId;
          });

          if (!run && id) {
            // If not found, try fetching latest list once
            try {
              const response = await axios.get('/api/run/list');
              const freshRuns = response.data;
              setRuns(freshRuns);
              run = freshRuns.find(r => {
                const rId = r.id || r.sessionId;
                return rId === targetId || rId.replace('session_', '') === targetId;
              });
            } catch (err) {
              console.error('Failed to fetch fresh runs:', err);
            }
          }

          if (run) {
            setSelectedRun(run);
            // Auto-switch view mode based on status
            if (run.pipelineStatus !== 'done' && run.pipelineStatus !== 'error' && run.pipelineStatus !== 'review') {
              setViewMode('pipeline');
            } else {
              setViewMode('output');
            }
          } else {
            // If ID in URL is still invalid after refresh, fall back to first run
            const firstRunId = (runs[0].id || runs[0].sessionId).replace('session_', '');
            navigate(`/runs/${firstRunId}`, { replace: true });
          }
        } else {
          // No ID in URL, default to first run and update URL
          const firstRunId = (runs[0].id || runs[0].sessionId).replace('session_', '');
          navigate(`/runs/${firstRunId}`, { replace: true });
        }
      }
    };

    handleRunSelection();
  }, [id, location.state, runs.length, navigate, isCreating]);

  const fetchRuns = async (isPoll = false) => {
    try {
      const response = await axios.get('/api/run/list');
      setRuns(response.data);
    } catch (error) {
      console.error('Error fetching runs:', error);
    } finally {
      if (!isPoll) setLoading(false);
    }
  };

  const fetchSelectedRunStatus = async () => {
    if (!id || !selectedRun) return;
    try {
      const response = await axios.get(`/api/run/status/${id}`);
      const newStatus = response.data.pipelineStatus;
      const oldStatus = selectedRun.pipelineStatus;
      
      setSelectedRun(response.data);
      
      // Auto-switch to output when it just finished
      if (newStatus === 'done' && oldStatus !== 'done') {
        setViewMode('output');
      }
      
      // Stop polling if done or error
      if (newStatus === 'done' || newStatus === 'error') {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch (err) {
      console.error('Failed to fetch selected run status:', err);
    }
  };

  const handleApprove = async (model) => {
    try {
      await axios.post('/api/drafts/approve', { runId: id, model });
      fetchSelectedRunStatus();
      fetchRuns(true);
    } catch (err) {
      console.error('Failed to approve draft:', err);
    }
  };

  const handleReject = async (feedback) => {
    if (!feedback?.trim()) return;
    try {
      await axios.post('/api/drafts/reject', { runId: id, feedback });
      fetchSelectedRunStatus();
      fetchRuns(true);
    } catch (err) {
      console.error('Failed to reject draft:', err);
    }
  };

  useEffect(() => {
    if (selectedRun && selectedRun.pipelineStatus !== 'done' && selectedRun.pipelineStatus !== 'error') {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        fetchSelectedRunStatus();
        fetchRuns(true);
      }, 3000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id, selectedRun?.pipelineStatus]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleCopy = () => {
    const content = selectedRun.approvedDraft || 
      ((selectedRun.winner || selectedRun.activeModel) === 'claude' 
        ? selectedRun.claudeDraft 
        : selectedRun.gpt4oDraft);
    
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden fade-in bg-white">
      {/* Sidebar List */}
      <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/30">
        <div className="p-6 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock size={20} className="text-violet-500" />
              Runs
            </h1>
            <button 
              onClick={() => navigate('/runs/new')}
              className="flex items-center gap-2 px-3 py-1.5 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors shadow-sm shadow-violet-100 group"
              title="New Run"
            >
              <Plus size={14} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-wider">New Run</span>
            </button>
          </div>
          <p className="text-xs text-gray-400">Previous pipeline runs and posts</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading runs...</div>
          ) : runs.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No runs found</div>
          ) : (
            runs.map((run) => {
                const rawRunId = run.id || run.sessionId;
                const runId = rawRunId.replace('session_', '');
                const isSelected = selectedRun && ((run.id || run.sessionId) === (selectedRun.id || selectedRun.sessionId));
                
                return (
                  <button
                    key={rawRunId}
                    onClick={() => navigate(`/runs/${runId}`)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex flex-col gap-2 group ${
                    isSelected
                      ? 'bg-white border-violet-500 shadow-md ring-4 ring-violet-500/5'
                      : 'bg-white/50 border-gray-100 hover:border-gray-200 hover:bg-white hover:shadow-sm'
                  }`}
                >
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    (run.channel || run.brief?.channel) === 'linkedin' ? 'bg-blue-50 text-blue-600' :
                    (run.channel || run.brief?.channel) === 'xthread' ? 'bg-gray-100 text-gray-800' :
                    'bg-orange-50 text-orange-600'
                  }`}>
                    {run.channel || run.brief?.channel || 'Draft'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {formatDate(run.createdAt)}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-gray-900">
                  {run.topic || run.brief?.topic || 'Untitled Run'}
                </h3>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2">
                      {(run.pipelineStatus === 'done' || run.status === 'done') ? (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-green-50 text-green-600">
                          Done
                        </span>
                      ) : (run.pipelineStatus === 'error' || run.status === 'error') ? (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-red-50 text-red-600">
                          Error
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md animate-pulse">
                          <Loader2 size={10} className="animate-spin" />
                          <span className="text-[9px] font-bold uppercase">In Progress</span>
                        </div>
                      )}
                    </div>
                    {run.winner && (
                      <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                        {run.winner === 'gpt4o' ? 'GPT-4o' : 'Claude'}
                      </span>
                    )}
                  </div>
              </button>
            );
          })
        )}
        </div>
      </div>

      {/* Content View */}
      <div className="flex-1 overflow-y-auto bg-white flex flex-col">
        {selectedRun ? (
          <>
            {/* Detail Header */}
            <div className="px-12 pt-10 pb-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="max-w-3xl mx-auto">
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="bg-gray-50 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-gray-100">
                    <span className="text-[10px] text-gray-400 uppercase font-black">Channel</span>
                    <span className="text-xs font-bold text-gray-700 capitalize">{selectedRun.channel || selectedRun.brief?.channel}</span>
                  </div>
                  {(selectedRun.winner || selectedRun.activeModel) && (
                    <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 border ${
                      (selectedRun.winner || selectedRun.activeModel) === 'gpt4o' ? 'bg-teal-50 border-teal-100' : 'bg-violet-50 border-violet-100'
                    }`}>
                      <span className="text-[10px] text-gray-400 uppercase font-black">Best Model</span>
                      <span className={`text-xs font-bold ${(selectedRun.winner || selectedRun.activeModel) === 'gpt4o' ? 'text-teal-600' : 'text-violet-600'}`}>
                        {(selectedRun.winner || selectedRun.activeModel) === 'gpt4o' ? 'GPT-4o' : 'Claude'}
                      </span>
                    </div>
                  )}
                  {selectedRun.pipelineStatus === 'review' ? (
                    <div className="bg-amber-50 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-amber-100">
                      <Loader2 size={12} className="text-amber-600 animate-spin" />
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-tight">Awaiting Review</span>
                    </div>
                  ) : selectedRun.publishedPath && (
                    <div className="bg-green-50 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-green-100">
                      <FileText size={12} className="text-green-600" />
                      <span className="text-xs font-bold text-green-700 uppercase tracking-tight">Published</span>
                    </div>
                  )}
                </div>
                
                <h2 className="text-3xl font-extrabold text-gray-900 mb-6 leading-tight">
                  {selectedRun.topic || selectedRun.brief?.topic}
                </h2>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-violet-500">
                    <Calendar size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">{formatDate(selectedRun.createdAt)}</span>
                  </div>
                  
                  {/* View Toggle */}
                  <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
                    <button 
                      onClick={() => setViewMode('output')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        viewMode === 'output' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <Layout size={14} /> Output
                    </button>
                    <button 
                      onClick={() => setViewMode('pipeline')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        viewMode === 'pipeline' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <Activity size={14} /> Pipeline
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Detail Content */}
            <div className="flex-1 p-12 overflow-y-auto">
              <div className="max-w-3xl mx-auto fade-in">
                {selectedRun.pipelineStatus === 'review' ? (
                  /* HITL Review Interface */
                  <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-violet-50 border border-violet-100 rounded-3xl p-8 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-lg font-bold text-gray-900">Human Review Required</h2>
                          <p className="text-sm text-violet-600 font-medium">Compare the drafts and select the winner</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black bg-white/50 text-violet-600 px-2 py-1 rounded-md border border-violet-100 uppercase tracking-widest">
                            Attempt {selectedRun.reviewAttempts || 1}/3
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
                            {selectedRun.gpt4oDraft || "Generating draft..."}
                          </div>
                          <button 
                            onClick={() => handleApprove('gpt4o')}
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
                            {selectedRun.claudeDraft || "Generating draft..."}
                          </div>
                          <button 
                            onClick={() => handleApprove('claude')}
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
                            placeholder="e.g., 'Make it more professional...'"
                            className="flex-1 bg-white border border-violet-100 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all"
                            id="feedback-input-runs"
                          />
                          <button 
                            onClick={() => handleReject(document.getElementById('feedback-input-runs').value)}
                            className="bg-white text-red-500 border border-red-100 font-bold px-6 rounded-xl hover:bg-red-50 transition-all text-xs"
                          >
                            Reject & Redraft
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : viewMode === 'output' ? (
                  /* Post Content View */
                  <div className="prose prose-slate max-w-none">
                    <div className="bg-gray-50/50 rounded-3xl p-10 border border-gray-100 relative group shadow-sm">
                      <div className="absolute top-6 right-6 z-10 flex flex-col items-end gap-2">
                        <button 
                          onClick={handleCopy}
                          className={`p-2.5 rounded-full border shadow-sm transition-all duration-300 transform active:scale-90 ${
                            copied 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'bg-white border-gray-100 text-gray-500 hover:text-violet-600 hover:border-violet-200 hover:shadow-md'
                          }`}
                          title="Copy content"
                        >
                          {copied ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                        {copied && (
                          <span className="text-[10px] font-bold text-green-600 bg-white px-2.5 py-1 rounded-lg border border-green-100 shadow-sm animate-in fade-in slide-in-from-top-1">
                            Copied!
                          </span>
                        )}
                      </div>
                      
                      {selectedRun.approvedDraft ? (
                        <div className="whitespace-pre-wrap text-gray-800 leading-relaxed font-serif text-xl">
                          {selectedRun.approvedDraft}
                        </div>
                      ) : ((selectedRun.winner || selectedRun.activeModel) === 'claude' ? selectedRun.claudeDraft : selectedRun.gpt4oDraft) ? (
                        <div className="whitespace-pre-wrap text-gray-800 leading-relaxed font-serif text-xl">
                          {(selectedRun.winner || selectedRun.activeModel) === 'claude' ? selectedRun.claudeDraft : selectedRun.gpt4oDraft}
                        </div>
                      ) : (
                        <div className="text-center py-20">
                          <FileText size={56} className="mx-auto text-gray-200 mb-6 opacity-50" />
                          <h4 className="text-gray-900 font-bold mb-1">Content not available</h4>
                          <p className="text-gray-400 text-sm max-w-xs mx-auto">This run may be in progress or was imported without full draft history.</p>
                        </div>
                      )}
                    </div>

                    {/* Metrics Section */}
                    {(selectedRun.gpt4oScore || selectedRun.claudeScore) && (
                      <div className="mt-12 pt-10 border-t border-gray-100">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-8">Performance Metrics</h4>
                        <div className="grid grid-cols-2 gap-8">
                          {selectedRun.gpt4oScore && (
                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                              <p className="text-[10px] font-black text-teal-500 uppercase mb-2 tracking-widest">GPT-4o Score</p>
                              <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-gray-900">{selectedRun.gpt4oScore.toFixed(1)}</span>
                                <span className="text-sm font-bold text-gray-300">/ 10</span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-4 overflow-hidden">
                                <div className="h-full bg-teal-400 rounded-full" style={{ width: `${selectedRun.gpt4oScore * 10}%` }} />
                              </div>
                            </div>
                          )}
                          {selectedRun.claudeScore && (
                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                              <p className="text-[10px] font-black text-violet-500 uppercase mb-2 tracking-widest">Claude Score</p>
                              <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-gray-900">{selectedRun.claudeScore.toFixed(1)}</span>
                                <span className="text-sm font-bold text-gray-300">/ 10</span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-4 overflow-hidden">
                                <div className="h-full bg-violet-400 rounded-full" style={{ width: `${selectedRun.claudeScore * 10}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Pipeline View */
                  <div className="space-y-8 fade-in">
                    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-8">Pipeline Progression</h3>
                      <PipelineBar 
                        pipelineStatus={selectedRun.pipelineStatus || selectedRun.status} 
                        currentStep={selectedRun.currentStep ?? (selectedRun.status === 'done' ? 5 : -1)} 
                      />
                    </div>
                    <AgentLog logs={selectedRun.log || []} />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : isCreating ? (
          <div className="flex-1 overflow-y-auto bg-gray-50/20 p-12">
            <NewRunForm />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50/20">
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 bg-white border border-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Clock size={32} className="text-gray-200" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Select a run</h3>
              <p className="text-sm text-gray-400">Choose a run from the list on the left to view its detailed output and pipeline trace.</p>
              <button 
                onClick={() => navigate('/runs/new')}
                className="mt-8 bg-gray-900 text-white text-xs font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition-all flex items-center gap-2 mx-auto"
              >
                <Plus size={14} /> Start New Run
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
