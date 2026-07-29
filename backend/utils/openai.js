import OpenAI from 'openai';
import { apiKeyStorage, sessionKeys } from './context.js';

/**
 * Factory function to retrieve an OpenAI client instance.
 * Automatically resolves the correct API key using:
 *  1. Request-scoped AsyncLocalStorage
 *  2. In-memory session key map
 *  3. Fallback to process.env.OPENAI_API_KEY
 * 
 * @param {string} [sessionId] - Optional active session ID
 * @returns {OpenAI} configured OpenAI client instance
 */
export function getOpenAI(sessionId = null) {
  const storeKey = apiKeyStorage.getStore();
  const mapKey = sessionId ? sessionKeys.get(sessionId) : null;
  const apiKey = storeKey || mapKey || process.env.OPENAI_API_KEY;
  
  return new OpenAI({ apiKey });
}
