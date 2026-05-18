/**
 * agents/writerAgent.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Writer Agent — Phase 3
 *
 * Responsibilities:
 *   1. Read the fact_sheet from the session.
 *   2. Generate a content draft using gpt-4o.
 *   3. Generate a second content draft using a different model style (simulated Claude).
 *   4. Handle feedback from the Review Agent if this is a retry cycle.
 *   5. Update the session with both drafts.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import OpenAI from 'openai';
import chalk from 'chalk';
import ora from 'ora';
import { withTrace } from '@openai/agents';
import { updateSession, appendHistory } from '../session.js';

/**
 * generateDraft - Calls OpenAI to generate content based on the brief and facts.
 */
async function generateDraft(brief, factSheet, model, feedback = null) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const systemPrompt = `
You are an expert content writer specialized in ${brief.channel} content.
Your goal is to write high-performing content that resonates with ${brief.audience}.

CONTEXT:
${JSON.stringify(factSheet, null, 2)}

GUIDELINES:
- Tone: ${brief.tone}
- Format: ${brief.channel} (Must be extremely professional format)
- Angle: ${brief.angle || 'Standard professional'}
- Use the key points and supporting facts from the research.
- Ensure the content is engaging and has a strong hook.
- CRITICAL RESTRICTIONS:
  1. DO NOT use any hashtags anywhere in the text.
  2. DO NOT use any numbers anywhere in the text (spell them out or rephrase).
  3. DO NOT use any emojis, icons, or special visual symbols. Keep it clean and text-only.
  4. The format must be strictly professional and business-appropriate.

${feedback ? `CRITICAL FEEDBACK FROM PREVIOUS DRAFT (FIX THESE): ${feedback}` : ''}
`;

  const userPrompt = `Write the content draft now. Return only the content, no conversational filler. Remember: NO hashtags, NO numbers, NO emojis/icons, and keep the format strictly professional.`;

  const response = await openai.chat.completions.create({
    model: model === 'gpt4o' ? 'gpt-4o' : 'gpt-4o-mini', // Simulating dual models
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  });

  return response.choices[0].message.content;
}

export async function runWriterAgent(session, feedback = null) {
  const { sessionId, brief, factSheet } = session;

  console.log('\n' + chalk.bold.bgMagenta(' WRITER AGENT ') + chalk.bold.white(' Phase 3 — Drafting Content'));
  console.log(chalk.dim('─'.repeat(60)));

  if (!factSheet) {
    throw new Error('[WriterAgent] No fact sheet found in session. Research must run first.');
  }

  await updateSession(sessionId, { pipelineStatus: 'writing', currentStep: 2 });

  let gpt4oDraft;
  let claudeDraft;

  await withTrace('WriterAgent', async () => {
    const spinner = ora({
      text: chalk.dim('  Generating dual drafts...'),
      spinner: 'dots',
      color: 'magenta',
    }).start();

    try {
      // Parallel generation
      [gpt4oDraft, claudeDraft] = await Promise.all([
        generateDraft(brief, factSheet, 'gpt4o', feedback),
        generateDraft(brief, factSheet, 'claude', feedback) // Using mini as a proxy for speed/variety
      ]);

      spinner.succeed(chalk.green('  Drafts generated successfully'));
    } catch (err) {
      spinner.fail('Draft generation failed');
      throw err;
    }
  });

  const updatedSession = await updateSession(sessionId, {
    gpt4oDraft,
    claudeDraft,
    pipelineStatus: 'review-ready'
  });

  console.log(chalk.green('✅  Drafting complete. Moving to Review.'));
  return updatedSession;
}
