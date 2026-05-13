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

import { createSession, updateSession } from '../../session.js';

// ── POST /api/run/start ───────────────────────────────────────────────────────
router.post('/start', async (req, res) => {
  try {
    const { topic, context, tone, audience, channel, angle } = req.body;

    // Create session first so we can return the ID
    const session = createSession();
    console.log('[API] Created session:', session.sessionId);
    
    activeRuns.set(session.sessionId, session);

    // We respond immediately to the frontend with the runId
    res.status(201).json({ 
      id: session.sessionId,
      runId: session.sessionId,
      sessionId: session.sessionId
    });

    // Run the real pipeline in the background
    // (Note: This runs outside the request/response cycle)
    runPipeline({
       preFilledBrief: { topic, context, tone, audience, channel, angle },
       sessionId: session.sessionId
    }).then(finalSession => {
      // Update activeRuns so the polling/SSE picks up the final state
      activeRuns.set(finalSession.sessionId, finalSession);
      
      // Add to historical runs for leaderboard
      const hist = historicalRuns.find(r => r.id === finalSession.sessionId);
      if (!hist) {
         historicalRuns.push({
           id:             finalSession.sessionId,
           topic:          finalSession.brief.topic,
           channel:        finalSession.brief.channel,
           winner:         finalSession.activeModel || 'gpt4o',
           approvedDraft:  finalSession.approvedDraft,
           gpt4oDraft:     finalSession.gpt4oDraft,
           claudeDraft:    finalSession.claudeDraft,
           gpt4oScore:     finalSession.evalScores?.overall,
           status:         'done',
           createdAt:      finalSession.createdAt || new Date().toISOString(),
           publishedPath:  finalSession.publishedPath
         });
      }
    }).catch(err => {
      console.error('Background pipeline error:', err);
      updateSession(session.sessionId, { pipelineStatus: 'error' });
    });
  } catch (err) {
    console.error('Route error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
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
