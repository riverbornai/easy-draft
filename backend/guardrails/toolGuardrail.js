/**
 * guardrails/toolGuardrail.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Tool guardrail stub for Phase 1 — full implementation in Phase 5.
 * ──────────────────────────────────────────────────────────────────────────────
 */

/**
 * runToolGuardrail – safety check before / after the publish tool runs.
 * (Stub — full logic added in Phase 5)
 *
 * @param {'pre'|'post'} _phase
 * @param {object} _args
 * @returns {Promise<{ allowed: boolean, reason?: string }>}
 */
export async function runToolGuardrail(_phase, _args) {
  // TODO: Phase 5 — implement pre/post publish safety checks
  return { allowed: true };
}
