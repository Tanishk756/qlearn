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
}

export class NotificationRepository {
  public static async create(notification: {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    actionLink?: string;
  }) {
    try {
      await pgDb.insert(notifications).values({
        id: notification.id,
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        actionLink: notification.actionLink,
      });
    } catch (e) {
      console.warn('[Notification Repository] Insert skipped:', e);
    }
  }

  public static async getUserNotifications(userId: string) {
    try {
      return await pgDb
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));
    } catch {
      return [];
    }
  }

  public static async markAllRead(userId: string) {
    try {
      await pgDb.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
    } catch {}
  }
}

export class AuditRepository {
  public static async logAudit(entry: {
    id: string;
    userId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    ipAddress: string;
    userAgent: string;
    status: 'SUCCESS' | 'FAILURE' | 'DENIED';
    metadata?: any;
  }) {
    try {
      await pgDb.insert(auditLogs).values({
        id: entry.id,
        userId: entry.userId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        status: entry.status,
        metadata: JSON.stringify(entry.metadata || {}),
      });
    } catch {}
  }

  public static async logSecurity(entry: {
    id: string;
    userId?: string;
    eventType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    details: string;
    ipAddress: string;
  }) {
    try {
      await pgDb.insert(securityEvents).values({
        id: entry.id,
        userId: entry.userId,
        eventType: entry.eventType,
        severity: entry.severity,
        details: entry.details,
        ipAddress: entry.ipAddress,
      });
    } catch {}
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
