/**
 * Q-Learn Nexus - Instructor Content Management API
 * RBAC Protected: Allows instructors and admins to create/manage courses, lessons, and quizzes.
 * @license Apache-2.0
 */

import { Router, Response } from 'express';
import { db, CourseRow, LessonRow } from '../database/index';
import { authenticateToken, requireInstructor, AuthenticatedRequest } from '../auth/middleware';
import { logAuditEvent } from '../security/auditLogger';
import crypto from 'crypto';

const router = Router();

// Apply instructor / admin check to all routes
router.use(authenticateToken, requireInstructor);

/**
 * POST /api/v1/instructor/courses
 */
router.post('/courses', (req: AuthenticatedRequest, res: Response) => {
  const { title, description, difficulty, category } = req.body;
  const courseId = `crs_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const now = new Date().toISOString();

  const newCourse: CourseRow = {
    id: courseId,
    title: title.trim(),
    description: (description || '').trim(),
    difficulty: difficulty || 'Beginner',
    category: category || 'Quantum Fundamentals',
    published: true,
    created_at: now,
    updated_at: now,
  };

  db.courses.set(courseId, newCourse);
  db.persist();

  logAuditEvent({
    userId: req.user!.id,
    action: 'INSTRUCTOR_CREATE_COURSE',
    resourceType: 'COURSE',
    resourceId: courseId,
    ipAddress: req.ip,
    status: 'SUCCESS',
  });

  res.status(201).json({ success: true, course: newCourse });
});

/**
 * POST /api/v1/instructor/courses/:courseId/lessons
 */
router.post('/courses/:courseId/lessons', (req: AuthenticatedRequest, res: Response) => {
  const { courseId } = req.params;
  const { title, description, content, xp, orderIndex } = req.body;

  if (!db.courses.has(courseId)) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Course not found' });
    return;
  }

  const lessonId = `lsn_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const now = new Date().toISOString();

  const newLesson: LessonRow = {
    id: lessonId,
    course_id: courseId,
    title: title.trim(),
    description: (description || '').trim(),
    content: content || '# Quantum Lesson\n\nContent here.',
    order_index: orderIndex || 1,
    xp: xp || 50,
    created_at: now,
    updated_at: now,
  };

  db.lessons.set(lessonId, newLesson);
  db.persist();

  res.status(201).json({ success: true, lesson: newLesson });
});

export default router;
