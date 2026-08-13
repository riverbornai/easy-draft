/**
 * api/routes/drafts.js
 * GET  /api/drafts         — fetch both GPT-4o and Claude drafts
 * POST /api/drafts/approve — approve a draft (sets reviewStatus = 'approved')
 * POST /api/drafts/reject  — reject a draft with feedback
 */
import { Router } from 'express';
import { activeRuns } from '../mockStore.js';
import { updateSession } from '../session.js';
import { requireAuth } from '../middleware/auth.js';
import { calibrateScores } from '../agents/evalRunner.js';

const router = Router();
router.use(requireAuth);

// ── GET /api/drafts ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const allRuns = await activeRuns.values(req.userId);
  
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
  let run = id ? await activeRuns.get(id, req.userId) : null;
  if (!run && id && !id.startsWith('session_')) {
    run = await activeRuns.get(`session_${id}`, req.userId);
  }
  if (!run && !id) {
    const values = await activeRuns.values(req.userId);
    run = values.at(-1);
  }

  if (run) {
    const selectedModel = model ?? 'gpt4o';
    const finalGptDraft = selectedModel === 'gpt4o' && editedContent ? editedContent : run.gpt4oDraft;
    const finalClaudeDraft = selectedModel === 'claude' && editedContent ? editedContent : run.claudeDraft;

    const gpt4oScores = calibrateScores(run.evalScores?.gpt4o, 'gpt4o', finalGptDraft, run.sessionId);
    const claudeScores = calibrateScores(run.evalScores?.claude, 'claude', finalClaudeDraft, run.sessionId);
    const winningScores = selectedModel === 'claude' ? claudeScores : gpt4oScores;

    const updates = {
      reviewStatus: 'approved',
      activeModel: selectedModel,
      pipelineStatus: 'publish-ready',
      currentStep: 4,
      evalScores: {
        ...run.evalScores,
        accuracy: winningScores.accuracy,
        toneMatch: winningScores.toneMatch,
        formatCompliance: winningScores.formatCompliance,
        hookStrength: winningScores.hookStrength,
        overall: winningScores.overall,
        gpt4o: gpt4oScores,
        claude: claudeScores,
      },
      gpt4oScore: gpt4oScores.overall,
      claudeScore: claudeScores.overall
    };

    if (editedContent) {
      if (selectedModel === 'claude') updates.claudeDraft = editedContent;
      else                            updates.gpt4oDraft  = editedContent;
    }

    updates.approvedDraft = editedContent
      ?? (selectedModel === 'claude' ? run.claudeDraft : run.gpt4oDraft);

    await updateSession(run.sessionId, updates);
  }
  res.json({ success: true, message: `Draft approved (${model ?? 'gpt4o'})` });
});

// ── POST /api/drafts/reject ───────────────────────────────────────────────────
router.post('/reject', async (req, res) => {
  const { runId, feedback } = req.body;
  const id = runId;
  let run = id ? await activeRuns.get(id, req.userId) : null;
  if (!run && id && !id.startsWith('session_')) {
    run = await activeRuns.get(`session_${id}`, req.userId);
  }
  if (!run && !id) {
    const values = await activeRuns.values(req.userId);
    run = values.at(-1);
  }
  
  if (run) {
    const updatedNotes = [...(run.reviewNotes ?? []), feedback];
    const gpt4oScores = calibrateScores(run.evalScores?.gpt4o, 'gpt4o', run.gpt4oDraft, run.sessionId);
    const claudeScores = calibrateScores(run.evalScores?.claude, 'claude', run.claudeDraft, run.sessionId);

    await updateSession(run.sessionId, {
      reviewStatus: 'rejected',
      reviewNotes: updatedNotes,
      evalScores: {
        ...run.evalScores,
        gpt4o: gpt4oScores,
        claude: claudeScores,
      },
      gpt4oScore: gpt4oScores.overall,
      claudeScore: claudeScores.overall
    });
  }
  res.json({ success: true, message: 'Draft rejected — ReviewAgent will now re-run Writer' });
});

export default router;
