/**
 * utils/keyEncryption.js
 * AES-256-GCM helpers for storing user-supplied OpenAI/Anthropic keys at
 * rest, keyed off a server-only secret (KEY_ENCRYPTION_SECRET).
 */
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey() {
  const secret = process.env.KEY_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('KEY_ENCRYPTION_SECRET is not set in backend/.env');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptSecret(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

export function decryptSecret(payload) {
  if (!payload) return null;
  try {
    const raw = Buffer.from(payload, 'base64');
    if (raw.length < 28) return null;
    const iv = raw.subarray(0, 12);
    const authTag = raw.subarray(12, 28);
    const encrypted = raw.subarray(28);
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch (err) {
    console.error('⚠️ Failed to decrypt stored secret:', err.message);
    return null;
  }
}
