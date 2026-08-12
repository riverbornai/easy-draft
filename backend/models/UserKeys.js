import mongoose from 'mongoose';

const userKeysSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  openaiKeyEncrypted: { type: String, default: null },
  anthropicKeyEncrypted: { type: String, default: null },
  updatedAt: { type: Date, default: Date.now },
});

const UserKeys = mongoose.model('UserKeys', userKeysSchema);
export default UserKeys;
