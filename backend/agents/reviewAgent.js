/**
 * agents/reviewAgent.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Review Agent — Phase 4
 *
 * Responsibilities:
 *   1. Select the "active" draft from session (prefers gpt4oDraft by default)
 *   2. Run OUTPUT GUARDRAIL — detect hallucinated stats / fake quotes
 *      • HIGH severity → block draft, increment attempt, hand back to Writer
 *      • MEDIUM/LOW   → log warning, proceed to HITL
 *   3. HUMAN-IN-THE-LOOP (HITL) — two modes:
 *      a. TERMINAL mode (default): show draft in terminal, await approve/reject/edit
 *      b. WEB mode (HITL_MODE=web): set session reviewStatus='pending', return
 *         immediately — web UI's /api/drafts/approve|reject handles the decision
 *   4. If approved → set session.approvedDraft, hand off to Publisher
 *   5. If rejected → append feedback to session.reviewNotes, increment attempt
 *      • Max 3 attempts → escalate
 *   6. Update session.pipelineStatus throughout
 *
 * SDK features used:
 *   • withTrace()           — named trace span for full run observability
 *   • handoff               — passing control back to Writer Agent on reject
 *   • runOutputGuardrail()  — output safety check
 *
 * Session fields written:
 *   session.approvedDraft   — human-approved final draft
 *   session.reviewNotes     — feedback per rejection cycle
 *   session.reviewAttempts  — iteration counter (max 3)
 *   session.reviewStatus    — 'pending' | 'approved' | 'rejected' | 'escalated'
 *   session.pipelineStatus  → 'review' → 'publish-ready' | 'escalated'
 * ──────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import readline from 'readline';
import chalk    from 'chalk';
import ora      from 'ora';

import { withTrace } from '@openai/agents';

import { runOutputGuardrail } from '../guardrails/outputGuardrail.js';
import {
  updateSession,
  appendHistory,
  logError,
  getSession,
} from '../session.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_REVIEW_ATTEMPTS = 3;
const HITL_MODE = process.env.HITL_MODE ?? 'terminal'; // 'terminal' | 'web'
const WEB_POLL_INTERVAL  = 3000;  // ms to poll for web HITL decision
const WEB_POLL_TIMEOUT   = 5 * 60 * 1000; // 5 min max wait

// ── HITL helpers ──────────────────────────────────────────────────────────────

/**
 * printDraftForReview – displays the draft in terminal with clear framing.
 */
function printDraftForReview(draft, attempt, model) {
  const modelLabel = model === 'gpt4o' ? 'GPT-4o' : 'Claude';
  console.log('\n' + chalk.bold.bgWhite.black(` DRAFT FOR REVIEW (${modelLabel}, attempt ${attempt}/${MAX_REVIEW_ATTEMPTS}) `));
  console.log(chalk.dim('─'.repeat(70)));
  console.log('\n' + chalk.white(draft) + '\n');
  console.log(chalk.dim('─'.repeat(70)));
}

/**
 * terminalHITL – interactive terminal approval loop.
 * Returns: { decision: 'approved' | 'rejected' | 'edited', feedback?, editedDraft? }
 */
async function terminalHITL(draft) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  return new Promise((resolve) => {
    console.log(chalk.bold.cyan('\n  👤  Human-in-the-Loop Review'));
    console.log(chalk.dim('  Options: [a] Approve   [r] Reject + feedback   [e] Edit inline\n'));

    const askChoice = () => {
      rl.question(chalk.cyan('  ❯ ') + chalk.white('Your decision [a/r/e]: '), async (raw) => {
        const choice = raw.trim().toLowerCase();

        // ── Approve ────────────────────────────────────────────────────────────
        if (choice === 'a') {
          rl.close();
          resolve({ decision: 'approved' });

        // ── Reject with feedback ───────────────────────────────────────────────
        } else if (choice === 'r') {
          rl.question(
            chalk.cyan('  ❯ ') + chalk.white('Feedback for the Writer Agent: '),
            (feedback) => {
              rl.close();
              resolve({ decision: 'rejected', feedback: feedback.trim() || 'No specific feedback provided.' });
            }
          );

        // ── Edit inline ────────────────────────────────────────────────────────
        } else if (choice === 'e') {
          console.log(chalk.dim('\n  Opening draft for editing. Paste your revised version, then type'));
          console.log(chalk.dim('  END on a new line and press Enter.\n'));

          let lines = [];
          const collectLines = (line) => {
            if (line.trim() === 'END') {
              rl.removeListener('line', collectLines);
              rl.close();
              const editedDraft = lines.join('\n').trim();
              resolve({ decision: 'edited', editedDraft: editedDraft || draft });
            } else {
              lines.push(line);
            }
          };
          rl.on('line', collectLines);

        } else {
          console.log(chalk.yellow('  Please enter a, r, or e.'));
          askChoice();
        }
      });
    };

    askChoice();
  });
}

/**
 * webHITL – waits for the web UI to call /api/drafts/approve or /api/drafts/reject.
 * Polls the session object until reviewStatus changes from 'pending'.
 *
 * @param {string} sessionId
 * @returns {Promise<{ decision: 'approved'|'rejected', feedback?: string }>}
 */
async function webHITL(sessionId) {
  console.log(chalk.bold.yellow('\n  🌐  Web HITL — waiting for approval via dashboard...'));
  console.log(chalk.dim('  Open http://localhost:3000/drafts and approve or reject the draft.\n'));

  const start = Date.now();

  return new Promise((resolve, reject) => {
    const poll = setInterval(async () => {
      const session = await getSession(sessionId);
      if (!session) {
        clearInterval(poll);
        reject(new Error('Session not found during web HITL wait.'));
        return;
      }

      if (session.reviewStatus === 'approved') {
        clearInterval(poll);
        resolve({ decision: 'approved' });
      } else if (session.reviewStatus === 'rejected') {
        clearInterval(poll);
        const feedback = session.reviewNotes?.at(-1) ?? 'Rejected via web UI.';
        resolve({ decision: 'rejected', feedback });
      } else if (Date.now() - start > WEB_POLL_TIMEOUT) {
        clearInterval(poll);
        // Escalate after timeout
        resolve({ decision: 'rejected', feedback: 'Web HITL timed out — auto-escalated.' });
      }
    }, WEB_POLL_INTERVAL);
  });
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * runReviewAgent – entry point called by the orchestrator.
 *
 * @param {object} session  – session from WriterAgent (has gpt4oDraft and/or claudeDraft)
 * @returns {Promise<object>} updated session
 */
export async function runReviewAgent(session) {
  const { sessionId } = session;

  // Refresh session state in case web UI changed it
  const current = (await getSession(sessionId)) ?? session;

  console.log('\n' + chalk.bold.bgYellow.black(' REVIEW AGENT ') + chalk.bold.white(' Phase 4 — Guardrail + HITL'));
  console.log(chalk.dim('─'.repeat(60)));

  await updateSession(sessionId, { pipelineStatus: 'review', currentStep: 3 });

  // ── Pick the draft to review ───────────────────────────────────────────────
  // Default: GPT-4o draft. Fall back to Claude if GPT-4o not available.
  const activeModel = current.activeModel ?? 'gpt4o';
  const draft = activeModel === 'claude'
    ? (current.claudeDraft ?? current.gpt4oDraft)
    : (current.gpt4oDraft ?? current.claudeDraft);

  if (!draft) {
    await logError(sessionId, 'review-no-draft', 'No draft found in session');
    console.log(chalk.red('  ❌  No draft found in session — skipping review.'));
    return await updateSession(sessionId, { reviewStatus: 'escalated', pipelineStatus: 'escalated' });
  }

  const attempt = (current.reviewAttempts ?? 0) + 1;
  console.log(chalk.dim(`  Draft model: ${activeModel === 'claude' ? 'Claude' : 'GPT-4o'}`));
  console.log(chalk.dim(`  Review attempt: ${attempt}/${MAX_REVIEW_ATTEMPTS}\n`));

  // Guard: too many attempts → escalate
  if (attempt > MAX_REVIEW_ATTEMPTS) {
    console.log(chalk.red(`\n  ⚠  Maximum review attempts (${MAX_REVIEW_ATTEMPTS}) reached — escalating.`));
    return await updateSession(sessionId, {
      reviewAttempts: attempt,
      reviewStatus:   'escalated',
      pipelineStatus: 'escalated',
    });
  }

  await updateSession(sessionId, { reviewAttempts: attempt });

  let approvedDraft = null;
  let reviewResult  = null;

  await withTrace('ReviewAgent', async () => {

    // ── Step 1: Output guardrail ───────────────────────────────────────────────
    const guardrailSpinner = ora({
      text:    chalk.dim('  Running output guardrail (hallucination check)...'),
      spinner: 'dots',
      color:   'yellow',
    }).start();

    const guardrailResult = await runOutputGuardrail(draft, current.factSheet ?? null, sessionId);
    guardrailSpinner.stop();

    if (guardrailResult.tripwireTriggered) {
      // ── Guardrail BLOCKED → automatic rejection, hand back to Writer ──────
      const issues = guardrailResult.outputInfo?.issues ?? [];
      const reason = `Output guardrail blocked draft: ${guardrailResult.outputInfo?.reason}`;

      console.log(chalk.red('\n  Draft blocked by output guardrail. Sending back to Writer Agent.'));

      await appendHistory(sessionId, 'assistant',
        `ReviewAgent: Draft blocked (attempt ${attempt}). Issues: ${issues.join('; ')}`
      );

      reviewResult = await updateSession(sessionId, {
        reviewStatus:   'rejected',
        reviewNotes:    [...(current.reviewNotes ?? []), reason],
        pipelineStatus: 'writing',  // signal orchestrator to re-run Writer
      });
      return;
    }

    // Log any warnings (medium severity)
    if (guardrailResult.outputInfo?.severity === 'medium') {
      await updateSession(sessionId, {
        reviewNotes: [
          ...(current.reviewNotes ?? []),
          `Warning: ${guardrailResult.outputInfo.reason}`,
        ],
      });
    }

    // ── Step 2: HITL ─────────────────────────────────────────────────────────
    // Set status to pending so web UI can show the HITL banner
    await updateSession(sessionId, { reviewStatus: 'pending' });

    let hitlResult;

    if (HITL_MODE === 'web') {
      // Web UI handles approval
      hitlResult = await webHITL(sessionId);
    } else {
      // Terminal HITL
      printDraftForReview(draft, attempt, activeModel);
      hitlResult = await terminalHITL(draft);
    }

    // ── Step 3: Process HITL decision ─────────────────────────────────────────
    if (hitlResult.decision === 'approved') {
      // Re-read session to see which model the user actually picked in the web UI
      const updatedSession = (await getSession(sessionId)) || session;
      const modelPicked = updatedSession.activeModel || activeModel;
      
      // If the web UI already set approvedDraft, use it. Otherwise calculate it.
      approvedDraft = updatedSession.approvedDraft || (modelPicked === 'claude' 
        ? (updatedSession.claudeDraft || updatedSession.gpt4oDraft)
        : (updatedSession.gpt4oDraft || updatedSession.claudeDraft));

      await appendHistory(sessionId, 'assistant', `ReviewAgent: Draft approved by human (attempt ${attempt}, model: ${modelPicked}).`);

      reviewResult = await updateSession(sessionId, {
        approvedDraft,
        activeModel:    modelPicked,
        reviewStatus:   'approved',
        pipelineStatus: 'publish-ready',
      });

      console.log(chalk.bold.green('\n  ✅  Draft approved — moving to Publisher Agent.'));

    } else if (hitlResult.decision === 'edited') {
      approvedDraft = hitlResult.editedDraft;
      await appendHistory(sessionId, 'assistant', `ReviewAgent: Draft edited and approved by human (attempt ${attempt}).`);

      reviewResult = await updateSession(sessionId, {
        approvedDraft,
        reviewStatus:   'approved',
        pipelineStatus: 'publish-ready',
        // Store the edited version back
        ...(activeModel === 'claude'
          ? { claudeDraft: approvedDraft }
          : { gpt4oDraft:  approvedDraft }
        ),
      });

      console.log(chalk.bold.green('\n  ✅  Edited draft approved — moving to Publisher Agent.'));

    } else {
      // Rejected
      const feedback = hitlResult.feedback ?? 'No specific feedback provided.';
      await appendHistory(sessionId, 'user', `Human rejected draft (attempt ${attempt}): ${feedback}`);
      await appendHistory(sessionId, 'assistant', `ReviewAgent: Sending draft back to Writer with feedback.`);

      console.log(chalk.yellow(`\n  ↩  Draft rejected — feedback sent to Writer Agent.`));
      console.log(chalk.dim(`     Feedback: "${feedback}"`));

      reviewResult = await updateSession(sessionId, {
        reviewStatus:   'rejected',
        reviewNotes:    [...(current.reviewNotes ?? []), feedback],
        pipelineStatus: 'writing',  // orchestrator will re-run Writer
      });
    }

  }); // end withTrace

  // ── Summary ───────────────────────────────────────────────────────────────
  const finalSession = (await getSession(sessionId)) ?? reviewResult;
  console.log('\n' + chalk.dim('─'.repeat(60)));
  console.log(chalk.dim(`  Review status:   ${finalSession?.reviewStatus}`));
  console.log(chalk.dim(`  Attempts used:   ${finalSession?.reviewAttempts}/${MAX_REVIEW_ATTEMPTS}`));
  if (finalSession?.reviewNotes?.length > 0) {
    console.log(chalk.dim(`  Feedback notes:  ${finalSession.reviewNotes.length}`));
  }
  console.log('');

  return finalSession ?? session;
}
