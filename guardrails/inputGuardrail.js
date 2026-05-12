/**
 * guardrails/inputGuardrail.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Input guardrail for the Intake Agent.
 *
 * Uses gpt-4o-mini (cheap + fast) to evaluate the user's brief BEFORE any
 * expensive model runs.  If the brief is harmful, irrelevant, or spam, the
 * pipeline is blocked early.
 *
 * The guardrail is implemented as an OpenAI Agents SDK input guardrail:
 *   • Returns { tripwireTriggered: true, outputInfo: { reason } }  → BLOCK
 *   • Returns { tripwireTriggered: false }                         → PASS
 *
 * Checks performed:
 *   1. Harmful / violent / illegal content
 *   2. Sexually explicit content
 *   3. Off-topic (not related to content creation / marketing / writing)
 *   4. Spam / gibberish (unintelligible input)
 * ──────────────────────────────────────────────────────────────────────────────
 */

import OpenAI from 'openai';

const SYSTEM_PROMPT = `
You are a content safety classifier for a professional AI content creation platform.

Your job is to evaluate a user-submitted content brief and decide whether it is:
  - SAFE   → legitimate content creation request (marketing, thought leadership, 
              tutorials, news, analysis, etc.)
  - UNSAFE → harmful, illegal, sexually explicit, deeply offensive, or complete gibberish

Rules:
  • Be permissive for edgy-but-legitimate topics (politics, satire, criticism, 
    controversial opinions). These are SAFE.
  • Only block clear violations: instructions for violence/illegal acts, CSAM, 
    hate speech targeting protected groups, or total gibberish.
  • Respond ONLY with valid JSON, no markdown, no extra text.

Response format:
{
  "safe": true | false,
  "reason": "one-sentence explanation"
}
`.trim();

/**
 * runInputGuardrail – evaluates a content brief and returns a guardrail result.
 *
 * @param {object} brief  – { topic, tone, audience, channel, angle }
 * @returns {Promise<{ tripwireTriggered: boolean, outputInfo?: { reason: string } }>}
 */
export async function runInputGuardrail(brief) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const briefText = [
    `Topic:    ${brief.topic}`,
    `Tone:     ${brief.tone}`,
    `Audience: ${brief.audience}`,
    `Channel:  ${brief.channel}`,
    brief.angle ? `Angle:    ${brief.angle}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  let classification;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 150,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Please evaluate this content brief:\n\n${briefText}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    classification = JSON.parse(response.choices[0].message.content);
  } catch (err) {
    // Fail-open: if the guardrail itself errors, log and allow the pipeline
    console.error('[InputGuardrail] Classification error:', err.message);
    return { tripwireTriggered: false };
  }

  if (!classification.safe) {
    return {
      tripwireTriggered: true,
      outputInfo: {
        reason: classification.reason ?? 'Content brief failed safety check.',
      },
    };
  }

  return { tripwireTriggered: false };
}
