import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  decryptString,
  deriveEncryptionKey,
  encryptString,
  isEncrypted,
} from './encryption.util';

/**
 * Encrypts sensitive values before they are persisted (currently vendor payout
 * details).
 *
 * The key comes from ENCRYPTION_KEY when set. Otherwise it is derived from
 * JWT_SECRET with a distinct domain separator, so the application always has a
 * working key without introducing a second required secret. Deployments that
 * want independent key rotation should set ENCRYPTION_KEY explicitly.
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly key: Buffer;

  constructor(private configService: ConfigService) {
    const explicitKey = this.configService.get<string>('ENCRYPTION_KEY');
    const fallback = this.configService.get<string>('JWT_SECRET');

    const secret = explicitKey || fallback;
    if (!secret) {
      throw new Error(
        'Cannot initialise encryption: set ENCRYPTION_KEY or JWT_SECRET.',
      );
    }

    if (!explicitKey) {
      this.logger.warn(
        'ENCRYPTION_KEY is not set - deriving the payout encryption key from JWT_SECRET. ' +
          'Set a dedicated ENCRYPTION_KEY to rotate it independently.',
      );
    }

    this.key = deriveEncryptionKey(secret);
  }

  /** Encrypts a JSON-serialisable value. */
  encryptJson(value: unknown): string {
    return encryptString(JSON.stringify(value), this.key);
  }

  /**
   * Decrypts a value produced by {@link encryptJson}.
   *
   * Values written before encryption was introduced are stored as plain JSON;
   * those are returned as-is so existing records stay readable.
   */
  decryptJson<T>(value: unknown): T | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (!isEncrypted(value)) {
      // Legacy plaintext record.
      return value as T;
    }

    try {
      return JSON.parse(decryptString(value, this.key)) as T;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to decrypt stored value: ${message}`);
      return null;
    }
  }
}
