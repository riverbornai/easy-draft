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
          if (run.pipelineStatus !== 'done' && run.pipelineStatus !== 'error') {
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
      
      // Auto-switch view mode based on state transitions
      if (newStatus === 'done' && oldStatus !== 'done') {
        // 1. Pipeline finished -> Content
        setViewMode('output');
      } else if (oldStatus === 'review' && selectedRun.reviewStatus === 'pending' && 
                (newStatus !== 'review' || response.data.reviewStatus !== 'pending')) {
        // 2. Human provided feedback (approved/rejected) -> stay/back to Pipeline to see next steps
        setViewMode('pipeline');
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
      <div className="w-80 border-r border-[#E8EDE6] flex flex-col bg-[#F2FFEE]/30">
        <div className="p-6 border-b border-[#E8EDE6] bg-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-black text-[#0D2B22] flex items-center gap-2">
              <Clock size={20} className="text-[#0D2B22]" />
              Runs
            </h1>
            <button 
              onClick={() => navigate('/runs/new')}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#0D2B22] text-[#D4F53C] rounded-lg hover:bg-[#1A4435] transition-all shadow-sm shadow-[#0D2B22]/10 group"
              title="New Run"
            >
              <Plus size={14} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-wider">New Run</span>
            </button>
          </div>
          <p className="text-xs text-[#1A4435] font-semibold uppercase tracking-wider">Previous pipeline runs</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {loading ? (
            <div className="p-8 text-center text-[#1A4435] text-sm font-black uppercase tracking-widest">Loading runs...</div>
          ) : runs.length === 0 ? (
            <div className="p-8 text-center text-[#1A4435] text-sm font-black uppercase tracking-widest">No runs found</div>
          ) : (
            runs.map((run) => {
                const rawRunId = run.id || run.sessionId;
                const runId = rawRunId.replace('session_', '');
                const isSelected = selectedRun && ((run.id || run.sessionId) === (selectedRun.id || selectedRun.sessionId));
                
                return (
                  <button
                    key={rawRunId}
                    onClick={() => navigate(`/runs/${runId}`)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex flex-col gap-3 group relative overflow-hidden ${
                      isSelected
                        ? 'bg-white border-[#0D2B22] shadow-[0_8px_30px_rgb(13,43,34,0.08)] scale-[1.02] z-10'
                        : 'bg-white/40 border-[#E8EDE6] hover:border-[#1A4435] hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#D4F53C]" />
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-md bg-[#0D2B22] text-[#D4F53C] border border-[#D4F53C]/10">
                        {run.channel || run.brief?.channel || 'Draft'}
                      </span>
                      <span className="text-[10px] text-[#1A4435]/60 font-black uppercase tracking-wider">
                        {formatDate(run.createdAt)}
                      </span>
                    </div>
                    <h3 className="text-[13px] font-black text-[#0D2B22] line-clamp-2 leading-snug group-hover:text-[#1A4435] transition-colors">
                      {run.topic || run.brief?.topic || 'Untitled Run'}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2">
                        {(run.pipelineStatus === 'done' || run.status === 'done') ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F2FFEE] border border-[#9FCEBE]/30">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#0D2B22]" />
                            <span className="text-[9px] font-black uppercase text-[#0D2B22]">Done</span>
                          </div>
                        ) : (run.pipelineStatus === 'error' || run.status === 'error') ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-50 border border-red-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span className="text-[9px] font-black uppercase text-red-600">Error</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-[#D4F53C]/20 border border-[#0D2B22]/10 text-[#0D2B22] px-2 py-0.5 rounded-md">
                            <Loader2 size={10} className="animate-spin" />
                            <span className="text-[9px] font-black uppercase">Active</span>
                          </div>
                        )}
                      </div>
                      {run.winner && (
                        <span className="text-[9px] font-black text-[#1A4435] bg-[#E8EDE6] px-2 py-1 rounded-md border border-[#1A4435]/5">
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
        <div className="flex-1 overflow-y-auto bg-[#F2FFEE]/10 flex flex-col">
          {selectedRun ? (
            <>
              {/* Detail Header */}
              <div className="px-12 pt-12 pb-8 border-b border-[#E8EDE6] sticky top-0 bg-white/80 backdrop-blur-md z-10 shadow-sm shadow-[#0D2B22]/5">
                <div className="max-w-4xl mx-auto">
                  <div className="flex flex-wrap gap-3 mb-6">
                    <div className="bg-[#F2FFEE] px-3 py-1.5 rounded-xl flex items-center gap-2 border border-[#9FCEBE]/30">
                      <span className="text-[9px] text-[#1A4435] uppercase font-black tracking-widest opacity-60">Channel</span>
                      <span className="text-[11px] font-black text-[#0D2B22] uppercase tracking-wider">{selectedRun.channel || selectedRun.brief?.channel}</span>
                    </div>
                    {(selectedRun.winner || selectedRun.activeModel) && (
                      <div className={`px-3 py-1.5 rounded-xl flex items-center gap-2 border transition-all ${
                        (selectedRun.winner || selectedRun.activeModel) === 'gpt4o' 
                          ? 'bg-[#F2FFEE] border-[#D4F53C]' 
                          : 'bg-white border-[#E8EDE6]'
                      }`}>
                        <span className="text-[9px] text-[#1A4435] uppercase font-black tracking-widest opacity-60">Best Model</span>
                        <span className={`text-[11px] font-black uppercase tracking-wider ${(selectedRun.winner || selectedRun.activeModel) === 'gpt4o' ? 'text-[#0D2B22]' : 'text-[#1A4435]'}`}>
                          {(selectedRun.winner || selectedRun.activeModel) === 'gpt4o' ? 'GPT-4o' : 'Claude'}
                        </span>
                      </div>
                    )}
                    {selectedRun.pipelineStatus === 'review' ? (
                      selectedRun.reviewStatus === 'pending' ? (
                        <div className="bg-[#0D2B22] px-3 py-1.5 rounded-xl flex items-center gap-2 border border-[#0D2B22] shadow-lg shadow-[#0D2B22]/20">
                          <Loader2 size={12} className="text-[#D4F53C] animate-spin" />
                          <span className="text-[11px] font-black text-[#D4F53C] uppercase tracking-widest">Awaiting Review</span>
                        </div>
                      ) : (
                        <div className="bg-[#F2FFEE] px-3 py-1.5 rounded-xl flex items-center gap-2 border border-[#9FCEBE]/30">
                          <Loader2 size={12} className="text-[#0D2B22] animate-spin" />
                          <span className="text-[11px] font-black text-[#0D2B22] uppercase tracking-widest">Reviewing...</span>
                        </div>
                      )
                    ) : selectedRun.publishedPath && (
                      <div className="bg-emerald-500/10 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-emerald-500/30">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">Published</span>
                      </div>
                    )}
                  </div>
                  
                  <h2 className="text-4xl font-black text-[#0D2B22] mb-8 leading-tight tracking-tighter">
                    {selectedRun.topic || selectedRun.brief?.topic}
                  </h2>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[#1A4435]/60">
                      <Calendar size={14} />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em]">{formatDate(selectedRun.createdAt)}</span>
                    </div>
                    
                    {/* View Toggle */}
                    <div className="flex bg-[#E8EDE6]/50 p-1 rounded-2xl border border-[#E8EDE6]">
                      <button 
                        onClick={() => setViewMode('output')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                          viewMode === 'output' ? 'bg-[#0D2B22] text-[#D4F53C] shadow-lg shadow-[#0D2B22]/10 scale-[1.02]' : 'text-[#1A4435]/40 hover:text-[#0D2B22]'
                        }`}
                      >
                        <Layout size={14} /> Content
                      </button>
                      <button 
                        onClick={() => setViewMode('pipeline')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                          viewMode === 'pipeline' ? 'bg-[#0D2B22] text-[#D4F53C] shadow-lg shadow-[#0D2B22]/10 scale-[1.02]' : 'text-[#1A4435]/40 hover:text-[#0D2B22]'
                        }`}
                      >
                        <Activity size={14} /> Trace
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto fade-in">
                  {/* Global Pipeline Progress - Only show in Output mode if awaiting review, otherwise show in Pipeline mode */}
                  {(viewMode === 'pipeline' || (selectedRun.pipelineStatus === 'review' && selectedRun.reviewStatus === 'pending')) && (
                    <div className="mb-10">
                      <PipelineBar 
                        pipelineStatus={selectedRun.pipelineStatus || selectedRun.status} 
                        currentStep={selectedRun.currentStep ?? (selectedRun.status === 'done' ? 5 : -1)} 
                        reviewStatus={selectedRun.reviewStatus}
                      />
                    </div>
                  )}
                  
                  {/* Detail Content Area */}
                  {viewMode === 'output' ? (
                    /* Post Content View - Restored actual content display */
                    <div className="smooth-slide">
                      <div className="bg-white rounded-[3rem] p-10 border border-[#E8EDE6] relative group shadow-2xl shadow-[#0D2B22]/5">
                        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-3">
                          <button 
                            onClick={handleCopy}
                            className={`p-2.5 rounded-full border shadow-sm transition-all duration-300 transform active:scale-90 ${
                              copied 
                                ? 'bg-[#D4F53C] border-[#D4F53C] text-[#0D2B22]' 
                                : 'bg-white border-[#E8EDE6] text-[#1A4435] hover:text-[#0D2B22] hover:border-[#0D2B22] hover:shadow-md'
                            }`}
                            title="Copy content"
                          >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                          </button>
                          {copied && (
                            <span className="text-[10px] font-black text-[#0D2B22] bg-[#D4F53C] px-2.5 py-1 rounded-lg border border-[#D4F53C] shadow-sm animate-in fade-in slide-in-from-top-1">
                              Copied!
                            </span>
                          )}
                        </div>
                        
                        {selectedRun.approvedDraft ? (
                          <div className="whitespace-pre-wrap text-[#0D2B22] leading-relaxed font-serif text-xl">
                            {selectedRun.approvedDraft}
                          </div>
                        ) : ((selectedRun.winner || selectedRun.activeModel) === 'claude' ? selectedRun.claudeDraft : selectedRun.gpt4oDraft) ? (
                          <div className="whitespace-pre-wrap text-[#0D2B22] leading-relaxed font-serif text-xl">
                            {(selectedRun.winner || selectedRun.activeModel) === 'claude' ? selectedRun.claudeDraft : selectedRun.gpt4oDraft}
                          </div>
                        ) : (
                          <div className="text-center py-20">
                            <FileText size={56} className="mx-auto text-[#1A4435] mb-6 opacity-30" />
                            <h4 className="text-[#0D2B22] font-black mb-1">Content not available</h4>
                            <p className="text-[#1A4435] text-sm max-w-xs mx-auto">This run may be in progress or was imported without full draft history.</p>
                          </div>
                        )}
                      </div>

                      {/* Metrics Section */}
                      {(selectedRun.gpt4oScore || selectedRun.claudeScore) && (
                        <div className="mt-16 pt-12 border-t border-[#E8EDE6]">
                          <h4 className="text-[11px] font-black text-[#1A4435] uppercase tracking-[0.2em] mb-10">Performance Analytics</h4>
                          <div className="grid grid-cols-2 gap-10">
                            {selectedRun.gpt4oScore && (
                              <div className="bg-white border border-[#E8EDE6] rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:shadow-[#0D2B22]/5 transition-all group">
                                <p className="text-[10px] font-black text-[#0D2B22] uppercase mb-4 tracking-widest opacity-60">GPT-4o Score</p>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-5xl font-black text-[#0D2B22] tracking-tighter">{selectedRun.gpt4oScore.toFixed(1)}</span>
                                  <span className="text-sm font-bold text-[#1A4435]/30">/ 10</span>
                                </div>
                                <div className="w-full h-2 bg-[#F2FFEE] rounded-full mt-6 overflow-hidden border border-[#E8EDE6]">
                                  <div className="h-full bg-[#D4F53C] rounded-full shadow-[0_0_10px_rgba(212,245,60,0.1)] transition-all duration-1000" style={{ width: `${selectedRun.gpt4oScore * 10}%` }} />
                                </div>
                              </div>
                            )}
                            {selectedRun.claudeScore && (
                              <div className="bg-white border border-[#E8EDE6] rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:shadow-[#0D2B22]/5 transition-all group">
                                <p className="text-[10px] font-black text-[#1A4435] uppercase mb-4 tracking-widest opacity-60">Claude Score</p>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-5xl font-black text-[#0D2B22] tracking-tighter">{selectedRun.claudeScore.toFixed(1)}</span>
                                  <span className="text-sm font-bold text-[#1A4435]/30">/ 10</span>
                                </div>
                                <div className="w-full h-2 bg-[#F2FFEE] rounded-full mt-6 overflow-hidden border border-[#E8EDE6]">
                                  <div className="h-full bg-[#0D2B22] rounded-full shadow-[0_0_10px_rgba(13,43,34,0.1)] transition-all duration-1000" style={{ width: `${selectedRun.claudeScore * 10}%` }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Pipeline (Trace) View */
                    <div className="space-y-10 fade-in">
                      {/* HITL Review Interface - Now shown within the Trace tab */}
                      {(selectedRun.pipelineStatus === 'review' && selectedRun.reviewStatus === 'pending') && (
                        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
                          <div className="bg-white border border-[#E8EDE6] rounded-[2rem] p-12 shadow-xl shadow-[#0D2B22]/5">
                            <div className="flex items-end justify-between mb-10 border-b border-[#E8EDE6] pb-8">
                              <div>
                                <span className="text-[10px] font-black text-[#1A4435] uppercase tracking-[0.3em] mb-2 block">Decision Required</span>
                                <h2 className="text-3xl font-black text-[#0D2B22] tracking-tighter">Human Review Point</h2>
                                <p className="text-sm text-[#1A4435] mt-2 font-medium opacity-60">The pipeline has drafted two variations. Please select the best performer.</p>
                              </div>
                              <div className="bg-[#F2FFEE] px-4 py-2 rounded-xl border border-[#9FCEBE]/30">
                                <span className="text-[11px] font-black text-[#0D2B22] uppercase tracking-[0.1em]">
                                  Attempt {selectedRun.reviewAttempts || 1} of 3
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-10">
                              {/* GPT-4o Draft */}
                              <div className="bg-[#F2FFEE]/20 border border-[#E8EDE6] rounded-[2rem] p-8 hover:border-[#D4F53C] hover:bg-white transition-all duration-500 group">
                                <div className="flex items-center justify-between mb-6">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-[#0D2B22] flex items-center justify-center shadow-lg">
                                      <span className="text-[#D4F53C] text-[10px] font-black">A</span>
                                    </div>
                                    <span className="text-[11px] font-black text-[#0D2B22] uppercase tracking-widest">GPT-4o Draft</span>
                                  </div>
                                  <div className="w-2 h-2 rounded-full bg-[#D4F53C] shadow-[0_0_8px_rgba(212,245,60,0.8)]" />
                                </div>
                                <div className="text-[15px] text-[#1A4435] leading-relaxed max-h-[400px] overflow-y-auto pr-3 custom-scrollbar whitespace-pre-wrap mb-8 font-medium italic opacity-70 group-hover:opacity-100 transition-opacity">
                                  {selectedRun.gpt4oDraft || "The engine is still synthesizing this variation..."}
                                </div>
                                <button 
                                  onClick={() => handleApprove('gpt4o')}
                                  className="w-full bg-[#0D2B22] text-[#D4F53C] font-black py-4 rounded-2xl hover:bg-[#1A4435] hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-[#0D2B22]/10"
                                >
                                  <CheckCircle2 size={16} /> Approve GPT-4o
                                </button>
                              </div>

                              {/* Claude Draft */}
                              <div className="bg-[#F2FFEE]/20 border border-[#E8EDE6] rounded-[2rem] p-8 hover:border-[#0D2B22] hover:bg-white transition-all duration-500 group">
                                <div className="flex items-center justify-between mb-6">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-[#1A4435] flex items-center justify-center shadow-lg">
                                      <span className="text-white text-[10px] font-black">B</span>
                                    </div>
                                    <span className="text-[11px] font-black text-[#1A4435] uppercase tracking-widest">Claude Draft</span>
                                  </div>
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                </div>
                                <div className="text-[15px] text-[#1A4435] leading-relaxed max-h-[400px] overflow-y-auto pr-3 custom-scrollbar whitespace-pre-wrap mb-8 font-medium italic opacity-70 group-hover:opacity-100 transition-opacity">
                                  {selectedRun.claudeDraft || "Synthesizing secondary variation..."}
                                </div>
                                <button 
                                  onClick={() => handleApprove('claude')}
                                  className="w-full bg-[#0D2B22] text-[#D4F53C] font-black py-4 rounded-2xl hover:bg-[#1A4435] hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-[#0D2B22]/10"
                                >
                                  <CheckCircle2 size={16} /> Approve Claude
                                </button>
                              </div>
                            </div>

                            {/* Reject Section */}
                            <div className="bg-[#F2FFEE]/30 rounded-3xl p-8 border border-[#9FCEBE]/20">
                              <p className="text-[11px] font-black text-[#1A4435] uppercase tracking-[0.2em] mb-4 ml-1">Refinement Feedback</p>
                              <div className="flex gap-4">
                                <input 
                                  type="text"
                                  placeholder="e.g. 'Synthesize both ideas but make the tone more aggressive...'"
                                  className="flex-1 bg-white border border-[#E8EDE6] rounded-2xl px-6 py-4 text-sm font-semibold text-[#0D2B22] focus:outline-none focus:border-[#0D2B22] focus:ring-4 focus:ring-[#0D2B22]/5 transition-all placeholder-[#1A4435]/30 shadow-inner"
                                  id="feedback-input-runs"
                                />
                                <button 
                                  onClick={() => handleReject(document.getElementById('feedback-input-runs').value)}
                                  className="bg-white text-red-500 border border-red-100 font-black px-8 rounded-2xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all text-[11px] uppercase tracking-[0.15em] shadow-sm shadow-red-500/5 active:scale-95"
                                >
                                  Reject & Redraft
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <AgentLog logs={selectedRun.log || []} />
                    </div>
                  )}
              </div>
            </div>
          </>
        ) : isCreating ? (
          <div className="flex-1 overflow-y-auto bg-[#F2FFEE]/10 p-12">
            <NewRunForm />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-[#F2FFEE]/10">
            <div className="text-center max-w-sm px-6">
              <div className="w-24 h-24 bg-white border border-[#E8EDE6] rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-[#0D2B22]/5 transform hover:rotate-6 transition-transform duration-500">
                <Clock size={40} strokeWidth={1.5} className="text-[#0D2B22]" />
              </div>
              <h3 className="text-2xl font-black text-[#0D2B22] mb-3 tracking-tighter">Select a session</h3>
              <p className="text-sm text-[#1A4435] font-medium opacity-60 leading-relaxed mb-10">Choose a pipeline run from the list to view its real-time intelligence trace and output.</p>
              <button 
                onClick={() => navigate('/runs/new')}
                className="bg-[#0D2B22] text-[#D4F53C] text-[11px] uppercase tracking-[0.2em] font-black px-10 py-5 rounded-2xl hover:bg-[#1A4435] hover:scale-[1.05] hover:shadow-2xl hover:shadow-[#0D2B22]/20 transition-all flex items-center gap-3 mx-auto"
              >
                <Plus size={16} strokeWidth={3} /> Start New Run
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
