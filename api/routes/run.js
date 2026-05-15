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
} from '../mockStore.js';
import { runPipeline } from '../../orchestrator.js';
import { createSession, updateSession } from '../../session.js';

const router = Router();

// ── POST /api/run/start ───────────────────────────────────────────────────────
router.post('/start', async (req, res) => {
  try {
    const { topic, context, tone, audience, channel, angle } = req.body;
    console.log('[API] /api/run/start received:', { topic, channel });

    // Create session first so we can return the ID
    const session = await createSession();
    if (!session || !session.sessionId) {
      throw new Error('Failed to create session or sessionId is missing.');
    }
    
    console.log('[API] Created session:', session.sessionId);
    
    // Update memory proxy
    await activeRuns.set(session.sessionId, session);

    // Respond immediately
    res.status(201).json({ 
      id: session.sessionId,
      runId: session.sessionId,
      sessionId: session.sessionId
    });

    // Background pipeline
    runPipeline({
       preFilledBrief: { topic, context, tone, audience, channel, angle },
       sessionId: session.sessionId
    }).then(async finalSession => {
      if (!finalSession) return;
      
      const hist = historicalRuns.find(r => r.id === finalSession.sessionId);
      if (!hist) {
         historicalRuns.push({
           id:             finalSession.sessionId,
           topic:          finalSession.brief?.topic || 'N/A',
           channel:        finalSession.brief?.channel || 'N/A',
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
    }).catch(async err => {
      console.error('Background pipeline error:', err);
      try {
        await updateSession(session.sessionId, { pipelineStatus: 'error' });
      } catch (e) {
        console.error('Failed to update session error status:', e);
      }
    });
  } catch (err) {
    console.error('Route error in /api/run/start:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ── GET /api/run/status/:id ───────────────────────────────────────────────────
router.get('/status/:id', async (req, res) => {
  const id = req.params.id;
  let run = await activeRuns.get(id);
  
  // If not found, try with session_ prefix for active runs
  if (!run && !id.startsWith('session_')) {
    run = await activeRuns.get(`session_${id}`);
  }

  // If still not found, check historical runs
  if (!run) {
    run = historicalRuns.find(h => 
      h.id === id || 
      h.sessionId === id || 
      (h.id && h.id.replace('session_', '') === id) ||
      (h.sessionId && h.sessionId.replace('session_', '') === id) ||
      `session_${h.id}` === id ||
      `session_${h.sessionId}` === id
    );
  }

  if (!run) return res.status(404).json({ error: 'Run not found' });
  res.json(run);
});

// ── GET /api/run/list ─────────────────────────────────────────────────────────
router.get('/list', async (_req, res) => {
  try {
    const activeValues = (await activeRuns.values()) || [];
    const all = [
      ...activeValues,
      ...historicalRuns.filter(h => !activeValues.some(av => (av.sessionId === h.id || av.id === h.id))),
    ].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.ts || 0);
      const dateB = new Date(b.createdAt || b.ts || 0);
      return dateB - dateA;
    });

    res.json(all);
  } catch (err) {
    console.error('List error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

export default router;
