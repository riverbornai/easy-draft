/**
 * api/mockStore.js
 * ──────────────────────────────────────────────────────────────────────────────
 * API Data Store — Phase 3/4 Wrapper
 * 
 * This file now connects the Express API to the real session.js memory store,
 * while maintaining historical data for the dashboard metrics.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { getSession, allSessions } from '../session.js';

// Historical runs that have already completed (for dashboard stats)
export const historicalRuns = [
  {
    id:          'run_001',
    topic:       'Startup fundraising mistakes in 2024',
    channel:     'linkedin',
    winner:      'gpt4o',
    gpt4oScore:  8.5,
    claudeScore: 8.0,
    status:      'done',
    createdAt:   '2024-10-15T10:00:00Z',
  },
  {
    id:          'run_002',
    topic:       'The mindset shift every first-time CTO needs',
    channel:     'email',
    winner:      'claude',
    gpt4oScore:  7.8,
    claudeScore: 8.6,
    status:      'done',
    createdAt:   '2024-10-16T14:30:00Z',
  },
  {
    id:          'run_003',
    topic:       'Why multi-agent AI is the future of SaaS',
    channel:     'blog',
    winner:      'gpt4o',
    gpt4oScore:  9.0,
    claudeScore: 8.3,
    status:      'done',
    createdAt:   '2024-10-17T09:15:00Z',
  },
  {
    id:          'run_004',
    topic:       'Node.js vs Go for microservices',
    channel:     'blog',
    winner:      'claude',
    gpt4oScore:  7.8,
    claudeScore: 8.6,
    status:      'done',
    createdAt:   '2024-10-18T11:00:00Z',
  },
  {
    id:          'run_005',
    topic:       'Scaling engineering teams at Series B',
    channel:     'linkedin',
    winner:      'gpt4o',
    gpt4oScore:  8.7,
    claudeScore: 8.0,
    status:      'done',
    createdAt:   '2024-10-19T16:45:00Z',
  },
];

// activeRuns is now a proxy getter that pulls from session.js
export const activeRuns = {
  get: (id) => getSession(id),
  has: (id) => !!getSession(id),
  set: (id, val) => { /* session.js handles its own setting via createSession */ },
  delete: (id) => { /* cleanup logic if needed */ },
  values: () => allSessions().map(id => getSession(id)),
};

// ── Shared constants for UI simulation ───────────────────────────────────────

export const PIPELINE_STAGES = [
  { step: 0, status: 'intake',   agent: 'IntakeAgent',     delay: 2000 },
  { step: 1, status: 'research', agent: 'ResearchAgent',   delay: 3500 },
  { step: 2, status: 'writing',  agent: 'WriterAgent',     delay: 4500 },
  { step: 3, status: 'review',   agent: 'ReviewAgent',     delay: 2000 },
  { step: 4, status: 'publish',  agent: 'PublisherAgent',  delay: 2500 },
  { step: 5, status: 'done',     agent: 'EvalRunner',      delay: 2000 },
];

export const mockEvalScores = {
  accuracy:         8.5,
  toneMatch:        9.0,
  formatCompliance: 8.0,
  hookStrength:     8.8,
  overall:          8.6,
};

export const mockDrafts = {
  gpt4oDraft: `**The AI Revolution in Enterprise Software: What CTOs Need to Know in 2025**\n\nThe enterprise software landscape has never changed faster...`,
  claudeDraft: `🚀 The enterprise software industry is at an inflection point — and most companies are still treating AI like a feature instead of a foundation...`,
};

export const mockFactSheet = {
  topicOverview: "AI Agents are autonomous systems...",
  keyPoints: ["Point 1", "Point 2"],
  supportingFacts: ["Fact 1"],
  sourcesUsed: []
};

export const mockAgentLog = [
  { id: 1, ts: '10:30:00', agent: 'IntakeAgent', type: 'agent', msg: 'Started pipeline' }
];

