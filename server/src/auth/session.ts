/**
 * Q-Learn Nexus - Session Management
 * Server-authoritative cryptographic session store with token hashing and IP/UA tracking.
 * @license Apache-2.0
 */

import { db, UserRow, SessionRow } from '../database/index';
import { generateSecureToken, hashToken, constantTimeEquals } from '../security/crypto';
import crypto from 'crypto';

const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export interface CreatedSession {
  sessionId: string;
  rawToken: string;
  expiresAt: string;
  user: UserRow;
}

/**
 * Creates a new authenticated session for a user.
 */
export function createSession(userId: string, ipAddress = '127.0.0.1', userAgent = 'unknown'): CreatedSession {
  const user = db.users.get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const rawToken = generateSecureToken(32);
  const tokenHash = hashToken(rawToken);
  const sessionId = `sess_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  const sessionRow: SessionRow = {
    id: sessionId,
    user_id: userId,
    token_hash: tokenHash,
    ip_address: ipAddress,
    user_agent: userAgent,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
  };

  db.sessions.set(sessionId, sessionRow);
  db.persist();

  return {
    sessionId,
    rawToken,
    expiresAt,
    user,
  };
}

/**
 * Validates a raw token or composite session credential (sessionId:rawToken).
 */
export function validateSession(credential: string): { user: UserRow; session: SessionRow } | null {
  if (!credential) return null;

  let sessionId = '';
  let rawToken = '';

  if (credential.includes('.')) {
    const parts = credential.split('.');
    sessionId = parts[0];
    rawToken = parts[1];
  } else {
    // If only rawToken provided, search active sessions
    rawToken = credential;
  }

  const candidateHash = hashToken(rawToken);

  if (sessionId) {
    const session = db.sessions.get(sessionId);
    if (!session) return null;

    if (new Date(session.expires_at).getTime() < Date.now()) {
      db.sessions.delete(sessionId);
      db.persist();
      return null;
    }

    if (!constantTimeEquals(session.token_hash, candidateHash)) {
      return null;
    }

    const user = db.users.get(session.user_id);
    if (!user || !user.is_active) return null;

    return { user, session };
  }

  // Linear lookup if no explicit sessionId was prefixed
  for (const session of db.sessions.values()) {
    if (constantTimeEquals(session.token_hash, candidateHash)) {
      if (new Date(session.expires_at).getTime() < Date.now()) {
        db.sessions.delete(session.id);
        db.persist();
        return null;
      }
      const user = db.users.get(session.user_id);
      if (!user || !user.is_active) return null;
      return { user, session };
    }
  }

  return null;
}

/**
 * Destroys a session by ID or token.
 */
export function destroySession(sessionId: string): boolean {
  const exists = db.sessions.has(sessionId);
  if (exists) {
    db.sessions.delete(sessionId);
    db.persist();
  }
  return exists;
}

/**
 * Invalidates all active sessions for a user (e.g. after password reset or security alert).
 */
export function invalidateAllUserSessions(userId: string): number {
  let count = 0;
  for (const [id, session] of db.sessions.entries()) {
    if (session.user_id === userId) {
      db.sessions.delete(id);
      count++;
    }
  }
  if (count > 0) {
    db.persist();
  }
  return count;
}
