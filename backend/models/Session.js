import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  // Phase 1 – Intake
  brief: {
    topic:    { type: String, default: null },
    tone:     { type: String, default: null },
    audience: { type: String, default: null },
    channel:  { type: String, default: null },
    angle:    { type: String, default: null },
  },

  history: [
    {
      role: { type: String, enum: ['user', 'assistant'] },
      content: { type: String },
      timestamp: { type: Date, default: Date.now }
    }
  ],

  // Phase 2 – Research
  factSheet: { type: mongoose.Schema.Types.Mixed, default: null },
  searchUsed: { type: Boolean, default: false },
  searchReason: { type: String, default: null },

  // Phase 3 – Writer
  gpt4oDraft: { type: String, default: null },
  claudeDraft: { type: String, default: null },
  activeModel: { type: String, default: null },

  // Phase 4 – Review
  approvedDraft: { type: String, default: null },
  reviewNotes: [String],
  reviewAttempts: { type: Number, default: 0 },
  reviewStatus: { type: String, default: null },

  // Phase 5 – Publisher
  formattedPost: { type: String, default: null },
  publishedPath: { type: String, default: null },

  // Phase 6 – Eval
  evalScores: {
    // Mirrors whichever model was actually approved/published (backward compat
    // for /api/metrics avgScore and the "done" check in mockStore.js).
    accuracy: { type: Number, default: null },
    toneMatch: { type: Number, default: null },
    formatCompliance: { type: Number, default: null },
    hookStrength: { type: Number, default: null },
    overall: { type: Number, default: null },
    // Independent judged scores per draft — each is a real, separate LLM
    // evaluation of that model's own draft (no derived/offset values).
    gpt4o: {
      accuracy: { type: Number, default: null },
      toneMatch: { type: Number, default: null },
      formatCompliance: { type: Number, default: null },
      hookStrength: { type: Number, default: null },
      overall: { type: Number, default: null },
      feedback: { type: String, default: null },
    },
    claude: {
      accuracy: { type: Number, default: null },
      toneMatch: { type: Number, default: null },
      formatCompliance: { type: Number, default: null },
      hookStrength: { type: Number, default: null },
      overall: { type: Number, default: null },
      feedback: { type: String, default: null },
    },
  },

  // Pipeline metadata
  pipelineStatus: { type: String, default: 'created' },
  log: [
    {
      id: { type: Number },
      ts: { type: String },
      agent: { type: String },
      type: { type: String },
      msg: { type: String }
    }
  ],
  pipelineErrors: [
    {
      phase: { type: String },
      message: { type: String },
      timestamp: { type: Date, default: Date.now }
    }
  ],
});

// Update updatedAt on every save
sessionSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

const Session = mongoose.model('Session', sessionSchema);
export default Session;
