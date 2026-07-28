/**
 * api/routes/eval.js
 * GET /api/eval/scores      — scores for the latest completed run
 * GET /api/eval/leaderboard — all historical runs with scores
 */
import { Router } from 'express';
import { activeRuns } from '../mockStore.js';

const router = Router();

// ── GET /api/eval/scores ──────────────────────────────────────────────────────
router.get('/scores', async (_req, res) => {
  const activeValues = await activeRuns.values();
  const doneRun = activeValues.find(r => r.evalScores?.overall);
  res.json(doneRun?.evalScores ?? {
    accuracy: 0,
    toneMatch: 0,
    formatCompliance: 0,
    hookStrength: 0,
    overall: 0
  });
});

// ── GET /api/eval/leaderboard ─────────────────────────────────────────────────
router.get('/leaderboard', async (_req, res) => {
  const activeValues = await activeRuns.values();
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
