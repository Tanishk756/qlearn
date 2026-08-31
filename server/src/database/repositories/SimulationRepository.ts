/**
 * Q-Learn Nexus - Simulation, Notification & Auditing Repositories
 * Parameterized access for Simulation Jobs, Real-time Notifications, and Security Audit Logs.
 * @license Apache-2.0
 */

import { eq, and, desc } from 'drizzle-orm';
import { pgDb } from '../client';
import {
  simulationJobs,
  simulationResults,
  notifications,
  notificationPreferences,
  auditLogs,
  securityEvents,
  aiConversations,
  aiMessages,
  systemSettings,
} from '../schema/schema';

export class SimulationRepository {
  public static async createJob(job: {
    id: string;
    userId: string;
    circuitId?: string;
    circuitIr: string;
    provider: string;
    shots: number;
  }) {
    await pgDb.insert(simulationJobs).values({
      id: job.id,
      userId: job.userId,
      circuitId: job.circuitId,
      circuitIr: job.circuitIr,
      status: 'QUEUED',
      provider: job.provider,
      shots: job.shots,
    });
  }

  public static async updateJobStatus(params: {
    id: string;
    status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    resultsJson?: string;
    errorMessage?: string;
    durationMs?: number;
  }) {
    await pgDb
      .update(simulationJobs)
      .set({
        status: params.status,
        resultsJson: params.resultsJson,
        errorMessage: params.errorMessage,
        durationMs: params.durationMs,
        completedAt: params.status === 'COMPLETED' || params.status === 'FAILED' ? new Date() : undefined,
      })
      .where(eq(simulationJobs.id, params.id));
  }

  public static async getJobById(id: string, userId?: string) {
    try {
      const rows = await pgDb.select().from(simulationJobs).where(eq(simulationJobs.id, id)).limit(1);
      if (!rows.length) return null;
      const j = rows[0];
      if (userId && j.userId !== userId) {
        return null;
      }
      return j;
    } catch {
      return null;
    }
  }

  public static async listJobsByUser(userId: string, limit = 50) {
    try {
      const rows = await pgDb
        .select()
        .from(simulationJobs)
        .where(eq(simulationJobs.userId, userId))
        .orderBy(desc(simulationJobs.createdAt))
        .limit(limit);
      return rows;
    } catch {
      return [];
    }
  }

  public static async listAllJobs(limit = 100) {
    try {
      const rows = await pgDb
        .select()
        .from(simulationJobs)
        .orderBy(desc(simulationJobs.createdAt))
        .limit(limit);
      return rows;
    } catch {
      return [];
    }
  }
}

export class AIRepository {
  public static async createConversation(userId: string, title = 'Quantum Tutoring Session', context = '') {
    const id = `conv_${Date.now()}`;
    await pgDb.insert(aiConversations).values({
      id,
      userId,
      title,
      context,
    });
    return id;
  }

  public static async logMessage(conversationId: string, role: string, content: string, model = 'gemini-3.7-flash') {
    await pgDb.insert(aiMessages).values({
      id: `msg_${Date.now()}`,
      conversationId,
      role,
      content,
      model,
    });
  }
}

export class SystemSettingsRepository {
  public static async get(key: string): Promise<any | null> {
    try {
      const rows = await pgDb.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
      if (!rows.length) return null;
      return JSON.parse(rows[0].valueJson);
    } catch {
      return null;
    }
  }

  public static async set(key: string, value: any, description = ''): Promise<void> {
    await pgDb
      .insert(systemSettings)
      .values({
        id: `set_${key}`,
        key,
        valueJson: JSON.stringify(value),
        description,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          valueJson: JSON.stringify(value),
          description,
          updatedAt: new Date(),
        },
      });
  }
}
