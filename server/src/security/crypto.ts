/**
 * Q-Learn Nexus - Cryptography & Token Utilities
 * Industry-standard password hashing, constant-time comparisons, and secure token generation.
 * @license Apache-2.0
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

// Pre-computed valid bcrypt hash for constant-time comparison when user is not found
export const DUMMY_BCRYPT_HASH = '$2a$12$e8rGVg60O5h0i3M6r2G5Ou7yW3k8f5s7D2v3m4l1k9j8h7g6f5e4d';

/**
 * Securely hashes a plain-text password using bcrypt with cost factor 12.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a plain-text password with a bcrypt hash in constant time.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Performs a dummy password verification against a fixed bcrypt hash
 * to ensure non-existent accounts take identical execution time as existent accounts.
 */
export async function performDummyPasswordCheck(password: string): Promise<void> {
  try {
    await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
  } catch {
    // Suppress internal dummy comparison error
  }
}

/**
 * Generates a cryptographically random hexadecimal string (default 32 bytes = 64 hex chars).
 */
export function generateSecureToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Generates a cryptographically secure 6-digit numeric verification code.
 */
export function generateSecureDigitCode(): string {
  const min = 100000;
  const max = 999999;
  return crypto.randomInt(min, max + 1).toString();
}

/**
 * Performs a SHA-256 hash of a token or code for secure database storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Compares two hashes in constant time to prevent timing attacks.
 */
export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  return crypto.timingSafeEqual(bufA, bufB);
}
