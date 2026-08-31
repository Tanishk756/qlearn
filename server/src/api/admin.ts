/**
 * Q-Learn Nexus - Administration & Security Operations API
 * RBAC Protected (ADMIN Only): User management, role elevation, immutable audit log queries, security alerts.
 * Uses PostgreSQL UserRepository and AuditRepository.
 * @license Apache-2.0
 */

import { Router, Response } from 'express';
import { UserRepository } from '../database/repositories/UserRepository';
import { AuditRepository } from '../database/repositories/AuditRepository';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../auth/middleware';
import { logAuditEvent, logSecurityEvent } from '../security/auditLogger';

const router = Router();

// Require admin authentication for all routes in this router
router.use(authenticateToken, requireAdmin);

/**
 * GET /api/v1/admin/users
 */
router.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  const users = await UserRepository.listAll();
  const result = [];

  for (const u of users) {
    const profile = await UserRepository.getProfile(u.id);
    result.push({
      id: u.id,
      email: u.email,
      name: u.name,
      username: u.username,
      role: u.role,
      isActive: u.is_active,
      isVerified: u.is_verified,
      proficiency: profile?.quantum_proficiency || 'Student',
      createdAt: u.created_at,
    });
  }

  res.json({ success: true, users: result });
});

/**
 * PATCH /api/v1/admin/users/:id/role
 */
router.patch('/users/:id/role', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['STUDENT', 'RESEARCHER', 'INSTRUCTOR', 'ADMIN'].includes(role)) {
    res.status(400).json({ error: 'INVALID_ROLE', message: 'Invalid role specified.' });
    return;
  }

  const targetUser = await UserRepository.findById(id);
  if (!targetUser) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
    return;
  }

  const previousRole = targetUser.role;
  await UserRepository.updateRole(id, role);

  logAuditEvent({
    userId: req.user!.id,
    action: 'ADMIN_ROLE_CHANGE',
    resourceType: 'USER',
    resourceId: targetUser.id,
    ipAddress: req.ip,
    status: 'SUCCESS',
    metadata: { previousRole, newRole: role },
  });

  logSecurityEvent({
    userId: req.user!.id,
    eventType: 'ROLE_ELEVATION_EXECUTED',
    severity: 'MEDIUM',
    details: `Admin ${req.user!.email} changed user ${targetUser.email} role from ${previousRole} to ${role}`,
    ipAddress: req.ip,
  });

  res.json({ success: true, message: `User role updated to ${role}.` });
});

/**
 * PATCH /api/v1/admin/users/:id/status
 */
router.patch('/users/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const targetUser = await UserRepository.findById(id);
  if (!targetUser) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
    return;
  }

  await UserRepository.updateStatus(id, !!isActive);

  res.json({ success: true, message: `User status set to ${isActive ? 'Active' : 'Suspended'}.` });
});

/**
 * GET /api/v1/admin/audit-logs
 */
router.get('/audit-logs', async (req: AuthenticatedRequest, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
  const logs = await AuditRepository.listAuditLogs(limit);
  res.json({ success: true, logs });
});

/**
 * GET /api/v1/admin/security-events
 */
router.get('/security-events', async (req: AuthenticatedRequest, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
  const events = await AuditRepository.listSecurityEvents(limit);
  res.json({ success: true, events });
});

/**
 * GET /api/v1/admin/system-stats
 */
router.get('/system-stats', async (req: AuthenticatedRequest, res: Response) => {
  const dbStats = await AuditRepository.getSystemStats();

  res.json({
    success: true,
    server: {
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      activeSessions: dbStats.activeSessions,
      totalUsers: dbStats.totalUsers,
      totalProjects: dbStats.totalProjects,
      totalCircuits: dbStats.totalCircuits,
      simulationJobsTotal: dbStats.simulationJobsTotal,
    },
  });
});

export default router;

