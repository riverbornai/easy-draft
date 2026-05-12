/**
 * session.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Central session store for the AI Content Studio pipeline.
 *
 * The session object is the single source of truth that flows through every
 * agent. Instead of re-sending history, agents read/write fields here, making
 * the pipeline fully stateful across multiple turns.
 *
 * Usage:
 *   import { createSession, getSession, updateSession } from './session.js';
 *
 * Fields written by each phase:
 *   Phase 1  – intake        : brief, history, createdAt
 *   Phase 2  – research      : factSheet, searchUsed
 *   Phase 3  – writer        : gpt4oDraft, claudeDraft
 *   Phase 4  – review        : approvedDraft, reviewNotes, reviewAttempts
 *   Phase 5  – publisher     : formattedPost, publishedPath
 *   Phase 6  – eval          : evalScores, leaderboard
 * ──────────────────────────────────────────────────────────────────────────────
 */

// In-memory store (keyed by sessionId).
// For a production system you would swap this with Redis / a DB.
const _store = new Map();
let _listener = null;

export function setSessionListener(fn) {
  _listener = fn;
}


/**
 * createSession – initialise a fresh session and return it.
 * @param {string} [id] – optional deterministic ID (auto-generated otherwise)
 * @returns {object} session
 */
export function createSession(id) {
  const sessionId = id ?? `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const session = {
    // ── Identity ──────────────────────────────────────────────────────────────
    sessionId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    // ── Phase 1 – Intake ──────────────────────────────────────────────────────
    brief: {
      topic:    null,   // string  – what is the content about?
      tone:     null,   // string  – e.g. "professional", "casual", "witty"
      audience: null,   // string  – e.g. "startup founders", "HR managers"
      channel:  null,   // "linkedin" | "blog" | "xthread" | "email"
      angle:    null,   // optional – specific hook or unique angle
    },

    // Conversation history with the Intake Agent (multi-turn support)
    history: [],        // [{ role: "user"|"assistant", content: string }]

    // ── Phase 2 – Research ────────────────────────────────────────────────────
    factSheet:   null,  // object – structured facts produced by Research Agent
    searchUsed:  false, // boolean – did Research Agent call WebSearch?
    searchReason: null, // string  – LLM justification from searchDecision tool

    // ── Phase 3 – Writer ──────────────────────────────────────────────────────
    gpt4oDraft:  null,  // string – draft written by GPT-4o
    claudeDraft: null,  // string – draft written by Claude (may be null)
    activeModel: null,  // "gpt4o" | "claude" – which draft the Review Agent sees

    // ── Phase 4 – Review ──────────────────────────────────────────────────────
    approvedDraft:  null, // string – the human-approved final draft
    reviewNotes:    [],   // string[] – reviewer feedback per iteration
    reviewAttempts: 0,    // number  – max 3 before auto-escalation
    reviewStatus:   null, // "pending" | "approved" | "rejected" | "escalated"

    // ── Phase 5 – Publisher ───────────────────────────────────────────────────
    formattedPost: null,  // string – post after channel template applied
    publishedPath: null,  // string – file path of the saved .md file

    // ── Phase 6 – Eval ────────────────────────────────────────────────────────
    evalScores: {
      accuracy:         null, // 0-10
      toneMatch:        null, // 0-10
      formatCompliance: null, // 0-10
      hookStrength:     null, // 0-10
      overall:          null, // average
    },

    // ── Pipeline metadata ─────────────────────────────────────────────────────
    pipelineStatus: 'created', // created | intake | research | writing |
                                // review  | publish | eval    | done | error
    log: [],                    // { id, ts, agent, type, msg }[]
    errors: [],                 // { phase, message, timestamp }[]
  };

  _store.set(sessionId, session);
  return session;
}

/**
 * getSession – retrieve an existing session by ID.
 * @param {string} sessionId
 * @returns {object|null}
 */
export function getSession(sessionId) {
  return _store.get(sessionId) ?? null;
}

/**
 * updateSession – merge a partial update into an existing session.
 * Deep-merges one level for nested objects (brief, evalScores, etc.).
 *
 * @param {string} sessionId
 * @param {object} updates   – partial session object
 * @returns {object}          updated session
 */
export function updateSession(sessionId, updates) {
  const session = _store.get(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  // Deep-merge first-level objects so callers only pass changed keys
  const DEEP_MERGE_KEYS = ['brief', 'evalScores'];

  for (const [key, value] of Object.entries(updates)) {
    if (DEEP_MERGE_KEYS.includes(key) && typeof value === 'object' && value !== null) {
      session[key] = { ...session[key], ...value };
    } else {
      session[key] = value;
    }
  }

  session.updatedAt = new Date().toISOString();

  if (_listener) {
    _listener(session, updates);
  }

  return session;
}

/**
 * appendHistory – add a message to the session's conversation history.
 * @param {string} sessionId
 * @param {'user'|'assistant'} role
 * @param {string} content
 */
export function appendHistory(sessionId, role, content) {
  const session = _store.get(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  session.history.push({ role, content, timestamp: new Date().toISOString() });
  session.updatedAt = new Date().toISOString();
}

/**
 * addLog – record an agent activity for the dashboard log.
 * @param {string} sessionId
 * @param {string} agent – e.g. "WriterAgent"
 * @param {string} msg – log message
 * @param {string} type – "agent" | "system" | "tool"
 */
export function addLog(sessionId, agent, msg, type = 'agent') {
  const session = _store.get(sessionId);
  if (!session) return;
  
  const logEntry = {
    id: Date.now() + Math.random(),
    ts: new Date().toLocaleTimeString('en-US', { hour12: false }),
    agent,
    type,
    msg
  };
  
  session.log.push(logEntry);
  session.updatedAt = new Date().toISOString();
  
  if (_listener) {
    _listener(session, { log: logEntry });
  }
}

/**
 * logError – record a pipeline error without crashing.
 * @param {string} sessionId
 * @param {string} phase
 * @param {string|Error} error
 */
export function logError(sessionId, phase, error) {
  const session = _store.get(sessionId);
  if (!session) return;
  session.errors.push({
    phase,
    message: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  });
  session.updatedAt = new Date().toISOString();
}

/**
 * serializeSession – return a clean, JSON-safe snapshot of the session.
 * Useful for saving to disk / tracing.
 * @param {string} sessionId
 * @returns {string} JSON string
 */
export function serializeSession(sessionId) {
  const session = getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  return JSON.stringify(session, null, 2);
}

/**
 * allSessions – list all active session IDs (debugging / eval).
 * @returns {string[]}
 */
export function allSessions() {
  return [..._store.keys()];
}
