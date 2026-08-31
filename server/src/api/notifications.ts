/**
 * Q-Learn Nexus - Notifications API
 * Lists user alerts, marks as read, batch acknowledges, and manages preferences.
 * Uses PostgreSQL NotificationRepository.
 * @license Apache-2.0
 */

import { Router, Response } from 'express';
import { NotificationRepository } from '../database/repositories/NotificationRepository';
import { authenticateToken, AuthenticatedRequest } from '../auth/middleware';

const router = Router();

/**
 * GET /api/v1/notifications
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const userNotifs = await NotificationRepository.listByUser(userId);

  res.json({
    success: true,
    notifications: userNotifs,
    unreadCount: userNotifs.filter((n) => !n.read).length,
  });
});

/**
 * PATCH /api/v1/notifications/:id/read
 */
router.patch('/:id/read', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = await NotificationRepository.markAsRead(id, req.user!.id);

  if (!success) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Notification not found' });
    return;
  }

  res.json({ success: true, message: 'Notification marked as read.' });
});

/**
 * POST /api/v1/notifications/mark-all-read
 */
router.post('/mark-all-read', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  await NotificationRepository.markAllAsRead(userId);

  res.json({ success: true, message: 'All notifications marked as read.' });
});

/**
 * DELETE /api/v1/notifications/:id
 */
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = await NotificationRepository.delete(id, req.user!.id);

  if (!success) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Notification not found' });
    return;
  }

  res.json({ success: true, message: 'Notification deleted.' });
});

export default router;

