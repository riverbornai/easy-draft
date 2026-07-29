/**
 * tools/searchDecision.js
 * ──────────────────────────────────────────────────────────────────────────────
 * LLM-powered decision tool — decides whether web search is actually needed
 * for a given topic before the Research Agent spends resources on it.
 *
 * Uses gpt-4o-mini (cheap + fast) to classify the topic into:
 *   needsSearch: true  → recent events, live stats, news, named companies/people,
 *                        trends with dates, evolving situations
 *   needsSearch: false → evergreen advice, conceptual frameworks, opinion pieces,
 *                        timeless how-to content, philosophical topics
 *
 * Returns:
 *   {
 *     needsSearch:  boolean,
 *     reason:       string,   ← one-sentence justification
 *     searchQuery:  string,   ← optimised query to use IF searching
 *   }
 * ──────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import { getOpenAI } from '../utils/openai.js';
import chalk from 'chalk';

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
You are a research planning assistant for a content production pipeline.

Your job: decide if web search is needed to write accurate content about a topic.

NEEDS_SEARCH = true when the topic involves:
  - Recent events (< 2 years old), breaking news, current affairs
  - Live/changing statistics, market data, company valuations
  - Named real people (CEOs, politicians, athletes) and their recent actions
  - Named real companies and their current products/status
  - Trend analysis with dates (e.g. "AI in 2025", "2024 marketing trends")
  - Regulatory changes, laws, government actions
  - Anything where outdated info would make the piece factually wrong

NEEDS_SEARCH = false when the topic involves:
  - Timeless advice / evergreen how-to content
  - Conceptual frameworks, mental models, philosophies
  - Opinion pieces / personal leadership / mindset content
  - Writing/communication skills
  - General productivity, creativity, or career advice
  - Topics where a 3-year-old article would still be accurate

Also produce an optimised search query to use IF searching is needed.
The query should be specific, include a year if relevant, and retrieve useful sources.

Respond ONLY with valid JSON — no markdown, no prose, no extra keys.

Format:
{
  "needsSearch": true | false,
  "reason": "one sentence explaining your decision",
  "searchQuery": "the optimised query string (even if needsSearch is false, provide a fallback)"
}
`.trim();

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * searchDecision – makes an LLM call to decide if web search is needed.
 *
 * @param {string} topic    – the content topic from session.brief.topic
 * @param {object} [brief]  – full brief for extra context (tone, audience, channel)
 * @returns {Promise<{ needsSearch: boolean, reason: string, searchQuery: string }>}
 */
export async function searchDecision(topic, brief = {}, sessionId = null) {
  const openai = getOpenAI(sessionId);
  const contextLines = [
    `Topic:    ${topic}`,
    brief.tone     ? `Tone:     ${brief.tone}`     : null,
    brief.audience ? `Audience: ${brief.audience}` : null,
    brief.channel  ? `Channel:  ${brief.channel}`  : null,
    brief.angle    ? `Angle:    ${brief.angle}`     : null,
  ]
    .filter(Boolean)
    .join('\n');

  let result;

  try {
    const response = await openai.chat.completions.create({
      model:           'gpt-4o-mini',
      temperature:     0,
      max_tokens:      200,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role:    'user',
          content: `Evaluate this content brief:\n\n${contextLines}`,
        },
      ],
    });

    result = JSON.parse(response.choices[0].message.content);
  } catch (err) {
    // Fail-safe: if classification errors, skip search rather than crashing
    console.error(chalk.red('  [searchDecision] Classification error:'), err.message);
    return {
      needsSearch:  false,
      reason:       'Classification failed — skipping search as a safe default.',
      searchQuery:  topic,
    };
  }

  // Normalise and validate
  const decision = {
    needsSearch:  Boolean(result.needsSearch),
    reason:       result.reason       ?? 'No reason provided.',
    searchQuery:  result.searchQuery  ?? topic,
  };

  // Console feedback
  const icon  = decision.needsSearch ? chalk.yellow('🔍') : chalk.green('📚');
  const label = decision.needsSearch ? chalk.yellow('WEB SEARCH NEEDED') : chalk.green('USING OWN KNOWLEDGE');
  console.log(`\n  ${icon}  Search Decision: ${label}`);
  console.log(chalk.dim(`     Reason: ${decision.reason}`));
  if (decision.needsSearch) {
    console.log(chalk.dim(`     Query:  "${decision.searchQuery}"`));
  }

  return decision;
}
