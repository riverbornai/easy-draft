/**
 * orchestrator.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Pipeline Orchestrator — coordinates all 6 agents in sequence.
 *
 * Each agent receives the shared session object and returns an updated version.
 * The orchestrator handles:
 *   • Agent sequencing (Intake → Research → Writer → Review → Publisher → Eval)
 *   • Review/Writer retry loop (max 3 rejections before escalation)
 *   • Top-level error catching and session error logging
 *   • Pipeline status transitions
 *
 * Phases implemented so far:
 *   ✅ Phase 1 — Intake
 *   ✅ Phase 2 — Research
 *   🔲 Phase 3 — Writer     (stub)
 *   🔲 Phase 4 — Review     (stub)
 *   🔲 Phase 5 — Publisher  (stub)
 *   🔲 Phase 6 — Eval       (stub)
 * ──────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import chalk from 'chalk';

import { runIntakeAgent }     from './agents/intakeAgent.js';
import { runResearchAgent }   from './agents/researchAgent.js';
import { runWriterAgent }     from './agents/writerAgent.js';
import { runReviewAgent }     from './agents/reviewAgent.js';
import { runPublisherAgent }  from './agents/publisherAgent.js';
import { runEvalRunner }      from './agents/evalRunner.js';
import { updateSession, logError, addLog, getSession } from './session.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_REVIEW_CYCLES = 3; // Writer → Review max loop iterations

// ── Helpers ───────────────────────────────────────────────────────────────────

function printPhaseHeader(phase, label) {
  console.log('\n' + chalk.bold.bgBlue(` PHASE ${phase} `) + ' ' + chalk.bold.white(label));
  console.log(chalk.dim('─'.repeat(60)));
}

function printPipelineComplete(session) {
  console.log('\n' + chalk.bold.bgGreen(' PIPELINE COMPLETE '));
  console.log(chalk.dim('─'.repeat(60)));
  if (session.publishedPath) {
    console.log(chalk.green(`  📄 Output saved: ${session.publishedPath}`));
  }
  if (session.evalScores?.overall !== null) {
    console.log(chalk.green(`  📊 Eval score: ${session.evalScores.overall}/10`));
  }
  console.log(chalk.dim(`  Session ID: ${session.sessionId}`));
  console.log(chalk.dim('─'.repeat(60)) + '\n');
}

// ── Orchestrator ──────────────────────────────────────────────────────────────

/**
 * runPipeline – executes the full 6-agent content production pipeline.
 *
 * @param {object} [options]
 * @param {object} [options.preFilledBrief=null] – pre-filled brief from API
 * @returns {Promise<object>}  final session
 */
export async function runPipeline({ skipMultiTurn = false, preFilledBrief = null } = {}) {
  let session;

  try {
    // ── Phase 1: Intake ──────────────────────────────────────────────────────
    printPhaseHeader(1, 'Intake Agent — Collecting Brief');
    session = await runIntakeAgent({ skipMultiTurn, preFilledBrief });
    session = getSession(session.sessionId) || session; // Ensure freshest state
    addLog(session.sessionId, 'IntakeAgent', 'Brief collected and validated.');
    updateSession(session.sessionId, { pipelineStatus: 'research', currentStep: 1 });

    // ── Phase 2: Research ────────────────────────────────────────────────────
    printPhaseHeader(2, 'Research Agent — Building Fact Sheet');
    addLog(session.sessionId, 'ResearchAgent', 'Starting deep research on topic...');
    session = await runResearchAgent(session);
    session = getSession(session.sessionId) || session;
    addLog(session.sessionId, 'ResearchAgent', 'Fact sheet synthesized and saved.');
    updateSession(session.sessionId, { pipelineStatus: 'writing', currentStep: 2 });

    // ── Phase 3 + 4: Writer + Review loop ────────────────────────────────────
    let reviewCycles = 0;
    let reviewStatus = 'pending';

    while (reviewStatus !== 'approved' && reviewCycles < MAX_REVIEW_CYCLES) {
      reviewCycles++;

      printPhaseHeader(3, `Writer Agent — Drafting Content (cycle ${reviewCycles})`);
      addLog(session.sessionId, 'WriterAgent', `Generating content drafts (cycle ${reviewCycles})...`);
      const feedback = session.reviewNotes?.at(-1) ?? null;
      session = await runWriterAgent(session, feedback);
      session = getSession(session.sessionId) || session;
      addLog(session.sessionId, 'WriterAgent', 'Drafts ready for human review.');

      printPhaseHeader(4, `Review Agent — Human-in-the-Loop Approval (cycle ${reviewCycles})`);
      updateSession(session.sessionId, { pipelineStatus: 'review', currentStep: 3 });
      addLog(session.sessionId, 'ReviewAgent', 'Waiting for human approval...');
      session = await runReviewAgent(session);
      session = getSession(session.sessionId) || session;
      addLog(session.sessionId, 'ReviewAgent', `Draft ${session.reviewStatus}.`);

      reviewStatus = session.reviewStatus ?? 'pending';

      if (reviewStatus === 'rejected') {
        console.log(chalk.yellow(`\n  ↩  Draft rejected. Handing back to Writer (${reviewCycles}/${MAX_REVIEW_CYCLES})...\n`));
      }
    }

    if (reviewStatus !== 'approved') {
      console.log(chalk.red('\n  ⚠  Maximum review cycles reached. Escalating to human supervisor.'));
      updateSession(session.sessionId, { reviewStatus: 'escalated', pipelineStatus: 'escalated' });
    }

    // ── Phase 5: Publisher ───────────────────────────────────────────────────
    if (session.pipelineStatus !== 'escalated') {
      printPhaseHeader(5, 'Publisher Agent — Formatting & Saving');
      updateSession(session.sessionId, { pipelineStatus: 'publish', currentStep: 4 });
      addLog(session.sessionId, 'PublisherAgent', 'Formatting and saving final output...');
      session = await runPublisherAgent(session);
      session = getSession(session.sessionId) || session;
      addLog(session.sessionId, 'PublisherAgent', 'Output published successfully.');
      updateSession(session.sessionId, { pipelineStatus: 'eval', currentStep: 5 });
    }

    // ── Phase 6: Eval ────────────────────────────────────────────────────────
    printPhaseHeader(6, 'Eval Runner — Scoring & Tracing');
    addLog(session.sessionId, 'EvalRunner', 'Running automated quality scoring...');
    session = await runEvalRunner(session);
    session = getSession(session.sessionId) || session;
    addLog(session.sessionId, 'EvalRunner', 'Evaluation complete. Pipeline finished.');
    updateSession(session.sessionId, { pipelineStatus: 'done' });

    printPipelineComplete(session);
    return session;

  } catch (err) {
    console.error('\n' + chalk.bold.red('  ❌  Pipeline error:'), err.message);

    if (session?.sessionId) {
      logError(session.sessionId, 'orchestrator', err);
      updateSession(session.sessionId, { pipelineStatus: 'error' });
    }

    throw err;
  }
}
