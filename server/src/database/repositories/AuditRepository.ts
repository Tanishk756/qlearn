/**
 * Q-Learn Nexus - Audit and Security Event Repository
 * Appends and queries immutable audit trails in PostgreSQL.
 * @license Apache-2.0
 */

import { eq, desc } from 'drizzle-orm';
import { pgDb } from '../client';
import { auditLogs, securityEvents, users, projects, circuits, simulationJobs, sessions } from '../schema/schema';

export class AuditRepository {
  public static async logAudit(params: {
    id: string;
    userId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    status: 'SUCCESS' | 'FAILURE' | 'DENIED';
    metadata?: string;
  }): Promise<void> {
    try {
      await pgDb.insert(auditLogs).values({
        id: params.id,
        userId: params.userId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        ipAddress: params.ipAddress || '127.0.0.1',
        userAgent: params.userAgent || 'system',
        status: params.status,
        metadata: params.metadata || '{}',
      });
    } catch (err) {
      console.error('[AuditRepository] Error inserting audit log:', err);
    }
  }

  public static async logSecurity(params: {
    id: string;
    userId?: string;
    eventType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    details: string;
    ipAddress?: string;
  }): Promise<void> {
    try {
      await pgDb.insert(securityEvents).values({
        id: params.id,
        userId: params.userId,
        eventType: params.eventType,
        severity: params.severity,
        details: params.details,
        ipAddress: params.ipAddress || '127.0.0.1',
      });
    } catch (err) {
      console.error('[AuditRepository] Error inserting security event:', err);
    }
  }

  public static async listAuditLogs(limit = 100) {
    try {
      const rows = await pgDb.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
      return rows.map((r) => ({
        id: r.id,
        user_id: r.userId,
        action: r.action,
        resource_type: r.resourceType,
        resource_id: r.resourceId,
        ip_address: r.ipAddress,
        user_agent: r.userAgent,
        status: r.status,
        metadata: r.metadata,
        created_at: r.createdAt.toISOString(),
      }));
    } catch {
      return [];
    }
  }

  public static async listSecurityEvents(limit = 100) {
    try {
      const rows = await pgDb.select().from(securityEvents).orderBy(desc(securityEvents.createdAt)).limit(limit);
      return rows.map((r) => ({
        id: r.id,
        user_id: r.userId,
        event_type: r.eventType,
        severity: r.severity,
        details: r.details,
        ip_address: r.ipAddress,
        created_at: r.createdAt.toISOString(),
      }));
    } catch {
      return [];
    }
  }

  public static async getSystemStats() {
    try {
      const [uCount, pCount, cCount, jCount, sCount] = await Promise.all([
        pgDb.select().from(users),
        pgDb.select().from(projects),
        pgDb.select().from(circuits),
        pgDb.select().from(simulationJobs),
        pgDb.select().from(sessions),
      ]);

      return {
        totalUsers: uCount.length,
        totalProjects: pCount.length,
        totalCircuits: cCount.length,
        simulationJobsTotal: jCount.length,
        activeSessions: sCount.filter((s) => s.expiresAt > new Date()).length,
      };
    } catch {
      return {
        totalUsers: 0,
        totalProjects: 0,
        totalCircuits: 0,
        simulationJobsTotal: 0,
        activeSessions: 0,
      };
    }
  }
}
