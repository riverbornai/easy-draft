import { AsyncLocalStorage } from 'async_hooks';

export const apiKeyStorage = new AsyncLocalStorage();
export const sessionKeys = new Map();

// Mirrors apiKeyStorage/sessionKeys above, but for the Anthropic (Claude) key.
export const anthropicApiKeyStorage = new AsyncLocalStorage();
export const anthropicSessionKeys = new Map();
