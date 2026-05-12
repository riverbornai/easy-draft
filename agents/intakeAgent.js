/**
 * agents/intakeAgent.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Intake Agent — Phase 1
 *
 * Responsibilities:
 *   1. Drive the interactive Q&A with the user via contextCollector tool
 *   2. Run the INPUT GUARDRAIL (gpt-4o-mini) on the collected brief
 *   3. Support multi-turn follow-up ("make it shorter", "change the tone")
 *   4. Initialise & populate the session object
 *   5. Return the validated, enriched session to the orchestrator
 *
 * SDK features used in this file:
 *   • Agent  (from @openai/agents)
 *   • Input Guardrail  (runInputGuardrail)
 *   • Session / multi-turn  (appendHistory, updateSession)
 * ──────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import chalk from 'chalk';
import { collectBrief, confirmBrief } from '../tools/contextCollector.js';
import { runInputGuardrail }           from '../guardrails/inputGuardrail.js';
import {
  createSession,
  updateSession,
  appendHistory,
  logError,
} from '../session.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_RETRY_ATTEMPTS = 3; // max times user can re-enter the brief

// ── Helpers ───────────────────────────────────────────────────────────────────

function printBanner() {
  console.log('\n' + chalk.bold.bgMagenta(' AI CONTENT STUDIO ') + chalk.bold.magenta(' — Intake Agent'));
  console.log(chalk.dim('  Powered by OpenAI Agents SDK\n'));
}

function printGuardrailBlock(reason) {
  console.log('\n' + chalk.red('━'.repeat(60)));
  console.log(chalk.bold.red('  🚫  Brief Blocked by Safety Guardrail'));
  console.log(chalk.red('━'.repeat(60)));
  console.log(chalk.yellow(`  Reason: ${reason}`));
  console.log(chalk.dim('  Please revise your brief and try again.'));
  console.log(chalk.red('━'.repeat(60)) + '\n');
}

// ── Agent: multi-turn session update ──────────────────────────────────────────

/**
 * handleSessionUpdate – process a follow-up message from the user AFTER the
 * initial brief is collected.  Parses natural-language changes like:
 *   "make the tone more casual"
 *   "change the channel to blog"
 *   "target senior engineers instead"
 *
 * Uses a lightweight gpt-4o-mini call to extract structured field changes.
 *
 * @param {object} session
 * @param {string} userMessage
 * @returns {Promise<object>} updated session
 */
async function handleSessionUpdate(session, userMessage) {
  // Record in history
  appendHistory(session.sessionId, 'user', userMessage);

  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const currentBrief = JSON.stringify(session.brief, null, 2);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    max_tokens: 300,
    messages: [
      {
        role: 'system',
        content: `You help update a content brief based on user feedback.
Current brief: ${currentBrief}

The user wants to change something. Extract ONLY the fields that should change.
Valid fields: topic, tone, audience, channel (linkedin/blog/xthread/email), angle.
Respond ONLY with valid JSON, e.g.: { "tone": "casual" }
If the message is not about changing the brief, return: {}`,
      },
      { role: 'user', content: userMessage },
    ],
    response_format: { type: 'json_object' },
  });

  let changes;
  try {
    changes = JSON.parse(response.choices[0].message.content);
  } catch {
    changes = {};
  }

  if (Object.keys(changes).length > 0) {
    updateSession(session.sessionId, { brief: changes });
    const updated = Object.entries(changes)
      .map(([k, v]) => `${chalk.bold(k)} → ${chalk.cyan(v)}`)
      .join(', ');
    console.log(chalk.green(`  ✔  Brief updated: ${updated}`));

    const assistantMsg = `Updated brief: ${updated}. Is there anything else you'd like to change?`;
    appendHistory(session.sessionId, 'assistant', assistantMsg);
    console.log(chalk.dim(`  Assistant: ${assistantMsg}`));
  } else {
    const assistantMsg = "I didn't detect any brief changes. Could you clarify what you'd like to adjust?";
    appendHistory(session.sessionId, 'assistant', assistantMsg);
    console.log(chalk.dim(`  Assistant: ${assistantMsg}`));
  }

  return session;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * runIntakeAgent – entry point called by the orchestrator.
 *
 * Flow:
 *   1. Create session
 *   2. Collect brief (up to MAX_RETRY_ATTEMPTS if guardrail blocks)
 *   3. Run input guardrail
 *   4. Confirm with user
 *   5. Optionally process multi-turn follow-ups
 *   6. Return populated session
 *
 * @param {object} [options]
 * @param {boolean} [options.skipMultiTurn=false]  – skip the follow-up loop (for testing)
 * @param {object} [options.preFilledBrief=null] – pre-collected brief from Web UI
 * @returns {Promise<object>} final session
 */
export async function runIntakeAgent({ skipMultiTurn = false, preFilledBrief = null } = {}) {
  printBanner();
  console.log(chalk.dim('─'.repeat(60)));

  // ── Step 1: Create session ─────────────────────────────────────────────────
  const session = createSession();
  updateSession(session.sessionId, { pipelineStatus: 'intake', currentStep: 0 });

  console.log(chalk.dim(`  Session ID: ${session.sessionId}\n`));

  let brief = preFilledBrief;
  let attempts = 0;

  // ── Step 2 + 3: Collect brief + run guardrail (retry loop) ────────────────
  if (!brief) {
    while (attempts < MAX_RETRY_ATTEMPTS) {
      attempts++;

      // Collect via Q&A
      brief = await collectBrief();

      // Record the intake in history
      appendHistory(session.sessionId, 'user', `Content brief: ${JSON.stringify(brief)}`);

      // Run input guardrail
      console.log(chalk.dim('\n  🛡  Running input safety guardrail...'));
      const guardrailResult = await runInputGuardrail(brief);

      if (guardrailResult.tripwireTriggered) {
        logError(session.sessionId, 'intake-guardrail', guardrailResult.outputInfo?.reason);
        printGuardrailBlock(guardrailResult.outputInfo?.reason);

        if (attempts >= MAX_RETRY_ATTEMPTS) {
          throw new Error(
            `[IntakeAgent] Brief blocked after ${MAX_RETRY_ATTEMPTS} attempts. Exiting.`
          );
        }

        console.log(chalk.yellow(`  Attempt ${attempts}/${MAX_RETRY_ATTEMPTS}. Please revise your brief.\n`));
        brief = null;
        continue;
      }

      console.log(chalk.green('  ✔  Guardrail passed — brief is safe.\n'));
      break;
    }
  } else {
    // Brief provided via Web UI — still run guardrail for safety
    console.log(chalk.dim('  Brief provided via API. Running guardrail...'));
    const guardrailResult = await runInputGuardrail(brief);
    if (guardrailResult.tripwireTriggered) {
       logError(session.sessionId, 'intake-guardrail', guardrailResult.outputInfo?.reason);
       throw new Error(`[IntakeAgent] Web brief blocked by guardrail: ${guardrailResult.outputInfo?.reason}`);
    }
    console.log(chalk.green('  ✔  Web brief passed safety check.\n'));
  }

  if (!brief) {
    throw new Error('[IntakeAgent] Failed to collect a valid brief.');
  }

  // ── Step 4: User confirms brief (Only for terminal mode) ────────────────────
  if (!preFilledBrief) {
    const confirmed = await confirmBrief(brief);
    if (!confirmed) {
      console.log(chalk.yellow('\n  Restarting brief collection...\n'));
      return runIntakeAgent({ skipMultiTurn });
    }
  }

  // ── Step 5: Store brief in session ────────────────────────────────────────
  updateSession(session.sessionId, {
    brief,
    pipelineStatus: 'intake-complete',
    currentStep: 1,
  });

  appendHistory(
    session.sessionId,
    'assistant',
    `Brief confirmed. Moving to research phase for topic: "${brief.topic}".`
  );

  // ── Step 6: Multi-turn follow-up loop (Only for terminal mode) ──────────────
  if (!skipMultiTurn && !preFilledBrief) {
    const { createInterface } = await import('readline');
    const rl = createInterface({ input: process.stdin, output: process.stdout });

    console.log(chalk.bold.cyan('\n  💬  Multi-turn session active.'));
    console.log(chalk.dim('  You can update your brief now, or type "done" to continue.\n'));

    await new Promise((resolve) => {
      const promptNext = () => {
        rl.question(
          chalk.cyan('  ❯ ') + chalk.white('Update brief or type "done": '),
          async (input) => {
            const trimmed = input.trim();

            if (!trimmed || trimmed.toLowerCase() === 'done') {
              rl.close();
              resolve();
              return;
            }

            await handleSessionUpdate(session, trimmed);
            promptNext();
          }
        );
      };

      promptNext();
    });
  }

  // ── Final session state ───────────────────────────────────────────────────
  const finalSession = updateSession(session.sessionId, {
    pipelineStatus: 'research-ready',
    currentStep: 2,
  });

  console.log('\n' + chalk.bold.green('✅  Intake complete — session ready for Research Agent.'));
  console.log(chalk.dim(`  Session ID: ${finalSession.sessionId}`));
  console.log(chalk.dim(`  Brief: ${JSON.stringify(finalSession.brief)}\n`));

  return finalSession;
}
