/**
 * Q-Learn Nexus - Profile & User Customization API
 * Manages profile metadata, theme settings, avatar uploads with security validation, and preferences.
 * Uses PostgreSQL UserRepository.
 * @license Apache-2.0
 */

import { Router, Response } from 'express';
import { UserRepository } from '../database/repositories/UserRepository';
import { authenticateToken, AuthenticatedRequest } from '../auth/middleware';
import { validateBody, updateProfileSchema } from '../security/validation';
import { logAuditEvent, logSecurityEvent } from '../security/auditLogger';

const router = Router();

/**
 * GET /api/v1/profile
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const profile = await UserRepository.getProfile(req.user!.id);
  res.json({
    user: {
      id: req.user!.id,
      name: req.user!.name,
      email: req.user!.email,
      username: req.user!.username,
      role: req.user!.role,
      created_at: req.user!.created_at,
    },
    profile: profile || null,
  });
});

/**
 * PATCH /api/v1/profile
 */
router.patch('/', authenticateToken, validateBody(updateProfileSchema), async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const updates = req.body;

  const updatedProfile = await UserRepository.updateProfile(userId, updates, updates.name);

  if (updates.name && updates.name.trim()) {
    req.user!.name = updates.name.trim();
  }

  logAuditEvent({
    userId,
    action: 'PROFILE_UPDATE',
    resourceType: 'PROFILE',
    resourceId: userId,
    ipAddress: req.ip,
    status: 'SUCCESS',
  });

  res.json({
    success: true,
    user: {
      id: req.user!.id,
      name: req.user!.name,
      email: req.user!.email,
      username: req.user!.username,
      role: req.user!.role,
    },
    profile: updatedProfile,
  });
});

/**
 * POST /api/v1/profile/avatar (Secure Avatar Upload)
 * Validates payload size, base64 MIME header, prevents path traversal, and bounds data to 2MB.
 */
router.post('/avatar', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { dataUrl } = req.body;
  const userId = req.user!.id;

  if (!dataUrl || typeof dataUrl !== 'string') {
    res.status(400).json({ error: 'INVALID_AVATAR_PAYLOAD', message: 'Valid image data URL required.' });
    return;
  }

  // Validate MIME type
  const match = dataUrl.match(/^data:(image\/(png|jpeg|jpg|webp|gif));base64,/i);
  if (!match) {
    logSecurityEvent({
      userId,
      eventType: 'INVALID_AVATAR_MIME_UPLOAD',
      severity: 'LOW',
      details: 'Rejected non-image payload in avatar upload',
      ipAddress: req.ip,
    });
    res.status(400).json({ error: 'INVALID_IMAGE_FORMAT', message: 'Only PNG, JPEG, WEBP, and GIF images are permitted.' });
    return;
  }

  // Check size limit (< 2MB base64)
  if (dataUrl.length > 2.8 * 1024 * 1024) {
    res.status(400).json({ error: 'IMAGE_TOO_LARGE', message: 'Avatar image must be under 2MB.' });
    return;
  }

  await UserRepository.updateProfile(userId, { avatar_url: dataUrl, avatar_preset: '' });

  logAuditEvent({
    userId,
    action: 'AVATAR_UPLOAD',
    resourceType: 'PROFILE',
    resourceId: userId,
    ipAddress: req.ip,
    status: 'SUCCESS',
  });

  res.json({ success: true, avatarUrl: dataUrl });
});

export default router;

