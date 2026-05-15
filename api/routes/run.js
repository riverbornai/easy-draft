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
  
  // If not found, try with session_ prefix
  if (!run && !id.startsWith('session_')) {
    run = await activeRuns.get(`session_${id}`);
  }

  if (!run) return res.status(404).json({ error: 'Run not found' });
  res.json(run);
});

// ── GET /api/run/list ─────────────────────────────────────────────────────────
router.get('/list', async (_req, res) => {
  try {
    const all = await activeRuns.values();
    all.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || a.ts || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || b.ts || 0);
      return dateB - dateA;
    });

    res.json(all);
  } catch (err) {
    console.error('List error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});


export default router;
