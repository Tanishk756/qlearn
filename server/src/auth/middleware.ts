/**
 * Q-Learn Nexus - Authentication & RBAC Middleware
 * Enforces server-side identity verification and role authorization.
 * @license Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { validateSession } from './session';
import { UserDTO } from '../database/repositories/UserRepository';
import { logSecurityEvent } from '../security/auditLogger';

export interface AuthenticatedRequest extends Request {
  user?: UserDTO;
  sessionId?: string;
}

/**
 * Extracts session token from Authorization Header or Cookie and attaches user to request.
 */
export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && req.cookies.nexus_session) {
    token = req.cookies.nexus_session;
  }

  if (!token) {
    res.status(401).json({
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Valid authentication session required to access this resource.',
    });
    return;
  }

  const result = await validateSession(token);
  if (!result) {
    res.status(401).json({
      error: 'INVALID_OR_EXPIRED_SESSION',
      message: 'Session has expired or is invalid. Please sign in again.',
    });
    return;
  }

  req.user = result.user;
  req.sessionId = result.session.id;
  next();
}

/**
 * Optional authentication: attaches user if token is valid, but does not block unauthenticated requests.
 */
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && req.cookies.nexus_session) {
    token = req.cookies.nexus_session;
  }

  if (token) {
    const result = await validateSession(token);
    if (result) {
      req.user = result.user;
      req.sessionId = result.session.id;
    }
  }
  next();
}

/**
 * Role-Based Access Control (RBAC) Guard.
 * Roles hierarchy / checks: ADMIN > INSTRUCTOR > RESEARCHER > STUDENT
 */
export function requireRole(...allowedRoles: Array<'STUDENT' | 'RESEARCHER' | 'INSTRUCTOR' | 'ADMIN'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logSecurityEvent({
        userId: req.user.id,
        eventType: 'UNAUTHORIZED_ROLE_ACCESS_ATTEMPT',
        severity: 'MEDIUM',
        details: `User with role ${req.user.role} attempted to access route requiring ${allowedRoles.join(', ')}`,
        ipAddress: req.ip,
      });

      res.status(403).json({
        error: 'FORBIDDEN_INSUFFICIENT_PERMISSIONS',
        message: `Your current role (${req.user.role}) is not authorized to access this resource.`,
      });
      return;
    }

    next();
  };
}

export const requireAdmin = requireRole('ADMIN');
export const requireInstructor = requireRole('INSTRUCTOR', 'ADMIN');
export const requireResearcher = requireRole('RESEARCHER', 'INSTRUCTOR', 'ADMIN');
