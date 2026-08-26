/**
 * Q-Learn Nexus - Session Repository
 * Parameterized data access for Sessions with secure token hash lookups and pruning.
 * @license Apache-2.0
 */

import { eq, and, gt, sql } from 'drizzle-orm';
import { pgDb } from '../client';
import { sessions, users } from '../schema/schema';

export interface SessionDTO {
  id: string;
  user_id: string;
  token_hash: string;
  ip_address: string;
  user_agent: string;
  expires_at: string;
  created_at: string;
}

export class SessionRepository {
  public static async create(session: SessionDTO): Promise<void> {
    await pgDb.insert(sessions).values({
      id: session.id,
      userId: session.user_id,
      tokenHash: session.token_hash,
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
      expiresAt: new Date(session.expires_at),
    });
  }

  public static async findByTokenHash(tokenHash: string): Promise<{ session: SessionDTO; user: any } | null> {
    try {
      const rows = await pgDb
        .select({
          session: sessions,
          user: users,
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(
          and(
            eq(sessions.tokenHash, tokenHash),
            gt(sessions.expiresAt, new Date()),
            eq(users.isActive, true)
          )
        )
        .limit(1);

      if (!rows.length) return null;
      const { session, user } = rows[0];

      return {
        session: {
          id: session.id,
          user_id: session.userId,
          token_hash: session.tokenHash,
          ip_address: session.ipAddress || '127.0.0.1',
          user_agent: session.userAgent || 'unknown',
          expires_at: session.expiresAt.toISOString(),
          created_at: session.createdAt.toISOString(),
        },
        user: {
          id: user.id,
          email: user.email,
          password_hash: user.passwordHash,
          name: user.name,
          username: user.username,
          role: user.role,
          is_active: user.isActive,
          is_verified: user.isVerified,
          created_at: user.createdAt.toISOString(),
          updated_at: user.updatedAt.toISOString(),
        },
      };
    } catch {
      return null;
    }
  }

  public static async delete(sessionId: string): Promise<boolean> {
    try {
      const res = await pgDb.delete(sessions).where(eq(sessions.id, sessionId)).returning();
      return res.length > 0;
    } catch {
      return false;
    }
  }

  public static async deleteAllForUser(userId: string): Promise<number> {
    try {
      const res = await pgDb.delete(sessions).where(eq(sessions.userId, userId)).returning();
      return res.length;
    } catch {
      return 0;
    }
  }
}
