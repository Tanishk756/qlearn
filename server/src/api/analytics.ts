/**
 * Q-Learn Nexus - Learning Analytics & Telemetry API
 * Records learner engagement events and computes proficiency metrics without storing PII.
 * @license Apache-2.0
 */

import { Router, Response } from 'express';
import { db, AnalyticsEventRow } from '../database/index';
import { optionalAuth, AuthenticatedRequest } from '../auth/middleware';
import crypto from 'crypto';

const router = Router();

/**
 * POST /api/v1/analytics/event
 */
router.post('/event', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { eventType, eventData } = req.body;
  const userId = req.user?.id;

  if (!eventType) {
    res.status(400).json({ error: 'INVALID_EVENT', message: 'eventType is required' });
    return;
  }

  const row: AnalyticsEventRow = {
    id: `ev_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    user_id: userId,
    event_type: eventType,
    event_data: JSON.stringify(eventData || {}),
    created_at: new Date().toISOString(),
  };

  db.analyticsEvents.push(row);
  db.persist();

  res.status(201).json({ success: true });
});

/**
 * GET /api/v1/analytics/summary
 */
router.get('/summary', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  const totalUsers = db.users.size;
  const totalProjects = db.projects.size;
  const totalSimulations = db.simulationJobs.size;
  const totalCompletedLessons = Array.from(db.lessonProgress.values()).filter((p) => p.completed).length;

  res.json({
    platformStats: {
      activeLearners: totalUsers,
      publishedProjects: totalProjects,
      simulationsExecuted: totalSimulations,
      lessonsCompleted: totalCompletedLessons,
    },
    userStats: userId ? {
      myCompletedLessons: Array.from(db.lessonProgress.values()).filter((p) => p.user_id === userId && p.completed).length,
      myProjectsCount: Array.from(db.projects.values()).filter((p) => p.user_id === userId).length,
      mySimulationsCount: Array.from(db.simulationJobs.values()).filter((p) => p.user_id === userId).length,
    } : null,
  });
});

export default router;
