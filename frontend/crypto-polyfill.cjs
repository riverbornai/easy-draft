const crypto = require('crypto');
if (crypto.webcrypto) {
  try {
    Object.defineProperty(globalThis, 'crypto', {
      value: crypto.webcrypto,
      writable: true,
      configurable: true,
      enumerable: true
    });
  } catch (e) {
    globalThis.crypto = crypto.webcrypto;
  }
}
