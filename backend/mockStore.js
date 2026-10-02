/**
 * api/mockStore.js
 * ──────────────────────────────────────────────────────────────────────────────
 * API Data Store — Phase 3/4 Wrapper
 * 
 * This file now connects the Express API to the real session.js memory store.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { getSession, allSessions } from './session.js';
import { calibrateScores } from './agents/evalRunner.js';

// Historical runs are now fetched directly from MongoDB via session.js proxy

// activeRuns is a proxy getter that pulls from MongoDB via session.js.
// Every read is scoped to userId so one account can never see another's runs.
export const activeRuns = {
  get: async (id, userId) => {
    const session = await getSession(id);
    if (!session || session.userId !== userId) return null;
    return attachScores(session);
  },
  has: async (id, userId) => {
    const session = await getSession(id);
    return !!session && session.userId === userId;
  },
  set: async (id, val) => { /* session.js handles its own setting via createSession */ },
  delete: async (id) => { /* cleanup logic if needed */ },
  values: async (userId) => {
    const ids = await allSessions(userId);
    const results = await Promise.all(ids.map(id => getSession(id)));
    return results.filter(Boolean).map(attachScores);
  },
  entries: async (userId) => {
    const ids = await allSessions(userId);
    const results = await Promise.all(ids.map(async id => [id, attachScores(await getSession(id))]));
    return results.filter(pair => pair[1] !== null);
  }
};

function attachScores(session) {
  if (!session) return session;

  let gpt4oOverall = session.evalScores?.gpt4o?.overall;
  let claudeOverall = session.evalScores?.claude?.overall;

  if (session.gpt4oDraft) {
    const calibrated = calibrateScores(session.evalScores?.gpt4o, 'gpt4o', session.gpt4oDraft, session.sessionId);
    gpt4oOverall = calibrated.overall;
  }

  if (session.claudeDraft) {
    const calibrated = calibrateScores(session.evalScores?.claude, 'claude', session.claudeDraft, session.sessionId);
    claudeOverall = calibrated.overall;
  }

  if (gpt4oOverall !== undefined && gpt4oOverall !== null) {
    session.gpt4oScore = gpt4oOverall;
  }
  if (claudeOverall !== undefined && claudeOverall !== null) {
    session.claudeScore = claudeOverall;
  }
  return session;
}

// ── Shared constants for UI ───────────────────────────────────────────────────

export const PIPELINE_STAGES = [
  { step: 0, status: 'intake',   agent: 'IntakeAgent',     delay: 2000 },
  { step: 1, status: 'research', agent: 'ResearchAgent',   delay: 3500 },
  { step: 2, status: 'writing',  agent: 'WriterAgent',     delay: 4500 },
  { step: 3, status: 'review',   agent: 'ReviewAgent',     delay: 2000 },
  { step: 4, status: 'publish',  agent: 'PublisherAgent',  delay: 2500 },
  { step: 5, status: 'done',     agent: 'EvalRunner',      delay: 2000 },
];


