/**
 * Q-Learn Nexus - Notifications API
 * Lists user alerts, marks as read, batch acknowledges, and manages preferences.
 * @license Apache-2.0
 */

import { Router, Response } from 'express';
import { db } from '../database/index';
import { authenticateToken, AuthenticatedRequest } from '../auth/middleware';

const router = Router();

/**
 * GET /api/v1/notifications
 */
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const userNotifs = [];

  for (const notif of db.notifications.values()) {
    if (notif.user_id === userId) {
      userNotifs.push({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        read: notif.read,
        actionLink: notif.action_link,
        createdAt: notif.created_at,
      });
    }
  }

  // Sort descending by created_at
  userNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    notifications: userNotifs,
    unreadCount: userNotifs.filter((n) => !n.read).length,
  });
});

/**
 * PATCH /api/v1/notifications/:id/read
 */
router.patch('/:id/read', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const notif = db.notifications.get(id);

  if (!notif || notif.user_id !== req.user!.id) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Notification not found' });
    return;
  }

  notif.read = true;
  db.persist();

  res.json({ success: true, message: 'Notification marked as read.' });
});

/**
 * POST /api/v1/notifications/mark-all-read
 */
router.post('/mark-all-read', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  for (const notif of db.notifications.values()) {
    if (notif.user_id === userId) {
      notif.read = true;
    }
  }
  db.persist();

  res.json({ success: true, message: 'All notifications marked as read.' });
});

/**
 * DELETE /api/v1/notifications/:id
 */
router.delete('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const notif = db.notifications.get(id);

  if (!notif || notif.user_id !== req.user!.id) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Notification not found' });
    return;
  }

  db.notifications.delete(id);
  db.persist();

  res.json({ success: true, message: 'Notification deleted.' });
});

export default router;
