/**
 * Q-Learn Nexus - User & Auth Repository
 * Parameterized data access for Users, Roles, and Password Resets.
 * @license Apache-2.0
 */

import { eq, and, sql } from 'drizzle-orm';
import { pgDb } from '../client';
import { users, profiles, userRoles, roles, passwordResets } from '../schema/schema';

export interface UserDTO {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  username: string;
  role: 'STUDENT' | 'RESEARCHER' | 'INSTRUCTOR' | 'ADMIN';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export class UserRepository {
  public static async findById(id: string): Promise<UserDTO | null> {
    try {
      const rows = await pgDb.select().from(users).where(eq(users.id, id)).limit(1);
      if (!rows.length) return null;
      const u = rows[0];
      return {
        id: u.id,
        email: u.email,
        password_hash: u.passwordHash,
        name: u.name,
        username: u.username,
        role: u.role as any,
        is_active: u.isActive,
        is_verified: u.isVerified,
        created_at: u.createdAt.toISOString(),
        updated_at: u.updatedAt.toISOString(),
      };
    } catch {
      return null;
    }
  }

  public static async findByEmail(email: string): Promise<UserDTO | null> {
    try {
      const rows = await pgDb
        .select()
        .from(users)
        .where(eq(sql`LOWER(${users.email})`, email.toLowerCase().trim()))
        .limit(1);
      if (!rows.length) return null;
      const u = rows[0];
      return {
        id: u.id,
        email: u.email,
        password_hash: u.passwordHash,
        name: u.name,
        username: u.username,
        role: u.role as any,
        is_active: u.isActive,
        is_verified: u.isVerified,
        created_at: u.createdAt.toISOString(),
        updated_at: u.updatedAt.toISOString(),
      };
    } catch {
      return null;
    }
  }

  public static async create(user: UserDTO, profileData?: any): Promise<UserDTO> {
    return await pgDb.transaction(async (tx) => {
      const inserted = await tx
        .insert(users)
        .values({
          id: user.id,
          email: user.email.toLowerCase().trim(),
          passwordHash: user.password_hash,
          name: user.name,
          username: user.username.toLowerCase().trim(),
          role: user.role,
          isActive: user.is_active,
          isVerified: user.is_verified,
        })
        .returning();

      const u = inserted[0];

      await tx.insert(profiles).values({
        userId: user.id,
        avatarUrl: profileData?.avatar_url || '',
        avatarPreset: profileData?.avatar_preset || 'bloch-sphere',
        bio: profileData?.bio || `Quantum computing enthusiast studying ${profileData?.quantum_proficiency || 'quantum algorithms'}.`,
        affiliation: profileData?.affiliation || 'Quantum Learning Community',
        quantumProficiency: profileData?.quantum_proficiency || 'Student',
        theme: profileData?.theme || 'natural',
        preferences: profileData?.preferences ? (typeof profileData.preferences === 'string' ? JSON.parse(profileData.preferences) : profileData.preferences) : {},
      });

      return {
        id: u.id,
        email: u.email,
        password_hash: u.passwordHash,
        name: u.name,
        username: u.username,
        role: u.role as any,
        is_active: u.isActive,
        is_verified: u.isVerified,
        created_at: u.createdAt.toISOString(),
        updated_at: u.updatedAt.toISOString(),
      };
    });
  }

  public static async getProfile(userId: string): Promise<any | null> {
    try {
      const rows = await pgDb.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
      if (!rows.length) return null;
      const p = rows[0];
      return {
        user_id: p.userId,
        avatar_url: p.avatarUrl || '',
        avatar_preset: p.avatarPreset || 'bloch-sphere',
        bio: p.bio || '',
        affiliation: p.affiliation || '',
        quantum_proficiency: p.quantumProficiency || 'Student',
        theme: p.theme || 'natural',
        preferences: typeof p.preferences === 'object' ? JSON.stringify(p.preferences) : (p.preferences || '{}'),
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
      };
    } catch {
      return null;
    }
  }

  public static async updateProfile(userId: string, updates: any, newName?: string): Promise<any> {
    return await pgDb.transaction(async (tx) => {
      if (newName && newName.trim()) {
        await tx
          .update(users)
          .set({ name: newName.trim(), updatedAt: new Date() })
          .where(eq(users.id, userId));
      }

      const existingProfile = await tx.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);

      const profilePayload: any = {
        updatedAt: new Date(),
      };

      if (updates.bio !== undefined) profilePayload.bio = updates.bio.trim();
      if (updates.affiliation !== undefined) profilePayload.affiliation = updates.affiliation.trim();
      if (updates.quantum_proficiency !== undefined) profilePayload.quantumProficiency = updates.quantum_proficiency;
      if (updates.theme !== undefined) profilePayload.theme = updates.theme;
      if (updates.avatar_preset !== undefined) {
        profilePayload.avatarPreset = updates.avatar_preset;
        profilePayload.avatarUrl = '';
      }
      if (updates.avatar_url !== undefined) {
        profilePayload.avatarUrl = updates.avatar_url;
        profilePayload.avatarPreset = '';
      }
      if (updates.preferences !== undefined) {
        profilePayload.preferences = typeof updates.preferences === 'string' ? JSON.parse(updates.preferences) : updates.preferences;
      }

      let updated;
      if (existingProfile.length > 0) {
        updated = await tx
          .update(profiles)
          .set(profilePayload)
          .where(eq(profiles.userId, userId))
          .returning();
      } else {
        profilePayload.userId = userId;
        updated = await tx.insert(profiles).values(profilePayload).returning();
      }

      const p = updated[0];
      return {
        user_id: p.userId,
        avatar_url: p.avatarUrl || '',
        avatar_preset: p.avatarPreset || 'bloch-sphere',
        bio: p.bio || '',
        affiliation: p.affiliation || '',
        quantum_proficiency: p.quantumProficiency || 'Student',
        theme: p.theme || 'natural',
        preferences: typeof p.preferences === 'object' ? JSON.stringify(p.preferences) : (p.preferences || '{}'),
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
      };
    });
  }

  public static async updatePassword(userId: string, newPasswordHash: string): Promise<boolean> {
    try {
      const res = await pgDb
        .update(users)
        .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      return res.length > 0;
    } catch {
      return false;
    }
  }

  public static async listUsers(): Promise<any[]> {
    try {
      const rows = await pgDb
        .select({
          user: users,
          profile: profiles,
        })
        .from(users)
        .leftJoin(profiles, eq(users.id, profiles.userId));

      return rows.map(({ user: u, profile: p }) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        username: u.username,
        role: u.role,
        isActive: u.isActive,
        isVerified: u.isVerified,
        proficiency: p?.quantumProficiency || 'Student',
        createdAt: u.createdAt.toISOString(),
      }));
    } catch {
      return [];
    }
  }

  public static async updateRole(userId: string, role: string): Promise<boolean> {
    try {
      const res = await pgDb
        .update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      return res.length > 0;
    } catch {
      return false;
    }
  }

  public static async updateStatus(userId: string, isActive: boolean): Promise<boolean> {
    try {
      const res = await pgDb
        .update(users)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      return res.length > 0;
    } catch {
      return false;
    }
  }

  public static async deleteUser(userId: string): Promise<boolean> {
    try {
      const res = await pgDb.delete(users).where(eq(users.id, userId)).returning();
      return res.length > 0;
    } catch {
      return false;
    }
  }

  public static async createPasswordReset(record: {
    id: string;
    userId: string;
    tokenHash: string;
    codeHash: string;
    expiresAt: string;
  }): Promise<void> {
    await pgDb.insert(passwordResets).values({
      id: record.id,
      userId: record.userId,
      tokenHash: record.tokenHash,
      codeHash: record.codeHash,
      expiresAt: new Date(record.expiresAt),
      used: false,
    });
  }

  public static async findValidPasswordReset(userId: string): Promise<any[]> {
    try {
      const rows = await pgDb
        .select()
        .from(passwordResets)
        .where(
          and(
            eq(passwordResets.userId, userId),
            eq(passwordResets.used, false),
            sql`${passwordResets.expiresAt} >= NOW()`
          )
        );
      return rows;
    } catch {
      return [];
    }
  }

  public static async markPasswordResetUsed(resetId: string): Promise<void> {
    try {
      await pgDb
        .update(passwordResets)
        .set({ used: true })
        .where(eq(passwordResets.id, resetId));
    } catch {}
  }
}
