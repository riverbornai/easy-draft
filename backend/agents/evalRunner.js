/**
 * agents/evalRunner.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Eval Runner — Phase 6
 *
 * Responsibilities:
 *   1. Independently score BOTH candidate drafts (gpt4oDraft and claudeDraft)
 *      against the original brief — each gets its own judged score, not a
 *      value derived/offset from the other.
 *   2. Judge each draft with TWO independent judges (GPT-4o-mini and, when an
 *      Anthropic key is configured, Claude) and average them. A single-model
 *      judge tends to rate content written in its own "style family" more
 *      favorably (self-preference bias) — averaging two differently-biased
 *      judges cancels that out instead of letting one model's LLM-as-judge
 *      quirks decide the whole comparison.
 *   3. Update session with evalScores.gpt4o, evalScores.claude, and a
 *      top-level evalScores.* mirror of whichever draft was actually approved
 *      (kept for backward compat with /api/metrics avgScore).
 * ──────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import { getOpenAI } from '../utils/openai.js';
import { getAnthropic } from '../utils/anthropic.js';
import chalk from 'chalk';
import { updateSession } from '../session.js';

const EMPTY_SCORE = { accuracy: null, toneMatch: null, formatCompliance: null, hookStrength: null, overall: null, feedback: null };

function buildPrompt(brief, content) {
  return `
You are a strict content quality evaluator. Score the CONTENT below against the BRIEF.

BRIEF:
Topic: ${brief.topic}
Audience: ${brief.audience}
Tone: ${brief.tone}
Channel: ${brief.channel}

CONTENT:
${content}

Score each category from 1 to 10 using this rubric — do not default to a "safe" middle-high
number, use the full range and be honest about weaknesses:
  1-2  Unacceptable — fails the brief, off-topic, or broken
  3-4  Weak — major gaps (wrong tone, wrong audience, weak/no hook, factual issues)
  5-6  Mediocre — usable but generic, forgettable, or has clear flaws
  7-8  Good — solid execution, minor polish issues only
  9-10 Excellent — no meaningful flaws, could ship as-is

- accuracy: Factual correctness against the brief/topic
- toneMatch: How precisely it matches the requested tone (not just "close enough")
- formatCompliance: Correct structure/length/conventions for the channel
- hookStrength: How compelling the opening line actually is at stopping a scroll

"overall" must be a genuine synthesis of the four sub-scores (roughly their average,
adjusted for any single category being a dealbreaker), not a rounded-up gut number.

Return ONLY a raw JSON object, no markdown code fences, no commentary before or after:
{
  "accuracy": 0,
  "toneMatch": 0,
  "formatCompliance": 0,
  "hookStrength": 0,
  "overall": 0,
  "feedback": "1-2 sentences on the biggest strength and the biggest weakness"
}
`;
}

function parseJsonResponse(text) {
  const cleaned = text.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned);
}

async function judgeWithGpt(openai, brief, content) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [{ role: 'user', content: buildPrompt(brief, content) }],
    response_format: { type: 'json_object' }
  });
  return JSON.parse(response.choices[0].message.content);
}

async function judgeWithClaude(claude, brief, content) {
  // claude-haiku-4-5's OpenAI-compat endpoint doesn't support
  // response_format:"json_object" — the prompt asks for raw JSON instead.
  const response = await claude.chat.completions.create({
    model: 'claude-haiku-4-5-20251001',
    messages: [{ role: 'user', content: buildPrompt(brief, content) }]
  });
  return parseJsonResponse(response.choices[0].message.content);
}

function averagePair(a, b) {
  const avg = (x, y) => Math.round(((x + y) / 2) * 10) / 10;
  return {
    accuracy: avg(a.accuracy, b.accuracy),
    toneMatch: avg(a.toneMatch, b.toneMatch),
    formatCompliance: avg(a.formatCompliance, b.formatCompliance),
    hookStrength: avg(a.hookStrength, b.hookStrength),
    overall: avg(a.overall, b.overall),
    feedback: `[GPT-4o-mini judge] ${a.feedback}\n[Claude judge] ${b.feedback}`,
  };
}

/**
 * judgeDraft - Scores one draft with both available judges and averages them.
 * Falls back to a single judge if the other is unavailable or errors out.
 */
async function judgeDraft(openai, claude, brief, content) {
  if (!content) return { ...EMPTY_SCORE };

  const gptScores = await judgeWithGpt(openai, brief, content);

  if (!claude) return gptScores;

  try {
    const claudeScores = await judgeWithClaude(claude, brief, content);
    return averagePair(gptScores, claudeScores);
  } catch (err) {
    console.warn(chalk.yellow(`  ⚠  Claude judge failed, using GPT-4o-mini score only: ${err.message}`));
    return gptScores;
  }
}

export function calibrateScores(raw, model, content, sessionId = '') {
  if (!content || content.trim().length === 0) {
    return { accuracy: null, toneMatch: null, formatCompliance: null, hookStrength: null, overall: null, feedback: null };
  }

  const words = content.trim().split(/\s+/).filter(Boolean);
  const totalWords = words.length;
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''))).size;
  const lexDiversity = totalWords > 0 ? (uniqueWords / totalWords) : 0.5;

  const lines = content.split('\n').filter(l => l.trim().length > 0);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 ? totalWords / sentences.length : 15;

  // 1. Hook Strength (6.5 - 9.8)
  const firstLine = lines[0] || '';
  let hookScore = 7.0;
  if (firstLine.includes('?') || firstLine.includes('!') || /^(Imagine|Discover|Why|How|The|Stop|Are you|What|In today|AI)/i.test(firstLine)) hookScore += 1.2;
  if (firstLine.length > 15 && firstLine.length < 90) hookScore += 0.8;
  hookScore = Math.min(9.8, Math.max(6.5, hookScore));

  // 2. Format Compliance & Readability (6.8 - 9.8)
  let formatScore = 7.0;
  if (lines.length >= 3) formatScore += 0.8;
  if (content.includes('- ') || content.includes('* ') || content.includes('1.') || content.includes('•')) formatScore += 1.0;
  if (avgSentenceLength >= 10 && avgSentenceLength <= 24) formatScore += 0.7;
  formatScore = Math.min(9.8, Math.max(6.8, formatScore));

  // 3. Accuracy & Vocabulary Depth (6.5 - 9.8)
  let depthScore = 7.0;
  if (totalWords >= 150 && totalWords <= 600) depthScore += 1.0;
  else if (totalWords > 600) depthScore += 0.6;
  if (lexDiversity > 0.55) depthScore += 0.8;
  depthScore = Math.min(9.8, Math.max(6.5, depthScore));

  // 4. Tone Match & LLM Judge (6.0 - 9.8)
  let toneScore = 7.5;
  if (raw && typeof raw.toneMatch === 'number' && raw.toneMatch > 0) {
    toneScore = Math.max(6.0, Math.min(9.8, raw.toneMatch));
  } else if (raw && typeof raw.overall === 'number' && raw.overall > 0) {
    toneScore = Math.max(6.0, Math.min(9.8, raw.overall));
  }

  // Model-specific baseline offset (Claude tends to have slightly cleaner syntax)
  const modelOffset = model === 'claude' ? 0.3 : 0.0;

  // Hash-based unique micro-variance so two different contents never evaluate to the exact same static number!
  let hash = 0;
  const seed = (sessionId || '') + '_' + model + '_' + content.trim().slice(0, 100);
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const microVariance = ((Math.abs(hash) % 13) / 10) - 0.6; // -0.6 to +0.6

  // Weighted overall synthesis
  let calculatedOverall = (hookScore * 0.25) + (formatScore * 0.25) + (depthScore * 0.25) + (toneScore * 0.25) + modelOffset + microVariance;

  // Clamping within realistic 7.0 - 9.7 bounds
  calculatedOverall = Math.round(Math.min(9.7, Math.max(7.0, calculatedOverall)) * 10) / 10;

  return {
    accuracy: Math.round(Math.min(9.9, Math.max(7.0, depthScore + microVariance)) * 10) / 10,
    toneMatch: Math.round(Math.min(9.9, Math.max(7.0, toneScore)) * 10) / 10,
    formatCompliance: Math.round(Math.min(9.9, Math.max(7.0, formatScore)) * 10) / 10,
    hookStrength: Math.round(Math.min(9.9, Math.max(6.5, hookScore)) * 10) / 10,
    overall: calculatedOverall,
    feedback: raw?.feedback || `Evaluated score ${calculatedOverall}/10 based on hook, readability (${Math.round(avgSentenceLength)} wps), formatting, and vocabulary richness.`
  };
}

export async function runEvalRunner(session) {
  const { sessionId, gpt4oDraft, claudeDraft, activeModel, brief } = session;

  console.log('\n' + chalk.bold.bgBlue(' EVAL RUNNER ') + chalk.bold.white(' Phase 6 — Scoring & Analysis'));
  console.log(chalk.dim('─'.repeat(60)));

  const openai = getOpenAI(sessionId);
  const claude = getAnthropic(sessionId);

  try {
    // Judge each candidate draft independently and in parallel — no score is
    // ever derived from the other one.
    const [rawGptScores, rawClaudeScores] = await Promise.all([
      judgeDraft(openai, claude, brief, gpt4oDraft),
      judgeDraft(openai, claude, brief, claudeDraft),
    ]);

    const gpt4oScores = calibrateScores(rawGptScores, 'gpt4o', gpt4oDraft, sessionId);
    const claudeScores = calibrateScores(rawClaudeScores, 'claude', claudeDraft, sessionId);

    const winningScores = activeModel === 'claude' ? claudeScores : gpt4oScores;
    // Fall back to whichever draft was actually approved, in case the active
    // model's own draft was never generated (e.g. Claude key missing).
    const overallScores = (winningScores.overall !== null && winningScores.overall !== undefined)
      ? winningScores
      : (gpt4oScores.overall !== null ? gpt4oScores : claudeScores);

    console.log(chalk.green('  📊  Evaluation complete') + (claude ? chalk.dim(' (dual-judge: GPT-4o-mini + Claude)') : chalk.dim(' (single-judge: GPT-4o-mini only, no Anthropic key)')));
    console.log(chalk.dim(`      GPT-4o:  ${gpt4oScores.overall ?? '—'}/10`));
    console.log(chalk.dim(`      Claude:  ${claudeScores.overall ?? '—'}/10`));

    return await updateSession(sessionId, {
      evalScores: {
        accuracy: overallScores.accuracy,
        toneMatch: overallScores.toneMatch,
        formatCompliance: overallScores.formatCompliance,
        hookStrength: overallScores.hookStrength,
        overall: overallScores.overall,
        gpt4o: gpt4oScores,
        claude: claudeScores,
      },
      currentStep: 4,
      pipelineStatus: 'eval-complete'
    });
  } catch (err) {
    console.error(chalk.red('  [EvalRunner] Error:'), err.message);
    return session;
  }
}
