/**
 * api/routes/agents.js
 * GET /api/agents/log        — last 20 log events across all agents
 * GET /api/sandbox/factsheet — latest fact_sheet.json from sandbox
 * GET /api/metrics           — dashboard summary metrics
 */
import { Router } from 'express';
import { mockAgentLog, mockFactSheet, historicalRuns, activeRuns } from '../mockStore.js';

const router = Router();

// ── GET /api/agents/log ───────────────────────────────────────────────────────
router.get('/agents/log', async (req, res) => {
  const { runId } = req.query;

  // Gather logs from all active runs
  const activeValues = await activeRuns.values();
  let allLogs = activeValues.flatMap(r => 
    (r.log ?? []).map(l => ({ ...l, runId: r.sessionId, topic: r.topic || r.brief?.topic }))
  );

  // If no live runs, use mock logs for demonstration
  if (allLogs.length === 0) {
    allLogs = mockAgentLog.map((l, i) => ({ ...l, runId: `mock_${i}`, topic: 'Demo Run' }));
  }

  if (runId && runId !== 'All') {
    allLogs = allLogs.filter(l => l.runId === runId || l.runId.replace('session_', '') === runId);
  }

  // Sort latest first
  allLogs.sort((a, b) => b.id - a.id);

  res.json(allLogs);
});

// ── GET /api/sandbox/factsheet ────────────────────────────────────────────────
router.get('/sandbox/factsheet', (_req, res) => {
  // In production: read from SANDBOX_DIR/latest session/fact_sheet.json
  res.json(mockFactSheet);
});

// ── GET /api/metrics ──────────────────────────────────────────────────────────
router.get('/metrics', async (_req, res) => {
  const activeList = await activeRuns.values();
  const allRuns    = [...historicalRuns, ...activeList];
  
  // A run is "done" if pipelineStatus is 'done'
  const doneRuns   = allRuns.filter(r => r.pipelineStatus === 'done' || r.status === 'done');
  
  const totalRuns     = allRuns.length;
  const guardrailHits = allRuns.filter(r => r.guardrailHit || (r.pipelineErrors && r.pipelineErrors.length > 0)).length;
  const webSearches   = allRuns.filter(r => r.searchUsed).length;
  
  const avgScore = doneRuns.length
    ? (doneRuns.reduce((s, r) => s + (r.evalScores?.overall || r.gpt4oScore || 0), 0) / doneRuns.length).toFixed(1)
    : 0;
    
  const activeRun = activeList.find(r => r.pipelineStatus !== 'done' && r.pipelineStatus !== 'error');
  const lastRun   = allRuns.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))[0];

  res.json({
    totalRuns,
    avgScore: Number(avgScore),
    guardrailHits,
    webSearches,
    activeRunId:     activeRun?.sessionId ?? lastRun?.sessionId ?? null,
    pipelineStatus:  activeRun?.pipelineStatus ?? lastRun?.pipelineStatus ?? lastRun?.status ?? 'idle',
    currentStep:     activeRun?.currentStep ?? lastRun?.currentStep ?? (lastRun?.status === 'done' ? 5 : -1),
    reviewStatus:    activeRun?.reviewStatus ?? lastRun?.reviewStatus ?? null,
  });
});

export default router;
