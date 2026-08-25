/**
 * guardrails/outputGuardrail.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Output guardrail — Phase 4
 *
 * Uses gpt-4o-mini to scan a content draft for:
 *   1. Hallucinated statistics — specific numbers/percentages NOT found in the
 *      verified fact_sheet (e.g. "84% of CTOs agree..." when no such stat exists)
 *   2. Fabricated quotes — direct quotes attributed to real named people that
 *      aren't in the verified sources
 *   3. Hard factual contradictions — claims that directly contradict
 *      verified facts in the fact_sheet
 *
 * Severity levels:
 *   high   → tripwire TRIGGERED (blocks draft, must revise)
 *   medium → tripwire NOT triggered (logged as warning, human reviews)
 *   low    → tripwire NOT triggered (minor note, passes)
 *   none   → clean
 *
 * Returns:
 *   { tripwireTriggered: boolean, outputInfo: { issues, severity, reason } }
 * ──────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import { getOpenAI } from '../utils/openai.js';
import chalk  from 'chalk';

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
You are a senior fact-checker for a professional content publication pipeline.

Your job: determine if a content draft contains hallucinated statistics or fabricated quotes.

CHECK FOR (only flag these):
1. HALLUCINATED STATS: Specific numbers, percentages, or figures in the draft that:
   - Are NOT present in the verified facts provided
   - Cannot be reasonably inferred from the verified facts
   - Are suspiciously precise (e.g. "73.4% of CMOs said...")
2. FABRICATED QUOTES: Direct quoted speech ("...") attributed to a specific named
   real person that does NOT appear in the verified sources
3. HARD CONTRADICTIONS: Claims that directly CONTRADICT a specific verified fact

BE LENIENT WITH (do NOT flag these):
   - The author's own analysis, opinions, and interpretations
   - General statements without specific figures (e.g. "many companies are adopting AI")
   - Round approximations that are directionally consistent with verified facts
   - Common knowledge (e.g. "the internet exists", "COVID happened in 2020")
   - Paraphrasing or summarising verified facts slightly differently
   - Future predictions and forward-looking statements

SEVERITY:
   "high"   → clear hallucinated stat or fabricated quote found → BLOCK the draft
   "medium" → questionable claim, but not clearly fabricated → WARN only
   "low"    → very minor, arguably acceptable → PASS
   "none"   → draft is factually clean

Respond ONLY with valid JSON — no markdown, no prose:
{
  "safe": true | false,
  "severity": "none" | "low" | "medium" | "high",
  "issues": ["issue description 1", "issue description 2"],
  "summary": "one sentence overall assessment"
}
`.trim();

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * runOutputGuardrail – evaluates a draft against the verified fact sheet.
 *
 * @param {string} draft       – the content draft to check
 * @param {object} [factSheet] – session.factSheet from ResearchAgent (may be null)
 * @returns {Promise<{
 *   tripwireTriggered: boolean,
 *   outputInfo: { issues: string[], severity: string, reason: string, summary: string }
 * }>}
 */
export async function runOutputGuardrail(draft, factSheet = null, sessionId = null) {
  if (!draft || draft.trim().length === 0) {
    return { tripwireTriggered: false, outputInfo: { issues: [], severity: 'none', reason: '', summary: 'Empty draft.' } };
  }

  const openai = getOpenAI(sessionId);

  // Build a compact, readable facts context for the model
  const factsContext = factSheet
    ? [
        factSheet.topicOverview ? `Overview: ${factSheet.topicOverview}` : null,
        factSheet.keyPoints?.length
          ? `Key Points:\n${factSheet.keyPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}`
          : null,
        factSheet.supportingFacts?.length
          ? `Verified Facts:\n${factSheet.supportingFacts.map(f => `  • ${f}`).join('\n')}`
          : null,
        factSheet.sourcesUsed?.length
          ? `Sources: ${factSheet.sourcesUsed.map(s => s.title).join(', ')}`
          : null,
      ]
        .filter(Boolean)
        .join('\n\n')
    : 'No fact sheet available — check for obvious statistical fabrications only.';

  let result;

  try {
    const response = await openai.chat.completions.create({
      model:           'gpt-4o-mini',
      temperature:     0,
      max_tokens:      400,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role:    'user',
          content: `VERIFIED FACTS:\n${factsContext}\n\n${'─'.repeat(40)}\n\nDRAFT TO CHECK:\n${draft.slice(0, 3000)}`,
        },
      ],
    });

    result = JSON.parse(response.choices[0].message.content);
  } catch (err) {
    // Fail-open: guardrail errors should not block the pipeline
    console.error(chalk.red('  [OutputGuardrail] Error:'), err.message);
    return {
      tripwireTriggered: false,
      outputInfo: { issues: [], severity: 'none', reason: 'Guardrail check failed — passing through.', summary: '' },
    };
  }

  const { safe, severity = 'none', issues = [], summary = '' } = result;

  // Only HIGH severity actually triggers the tripwire
  const tripwireTriggered = !safe && severity === 'high';

  // Console output
  if (tripwireTriggered) {
    console.log('\n' + chalk.red('  🚨  Output Guardrail TRIGGERED'));
    console.log(chalk.red('  ─'.repeat(30)));
    issues.forEach(issue => console.log(chalk.red(`  ✗  ${issue}`)));
  } else if (severity === 'medium') {
    console.log(chalk.yellow(`\n  ⚠  Output Guardrail WARNING (${severity}) — ${summary}`));
    issues.forEach(issue => console.log(chalk.yellow(`     • ${issue}`)));
  } else {
    console.log(chalk.green(`\n  ✅  Output Guardrail passed (${severity}) — ${summary}`));
  }

  return {
    tripwireTriggered,
    outputInfo: {
      issues,
      severity,
      reason: issues.length > 0 ? issues.join('; ') : 'No issues found.',
      summary,
    },
  };
}
