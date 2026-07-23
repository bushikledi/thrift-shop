import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';

/**
 * Authenticated symmetric encryption (AES-256-GCM) for sensitive values stored
 * at rest, such as vendor payout/bank details.
 *
 * Encrypted values are serialised as `enc:v1:<iv>:<authTag>:<ciphertext>` with
 * each part base64-encoded. The version prefix lets us recognise encrypted
 * values (so pre-existing plaintext rows can be read and transparently
 * upgraded) and leaves room for future scheme changes.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit nonce, the recommended size for GCM
const KEY_LENGTH = 32; // AES-256
const PREFIX = 'enc:v1:';

/**
 * Derives a 32-byte key from the configured secret.
 *
 * A 64-character hex secret is used directly as raw key material; anything else
 * is stretched with scrypt. The fixed salt includes a domain string so a key
 * derived from a shared secret is not interchangeable with keys used elsewhere.
 */
export function deriveEncryptionKey(secret: string): Buffer {
  if (/^[0-9a-fA-F]{64}$/.test(secret)) {
    return Buffer.from(secret, 'hex');
  }
  return scryptSync(secret, 'thrift-shop:payout-encryption:v1', KEY_LENGTH);
}

/** True when the value looks like output of {@link encryptString}. */
export function isEncrypted(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

export function encryptString(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString('base64')}:${authTag.toString(
    'base64',
  )}:${ciphertext.toString('base64')}`;
}

export function decryptString(payload: string, key: Buffer): string {
  if (!isEncrypted(payload)) {
    throw new Error('Value is not encrypted');
  }

  const [iv, authTag, ciphertext] = payload.slice(PREFIX.length).split(':');
  if (!iv || !authTag || !ciphertext) {
    throw new Error('Malformed encrypted value');
  }

  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
