import mongoose from 'mongoose';
import 'dotenv/config';
import Session from './models/Session.js';
import { activeRuns } from './mockStore.js';

async function run() {
  const MONGO_URI = process.env.MONGO_DB;
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');
  
  const sessions = await Session.find({}).sort({ createdAt: -1 }).limit(10);
  console.log(`Found ${sessions.length} latest sessions.`);
  for (const s of sessions) {
    const attached = await activeRuns.get(s.sessionId);
    console.log(`Session: ${s.sessionId} | Topic: "${s.brief?.topic}"`);
    console.log(`  pipelineStatus: ${s.pipelineStatus}`);
    console.log(`  activeModel: ${s.activeModel}`);
    console.log(`  reviewNotes:`, s.reviewNotes);
    console.log(`  reviewAttempts:`, s.reviewAttempts);
    console.log(`  evalScores:`, s.evalScores);
    console.log(`  gpt4oScore:`, attached.gpt4oScore);
    console.log(`  claudeScore:`, attached.claudeScore);
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);
