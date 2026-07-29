/**
 * agents/researchAgent.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Research Agent — Phase 2
 *
 * Responsibilities:
 *   1. Run inside a SANDBOX (isolated directory from SANDBOX_DIR env var)
 *   2. Call searchDecision() — LLM decides if web search is needed for the topic
 *   3. If needsSearch: true  → call webSearch(), incorporate results
 *      If needsSearch: false → use model's own knowledge only
 *   4. Call a gpt-4o model to synthesize all context into structured research
 *   5. Save fact_sheet.json to the sandbox directory
 *   6. Update the session with factSheet, searchUsed, searchReason
 *   7. Return the updated session to the orchestrator
 *
 * SDK features used:
 *   • Agent + run         — fact synthesis agent
 *   • tool()              — custom factSynthesis tool
 *   • withTrace()         — wraps entire research run in a named trace span
 *   • Sandbox (fs-extra)  — isolated write directory for fact_sheet.json
 *
 * Session fields written:
 *   session.factSheet    — the structured fact_sheet object
 *   session.searchUsed   — boolean
 *   session.searchReason — LLM justification string
 *   session.pipelineStatus → 'research-complete'
 * ──────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';
import fse from 'fs-extra';
import { getOpenAI } from '../utils/openai.js';

import {
  withTrace,
} from '@openai/agents';

import { searchDecision } from '../tools/searchDecision.js';
import { webSearch } from '../tools/webSearch.js';
import {
  updateSession,
  logError,
  getSession,
} from '../session.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Sandbox setup ─────────────────────────────────────────────────────────────

/**
 * initialiseSandbox – ensures the sandbox directory exists and returns its path.
 * Creates a session-scoped subfolder so runs don't overwrite each other.
 *
 * @param {string} sessionId
 * @returns {Promise<string>} absolute path to the session sandbox
 */
async function initialiseSandbox(sessionId) {
  const base = process.env.SANDBOX_DIR ?? './sandbox';
  const sandboxPath = path.resolve(__dirname, '..', base, sessionId);
  await fse.ensureDir(sandboxPath);
  return sandboxPath;
}

// ── Fact-sheet synthesizer ────────────────────────────────────────────────────

/**
 * synthesizeFacts – calls gpt-4o to combine brief + optional search results
 * into a structured fact_sheet object.
 *
 * @param {object} brief         – session.brief
 * @param {object|null} searchResult – result from webSearch(), or null
 * @returns {Promise<object>}    structured fact_sheet
 */
async function synthesizeFacts(brief, searchResult, sessionId) {
  const openai = getOpenAI(sessionId);
  const hasSearchData = searchResult && searchResult.keyFacts?.length > 0;

  const contextSection = hasSearchData
    ? `
WEB SEARCH RESULTS:
Summary: ${searchResult.summary}

Key Facts:
${searchResult.keyFacts.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Sources:
${searchResult.sources.map(s => `- ${s.title}${s.url ? ' | ' + s.url : ''}`).join('\n')}
`.trim()
    : 'No web search was performed. Use your own knowledge to generate research context.';

  const prompt = `
You are a senior research analyst. Create a structured research brief for this content piece.

CONTENT BRIEF:
Topic:    ${brief.topic}
Tone:     ${brief.tone}
Audience: ${brief.audience}
Channel:  ${brief.channel}
${brief.angle ? 'Angle:    ' + brief.angle : ''}

${contextSection}

OUTPUT: Return a JSON object with this EXACT structure (no markdown, no prose):
{
  "topicOverview": "2-3 sentence overview of the topic",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "supportingFacts": ["fact with context", "stat or example", "relevant data point"],
  "audienceInsights": "1-2 sentences on what this specific audience cares about re: this topic",
  "suggestedAngles": ["angle 1", "angle 2", "angle 3"],
  "keywordsAndPhrases": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "sourcesUsed": ${hasSearchData ? JSON.stringify(searchResult.sources) : '[]'},
  "contentWarnings": "any sensitive areas to avoid, or empty string",
  "researchConfidence": "high | medium | low"
}
`.trim();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    max_tokens: 1200,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content);
}

// ── Fact-sheet file writer ────────────────────────────────────────────────────

/**
 * saveFactSheet – writes the fact_sheet object to sandbox/fact_sheet.json.
 *
 * @param {string} sandboxPath
 * @param {object} factSheet
 * @returns {Promise<string>} full path of written file
 */
async function saveFactSheet(sandboxPath, factSheet) {
  const filePath = path.join(sandboxPath, 'fact_sheet.json');
  await fse.writeJson(filePath, factSheet, { spaces: 2 });
  return filePath;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * runResearchAgent – entry point called by the orchestrator.
 *
 * Flow:
 *   1. Initialise sandbox directory (session-scoped)
 *   2. Call searchDecision() → log result
 *   3. If needsSearch: true  → call webSearch()
 *      If needsSearch: false → skip
 *   4. Synthesize all context into fact_sheet via gpt-4o
 *   5. Save fact_sheet.json to sandbox
 *   6. Update session and return
 *
 * @param {object} session  – session object from Phase 1
 * @returns {Promise<object>} updated session
 */
export async function runResearchAgent(session) {
  const { sessionId, brief } = session;

  console.log('\n' + chalk.bold.bgCyan(' RESEARCH AGENT ') + chalk.bold.white(' Phase 2 — Building Fact Sheet'));
  console.log(chalk.dim('─'.repeat(60)));
  console.log(chalk.dim(`  Topic:    ${brief.topic}`));
  console.log(chalk.dim(`  Audience: ${brief.audience}`));
  console.log(chalk.dim(`  Channel:  ${brief.channel}\n`));

  await updateSession(sessionId, { pipelineStatus: 'research', currentStep: 1 });

  // ── Step 1: Initialise sandbox ─────────────────────────────────────────────
  let sandboxPath;
  try {
    sandboxPath = await initialiseSandbox(sessionId);
    console.log(chalk.dim(`  🗂  Sandbox: ${sandboxPath}`));
  } catch (err) {
    await logError(sessionId, 'research-sandbox', err);
    throw new Error(`[ResearchAgent] Sandbox init failed: ${err.message}`);
  }

  // ── Wrap entire research run in a trace span ───────────────────────────────
  let factSheet;
  let searchResult = null;
  let decision;

  await withTrace('ResearchAgent', async () => {

    // ── Step 2: Search decision ──────────────────────────────────────────────
    const decisionSpinner = ora({
      text: chalk.dim('  Evaluating search necessity...'),
      spinner: 'dots',
      color: 'yellow',
    }).start();

    try {
      decision = await searchDecision(brief.topic, brief, sessionId);
      decisionSpinner.stop();
    } catch (err) {
      decisionSpinner.fail('Search decision failed');
      await logError(sessionId, 'research-search-decision', err);
      decision = { needsSearch: false, reason: 'Decision error — using own knowledge.', searchQuery: brief.topic };
    }

    // Update session with search decision metadata
    await updateSession(sessionId, {
      searchReason: decision.reason,
      searchUsed: false, // will flip to true if search runs
    });

    // ── Step 3: Conditional web search ──────────────────────────────────────
    if (decision.needsSearch) {
      console.log(chalk.yellow('\n  🔍  Web search triggered. Running search...'));
      try {
        searchResult = await webSearch(decision.searchQuery, brief.topic);
        await updateSession(sessionId, { searchUsed: true });
      } catch (err) {
        await logError(sessionId, 'research-websearch', err);
        console.log(chalk.yellow('  ⚠  Web search failed — continuing with model knowledge.'));
        searchResult = null;
      }
    } else {
      console.log(chalk.green('\n  📚  Skipping web search — using model knowledge.'));
      console.log(chalk.dim(`     ${decision.reason}`));
    }

    // ── Step 4: Synthesize fact sheet ────────────────────────────────────────
    const synthSpinner = ora({
      text: chalk.dim('  Synthesizing research into fact sheet (gpt-4o)...'),
      spinner: 'dots',
      color: 'magenta',
    }).start();

    try {
      const rawFacts = await synthesizeFacts(brief, searchResult, sessionId);

      // Enrich with metadata
      factSheet = {
        ...rawFacts,
        _meta: {
          sessionId,
          topic: brief.topic,
          channel: brief.channel,
          searchUsed: decision.needsSearch && searchResult !== null,
          searchQuery: decision.needsSearch ? decision.searchQuery : null,
          searchReason: decision.reason,
          generatedAt: new Date().toISOString(),
          model: 'gpt-4o',
        },
      };

      synthSpinner.succeed(chalk.green('  Fact sheet synthesized'));
    } catch (err) {
      synthSpinner.fail('Fact synthesis failed');
      await logError(sessionId, 'research-synthesis', err);
      throw new Error(`[ResearchAgent] Fact synthesis failed: ${err.message}`);
    }

    // ── Step 5: Save to sandbox ──────────────────────────────────────────────
    try {
      const savedPath = await saveFactSheet(sandboxPath, factSheet);
      console.log(chalk.green(`  💾  Saved: ${savedPath}`));
    } catch (err) {
      await logError(sessionId, 'research-save', err);
      console.warn(chalk.yellow('  ⚠  Could not save fact_sheet.json to sandbox — continuing.'));
    }

  }); // end withTrace

  // ── Step 6: Update session ────────────────────────────────────────────────
  const updatedSession = await updateSession(sessionId, {
    factSheet,
    searchUsed: decision?.needsSearch && searchResult !== null,
    searchReason: decision?.reason,
    pipelineStatus: 'research-complete',
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + chalk.bold.green('✅  Research complete'));
  console.log(chalk.dim('─'.repeat(60)));
  console.log(chalk.dim(`  Key points:   ${factSheet?.keyPoints?.length ?? 0}`));
  console.log(chalk.dim(`  Facts found:  ${factSheet?.supportingFacts?.length ?? 0}`));
  console.log(chalk.dim(`  Angles:       ${factSheet?.suggestedAngles?.length ?? 0}`));
  console.log(chalk.dim(`  Keywords:     ${factSheet?.keywordsAndPhrases?.join(', ') ?? 'N/A'}`));
  console.log(chalk.dim(`  Confidence:   ${factSheet?.researchConfidence ?? 'N/A'}`));
  console.log(chalk.dim(`  Search used:  ${updatedSession.searchUsed}`));
  console.log('');

  return updatedSession;
}
