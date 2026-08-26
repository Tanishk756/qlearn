/**
 * Q-Learn Nexus - Authentication REST Endpoints
 * Registration, login, logout, session management, secure password recovery, and account deletion.
 * @license Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { db, UserRow, ProfileRow, PasswordResetRow } from '../database/index';
import { hashPassword, verifyPassword, performDummyPasswordCheck, generateSecureDigitCode, generateSecureToken, hashToken, constantTimeEquals } from '../security/crypto';
import { createSession, destroySession, invalidateAllUserSessions } from '../auth/session';
import { authenticateToken, AuthenticatedRequest } from '../auth/middleware';
import { validateBody, registerSchema, loginSchema, passwordRecoverSchema, passwordResetSchema, changePasswordSchema } from '../security/validation';
import { authRateLimiter, passwordResetRateLimiter } from '../security/rateLimiter';
import { EmailService } from '../services/EmailService';
import { logAuditEvent, logSecurityEvent } from '../security/auditLogger';
import crypto from 'crypto';

const router = Router();

/**
 * POST /api/v1/auth/register
 */
router.post('/register', authRateLimiter, validateBody(registerSchema), async (req: Request, res: Response) => {
  const { email, password, name, username, affiliation, quantumLevel } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  // Check existing
  for (const user of db.users.values()) {
    if (user.email.toLowerCase() === normalizedEmail) {
      res.status(409).json({
        error: 'ACCOUNT_EXISTS',
        message: 'An account with this email address already exists. Please sign in.',
      });
      return;
    }
  }

  const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(password);

  const newUser: UserRow = {
    id: userId,
    email: normalizedEmail,
    password_hash: passwordHash,
    name: name.trim(),
    username: username || name.toLowerCase().replace(/\s+/g, '_'),
    role: 'STUDENT',
    is_active: true,
    is_verified: true, // Default verified for frictionless classroom onboarding
    created_at: now,
    updated_at: now,
  };

  const newProfile: ProfileRow = {
    user_id: userId,
    avatar_url: '',
    avatar_preset: 'bloch-sphere',
    bio: `Quantum computing enthusiast studying ${quantumLevel || 'quantum algorithms'} and circuit compilation.`,
    affiliation: affiliation || 'Quantum Learning Community',
    quantum_proficiency: quantumLevel || 'Student',
    theme: 'natural',
    preferences: JSON.stringify({
      newMessages: true,
      importantUpdates: true,
      mentions: true,
      soundAlerts: true,
    }),
    created_at: now,
    updated_at: now,
  };

  db.users.set(userId, newUser);
  db.profiles.set(userId, newProfile);
  db.persist();

  // Create session
  const session = createSession(userId, req.ip, req.headers['user-agent']);

  // Set secure cookie
  res.cookie('nexus_session', `${session.sessionId}.${session.rawToken}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 14 * 24 * 60 * 60 * 1000,
  });

  logAuditEvent({
    userId,
    action: 'USER_REGISTER',
    resourceType: 'USER',
    resourceId: userId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    status: 'SUCCESS',
  });

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token: `${session.sessionId}.${session.rawToken}`,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
      profile: newProfile,
    },
  });
});

/**
 * POST /api/v1/auth/login
 */
router.post('/login', authRateLimiter, validateBody(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  let targetUser: UserRow | null = null;
  for (const user of db.users.values()) {
    if (user.email.toLowerCase() === normalizedEmail) {
      targetUser = user;
      break;
    }
  }

  if (!targetUser) {
    // Perform dummy bcrypt comparison to ensure identical execution timing
    await performDummyPasswordCheck(password);

    logSecurityEvent({
      eventType: 'FAILED_LOGIN_UNKNOWN_EMAIL',
      severity: 'LOW',
      details: `Failed login attempt for non-existent email: ${normalizedEmail}`,
      ipAddress: req.ip,
    });

    res.status(401).json({
      error: 'INVALID_CREDENTIALS',
      message: 'Incorrect email or password. Please verify your credentials.',
    });
    return;
  }

  const passwordMatch = await verifyPassword(password, targetUser.password_hash);
  if (!passwordMatch) {
    logSecurityEvent({
      userId: targetUser.id,
      eventType: 'FAILED_LOGIN_INCORRECT_PASSWORD',
      severity: 'MEDIUM',
      details: `Incorrect password entered for user ${targetUser.email}`,
      ipAddress: req.ip,
    });

    res.status(401).json({
      error: 'INVALID_CREDENTIALS',
      message: 'Incorrect email or password. Please verify your credentials.',
    });
    return;
  }

  if (!targetUser.is_active) {
    res.status(403).json({
      error: 'ACCOUNT_DISABLED',
      message: 'This account has been disabled. Please contact platform administration.',
    });
    return;
  }

  const session = createSession(targetUser.id, req.ip, req.headers['user-agent']);
  const profile = db.profiles.get(targetUser.id);

  res.cookie('nexus_session', `${session.sessionId}.${session.rawToken}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 14 * 24 * 60 * 60 * 1000,
  });

  logAuditEvent({
    userId: targetUser.id,
    action: 'USER_LOGIN',
    resourceType: 'SESSION',
    resourceId: session.sessionId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    status: 'SUCCESS',
  });

  res.json({
    success: true,
    token: `${session.sessionId}.${session.rawToken}`,
    user: {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      username: targetUser.username,
      role: targetUser.role,
      profile: profile || null,
    },
  });
});

/**
 * POST /api/v1/auth/logout
 */
router.post('/logout', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.sessionId) {
    destroySession(req.sessionId);
  }
  res.clearCookie('nexus_session');

  logAuditEvent({
    userId: req.user?.id,
    action: 'USER_LOGOUT',
    resourceType: 'SESSION',
    resourceId: req.sessionId,
    ipAddress: req.ip,
    status: 'SUCCESS',
  });

  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/v1/auth/me
 */
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const profile = req.user ? db.profiles.get(req.user.id) : null;
  res.json({
    user: {
      id: req.user!.id,
      name: req.user!.name,
      email: req.user!.email,
      username: req.user!.username,
      role: req.user!.role,
      is_active: req.user!.is_active,
      is_verified: req.user!.is_verified,
      profile: profile || null,
    },
  });
});

/**
 * POST /api/v1/auth/recover-password
 * Step 1: User submits email. Always return a generic response to prevent user enumeration.
 */
router.post('/recover-password', passwordResetRateLimiter, validateBody(passwordRecoverSchema), async (req: Request, res: Response) => {
  const { email } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  let targetUser: UserRow | null = null;
  for (const user of db.users.values()) {
    if (user.email.toLowerCase() === normalizedEmail) {
      targetUser = user;
      break;
    }
  }

  if (targetUser && targetUser.is_active) {
    const rawCode = generateSecureDigitCode();
    const rawToken = generateSecureToken(32);
    const codeHash = hashToken(rawCode);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    const resetId = `pr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const resetRecord: PasswordResetRow = {
      id: resetId,
      user_id: targetUser.id,
      token_hash: tokenHash,
      code_hash: codeHash,
      expires_at: expiresAt,
      used: false,
      created_at: new Date().toISOString(),
    };

    db.passwordResets.set(resetId, resetRecord);
    db.persist();

    // Send transactional email
    await EmailService.sendPasswordReset(targetUser.email, rawCode, rawToken);

    logAuditEvent({
      userId: targetUser.id,
      action: 'PASSWORD_RESET_REQUESTED',
      resourceType: 'PASSWORD_RESET',
      resourceId: resetId,
      ipAddress: req.ip,
      status: 'SUCCESS',
    });
  }

  // Always return generic message
  res.json({
    success: true,
    message: 'If an active account exists for that email address, a password reset code and link have been dispatched.',
  });
});

/**
 * POST /api/v1/auth/reset-password
 * Step 2: Reset password using verified code.
 */
router.post('/reset-password', passwordResetRateLimiter, validateBody(passwordResetSchema), async (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  const candidateCodeHash = hashToken(code.trim());

  let targetUser: UserRow | null = null;
  for (const user of db.users.values()) {
    if (user.email.toLowerCase() === normalizedEmail) {
      targetUser = user;
      break;
    }
  }

  if (!targetUser) {
    constantTimeEquals(candidateCodeHash, candidateCodeHash);
    res.status(400).json({
      error: 'INVALID_RESET_REQUEST',
      message: 'Invalid or expired password reset verification code. Please request a new code.',
    });
    return;
  }

  // Find active, unused reset record for this user
  let validReset: PasswordResetRow | null = null;
  for (const pr of db.passwordResets.values()) {
    if (pr.user_id === targetUser.id && !pr.used) {
      if (new Date(pr.expires_at).getTime() >= Date.now()) {
        if (constantTimeEquals(pr.code_hash, candidateCodeHash)) {
          validReset = pr;
          break;
        }
      }
    }
  }

  if (!validReset) {
    logSecurityEvent({
      userId: targetUser.id,
      eventType: 'INVALID_PASSWORD_RESET_CODE_ATTEMPT',
      severity: 'MEDIUM',
      details: `Invalid verification code submitted for user ${targetUser.email}`,
      ipAddress: req.ip,
    });

    res.status(400).json({
      error: 'INVALID_RESET_REQUEST',
      message: 'Invalid or expired password reset verification code. Please request a new code.',
    });
    return;
  }

  // Mark token as used
  validReset.used = true;

  // Hash new password and save
  targetUser.password_hash = await hashPassword(newPassword);
  targetUser.updated_at = new Date().toISOString();

  // Invalidate all active sessions for security
  invalidateAllUserSessions(targetUser.id);
  db.persist();

  // Send security notification email
  await EmailService.sendPasswordChanged(targetUser.email);

  logAuditEvent({
    userId: targetUser.id,
    action: 'PASSWORD_RESET_COMPLETED',
    resourceType: 'USER',
    resourceId: targetUser.id,
    ipAddress: req.ip,
    status: 'SUCCESS',
  });

  res.json({
    success: true,
    message: 'Your password has been reset successfully. Please sign in with your new credentials.',
  });
});

/**
 * POST /api/v1/auth/change-password
 */
router.post('/change-password', authenticateToken, validateBody(changePasswordSchema), async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user!;

  const matches = await verifyPassword(currentPassword, user.password_hash);
  if (!matches) {
    res.status(400).json({ error: 'INCORRECT_CURRENT_PASSWORD', message: 'Current password does not match.' });
    return;
  }

  user.password_hash = await hashPassword(newPassword);
  user.updated_at = new Date().toISOString();
  invalidateAllUserSessions(user.id);
  db.persist();

  await EmailService.sendPasswordChanged(user.email);

  logAuditEvent({
    userId: user.id,
    action: 'PASSWORD_CHANGE_DIRECT',
    resourceType: 'USER',
    resourceId: user.id,
    ipAddress: req.ip,
    status: 'SUCCESS',
  });

  res.json({ success: true, message: 'Password changed successfully. Please log in again.' });
});

/**
 * DELETE /api/v1/auth/account (GDPR / Privacy Data Erasure)
 */
router.delete('/account', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  // Erase user profile, sessions, projects
  db.users.delete(userId);
  db.profiles.delete(userId);
  invalidateAllUserSessions(userId);

  for (const [id, proj] of db.projects.entries()) {
    if (proj.user_id === userId) db.projects.delete(id);
  }
  for (const [id, notif] of db.notifications.entries()) {
    if (notif.user_id === userId) db.notifications.delete(id);
  }
  db.persist();

  res.clearCookie('nexus_session');

  logAuditEvent({
    userId,
    action: 'ACCOUNT_PERMANENTLY_DELETED',
    resourceType: 'USER',
    resourceId: userId,
    ipAddress: req.ip,
    status: 'SUCCESS',
  });

  res.json({ success: true, message: 'Account and associated data deleted permanently.' });
});

export default router;
