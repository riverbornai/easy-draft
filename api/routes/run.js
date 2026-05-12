/**
 * api/routes/run.js
 * POST /api/run/start    — kick off a new pipeline run
 * GET  /api/run/status/:id — poll current run state
 * GET  /api/run/list     — all runs (history)
 */
import { Router } from 'express';
import { broadcastEvent } from '../server.js';
import {
  activeRuns,
  historicalRuns,
  PIPELINE_STAGES,
  mockAgentLog,
  mockDrafts,
  mockEvalScores,
} from '../mockStore.js';

const router = Router();

import { runPipeline } from '../../orchestrator.js';

// ── POST /api/run/start ───────────────────────────────────────────────────────
router.post('/start', async (req, res) => {
  const { topic, tone, audience, channel, angle } = req.body;

  // We respond immediately to the frontend
  res.status(201).json({ message: 'Pipeline started' });

  // Run the real pipeline in the background
  try {
    const session = await runPipeline({
       preFilledBrief: { topic, tone, audience, channel, angle }
    });
    
    // Update activeRuns so the polling/SSE picks up the final state
    activeRuns.set(session.sessionId, session);
    
    // Add to historical runs for leaderboard
    const hist = historicalRuns.find(r => r.id === session.sessionId);
    if (!hist) {
       historicalRuns.push({
         id: session.sessionId,
         topic: session.brief.topic,
         channel: session.brief.channel,
         winner: 'gpt4o',
         gpt4oScore: session.evalScores?.overall,
         status: 'done',
         createdAt: new Date().toISOString()
       });
    }
  } catch (err) {
    console.error('Background pipeline error:', err);
  }
});

// ── GET /api/run/status/:id ───────────────────────────────────────────────────
router.get('/status/:id', (req, res) => {
  const run = activeRuns.get(req.params.id);
  if (!run) return res.status(404).json({ error: 'Run not found' });
  res.json(run);
});

// ── GET /api/run/list ─────────────────────────────────────────────────────────
router.get('/list', (_req, res) => {
  const all = [
    ...[...activeRuns.values()],
    ...historicalRuns.filter(h => !activeRuns.has(h.id)),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(all);
});

export default router;
