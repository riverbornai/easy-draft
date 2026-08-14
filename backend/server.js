/**
 * api/server.js — Express API server for EasyDraft UI
 * Runs on port 3001. Provides REST + SSE endpoints for the React frontend.
 */
import 'dotenv/config';
import crypto from 'crypto';
if (!globalThis.crypto?.getRandomValues) {
  globalThis.crypto = crypto.webcrypto || crypto;
}
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { setSessionListener } from './session.js';


import runRoutes from './routes/run.js';
import agentRoutes from './routes/agents.js';
import draftRoutes from './routes/drafts.js';
import evalRoutes from './routes/eval.js';
import userKeysRoutes from './routes/userKeys.js';

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// ── MongoDB Connection ───────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_DB;
import fs from 'fs';

fs.writeFileSync('db_error.log', `Starting DB Connection attempt...\n`);

mongoose.connection.on('error', err => {
  fs.appendFileSync('db_error.log', `Mongoose connection error: ${err.message}\n${err.stack}\n`);
});
mongoose.connection.on('disconnected', () => {
  fs.appendFileSync('db_error.log', `Mongoose disconnected\n`);
});
mongoose.connection.on('connected', () => {
  fs.appendFileSync('db_error.log', `Mongoose connected successfully\n`);
});

if (!MONGO_URI) {
  fs.appendFileSync('db_error.log', '❌ MONGO_DB is not defined in .env\n');
  console.error('❌ MONGO_DB is not defined in .env');
} else {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => {
      fs.appendFileSync('db_error.log', `Mongoose connect catch block error: ${err.message}\n`);
      console.error('❌ MongoDB Connection Error:', err);
    });
}

// ── SSE Bridge ───────────────────────────────────────────────────────────────
// Listen for real session updates and broadcast to frontend
setSessionListener((session, updates) => {
  if (updates.pipelineStatus) {
    // Map status to UI steps
    const stepMap = {
      'intake': 0, 'research': 1, 'writing': 2, 'review': 3, 'eval': 4, 'publish': 5, 'done': 5, 'error': -1
    };
    broadcastEvent({
      type: 'stage',
      runId: session.sessionId,
      stage: updates.pipelineStatus,
      step: stepMap[updates.pipelineStatus] ?? 0
    });
  }
});

const app = express();
const PORT = process.env.API_PORT || 3001;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ── SSE: broadcast pipeline events to all connected clients ───────────────────
export const sseClients = new Set();

export function broadcastEvent(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try { client.res.write(payload); } catch (_) { sseClients.delete(client); }
  });
}

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const client = { id: Date.now(), res };
  sseClients.add(client);

  // Initial ping so browser knows connection is live
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch (_) { clearInterval(heartbeat); }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(client);
  });
});

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/run', runRoutes);
app.use('/api', agentRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/eval', evalRoutes);
app.use('/api/user/keys', userKeysRoutes);

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    path: req.path
  });
});

// ── Health ─────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(), 
    clients: sseClients.size,
    dbState: mongoose.connection.readyState,
    dbStateLabel: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] ?? 'unknown'
  })
);

app.listen(PORT, () => {
  console.log(`\n🚀  EasyDraft API → http://localhost:${PORT}`);
  console.log(`   SSE endpoint → http://localhost:${PORT}/api/events\n`);
});
