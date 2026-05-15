/**
 * agents/evalRunner.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Eval Runner — Phase 6
 *
 * Responsibilities:
 *   1. Evaluate the published content against the original brief.
 *   2. Use gpt-4o-mini to provide scores (1-10) and feedback.
 *   3. Update session with evalScores.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import OpenAI from 'openai';
import chalk from 'chalk';
import { updateSession } from '../session.js';

export async function runEvalRunner(session) {
  const { sessionId, approvedDraft, brief } = session;

  console.log('\n' + chalk.bold.bgBlue(' EVAL RUNNER ') + chalk.bold.white(' Phase 6 — Scoring & Analysis'));
  console.log(chalk.dim('─'.repeat(60)));

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `
You are a content quality evaluator. Evaluate the following content based on the provided brief.

BRIEF:
Topic: ${brief.topic}
Audience: ${brief.audience}
Tone: ${brief.tone}
Channel: ${brief.channel}

CONTENT:
${approvedDraft}

Provide scores from 1 to 10 for the following categories:
- accuracy: Factual correctness
- toneMatch: How well it matches the requested tone
- formatCompliance: Appropriate for the channel
- hookStrength: Engagement level of the intro

Return ONLY valid JSON:
{
  "accuracy": 0,
  "toneMatch": 0,
  "formatCompliance": 0,
  "hookStrength": 0,
  "overall": 0,
  "feedback": "summary feedback"
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const scores = JSON.parse(response.choices[0].message.content);
    
    console.log(chalk.green('  📊  Evaluation complete'));
    console.log(chalk.dim(`      Overall: ${scores.overall}/10`));

    return updateSession(sessionId, {
      evalScores: scores,
      currentStep: 4,
      pipelineStatus: 'eval'
    });
  } catch (err) {
    console.error(chalk.red('  [EvalRunner] Error:'), err.message);
    return session;
  }
}
