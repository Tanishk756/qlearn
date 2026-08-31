/**
 * Q-Learn Nexus - Audit & Security Event Logger
 * Append-only immutable structured audit trail. Never logs passwords, API keys, or raw secrets.
 * Uses PostgreSQL AuditRepository.
 * @license Apache-2.0
 */

import { AuditRepository } from '../database/repositories/AuditRepository';
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
    const id = `aud_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    // Fire and forget or handle asynchronously
    AuditRepository.logAudit({
      id,
      userId: params.userId,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      ipAddress: params.ipAddress || '127.0.0.1',
      userAgent: params.userAgent || 'system',
      status: params.status,
      metadata: JSON.stringify(params.metadata || {}),
    }).catch((err) => {
      console.error('[AuditLogger] Async audit write failed:', err);
    });
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
    const id = `sec_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    AuditRepository.logSecurity({
      id,
      userId: params.userId,
      eventType: params.eventType,
      severity: params.severity,
      details: params.details,
      ipAddress: params.ipAddress || '127.0.0.1',
    }).catch((err) => {
      console.error('[AuditLogger] Async security write failed:', err);
    });
    console.warn(`[SECURITY EVENT][${params.severity}] ${params.eventType}: ${params.details}`);
  } catch (err) {
    console.error('[AuditLogger] Failed to log security event:', err);
  }
}

