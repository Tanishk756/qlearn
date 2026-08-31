/**
 * Q-Learn Nexus - Learning Analytics & Telemetry API
 * Records learner engagement events and computes proficiency metrics without storing PII.
 * Uses PostgreSQL AnalyticsRepository.
 * @license Apache-2.0
 */

import { Router, Response } from 'express';
import { AnalyticsRepository } from '../database/repositories/AnalyticsRepository';
import { optionalAuth, AuthenticatedRequest } from '../auth/middleware';
import crypto from 'crypto';

const router = Router();

/**
 * POST /api/v1/analytics/event
 */
router.post('/event', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { eventType, eventData } = req.body;
  const userId = req.user?.id;

  if (!eventType) {
    res.status(400).json({ error: 'INVALID_EVENT', message: 'eventType is required' });
    return;
  }

  const id = `ev_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  await AnalyticsRepository.recordEvent({
    id,
    userId,
    eventType,
    eventData,
  });

  res.status(201).json({ success: true });
});

/**
 * GET /api/v1/analytics/summary
 */
router.get('/summary', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const summary = await AnalyticsRepository.getSummary(userId);

  res.json(summary);
});

export default router;

