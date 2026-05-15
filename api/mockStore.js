/**
 * api/mockStore.js
 * ──────────────────────────────────────────────────────────────────────────────
 * API Data Store — Phase 3/4 Wrapper
 * 
 * This file now connects the Express API to the real session.js memory store.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { getSession, allSessions } from '../session.js';

// Historical runs are now fetched directly from MongoDB via session.js proxy

// activeRuns is a proxy getter that pulls from MongoDB via session.js
export const activeRuns = {
  get: async (id) => await getSession(id),
  has: async (id) => !!(await getSession(id)),
  set: async (id, val) => { /* session.js handles its own setting via createSession */ },
  delete: async (id) => { /* cleanup logic if needed */ },
  values: async () => {
    const ids = await allSessions();
    const results = await Promise.all(ids.map(id => getSession(id)));
    return results.filter(Boolean);
  },
  entries: async () => {
    const ids = await allSessions();
    const results = await Promise.all(ids.map(async id => [id, await getSession(id)]));
    return results.filter(pair => pair[1] !== null);
  }
};

// ── Shared constants for UI ───────────────────────────────────────────────────

export const PIPELINE_STAGES = [
  { step: 0, status: 'intake',   agent: 'IntakeAgent',     delay: 2000 },
  { step: 1, status: 'research', agent: 'ResearchAgent',   delay: 3500 },
  { step: 2, status: 'writing',  agent: 'WriterAgent',     delay: 4500 },
  { step: 3, status: 'review',   agent: 'ReviewAgent',     delay: 2000 },
  { step: 4, status: 'publish',  agent: 'PublisherAgent',  delay: 2500 },
  { step: 5, status: 'done',     agent: 'EvalRunner',      delay: 2000 },
];


