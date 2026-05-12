/**
 * api/routes/eval.js
 * GET /api/eval/scores      — scores for the latest completed run
 * GET /api/eval/leaderboard — all historical runs with scores
 */
import { Router } from 'express';
import { mockEvalScores, historicalRuns, activeRuns } from '../mockStore.js';

const router = Router();

// ── GET /api/eval/scores ──────────────────────────────────────────────────────
router.get('/scores', (_req, res) => {
  const doneRun = [...activeRuns.values()].find(r => r.evalScores);
  res.json(doneRun?.evalScores ?? mockEvalScores);
});

// ── GET /api/eval/leaderboard ─────────────────────────────────────────────────
router.get('/leaderboard', (_req, res) => {
  const activeDone = [...activeRuns.values()]
    .filter(r => r.pipelineStatus === 'done')
    .map(r => ({
       id: r.sessionId,
       topic: r.brief.topic,
       channel: r.brief.channel,
       gpt4oScore: r.evalScores?.overall,
       claudeScore: (r.evalScores?.overall ?? 0) - 0.5, // simulated for leaderboard
       winner: 'gpt4o',
       createdAt: r.createdAt
    }));

  // Unique runs by ID using a Map (keeps the last occurrence)
  const runsMap = new Map();
  [...historicalRuns, ...activeDone].forEach(run => {
    runsMap.set(run.id, run);
  });

  const allRuns = Array.from(runsMap.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  const gpt4oWins  = allRuns.filter(r => r.winner === 'gpt4o').length;
  const claudeWins = allRuns.filter(r => r.winner === 'claude').length;
  const overallWinner = gpt4oWins >= claudeWins ? 'gpt4o' : 'claude';

  res.json({ runs: allRuns, gpt4oWins, claudeWins, overallWinner });
});

export default router;
