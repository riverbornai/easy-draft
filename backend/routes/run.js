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
import { runPipeline } from '../orchestrator.js';
import { createSession, updateSession, deleteSession } from '../session.js';
import { apiKeyStorage, sessionKeys, anthropicApiKeyStorage, anthropicSessionKeys } from '../utils/context.js';
import { requireAuth } from '../middleware/auth.js';
import UserKeys from '../models/UserKeys.js';
import { decryptSecret } from '../utils/keyEncryption.js';

const router = Router();
router.use(requireAuth);

// ── POST /api/run/start ───────────────────────────────────────────────────────
router.post('/start', async (req, res) => {
  try {
    const { topic, context, tone, audience, channel, angle } = req.body;
    console.log('[API] /api/run/start received:', { topic, channel });

    // Extract API keys from request headers, falling back to the keys the
    // signed-in account has saved (Manage API Key).
    let apiKey = req.headers['x-api-key'] ||
      (req.headers['authorization'] && req.headers['authorization'].replace('Bearer ', ''));
    let anthropicKey = req.headers['x-anthropic-key'] || null;

    if (!apiKey || !anthropicKey) {
      const stored = await UserKeys.findOne({ userId: req.userId });
      if (!apiKey && stored?.openaiKeyEncrypted) apiKey = decryptSecret(stored.openaiKeyEncrypted);
      if (!anthropicKey && stored?.anthropicKeyEncrypted) anthropicKey = decryptSecret(stored.anthropicKeyEncrypted);
    }

    // Create session first so we can return the ID
    const session = await createSession(undefined, req.userId);
    if (!session || !session.sessionId) {
      throw new Error('Failed to create session or sessionId is missing.');
    }

    console.log('[API] Created session:', session.sessionId);

    // Store keys in session maps if they exist
    if (apiKey) {
      sessionKeys.set(session.sessionId, apiKey);
    }
    if (anthropicKey) {
      anthropicSessionKeys.set(session.sessionId, anthropicKey);
    }

    // Update memory proxy
    await activeRuns.set(session.sessionId, session);

    // Respond immediately
    res.status(201).json({ 
      id: session.sessionId,
      runId: session.sessionId,
      sessionId: session.sessionId
    });

    // Background pipeline wrapped in storage context
    apiKeyStorage.run(apiKey, () => {
      anthropicApiKeyStorage.run(anthropicKey, () => {
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
        }).finally(() => {
          // Clean up the key mappings when run ends
          sessionKeys.delete(session.sessionId);
          anthropicSessionKeys.delete(session.sessionId);
        });
      });
    });
  } catch (err) {
    console.error('Route error in /api/run/start:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ── GET /api/run/status/:id ───────────────────────────────────────────────────
router.get('/status/:id', async (req, res) => {
  const id = req.params.id;
  let run = await activeRuns.get(id, req.userId);

  // If not found, try with session_ prefix
  if (!run && !id.startsWith('session_')) {
    run = await activeRuns.get(`session_${id}`, req.userId);
  }

  if (!run) return res.status(404).json({ error: 'Run not found' });
  res.json(run);
});

// ── DELETE /api/run/:id ───────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  let deleted = await deleteSession(id, req.userId);

  if (!deleted && !id.startsWith('session_')) {
    deleted = await deleteSession(`session_${id}`, req.userId);
  }

  if (!deleted) return res.status(404).json({ error: 'Run not found' });
  res.json({ success: true });
});

// ── GET /api/run/list ─────────────────────────────────────────────────────────
router.get('/list', async (req, res) => {
  try {
    const all = await activeRuns.values(req.userId);
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
