/**
 * Q-Learn Nexus - Instructor Content Management API
 * RBAC Protected: Allows instructors and admins to create/manage courses, lessons, and quizzes.
 * Uses PostgreSQL CourseRepository.
 * @license Apache-2.0
 */

import { Router, Response } from 'express';
import { CourseRepository } from '../database/repositories/CourseRepository';
import { authenticateToken, requireInstructor, AuthenticatedRequest } from '../auth/middleware';
import { logAuditEvent } from '../security/auditLogger';
import crypto from 'crypto';

const router = Router();

// Apply instructor / admin check to all routes
router.use(authenticateToken, requireInstructor);

/**
 * POST /api/v1/instructor/courses
 */
router.post('/courses', async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, difficulty, category } = req.body;
  const courseId = `crs_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const newCourse = await CourseRepository.createCourse({
    id: courseId,
    title: (title || '').trim(),
    description: (description || '').trim(),
    difficulty: difficulty || 'Beginner',
    category: category || 'Quantum Fundamentals',
    authorId: req.user!.id,
    published: true,
  });

  if (!newCourse) {
    res.status(500).json({ error: 'CREATE_FAILED', message: 'Failed to create course.' });
    return;
  }

  logAuditEvent({
    userId: req.user!.id,
    action: 'INSTRUCTOR_CREATE_COURSE',
    resourceType: 'COURSE',
    resourceId: courseId,
    ipAddress: req.ip,
    status: 'SUCCESS',
  });

  res.status(201).json({
    success: true,
    course: {
      id: newCourse.id,
      title: newCourse.title,
      description: newCourse.description,
      difficulty: newCourse.difficulty,
      category: newCourse.category,
      published: newCourse.published,
      created_at: newCourse.createdAt.toISOString(),
      updated_at: newCourse.updatedAt.toISOString(),
    },
  });
});

/**
 * POST /api/v1/instructor/courses/:courseId/lessons
 */
router.post('/courses/:courseId/lessons', async (req: AuthenticatedRequest, res: Response) => {
  const { courseId } = req.params;
  const { title, description, content, xp, orderIndex } = req.body;

  const course = await CourseRepository.getCourse(courseId);
  if (!course) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Course not found' });
    return;
  }

  const lessonId = `lsn_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const newLesson = await CourseRepository.createLesson({
    id: lessonId,
    courseId,
    title: (title || '').trim(),
    description: (description || '').trim(),
    content: content || '# Quantum Lesson\n\nContent here.',
    orderIndex: orderIndex || 1,
    xp: xp || 50,
  });

  if (!newLesson) {
    res.status(500).json({ error: 'CREATE_FAILED', message: 'Failed to create lesson.' });
    return;
  }

  res.status(201).json({
    success: true,
    lesson: {
      id: newLesson.id,
      course_id: newLesson.courseId,
      title: newLesson.title,
      description: newLesson.description,
      content: newLesson.content,
      order_index: newLesson.orderIndex,
      xp: newLesson.xp,
      created_at: newLesson.createdAt.toISOString(),
      updated_at: newLesson.updatedAt.toISOString(),
    },
  });
});

export default router;

