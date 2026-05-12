import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Edit3, Loader2, RotateCcw, Save, X, ArrowRight } from 'lucide-react';

// ── Individual draft panel ────────────────────────────────────────────────────

function DraftPanel({ title, model, draft: initialDraft, globalStatus, onApprove, onReject, loading, color }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback,     setFeedback]     = useState('');
  const [isEditing,    setIsEditing]    = useState(false);
  const [editedDraft,  setEditedDraft]  = useState(initialDraft ?? '');

  // Keep editor in sync if draft prop changes (e.g. re-write arrives)
  useEffect(() => {
    if (!isEditing) setEditedDraft(initialDraft ?? '');
  }, [initialDraft, isEditing]);

  const isApproved = globalStatus === `approved-${model}`;

  const saveEdit = () => {
    setIsEditing(false);
    // onApprove with the edited content — parent stores the override
    onApprove(model, editedDraft);
  };

  return (
    <div className={`bg-white border rounded-xl flex flex-col transition-all duration-300 ${
      isApproved ? 'border-teal-400 shadow-teal-100 shadow-md' : 'border-gray-100'
    }`}>

      {/* Header */}
      <div className={`px-5 py-4 border-b flex items-center justify-between rounded-t-xl ${
        isApproved ? 'bg-teal-50 border-teal-100' : 'bg-gray-50 border-gray-100'
      }`}>
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${color}`} />
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          {isApproved && (
            <span className="text-[10px] font-semibold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
              ✓ Approved
            </span>
          )}
          {isEditing && (
            <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              ✎ Editing
            </span>
          )}
        </div>

        {/* Edit / Save / Cancel controls */}
        {!isApproved && !isEditing ? (
          <button
            onClick={() => { setIsEditing(true); setShowFeedback(false); }}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
          >
            <Edit3 size={12} /> Edit
          </button>
        ) : isEditing ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={saveEdit}
              className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-800 px-2 py-1 rounded-md hover:bg-teal-50 transition-colors"
            >
              <Save size={12} /> Save & Approve
            </button>
            <button
              onClick={() => { setIsEditing(false); setEditedDraft(initialDraft ?? ''); }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              <X size={12} /> Cancel
            </button>
          </div>
        ) : null}
      </div>

      {/* Draft body — read view OR edit textarea */}
      <div className="flex-1 px-5 py-4 overflow-y-auto max-h-[500px]">
        {!initialDraft ? (
          <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
            Draft not yet generated
          </div>
        ) : isEditing ? (
          <textarea
            value={editedDraft}
            onChange={e => setEditedDraft(e.target.value)}
            className="w-full h-full min-h-[420px] text-sm text-gray-800 leading-relaxed resize-none focus:outline-none font-[inherit]"
            autoFocus
          />
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{initialDraft}</p>
        )}
      </div>

      {/* Word count when editing */}
      {isEditing && (
        <div className="px-5 pb-2">
          <p className="text-[10px] text-gray-300">{editedDraft.split(/\s+/).filter(Boolean).length} words</p>
        </div>
      )}

      {/* Actions */}
      {initialDraft && !isApproved && !isEditing && (
        <div className="px-5 py-4 border-t border-gray-100">
          {!showFeedback ? (
            <div className="flex gap-2">
              <button
                disabled={loading}
                onClick={() => onApprove(model)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-teal-500 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                Approve
              </button>
              <button
                disabled={loading}
                onClick={() => setShowFeedback(true)}
                className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-500 text-sm font-medium py-2.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <XCircle size={13} /> Reject
              </button>
            </div>
          ) : (
            <div className="space-y-2 fade-in">
              <p className="text-xs font-medium text-gray-500 mb-1">What needs to change?</p>
              <textarea
                rows={2}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Be specific — the Writer Agent will use this to rewrite..."
                className="w-full border border-red-200 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-300 resize-none focus:outline-none focus:border-red-300"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { onReject(model, feedback); setShowFeedback(false); setFeedback(''); }}
                  disabled={!feedback.trim() || loading}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 text-white text-xs font-medium py-2 rounded-lg hover:bg-red-600 disabled:opacity-40 transition-colors"
                >
                  <RotateCcw size={11} /> Resubmit to Writer
                </button>
                <button
                  onClick={() => setShowFeedback(false)}
                  className="px-3 text-xs text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Drafts() {
  const navigate = useNavigate();
  const [data,     setData]    = useState(null);
  const [status,   setStatus]  = useState('');
  const [loading,  setLoading] = useState(false);
  const [toast,    setToast]   = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const fetchDrafts = () =>
    axios.get('/api/drafts').then(r => {
      setData(r.data);
      // If backend says it's already approved, update local status to disable buttons
      if (r.data.reviewStatus === 'approved') {
        setStatus('approved-gpt4o'); // Defaulting to gpt4o if approved
      }
    }).catch(() => {});

  useEffect(() => {
    fetchDrafts();
    const poll = setInterval(fetchDrafts, 4000);
    return () => clearInterval(poll);
  }, []);

  // onApprove: model = 'gpt4o' | 'claude', optionally with edited content
  const handleApprove = async (model, editedContent = null) => {
    setLoading(true);
    try {
      await axios.post('/api/drafts/approve', {
        model,
        editedContent: editedContent ?? undefined,
      });
      setStatus(`approved-${model}`);
      showToast(`✓ ${model === 'gpt4o' ? 'GPT-4o' : 'Claude'} draft approved — moving to Publisher Agent.`);
      
      // Auto-redirect to dashboard after 2.5 seconds to see progress
      setTimeout(() => {
        navigate('/');
      }, 2500);
    } catch (_) {
      showToast('Failed to approve draft.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (model, feedback) => {
    setLoading(true);
    try {
      await axios.post('/api/drafts/reject', { model, feedback });
      setStatus('');
      showToast(`↩ Feedback sent — Writer Agent rewriting (cycle ${(data?.reviewAttempts ?? 0) + 1}/3)`);
      setTimeout(fetchDrafts, 3500); // refresh after simulated rewrite
    } catch (_) {
      showToast('Failed to send rejection feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto fade-in">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drafts</h1>
          <p className="text-sm text-gray-400 mt-1">
            Compare GPT-4o and Claude — approve, reject with feedback, or edit inline
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data?.reviewAttempts > 0 && (
            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1.5 rounded-lg font-medium">
              Review cycle {data.reviewAttempts}/3
            </span>
          )}
          {data?.reviewStatus === 'approved' && (
            <span className="text-xs bg-teal-50 text-teal-600 border border-teal-200 px-3 py-1.5 rounded-lg font-medium">
              ✓ Approved — in Publisher queue
            </span>
          )}
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="mb-5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 fade-in flex items-center justify-between">
          <span>{toast}</span>
          <button onClick={() => setToast('')} className="text-gray-300 hover:text-gray-500 ml-3">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Output guardrail warnings from session */}
      {data?.reviewNotes?.length > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 fade-in">
          <p className="text-xs font-semibold text-amber-700 mb-2">⚠  Review notes from previous cycle</p>
          <ul className="space-y-1">
            {data.reviewNotes.map((note, i) => (
              <li key={i} className="text-xs text-amber-700">• {note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Side-by-side panels */}
      <div className="grid grid-cols-2 gap-5">
        <DraftPanel
          title="GPT-4o Draft"
          model="gpt4o"
          draft={data?.gpt4oDraft ?? null}
          globalStatus={status}
          onApprove={handleApprove}
          onReject={handleReject}
          loading={loading}
          color="bg-teal-400"
        />
        <DraftPanel
          title="Claude Draft"
          model="claude"
          draft={data?.claudeDraft ?? null}
          globalStatus={status}
          onApprove={handleApprove}
          onReject={handleReject}
          loading={loading}
          color="bg-violet-400"
        />
      </div>

      {/* Help text */}
      <p className="mt-4 text-xs text-gray-300 text-center">
        Click <strong className="text-gray-400">Edit</strong> to modify a draft inline, then Save & Approve ·
        Click <strong className="text-gray-400">Reject</strong> to send feedback back to the Writer Agent (max 3 cycles)
      </p>
    </div>
  );
}
