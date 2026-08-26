/**
 * Q-Learn Nexus - Master API Router
 * Aggregates all modular REST endpoints under /api/v1.
 * @license Apache-2.0
 */

import { Router } from 'express';
import authRoutes from './auth';
import profileRoutes from './profile';
import projectRoutes from './projects';
import simulationRoutes from './simulations';
import sandboxRoutes from './sandbox';
import codeRoutes from './code';
import aiRoutes from './ai';
import courseRoutes from './courses';
import challengeRoutes from './challenges';
import notificationRoutes from './notifications';
import analyticsRoutes from './analytics';
import instructorRoutes from './instructor';
import adminRoutes from './admin';
import healthRoutes from './health';

const router = Router();

// Health checks (accessible at /api/health, /api/v1/health, and /health)
router.use('/', healthRoutes);
router.use('/v1', healthRoutes);

// Versioned API sub-routes
router.use('/v1/auth', authRoutes);
router.use('/v1/profile', profileRoutes);
router.use('/v1/projects', projectRoutes);
router.use('/v1/simulations', simulationRoutes);
router.use('/v1/sandbox', sandboxRoutes);
router.use('/v1/code', codeRoutes);
router.use('/v1/ai', aiRoutes);
router.use('/v1/courses', courseRoutes);
router.use('/v1/challenges', challengeRoutes);
router.use('/v1/notifications', notificationRoutes);
router.use('/v1/analytics', analyticsRoutes);
router.use('/v1/instructor', instructorRoutes);
router.use('/v1/admin', adminRoutes);

export default router;
