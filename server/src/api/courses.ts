/**
 * Q-Learn Nexus - Courses & Learning Progress API
 * Curriculum browsing, lesson progress tracking, and interactive quiz submissions.
 * Uses PostgreSQL CourseRepository.
 * @license Apache-2.0
 */

import { Router, Response } from 'express';
import { CourseRepository } from '../database/repositories/CourseRepository';
import { authenticateToken, optionalAuth, AuthenticatedRequest } from '../auth/middleware';
import { NotificationDispatcher } from '../notifications/dispatcher';
import crypto from 'crypto';

const router = Router();

/**
 * GET /api/v1/courses
 */
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.id;
  const isInstructorOrAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'INSTRUCTOR';

  const coursesList = [];
  const allCourses = await CourseRepository.listCourses(isInstructorOrAdmin);
  const userProgressList = currentUserId ? await CourseRepository.getUserLessonProgress(currentUserId) : [];
  const completedLessonMap = new Map<string, boolean>();
  for (const p of userProgressList) {
    if (p.completed) completedLessonMap.set(p.lessonId, true);
  }

  for (const course of allCourses) {
    const courseLessons = await CourseRepository.getLessonsForCourse(course.id);
    const lessons = courseLessons.map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      orderIndex: l.orderIndex,
      xp: l.xp || 50,
      completed: !!completedLessonMap.get(l.id),
    }));

    coursesList.push({
      id: course.id,
      title: course.title,
      description: course.description,
      difficulty: course.difficulty || course.level || 'Beginner',
      category: course.category || 'Fundamentals',
      totalLessons: lessons.length,
      lessons,
    });
  }

  res.json({ success: true, courses: coursesList });
});

/**
 * GET /api/v1/courses/:courseId/lessons/:lessonId
 */
router.get('/:courseId/lessons/:lessonId', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { lessonId } = req.params;
  const currentUserId = req.user?.id;

  const result = await CourseRepository.getLessonWithDetails(lessonId, currentUserId);

  if (!result || !result.lesson) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Lesson not found' });
    return;
  }

  const { lesson, quizzes, progress } = result;

  res.json({
    lesson: {
      id: lesson.id,
      courseId: lesson.courseId,
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      orderIndex: lesson.orderIndex,
      xp: lesson.xp || 50,
      completed: progress ? progress.completed : false,
      quizzes: quizzes.map((q) => ({
        id: q.id,
        question: q.question,
        options: JSON.parse(q.optionsJson || '[]'),
        explanation: q.explanation,
      })),
    },
  });
});

/**
 * POST /api/v1/courses/:courseId/lessons/:lessonId/complete
 */
router.post('/:courseId/lessons/:lessonId/complete', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { lessonId } = req.params;
  const userId = req.user!.id;
  const lesson = await CourseRepository.getLesson(lessonId);

  if (!lesson) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Lesson not found' });
    return;
  }

  const xpEarned = lesson.xp || 50;
  await CourseRepository.markLessonComplete(userId, lessonId);

  // Send notification
  await NotificationDispatcher.dispatch({
    userId,
    type: 'COURSE_COMPLETED',
    title: 'Lesson Completed!',
    message: `You earned +${xpEarned} XP by completing "${lesson.title}".`,
    actionLink: `/learn`,
  });

  res.json({ success: true, message: 'Progress saved successfully.', xpEarned });
});

/**
 * POST /api/v1/courses/quizzes/:quizId/submit
 */
router.post('/quizzes/:quizId/submit', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { quizId } = req.params;
  const { selectedOptionIndex } = req.body;
  const userId = req.user!.id;

  const quiz = await CourseRepository.getQuiz(quizId);
  if (!quiz) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Quiz question not found' });
    return;
  }

  const isCorrect = selectedOptionIndex === quiz.correctOptionIndex;
  const attemptId = `qa_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  await CourseRepository.recordQuizAttempt({
    id: attemptId,
    userId,
    quizId,
    selectedOptionIndex,
    isCorrect,
    score: isCorrect ? 100 : 0,
  });

  if (isCorrect) {
    await NotificationDispatcher.dispatch({
      userId,
      type: 'QUIZ_COMPLETED',
      title: 'Quantum Quiz Ace!',
      message: `Correct! You answered the quiz for "${quiz.question.slice(0, 40)}..." accurately.`,
      actionLink: '/learn',
    });
  }

  res.json({
    success: true,
    isCorrect,
    correctOptionIndex: quiz.correctOptionIndex,
    explanation: quiz.explanation,
  });
});

export default router;

