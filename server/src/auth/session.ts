/**
 * Q-Learn Nexus - Session Management
 * Server-authoritative cryptographic session store with token hashing and IP/UA tracking.
 * Uses PostgreSQL SessionRepository as authoritative persistence layer.
 * @license Apache-2.0
 */

import { generateSecureToken, hashToken, constantTimeEquals } from '../security/crypto';
import { SessionRepository, SessionDTO } from '../database/repositories/SessionRepository';
import { UserRepository, UserDTO } from '../database/repositories/UserRepository';
import crypto from 'crypto';

const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export interface CreatedSession {
  sessionId: string;
  rawToken: string;
  expiresAt: string;
  user: UserDTO;
}

/**
 * Creates a new authenticated session for a user in PostgreSQL.
 */
export async function createSession(
  userId: string,
  ipAddress = '127.0.0.1',
  userAgent = 'unknown'
): Promise<CreatedSession> {
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const rawToken = generateSecureToken(32);
  const tokenHash = hashToken(rawToken);
  const sessionId = `sess_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  const sessionRow: SessionDTO = {
    id: sessionId,
    user_id: userId,
    token_hash: tokenHash,
    ip_address: ipAddress,
    user_agent: userAgent,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
  };

  await SessionRepository.create(sessionRow);

  return {
    sessionId,
    rawToken,
    expiresAt,
    user,
  };
}

/**
 * Validates a raw token or composite session credential (sessionId.rawToken) against PostgreSQL.
 */
export async function validateSession(credential: string): Promise<{ user: UserDTO; session: SessionDTO } | null> {
  if (!credential) return null;

  let rawToken = '';
  if (credential.includes('.')) {
    const parts = credential.split('.');
    rawToken = parts[1];
  } else {
    rawToken = credential;
  }

  if (!rawToken) return null;

  const candidateHash = hashToken(rawToken);
  const result = await SessionRepository.findByTokenHash(candidateHash);
  if (!result) return null;

  if (!result.user.is_active) return null;

  return result;
}

/**
 * Destroys a session by ID in PostgreSQL.
 */
export async function destroySession(sessionId: string): Promise<boolean> {
  return await SessionRepository.delete(sessionId);
}

/**
 * Invalidates all active sessions for a user (e.g. after password reset or security alert).
 */
export async function invalidateAllUserSessions(userId: string): Promise<number> {
  return await SessionRepository.deleteAllForUser(userId);
}

