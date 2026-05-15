/**
 * api/routes/drafts.js
 * GET  /api/drafts         — fetch both GPT-4o and Claude drafts
 * POST /api/drafts/approve — approve a draft (sets reviewStatus = 'approved')
 * POST /api/drafts/reject  — reject a draft with feedback
 */
import { Router } from 'express';
import { mockDrafts, activeRuns } from '../mockStore.js';
import { updateSession } from '../../session.js';

const router = Router();

// ── GET /api/drafts ───────────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  const allRuns = await activeRuns.values();
  
  // 1. First, look for a run that is specifically waiting for review (HITL)
  const pendingRun = allRuns.find(r => r.pipelineStatus === 'review' && r.reviewStatus === 'pending');
  
  // 2. If none, look for the most recent run that has drafts
  const latestRun = [...allRuns].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
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
router.post('/approve', async (req, res) => {
  const { runId, model, editedContent } = req.body; // model: 'gpt4o' | 'claude'
  const id = runId;
  let run = id ? await activeRuns.get(id) : null;
  if (!run && id && !id.startsWith('session_')) {
    run = await activeRuns.get(`session_${id}`);
  }
  if (!run && !id) {
    const values = await activeRuns.values();
    run = values.at(-1);
  }

  if (run) {
    const updates = {
      reviewStatus: 'approved',
      activeModel: model ?? 'gpt4o',
      pipelineStatus: 'publish-ready',
      currentStep: 4
    };

    if (editedContent) {
      if (model === 'claude') updates.claudeDraft = editedContent;
      else                    updates.gpt4oDraft  = editedContent;
    }

    updates.approvedDraft = editedContent
      ?? (model === 'claude' ? run.claudeDraft : run.gpt4oDraft);

    await updateSession(run.sessionId, updates);
  }
  res.json({ success: true, message: `Draft approved (${model ?? 'gpt4o'})` });
});

// ── POST /api/drafts/reject ───────────────────────────────────────────────────
router.post('/reject', async (req, res) => {
  const { runId, feedback } = req.body;
  const id = runId;
  let run = id ? await activeRuns.get(id) : null;
  if (!run && id && !id.startsWith('session_')) {
    run = await activeRuns.get(`session_${id}`);
  }
  if (!run && !id) {
    const values = await activeRuns.values();
    run = values.at(-1);
  }
  
  if (run) {
    await updateSession(run.sessionId, {
      reviewStatus: 'rejected',
      reviewNotes: [...(run.reviewNotes ?? []), feedback]
    });
  }
  res.json({ success: true, message: 'Draft rejected — ReviewAgent will now re-run Writer' });
});

export default router;
