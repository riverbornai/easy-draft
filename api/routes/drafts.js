/**
 * api/routes/drafts.js
 * GET  /api/drafts         — fetch both GPT-4o and Claude drafts
 * POST /api/drafts/approve — approve a draft (sets reviewStatus = 'approved')
 * POST /api/drafts/reject  — reject a draft with feedback
 */
import { Router } from 'express';
import { mockDrafts, activeRuns } from '../mockStore.js';

const router = Router();

// ── GET /api/eval/leaderboard ─────────────────────────────────────────────────
router.get('/', (_req, res) => {
  const allRuns = [...activeRuns.values()];
  
  // 1. First, look for a run that is specifically waiting for review (HITL)
  const pendingRun = allRuns.find(r => r.pipelineStatus === 'review' && r.reviewStatus === 'pending');
  
  // 2. If none, look for the most recent run that has drafts
  const latestRun = allRuns.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .find(r => r.gpt4oDraft || r.claudeDraft);

  const active = pendingRun || latestRun;

  res.json({
    gpt4oDraft:  active?.gpt4oDraft  ?? null,
    claudeDraft: active?.claudeDraft ?? null,
    reviewStatus: active?.reviewStatus ?? 'none',
    reviewAttempts: active?.reviewAttempts ?? 0,
    reviewNotes: active?.reviewNotes ?? [],
    runId: active?.sessionId ?? null,
    activeModel: active?.activeModel ?? null
  });
});

// ── POST /api/drafts/approve ──────────────────────────────────────────────────
router.post('/approve', (req, res) => {
  const { runId, model, editedContent } = req.body; // model: 'gpt4o' | 'claude'
  // Find most recent active run if no runId specified
  const id = runId;
  let run = id ? activeRuns.get(id) : null;
  if (!run && id && !id.startsWith('session_')) {
    run = activeRuns.get(`session_${id}`);
  }
  if (!run && !id) {
    run = [...activeRuns.values()].at(-1);
  }

  if (run) {
    run.reviewStatus   = 'approved';
    run.activeModel    = model ?? 'gpt4o';
    run.pipelineStatus = 'publish';
    run.currentStep    = 4;
    // If user edited the draft inline, persist the edited version
    if (editedContent) {
      if (model === 'claude') run.claudeDraft = editedContent;
      else                    run.gpt4oDraft  = editedContent;
    }
    run.approvedDraft = editedContent
      ?? (model === 'claude' ? run.claudeDraft : run.gpt4oDraft);
  }
  res.json({ success: true, message: `Draft approved (${model ?? 'gpt4o'})` });
});

// ── POST /api/drafts/reject ───────────────────────────────────────────────────
router.post('/reject', (req, res) => {
  const { runId, feedback } = req.body;
  const id = runId;
  let run = id ? activeRuns.get(id) : null;
  if (!run && id && !id.startsWith('session_')) {
    run = activeRuns.get(`session_${id}`);
  }
  if (!run && !id) {
    run = [...activeRuns.values()].at(-1);
  }
  
  if (run) {
    run.reviewStatus = 'rejected';
    run.reviewNotes  = [...(run.reviewNotes ?? []), feedback];
    // The ReviewAgent loop will pick this up from the session and proceed
  }
  res.json({ success: true, message: 'Draft rejected — ReviewAgent will now re-run Writer' });
});

export default router;
