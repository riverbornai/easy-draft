import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Clock, Calendar, ChevronRight, FileText, ExternalLink, Copy, Check, Plus, Activity, Layout } from 'lucide-react';
import PipelineBar from '../components/PipelineBar.jsx';
import AgentLog from '../components/AgentLog.jsx';

export default function Runs() {
  const navigate = useNavigate();
  const location = useLocation();
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('output'); // 'output' | 'pipeline'

  useEffect(() => {
    fetchRuns();
  }, []);

  useEffect(() => {
    if (location.state?.selectedRunId && runs.length > 0) {
      const run = runs.find(r => r.id === location.state.selectedRunId || r.sessionId === location.state.selectedRunId);
      if (run) setSelectedRun(run);
    }
  }, [location.state, runs]);

  const fetchRuns = async () => {
    try {
      const response = await axios.get('/api/run/list');
      setRuns(response.data);
      if (response.data.length > 0 && !selectedRun) {
        setSelectedRun(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching runs:', error);
    } finally {
      setLoading(false);
    }
  };

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
              onClick={() => navigate('/new-run')}
              className="p-1.5 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors shadow-sm shadow-violet-100"
              title="New Run"
            >
              <Plus size={16} />
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
              const runId = run.id || run.sessionId;
              const isSelected = selectedRun && (runId === (selectedRun.id || selectedRun.sessionId));
              
              return (
                <button
                  key={runId}
                  onClick={() => setSelectedRun(run)}
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
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                      run.status === 'done' || run.pipelineStatus === 'done'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-orange-50 text-orange-600'
                    }`}>
                      {run.status || run.pipelineStatus}
                    </span>
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
                <div className="flex items-center justify-between mb-4">
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
                
                <h2 className="text-3xl font-extrabold text-gray-900 mb-6 leading-tight">
                  {selectedRun.topic || selectedRun.brief?.topic}
                </h2>
                
                <div className="flex flex-wrap gap-3">
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
                  {selectedRun.publishedPath && (
                    <div className="bg-green-50 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-green-100">
                      <FileText size={12} className="text-green-600" />
                      <span className="text-xs font-bold text-green-700 uppercase tracking-tight">Published</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detail Content */}
            <div className="flex-1 p-12 overflow-y-auto">
              <div className="max-w-3xl mx-auto fade-in">
                {viewMode === 'output' ? (
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
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50/20">
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 bg-white border border-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Clock size={32} className="text-gray-200" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Select a run</h3>
              <p className="text-sm text-gray-400">Choose a run from the list on the left to view its detailed output and pipeline trace.</p>
              <button 
                onClick={() => navigate('/new-run')}
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
