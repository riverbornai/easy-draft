/**
 * tools/webSearch.js
 * ──────────────────────────────────────────────────────────────────────────────
 * OpenAI Agents SDK web search wrapper — only called when searchDecision()
 * returns needsSearch: true.
 *
 * Implementation:
 *   Creates a lightweight, single-purpose Agent equipped with webSearchTool()
 *   from the @openai/agents SDK, runs a search query through it, then parses
 *   the agent's response into a structured result object.
 *
 * Returns:
 *   {
 *     sources:  Array<{ title, url, snippet }>
 *     keyFacts: string[]          ← bullet-point facts extracted from results
 *     summary:  string            ← 2–3 sentence synthesis of findings
 *     rawText:  string            ← full agent response (kept for tracing)
 *   }
 * ──────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import chalk from 'chalk';
import ora from 'ora';

import {
  Agent,
  run,
  webSearchTool,
  extractAllTextOutput,
} from '@openai/agents';

// ── Search agent definition ───────────────────────────────────────────────────

/**
 * Build a fresh search agent for each call.
 * Using a factory keeps each invocation isolated (no shared state).
 *
 * @param {string} topic – content topic, injected into instructions for context
 * @returns {Agent}
 */
function buildSearchAgent(topic) {
  return new Agent({
    name: 'WebSearchAgent',
    model: 'gpt-4o-mini',
    tools: [webSearchTool()],
    instructions: `
You are a research assistant gathering factual information for a content piece about:
"${topic}"

When given a search query:
1. Search the web for the most relevant, up-to-date results
2. Extract key facts, statistics, and insights
3. Identify the most credible sources
4. Synthesize findings into a clear, structured response

Your response MUST be structured EXACTLY like this (use these exact section headers):

## KEY FACTS
- [fact 1 with source attribution]
- [fact 2 with source attribution]
- [fact 3 with source attribution]
(continue for all important facts found)

## SOURCES
- [Title] | [URL]
(list all sources used)

## SUMMARY
[2-3 sentence synthesis of the key findings, written as a research brief]

Be factual, specific, and cite sources. Avoid opinions.
    `.trim(),
  });
}

// ── Response parser ───────────────────────────────────────────────────────────

/**
 * parseSearchResponse – extracts structured data from the agent's markdown output.
 *
 * @param {string} text  – raw agent response text
 * @returns {{ sources: object[], keyFacts: string[], summary: string, rawText: string }}
 */
function parseSearchResponse(text) {
  const result = {
    sources: [],
    keyFacts: [],
    summary: '',
    rawText: text,
  };

  // ── Extract KEY FACTS section ─────────────────────────────────────────────
  const factsMatch = text.match(/##\s*KEY FACTS\s*\n([\s\S]*?)(?=##|$)/i);
  if (factsMatch) {
    result.keyFacts = factsMatch[1]
      .split('\n')
      .map(l => l.replace(/^[-*•]\s*/, '').trim())
      .filter(l => l.length > 10); // filter out empty/very short lines
  }

  // ── Extract SOURCES section ───────────────────────────────────────────────
  const sourcesMatch = text.match(/##\s*SOURCES\s*\n([\s\S]*?)(?=##|$)/i);
  if (sourcesMatch) {
    result.sources = sourcesMatch[1]
      .split('\n')
      .filter(l => l.trim().startsWith('-'))
      .map(line => {
        const clean = line.replace(/^[-*•]\s*/, '').trim();
        const parts = clean.split('|').map(p => p.trim());
        return {
          title: parts[0] ?? clean,
          url: parts[1] ?? '',
          snippet: '',
        };
      })
      .filter(s => s.title.length > 0);
  }

  // ── Extract SUMMARY section ───────────────────────────────────────────────
  const summaryMatch = text.match(/##\s*SUMMARY\s*\n([\s\S]*?)(?=##|$)/i);
  if (summaryMatch) {
    result.summary = summaryMatch[1].trim();
  }

  // Fallback: if parsing fails, use raw text as summary
  if (!result.summary && !result.keyFacts.length) {
    result.summary = text.slice(0, 500);
  }

  return result;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * webSearch – runs a web search via the OpenAI Agents SDK and returns
 * structured research results.
 *
 * @param {string} query  – the search query (from searchDecision.searchQuery)
 * @param {string} topic  – original topic (used to contextualise the search agent)
 * @returns {Promise<{ sources: object[], keyFacts: string[], summary: string, rawText: string }>}
 */
export async function webSearch(query, topic = '') {
  const spinner = ora({
    text: chalk.dim(`  Searching web: "${query}"`),
    spinner: 'dots',
    color: 'cyan',
  }).start();

  try {
    const agent = buildSearchAgent(topic || query);

    // Run the search agent
    const result = await run(agent, `Search for: ${query}`);

    // Extract the text output from the run result
    const rawText = extractAllTextOutput(result);

    spinner.succeed(chalk.green(`  Web search complete (${result.newItems?.length ?? 0} items processed)`));

    const parsed = parseSearchResponse(rawText);

    // Log a quick preview
    console.log(chalk.dim(`  Sources found:  ${parsed.sources.length}`));
    console.log(chalk.dim(`  Key facts:      ${parsed.keyFacts.length}`));
    if (parsed.keyFacts[0]) {
      console.log(chalk.dim(`  Top fact:       ${parsed.keyFacts[0].slice(0, 80)}...`));
    }

    return parsed;

  } catch (err) {
    spinner.fail(chalk.red('  Web search failed'));
    console.error(chalk.red('  [webSearch] Error:'), err.message);

    // Return empty structure — Research Agent will fall back to own knowledge
    return {
      sources: [],
      keyFacts: [],
      summary: `Web search failed: ${err.message}. Using model knowledge only.`,
      rawText: '',
    };
  }
}
