const ENCRYPTION_KEY = 'riverborn-ai-secret-salt';

/**
 * Encrypts cleartext using a simple XOR cipher and Base64 encoding.
 * Keeps the API key obfuscated in browser local storage.
 * @param {string} text - Plain text key
 * @returns {string} Encrypted base64 representation
 */
export function encrypt(text) {
  if (!text) return '';
  const encrypted = text.split('').map((char, index) => {
    return String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length));
  }).join('');
  return btoa(unescape(encodeURIComponent(encrypted)));
}

/**
 * Decrypts obfuscated base64 representation using XOR.
 * @param {string} cipher - Obfuscated base64 text
 * @returns {string} Decrypted plain text key
 */
export function decrypt(cipher) {
  if (!cipher) return '';
  try {
    const decoded = decodeURIComponent(escape(atob(cipher)));
    return decoded.split('').map((char, index) => {
      return String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length));
    }).join('');
  } catch (e) {
    console.error('Failed to decrypt API key:', e);
    return '';
  }
}
