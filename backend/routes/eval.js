/**
 * api/routes/eval.js
 * GET /api/eval/scores      — scores for the latest completed run
 * GET /api/eval/leaderboard — all historical runs with scores
 */
import { Router } from 'express';
import { activeRuns } from '../mockStore.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// ── GET /api/eval/scores ──────────────────────────────────────────────────────
// Optional ?runId=... to target a specific run; otherwise returns the most
// recently completed run's scores (not just the first one found).
router.get('/scores', async (req, res) => {
  const { runId } = req.query;
  const activeValues = await activeRuns.values(req.userId);

  let doneRun;
  if (runId) {
    doneRun = activeValues.find(r => r.sessionId === runId && r.evalScores?.overall != null);
  } else {
    doneRun = activeValues
      .filter(r => r.evalScores?.overall != null)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))[0];
  }

  res.json(doneRun?.evalScores ?? {
    accuracy: 0,
    toneMatch: 0,
    formatCompliance: 0,
    hookStrength: 0,
    overall: 0
  });
});

// ── GET /api/eval/leaderboard ─────────────────────────────────────────────────
router.get('/leaderboard', async (req, res) => {
  const activeValues = await activeRuns.values(req.userId);
  const activeDone = activeValues
    .filter(r => r.pipelineStatus === 'done' || r.status === 'done')
    .map(r => ({
       id: r.sessionId,
       topic: r.brief?.topic,
       channel: r.brief?.channel,
       gpt4oScore: r.gpt4oScore,
       claudeScore: r.claudeScore, 
       winner: r.activeModel || 'gpt4o',
       createdAt: r.createdAt || r.updatedAt
    }));

  const allRuns = activeDone
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const gpt4oWins  = allRuns.filter(r => r.winner === 'gpt4o').length;
  const claudeWins = allRuns.filter(r => r.winner === 'claude').length;
  const overallWinner = gpt4oWins >= claudeWins ? 'gpt4o' : 'claude';

  res.json({ runs: allRuns, gpt4oWins, claudeWins, overallWinner });
});


export default router;
