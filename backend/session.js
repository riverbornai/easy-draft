/**
 * session.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Central session store for the EasyDraft pipeline.
 *
 * This file now uses MongoDB via Mongoose for persistent storage.
 * All functions are now ASYNCHRONOUS.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import Session from './models/Session.js';

let _listener = null;

export function setSessionListener(fn) {
  _listener = fn;
}

/**
 * createSession – initialise a fresh session and save to DB.
 * @param {string} [id] – optional deterministic ID
 * @param {string} userId – owner of this session
 * @returns {Promise<object>} session
 */
export async function createSession(id, userId) {
  const sessionId = id ?? `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const sessionData = {
    sessionId,
    userId,
    brief: {
      topic:    null,
      tone:     null,
      audience: null,
      channel:  null,
      angle:    null,
    },
    history: [],
    factSheet:   null,
    searchUsed:  false,
    searchReason: null,
    gpt4oDraft:  null,
    claudeDraft: null,
    activeModel: null,
    approvedDraft:  null,
    reviewNotes:    [],
    reviewAttempts: 0,
    reviewStatus:   null,
    formattedPost: null,
    publishedPath: null,
    evalScores: {
      accuracy:         null,
      toneMatch:        null,
      formatCompliance: null,
      hookStrength:     null,
      overall:          null,
      gpt4o:  { accuracy: null, toneMatch: null, formatCompliance: null, hookStrength: null, overall: null, feedback: null },
      claude: { accuracy: null, toneMatch: null, formatCompliance: null, hookStrength: null, overall: null, feedback: null },
    },
    pipelineStatus: 'created',
    log: [],
    pipelineErrors: [],
  };

  const session = await Session.create(sessionData);
  return session.toObject();
}

/**
 * getSession – retrieve an existing session by ID from MongoDB.
 * @param {string} sessionId
 * @returns {Promise<object|null>}
 */
export async function getSession(sessionId) {
  const session = await Session.findOne({ sessionId });
  return session ? session.toObject() : null;
}

/**
 * updateSession – merge a partial update into a MongoDB document.
 * @param {string} sessionId
 * @param {object} updates   – partial session object
 * @returns {Promise<object>} updated session
 */
export async function updateSession(sessionId, updates) {
  // Deep-merge first-level objects (brief, evalScores)
  const DEEP_MERGE_KEYS = ['brief', 'evalScores'];
  
  const query = { sessionId };
  const updateOp = { $set: {} };

  for (const [key, value] of Object.entries(updates)) {
    if (DEEP_MERGE_KEYS.includes(key) && typeof value === 'object' && value !== null) {
      for (const [subKey, subValue] of Object.entries(value)) {
        updateOp.$set[`${key}.${subKey}`] = subValue;
      }
    } else {
      updateOp.$set[key] = value;
    }
  }

  const session = await Session.findOneAndUpdate(query, updateOp, { new: true });
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  const obj = session.toObject();
  if (_listener) {
    _listener(obj, updates);
  }

  return obj;
}

/**
 * appendHistory – add a message to the session's conversation history in DB.
 */
export async function appendHistory(sessionId, role, content) {
  const session = await Session.findOneAndUpdate(
    { sessionId },
    { 
      $push: { history: { role, content, timestamp: new Date() } },
      $set: { updatedAt: new Date() }
    },
    { new: true }
  );
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  return session.toObject();
}

/**
 * addLog – record an agent activity in DB.
 */
export async function addLog(sessionId, agent, msg, type = 'agent') {
  const logEntry = {
    id: Date.now() + Math.random(),
    ts: new Date().toLocaleTimeString('en-US', { hour12: false }),
    agent,
    type,
    msg
  };
  
  const session = await Session.findOneAndUpdate(
    { sessionId },
    { 
      $push: { log: logEntry },
      $set: { updatedAt: new Date() }
    },
    { new: true }
  );
  
  if (session && _listener) {
    _listener(session.toObject(), { log: logEntry });
  }
}

/**
 * logError – record a pipeline error in DB.
 */
export async function logError(sessionId, phase, error) {
  const errorEntry = {
    phase,
    message: error instanceof Error ? error.message : String(error),
    timestamp: new Date(),
  };

  await Session.findOneAndUpdate(
    { sessionId },
    { 
      $push: { pipelineErrors: errorEntry },
      $set: { updatedAt: new Date() }
    }
  );
}

/**
 * serializeSession – return a clean snapshot.
 */
export async function serializeSession(sessionId) {
  const session = await getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  return JSON.stringify(session, null, 2);
}

/**
 * allSessions – list session IDs belonging to a given user.
 * @param {string} userId
 */
export async function allSessions(userId) {
  const sessions = await Session.find({ userId }, 'sessionId');
  return sessions.map(s => s.sessionId);
}

/**
 * deleteSession – remove a session belonging to a given user.
 * @param {string} sessionId
 * @param {string} userId
 * @returns {Promise<boolean>} whether a document was deleted
 */
export async function deleteSession(sessionId, userId) {
  const result = await Session.deleteOne({ sessionId, userId });
  return result.deletedCount > 0;
}
