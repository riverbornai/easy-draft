/**
 * index.js
 * ──────────────────────────────────────────────────────────────────────────────
 * AI Content Studio — Entry Point
 *
 * Bootstraps the environment and starts the multi-agent content pipeline.
 *
 * Usage:
 *   node index.js           # Full interactive run
 *   node index.js --test    # Skips multi-turn follow-up (non-interactive CI mode)
 *
 * Environment variables (see .env.example):
 *   OPENAI_API_KEY    – required
 *   ANTHROPIC_API_KEY – optional (Claude draft in Phase 3)
 *   SANDBOX_DIR       – default ./sandbox
 *   OUTPUT_DIR        – default ./outputs
 *   DATA_DIR          – default ./data
 * ──────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import chalk from 'chalk';
import fse from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

import { runPipeline } from './orchestrator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Pre-flight checks ─────────────────────────────────────────────────────────

function checkEnv() {
  const missing = [];

  if (!process.env.OPENAI_API_KEY) {
    missing.push('OPENAI_API_KEY');
  }

  if (missing.length > 0) {
    console.error(chalk.red('\n  ❌  Missing required environment variables:'));
    missing.forEach(v => console.error(chalk.red(`     • ${v}`)));
    console.error(chalk.dim('  Copy .env.example → .env and fill in your keys.\n'));
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(chalk.yellow(
      '  ⚠  ANTHROPIC_API_KEY not set — Claude draft will be skipped in Phase 3.'
    ));
  }
}

async function ensureDirectories() {
  const dirs = [
    process.env.SANDBOX_DIR ?? './sandbox',
    process.env.OUTPUT_DIR  ?? './outputs',
    process.env.DATA_DIR    ?? './data',
  ].map(d => path.resolve(__dirname, d));

  for (const dir of dirs) {
    await fse.ensureDir(dir);
  }
}

// ── Startup banner ────────────────────────────────────────────────────────────

function printStartupBanner() {
  const lines = [
    '',
    chalk.bold.magenta('╔══════════════════════════════════════════════════════════╗'),
    chalk.bold.magenta('║') + chalk.bold.white('         🚀  AI CONTENT STUDIO  v1.0                    ') + chalk.bold.magenta('║'),
    chalk.bold.magenta('║') + chalk.dim('         Multi-Agent Content Production Pipeline        ') + chalk.bold.magenta('║'),
    chalk.bold.magenta('║') + chalk.dim('         Powered by OpenAI Agents SDK                   ') + chalk.bold.magenta('║'),
    chalk.bold.magenta('╚══════════════════════════════════════════════════════════╝'),
    '',
    chalk.dim('  Agents: Intake → Research → Writer → Review → Publisher → Eval'),
    chalk.dim('  Features: Guardrails · Sessions · HITL · Sandboxes · Tracing'),
    '',
  ];
  lines.forEach(l => console.log(l));
}

function printPhaseMap() {
  const phases = [
    { id: 1, name: 'Intake Agent',     status: '✅ Active',  color: chalk.green },
    { id: 2, name: 'Research Agent',   status: '🔲 Phase 2', color: chalk.dim },
    { id: 3, name: 'Writer Agent',     status: '🔲 Phase 3', color: chalk.dim },
    { id: 4, name: 'Review Agent',     status: '🔲 Phase 4', color: chalk.dim },
    { id: 5, name: 'Publisher Agent',  status: '🔲 Phase 5', color: chalk.dim },
    { id: 6, name: 'Eval Runner',      status: '🔲 Phase 6', color: chalk.dim },
  ];

  console.log(chalk.bold('  Build phases:'));
  phases.forEach(p => {
    console.log(`    ${p.color(`Phase ${p.id}: ${p.name.padEnd(20)} ${p.status}`)}`);
  });
  console.log('');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  printStartupBanner();
  printPhaseMap();

  // Environment validation
  checkEnv();

  // Ensure required directories exist
  await ensureDirectories();

  // Parse CLI args
  const args = process.argv.slice(2);
  const testMode = args.includes('--test');

  if (testMode) {
    console.log(chalk.yellow('  ℹ  Test mode enabled — skipping multi-turn follow-up.\n'));
  }

  // Start the pipeline
  const session = await runPipeline({ skipMultiTurn: testMode });

  // Success — print a summary
  console.log(chalk.bold.green('\n  ✅  Run complete!'));
  console.log(chalk.dim(`  Session ID:      ${session.sessionId}`));
  console.log(chalk.dim(`  Topic:           ${session.brief?.topic ?? 'N/A'}`));
  console.log(chalk.dim(`  Channel:         ${session.brief?.channel ?? 'N/A'}`));
  console.log(chalk.dim(`  Pipeline status: ${session.pipelineStatus}`));

  if (session.errors?.length > 0) {
    console.log(chalk.yellow(`\n  ⚠  ${session.errors.length} non-fatal error(s) recorded — check session.errors`));
  }

  console.log('');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n' + chalk.bold.red('  Fatal error:'), err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  process.exit(1);
});
