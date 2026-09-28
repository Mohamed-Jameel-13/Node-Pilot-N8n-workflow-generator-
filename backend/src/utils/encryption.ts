import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard 96-bit IV
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_SECRET;
  if (!key) {
    throw new Error('ENCRYPTION_SECRET is not set in environment variables');
  }
  // Ensure key is always exactly 32 bytes
  return crypto.createHash('sha256').update(key).digest();
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv, { authTagLength: TAG_LENGTH });
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

export function decrypt(text: string): string {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid ciphertext input');
  }

  // 1. Modern v1: AES-256-GCM with authentication tag
  if (text.startsWith('v1:')) {
    const parts = text.split(':');
    if (parts.length !== 4) {
      throw new Error('Malformed v1 encrypted text format');
    }
    const ivHex = parts[1];
    const tagHex = parts[2];
    const encryptedHex = parts[3];

    if (!ivHex || !tagHex || !encryptedHex) {
      throw new Error('Malformed v1 encrypted text payload elements');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv, { authTagLength: TAG_LENGTH });
    decipher.setAuthTag(tag);
    const decrypted1 = decipher.update(encryptedHex, 'hex', 'utf8');
    const decrypted2 = decipher.final('utf8');
    return decrypted1 + decrypted2;
  }

  // 2. Legacy fallback for existing stored tokens: AES-256-CBC
  const textParts = text.split(':');
  const ivStr = textParts.shift();
  if (!ivStr) throw new Error('Invalid legacy encrypted text format');
  const iv = Buffer.from(ivStr, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');

  let legacyKey = getEncryptionKey();
  const rawSecret = process.env.ENCRYPTION_SECRET || '';
  try {
    const hexKey = Buffer.from(rawSecret, 'hex');
    if (hexKey.length === 32) legacyKey = hexKey;
  } catch {
    // Use hash key
  }

  const decipher = crypto.createDecipheriv('aes-256-cbc', legacyKey, iv);
  const decryptedBuf = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decryptedBuf.toString('utf8');
}
