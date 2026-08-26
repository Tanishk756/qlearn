/**
 * Q-Learn Nexus - User & Auth Repository
 * Parameterized data access for Users, Roles, and Password Resets.
 * @license Apache-2.0
 */

import { eq, sql } from 'drizzle-orm';
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
        avatarPreset: profileData?.avatar_preset || 'schrodinger-cat',
        bio: profileData?.bio || 'Quantum enthusiast & algorithmic explorer on Q-Learn Nexus.',
        affiliation: profileData?.affiliation || '',
        quantumProficiency: profileData?.quantum_proficiency || 'Beginner',
        theme: profileData?.theme || 'natural',
        preferences: profileData?.preferences ? JSON.parse(profileData.preferences) : {},
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

  public static async updatePassword(userId: string, newPasswordHash: string): Promise<boolean> {
    const res = await pgDb
      .update(users)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return res.length > 0;
  }
}
