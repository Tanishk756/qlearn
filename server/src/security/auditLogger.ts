/**
 * Q-Learn Nexus - Audit & Security Event Logger
 * Append-only immutable structured audit trail. Never logs passwords, API keys, or raw secrets.
 * @license Apache-2.0
 */

import { db, AuditLogRow, SecurityEventRow } from '../database/index';
import crypto from 'crypto';

export function logAuditEvent(params: {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILURE' | 'DENIED';
  metadata?: Record<string, any>;
}) {
  try {
    const entry: AuditLogRow = {
      id: `aud_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      user_id: params.userId,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      ip_address: params.ipAddress || '127.0.0.1',
      user_agent: params.userAgent || 'system',
      status: params.status,
      metadata: JSON.stringify(params.metadata || {}),
      created_at: new Date().toISOString(),
    };

    db.auditLogs.push(entry);
    db.persist();
  } catch (err) {
    console.error('[AuditLogger] Failed to log audit event:', err);
  }
}

export function logSecurityEvent(params: {
  userId?: string;
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
  ipAddress?: string;
}) {
  try {
    const entry: SecurityEventRow = {
      id: `sec_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      user_id: params.userId,
      event_type: params.eventType,
      severity: params.severity,
      details: params.details,
      ip_address: params.ipAddress || '127.0.0.1',
      created_at: new Date().toISOString(),
    };

    db.securityEvents.push(entry);
    db.persist();
    console.warn(`[SECURITY EVENT][${params.severity}] ${params.eventType}: ${params.details}`);
  } catch (err) {
    console.error('[AuditLogger] Failed to log security event:', err);
  }
}
