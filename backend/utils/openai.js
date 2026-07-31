import OpenAI from 'openai';
import { apiKeyStorage, sessionKeys } from './context.js';

/**
 * Factory function to retrieve an OpenAI client instance.
 * Resolves the API key from the frontend request:
 *  1. Request-scoped AsyncLocalStorage (set per-request from X-API-Key header)
 *  2. In-memory session key map (persisted for background pipeline work)
 *
 * No process.env fallback — keys are provided exclusively by the user
 * via the browser UI and sent in request headers.
 *
 * @param {string} [sessionId] - Optional active session ID
 * @returns {OpenAI} configured OpenAI client instance
 */
export function getOpenAI(sessionId = null) {
  const storeKey = apiKeyStorage.getStore();
  const mapKey = sessionId ? sessionKeys.get(sessionId) : null;
  const apiKey = storeKey || mapKey;

  return new OpenAI({ apiKey });
}
