/**
 * Q-Learn Nexus - Project & Sharing Repository
 * Parameterized data access for Projects, Versions, Members, and Cryptographic Share Tokens.
 * @license Apache-2.0
 */

import { eq, or, and, desc } from 'drizzle-orm';
import { pgDb } from '../client';
import {
  projects,
  circuits,
  projectVersions,
  projectMembers,
  sharedProjects,
  shareTokens,
} from '../schema/schema';

export interface ProjectDTO {
  id: string;
  user_id: string;
  title: string;
  description: string;
  tags_json: string;
  circuit_id: string;
  is_public: boolean;
  visibility: 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
  version: number;
  created_at: string;
  updated_at: string;
}

export class ProjectRepository {
  public static async findAccessible(userId?: string, isAdmin = false): Promise<ProjectDTO[]> {
    try {
      let query;
      if (isAdmin) {
        query = pgDb.select().from(projects).orderBy(desc(projects.updatedAt));
      } else if (userId) {
        query = pgDb
          .select()
          .from(projects)
          .where(or(eq(projects.isPublic, true), eq(projects.ownerId, userId)))
          .orderBy(desc(projects.updatedAt));
      } else {
        query = pgDb
          .select()
          .from(projects)
          .where(eq(projects.isPublic, true))
          .orderBy(desc(projects.updatedAt));
      }

      const rows = await query;
      return rows.map((p) => ({
        id: p.id,
        user_id: p.ownerId,
        title: p.title,
        description: p.description || '',
        tags_json: p.tagsJson,
        circuit_id: p.circuitId,
        is_public: p.isPublic,
        visibility: p.visibility as any,
        version: p.version,
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
      }));
    } catch {
      return [];
    }
  }

  public static async findById(id: string): Promise<ProjectDTO | null> {
    try {
      const rows = await pgDb.select().from(projects).where(eq(projects.id, id)).limit(1);
      if (!rows.length) return null;
      const p = rows[0];
      return {
        id: p.id,
        user_id: p.ownerId,
        title: p.title,
        description: p.description || '',
        tags_json: p.tagsJson,
        circuit_id: p.circuitId,
        is_public: p.isPublic,
        visibility: p.visibility as any,
        version: p.version,
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
      };
    } catch {
      return null;
    }
  }

  public static async create(
    project: ProjectDTO,
    circuitData: {
      name: string;
      qubits: number;
      classical_bits: number;
      gates_json: string;
    }
  ): Promise<ProjectDTO> {
    return await pgDb.transaction(async (tx) => {
      // 1. Create circuit record
      await tx.insert(circuits).values({
        id: project.circuit_id,
        ownerId: project.user_id,
        projectId: project.id,
        name: circuitData.name,
        qubits: circuitData.qubits,
        classicalBits: circuitData.classical_bits,
        gatesJson: circuitData.gates_json,
        version: 1,
        isPublic: project.is_public,
      });

      // 2. Create project record
      const inserted = await tx
        .insert(projects)
        .values({
          id: project.id,
          ownerId: project.user_id,
          title: project.title,
          description: project.description,
          tagsJson: project.tags_json,
          circuitId: project.circuit_id,
          isPublic: project.is_public,
          visibility: project.visibility,
          version: 1,
        })
        .returning();

      // 3. Create initial project version
      await tx.insert(projectVersions).values({
        id: `pv_${project.id}_1`,
        projectId: project.id,
        version: 1,
        note: 'Initial project creation',
        circuitIr: circuitData.gates_json,
      });

      const p = inserted[0];
      return {
        id: p.id,
        user_id: p.ownerId,
        title: p.title,
        description: p.description || '',
        tags_json: p.tagsJson,
        circuit_id: p.circuitId,
        is_public: p.isPublic,
        visibility: p.visibility as any,
        version: p.version,
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
      };
    });
  }

  public static async delete(id: string): Promise<boolean> {
    try {
      const res = await pgDb.delete(projects).where(eq(projects.id, id)).returning();
      return res.length > 0;
    } catch {
      return false;
    }
  }
}

export class SharingRepository {
  public static async createShareToken(params: {
    tokenHash: string;
    resourceType: 'PROJECT' | 'CIRCUIT';
    resourceId: string;
    permissions?: string;
    expiresAt?: Date;
    createdBy: string;
  }): Promise<void> {
    await pgDb.insert(shareTokens).values({
      id: `tok_${Date.now()}`,
      tokenHash: params.tokenHash,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      permissions: params.permissions || 'VIEW',
      expiresAt: params.expiresAt,
      createdBy: params.createdBy,
    });
  }

  public static async validateShareToken(tokenHash: string, resourceId: string): Promise<boolean> {
    try {
      const rows = await pgDb
        .select()
        .from(shareTokens)
        .where(
          and(
            eq(shareTokens.tokenHash, tokenHash),
            eq(shareTokens.resourceId, resourceId),
            eq(shareTokens.revoked, false)
          )
        )
        .limit(1);

      if (!rows.length) return false;
      const tok = rows[0];
      if (tok.expiresAt && tok.expiresAt.getTime() < Date.now()) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  public static async revokeShareToken(tokenHash: string): Promise<boolean> {
    try {
      const res = await pgDb
        .update(shareTokens)
        .set({ revoked: true })
        .where(eq(shareTokens.tokenHash, tokenHash))
        .returning();
      return res.length > 0;
    } catch {
      return false;
    }
  }
}
