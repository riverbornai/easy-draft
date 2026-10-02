import OpenAI from 'openai';
import { anthropicApiKeyStorage, anthropicSessionKeys } from './context.js';

// Anthropic exposes an OpenAI-compatible endpoint, so the same `openai` SDK
// used elsewhere in this project can talk to Claude by pointing it at
// Anthropic's base URL instead of OpenAI's.
const ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1/';

/**
 * Factory function to retrieve an Anthropic (Claude) client instance.
 * Resolves the API key from the frontend request:
 *  1. Request-scoped AsyncLocalStorage (set per-request from X-Anthropic-Key header)
 *  2. In-memory session key map (persisted for background pipeline work)
 *
 * No process.env fallback — keys are provided exclusively by the user
 * via the browser UI and sent in request headers.
 *
 * @param {string} [sessionId] - Optional active session ID
 * @returns {OpenAI|null} configured client, or null if no key is available
 */
export function getAnthropic(sessionId = null) {
  const storeKey = anthropicApiKeyStorage.getStore();
  const mapKey = sessionId ? anthropicSessionKeys.get(sessionId) : null;
  const apiKey = storeKey || mapKey;

  if (!apiKey) return null;

  return new OpenAI({ apiKey, baseURL: ANTHROPIC_BASE_URL });
}

export function hasAnthropicKey(sessionId = null) {
  const storeKey = anthropicApiKeyStorage.getStore();
  const mapKey = sessionId ? anthropicSessionKeys.get(sessionId) : null;
  return Boolean(storeKey || mapKey);
}
