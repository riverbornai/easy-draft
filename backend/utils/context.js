import { AsyncLocalStorage } from 'async_hooks';

export const apiKeyStorage = new AsyncLocalStorage();
export const sessionKeys = new Map();
