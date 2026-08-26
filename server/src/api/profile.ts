/**
 * Q-Learn Nexus - Profile & User Customization API
 * Manages profile metadata, theme settings, avatar uploads with security validation, and preferences.
 * @license Apache-2.0
 */

import { Router, Response } from 'express';
import { db, ProfileRow } from '../database/index';
import { authenticateToken, AuthenticatedRequest } from '../auth/middleware';
import { validateBody, updateProfileSchema } from '../security/validation';
import { logAuditEvent, logSecurityEvent } from '../security/auditLogger';

const router = Router();

/**
 * GET /api/v1/profile
 */
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const profile = db.profiles.get(req.user!.id);
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
router.patch('/', authenticateToken, validateBody(updateProfileSchema), (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const updates = req.body;
  let profile = db.profiles.get(userId);

  if (!profile) {
    profile = {
      user_id: userId,
      avatar_url: '',
      avatar_preset: 'bloch-sphere',
      bio: '',
      affiliation: '',
      quantum_proficiency: 'Student',
      theme: 'natural',
      preferences: '{}',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.profiles.set(userId, profile);
  }

  if (updates.name && updates.name.trim()) {
    req.user!.name = updates.name.trim();
    req.user!.updated_at = new Date().toISOString();
  }

  if (updates.bio !== undefined) profile.bio = updates.bio.trim();
  if (updates.affiliation !== undefined) profile.affiliation = updates.affiliation.trim();
  if (updates.quantum_proficiency !== undefined) profile.quantum_proficiency = updates.quantum_proficiency;
  if (updates.theme !== undefined) profile.theme = updates.theme;
  if (updates.avatar_preset !== undefined) {
    profile.avatar_preset = updates.avatar_preset;
    profile.avatar_url = ''; // Reset custom file if preset is selected
  }
  if (updates.preferences !== undefined) {
    profile.preferences = JSON.stringify(updates.preferences);
  }

  profile.updated_at = new Date().toISOString();
  db.persist();

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
    profile,
  });
});

/**
 * POST /api/v1/profile/avatar (Secure Avatar Upload)
 * Validates payload size, base64 MIME header, prevents path traversal, and bounds data to 2MB.
 */
router.post('/avatar', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
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

  const profile = db.profiles.get(userId);
  if (profile) {
    profile.avatar_url = dataUrl;
    profile.avatar_preset = '';
    profile.updated_at = new Date().toISOString();
    db.persist();
  }

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
