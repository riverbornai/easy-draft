import mongoose from 'mongoose';
import 'dotenv/config';
import Session from './models/Session.js';

async function run() {
  const MONGO_URI = process.env.MONGO_DB;
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');
  
  const sessions = await Session.find({}).sort({ createdAt: -1 }).limit(5);
  console.log(`Found ${sessions.length} latest sessions.`);
  for (const s of sessions) {
    console.log(`Session: ${s.sessionId}`);
    console.log(`  pipelineStatus: ${s.pipelineStatus}`);
    console.log(`  activeModel: ${s.activeModel}`);
    console.log(`  evalScores:`, s.evalScores);
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);
