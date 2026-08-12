/**
 * api/routes/userKeys.js
 * GET /api/user/keys — whether the signed-in account has keys configured
 * PUT /api/user/keys — set/update the account's OpenAI/Anthropic keys
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import UserKeys from '../models/UserKeys.js';
import { encryptSecret, decryptSecret } from '../utils/keyEncryption.js';

const router = Router();
router.use(requireAuth);

function preview(key) {
  if (!key) return null;
  return key.length > 10 ? `${key.slice(0, 6)}…${key.slice(-4)}` : '••••';
}

router.get('/', async (req, res) => {
  const record = await UserKeys.findOne({ userId: req.userId });
  const openaiKey = record?.openaiKeyEncrypted ? decryptSecret(record.openaiKeyEncrypted) : null;
  const anthropicKey = record?.anthropicKeyEncrypted ? decryptSecret(record.anthropicKeyEncrypted) : null;

  res.json({
    hasOpenAIKey: !!openaiKey,
    hasAnthropicKey: !!anthropicKey,
    openaiKeyPreview: preview(openaiKey),
    anthropicKeyPreview: preview(anthropicKey),
  });
});

router.put('/', async (req, res) => {
  const { openaiKey, anthropicKey } = req.body;
  const update = { updatedAt: new Date() };

  if (openaiKey) update.openaiKeyEncrypted = encryptSecret(openaiKey.trim());
  if (anthropicKey) update.anthropicKeyEncrypted = encryptSecret(anthropicKey.trim());

  await UserKeys.findOneAndUpdate({ userId: req.userId }, update, { upsert: true });
  res.json({ success: true });
});

export default router;
