/**
 * tools/contextCollector.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Interactive terminal Q&A tool used by the Intake Agent.
 *
 * Responsibilities:
 *   • Ask the user a series of structured questions (topic, tone, audience, channel)
 *   • Support a free-form follow-up question for a "unique angle"
 *   • Return a validated brief object ready to be stored in session
 *   • Re-ask on invalid / empty answers
 *
 * This module is intentionally framework-free (plain readline) so it works
 * without any OpenAI SDK dependency — the Intake Agent imports it as a tool.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import readline from 'readline';
import chalk from 'chalk';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Creates a readline interface bound to stdin/stdout.
 * @returns {readline.Interface}
 */
function createRL() {
  return readline.createInterface({
    input:  process.stdin,
    output: process.stdout,
  });
}

/**
 * Prompts the user with a styled question and waits for a non-empty answer.
 * Re-asks if the user submits an empty string.
 *
 * @param {readline.Interface} rl
 * @param {string} question      – the question text
 * @param {string[]} [choices]   – optional list of valid choices
 * @returns {Promise<string>}     trimmed, lowercase answer
 */
async function ask(rl, question, choices = []) {
  return new Promise((resolve) => {
    const choiceHint = choices.length
      ? chalk.dim(` [${choices.join(' / ')}]`)
      : '';

    const prompt = `\n${chalk.cyan('❯')} ${chalk.white(question)}${choiceHint}\n  ${chalk.green('→')} `;

    const attempt = () => {
      rl.question(prompt, (raw) => {
        const answer = raw.trim().toLowerCase();

        if (!answer) {
          console.log(chalk.yellow('  ⚠  Please provide an answer.'));
          return attempt();
        }

        if (choices.length && !choices.map(c => c.toLowerCase()).includes(answer)) {
          console.log(
            chalk.yellow(`  ⚠  Invalid choice. Please pick one of: ${choices.join(', ')}`)
          );
          return attempt();
        }

        resolve(answer);
      });
    };

    attempt();
  });
}

/**
 * Optional free-text question — user may press Enter to skip.
 * @param {readline.Interface} rl
 * @param {string} question
 * @returns {Promise<string|null>}
 */
async function askOptional(rl, question) {
  return new Promise((resolve) => {
    const prompt = `\n${chalk.cyan('❯')} ${chalk.white(question)} ${chalk.dim('(press Enter to skip)')}\n  ${chalk.green('→')} `;
    rl.question(prompt, (raw) => {
      resolve(raw.trim() || null);
    });
  });
}

// ── Tone presets ──────────────────────────────────────────────────────────────

const TONE_PRESETS = [
  'professional',
  'casual',
  'witty',
  'inspirational',
  'educational',
  'conversational',
  'authoritative',
];

const CHANNEL_OPTIONS = ['linkedin', 'blog', 'xthread', 'email'];

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * collectBrief – drives the interactive intake Q&A in the terminal.
 *
 * Returns a brief object with fields:
 *   { topic, tone, audience, channel, angle }
 *
 * @returns {Promise<{topic: string, tone: string, audience: string, channel: string, angle: string|null}>}
 */
export async function collectBrief() {
  const rl = createRL();

  console.log('\n' + chalk.bold.magenta('━'.repeat(60)));
  console.log(chalk.bold.white('  📋  Content Brief Collection'));
  console.log(chalk.dim('  Answer each question to define your content piece.'));
  console.log(chalk.bold.magenta('━'.repeat(60)));

  // ── Q1: Topic ──────────────────────────────────────────────────────────────
  const topic = await ask(
    rl,
    'What is the topic of your content?\n  (e.g. "AI trends in 2025", "How to build resilient teams")'
  );

  // ── Q2: Tone ──────────────────────────────────────────────────────────────
  console.log(
    chalk.dim(`\n  Available tones: ${TONE_PRESETS.map(t => chalk.cyan(t)).join(', ')}, or type your own`)
  );
  const toneRaw = await ask(rl, 'What tone should the content use?');
  // Accept free-text; normalise preset names
  const tone = TONE_PRESETS.find(t => t.startsWith(toneRaw)) ?? toneRaw;

  // ── Q3: Audience ───────────────────────────────────────────────────────────
  const audience = await ask(
    rl,
    'Who is the target audience?\n  (e.g. "startup founders", "college students", "HR managers")'
  );

  // ── Q4: Channel ───────────────────────────────────────────────────────────
  const channel = await ask(
    rl,
    'Which publishing channel?',
    CHANNEL_OPTIONS
  );

  // ── Q5: Angle (optional) ──────────────────────────────────────────────────
  const angle = await askOptional(
    rl,
    'Do you have a specific angle or unique hook for this piece?'
  );

  rl.close();

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + chalk.bold.green('✔  Brief captured:'));
  console.log(chalk.dim('─'.repeat(60)));
  console.log(`  ${chalk.bold('Topic:')}    ${topic}`);
  console.log(`  ${chalk.bold('Tone:')}     ${tone}`);
  console.log(`  ${chalk.bold('Audience:')} ${audience}`);
  console.log(`  ${chalk.bold('Channel:')}  ${channel}`);
  if (angle) {
    console.log(`  ${chalk.bold('Angle:')}    ${angle}`);
  }
  console.log(chalk.dim('─'.repeat(60)) + '\n');

  return { topic, tone, audience, channel, angle };
}

/**
 * confirmBrief – shows the collected brief and asks for explicit confirmation.
 * Returns true (proceed) or false (restart collection).
 *
 * @param {{ topic, tone, audience, channel, angle }} brief
 * @returns {Promise<boolean>}
 */
export async function confirmBrief(brief) {
  const rl = createRL();

  console.log(chalk.bold.yellow('\n  Please confirm your content brief:'));
  console.log(chalk.dim('─'.repeat(60)));
  Object.entries(brief).forEach(([k, v]) => {
    if (v) console.log(`  ${chalk.bold(k.padEnd(10))} ${v}`);
  });
  console.log(chalk.dim('─'.repeat(60)));

  const answer = await ask(rl, 'Does this look correct?', ['yes', 'no']);
  rl.close();

  return answer === 'yes';
}
