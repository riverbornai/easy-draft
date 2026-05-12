import { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Calendar, ChevronRight, FileText, ExternalLink } from 'lucide-react';

export default function History() {
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    try {
      const response = await axios.get('/api/run/list');
      setRuns(response.data);
      if (response.data.length > 0 && !selectedRun) {
        setSelectedRun(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-screen overflow-hidden fade-in bg-white">
      {/* Sidebar List */}
      <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/30">
        <div className="p-6 border-b border-gray-100 bg-white">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Clock size={20} className="text-violet-500" />
            History
          </h1>
          <p className="text-xs text-gray-400 mt-1">Previous pipeline runs and posts</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading history...</div>
          ) : runs.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No history found</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {runs.map((run) => (
                <button
                  key={run.id || run.sessionId}
                  onClick={() => setSelectedRun(run)}
                  className={`w-full text-left p-4 transition-all duration-200 hover:bg-white flex flex-col gap-1.5 ${
                    (selectedRun?.id === run.id || selectedRun?.sessionId === run.sessionId)
                      ? 'bg-white border-l-4 border-violet-500 shadow-sm'
                      : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {run.channel}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {formatDate(run.createdAt)}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800 line-clamp-1">
                    {run.topic || run.brief?.topic}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      run.status === 'done' || run.pipelineStatus === 'done'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-orange-50 text-orange-600'
                    }`}>
                      {run.status || run.pipelineStatus}
                    </span>
                    {(run.winner || run.activeModel) && (
                      <span className="text-[10px] text-gray-400">
                        Winner: <span className="font-medium text-gray-600">{run.winner || run.activeModel}</span>
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content View */}
      <div className="flex-1 overflow-y-auto bg-white">
        {selectedRun ? (
          <div className="max-w-3xl mx-auto p-12 fade-in">
            <div className="mb-10 border-b border-gray-100 pb-8">
              <div className="flex items-center gap-2 text-violet-500 mb-2">
                <Calendar size={14} />
                <span className="text-xs font-medium">{formatDate(selectedRun.createdAt)}</span>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
                {selectedRun.topic || selectedRun.brief?.topic}
              </h2>
              
              <div className="flex flex-wrap gap-3">
                <div className="bg-gray-50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Channel</span>
                  <span className="text-xs font-semibold text-gray-700 capitalize">{selectedRun.channel || selectedRun.brief?.channel}</span>
                </div>
                {(selectedRun.winner || selectedRun.activeModel) && (
                  <div className="bg-gray-50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Best Model</span>
                    <span className={`text-xs font-semibold ${(selectedRun.winner || selectedRun.activeModel) === 'gpt4o' ? 'text-teal-600' : 'text-violet-600'}`}>
                      {(selectedRun.winner || selectedRun.activeModel) === 'gpt4o' ? 'GPT-4o' : 'Claude'}
                    </span>
                  </div>
                )}
                {selectedRun.publishedPath && (
                  <div className="bg-green-50 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-green-100">
                    <FileText size={12} className="text-green-600" />
                    <span className="text-xs font-medium text-green-700">Published to Disk</span>
                  </div>
                )}
              </div>
            </div>

            {/* Post Content */}
            <div className="prose prose-slate max-w-none">
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 relative group">
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors">
                    <ExternalLink size={16} />
                  </button>
                </div>
                
                {selectedRun.approvedDraft ? (
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed font-serif text-lg">
                    {selectedRun.approvedDraft}
                  </div>
                ) : ((selectedRun.winner || selectedRun.activeModel) === 'claude' ? selectedRun.claudeDraft : selectedRun.gpt4oDraft) ? (
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed font-serif text-lg">
                    {(selectedRun.winner || selectedRun.activeModel) === 'claude' ? selectedRun.claudeDraft : selectedRun.gpt4oDraft}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 text-sm">Full content not available for this historical entry.</p>
                    <p className="text-xs text-gray-300 mt-1">This run was imported from mock history or is still processing.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Metrics */}
            {(selectedRun.gpt4oScore || selectedRun.claudeScore) && (
              <div className="mt-12 pt-8 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Quality Metrics</h4>
                <div className="grid grid-cols-2 gap-6">
                  {selectedRun.gpt4oScore && (
                    <div className="bg-teal-50/30 border border-teal-100 rounded-xl p-5">
                      <p className="text-[10px] font-bold text-teal-600 uppercase mb-1">GPT-4o Score</p>
                      <p className="text-2xl font-black text-teal-700">{selectedRun.gpt4oScore.toFixed(1)}<span className="text-sm font-normal text-teal-400 ml-1">/10</span></p>
                    </div>
                  )}
                  {selectedRun.claudeScore && (
                    <div className="bg-violet-50/30 border border-violet-100 rounded-xl p-5">
                      <p className="text-[10px] font-bold text-violet-600 uppercase mb-1">Claude Score</p>
                      <p className="text-2xl font-black text-violet-700">{selectedRun.claudeScore.toFixed(1)}<span className="text-sm font-normal text-violet-400 ml-1">/10</span></p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-300">
            <div className="text-center">
              <Clock size={64} className="mx-auto mb-4 opacity-10" />
              <p className="text-sm font-medium">Select a run from the list to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
