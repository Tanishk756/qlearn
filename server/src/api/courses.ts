/**
 * Q-Learn Nexus - Courses & Learning Progress API
 * Curriculum browsing, lesson progress tracking, and interactive quiz submissions.
 * @license Apache-2.0
 */

import { Router, Response } from 'express';
import { db, LessonProgressRow, QuizAttemptRow } from '../database/index';
import { authenticateToken, optionalAuth, AuthenticatedRequest } from '../auth/middleware';
import { NotificationDispatcher } from '../notifications/dispatcher';
import crypto from 'crypto';

const router = Router();

/**
 * GET /api/v1/courses
 */
router.get('/', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const coursesList = [];
  const currentUserId = req.user?.id;

  for (const course of db.courses.values()) {
    if (course.published || course.is_published || req.user?.role === 'ADMIN' || req.user?.role === 'INSTRUCTOR') {
      const lessons = Array.from(db.lessons.values())
        .filter((l) => l.course_id === course.id)
        .sort((a, b) => a.order_index - b.order_index)
        .map((l) => {
          const progress = currentUserId ? db.lessonProgress.get(`${currentUserId}_${l.id}`) : null;
          return {
            id: l.id,
            title: l.title,
            description: l.description,
            orderIndex: l.order_index,
            xp: l.xp || 50,
            completed: progress ? progress.completed : false,
          };
        });

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
  }

  res.json({ success: true, courses: coursesList });
});

/**
 * GET /api/v1/courses/:courseId/lessons/:lessonId
 */
router.get('/:courseId/lessons/:lessonId', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { lessonId } = req.params;
  const lesson = db.lessons.get(lessonId);

  if (!lesson) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Lesson not found' });
    return;
  }

  const quizzes = Array.from(db.quizzes.values()).filter((q) => q.lesson_id === lessonId);
  const userProgress = req.user ? db.lessonProgress.get(`${req.user.id}_${lessonId}`) : null;

  res.json({
    lesson: {
      id: lesson.id,
      courseId: lesson.course_id,
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      orderIndex: lesson.order_index,
      xp: lesson.xp || 50,
      completed: userProgress ? userProgress.completed : false,
      quizzes: quizzes.map((q) => ({
        id: q.id,
        question: q.question,
        options: JSON.parse(q.options_json),
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
  const lesson = db.lessons.get(lessonId);

  if (!lesson) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Lesson not found' });
    return;
  }

  const key = `${userId}_${lessonId}`;
  let progress = db.lessonProgress.get(key);

  const xpEarned = lesson.xp || 50;

  if (!progress) {
    progress = {
      id: `lp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      user_id: userId,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    db.lessonProgress.set(key, progress);
    db.persist();

    // Send notification
    await NotificationDispatcher.dispatch({
      userId,
      type: 'COURSE_COMPLETED',
      title: 'Lesson Completed!',
      message: `You earned +${xpEarned} XP by completing "${lesson.title}".`,
      actionLink: `/learn`,
    });
  } else {
    progress.completed = true;
    progress.completed_at = new Date().toISOString();
    db.persist();
  }

  res.json({ success: true, message: 'Progress saved successfully.', xpEarned });
});

/**
 * POST /api/v1/courses/quizzes/:quizId/submit
 */
router.post('/quizzes/:quizId/submit', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { quizId } = req.params;
  const { selectedOptionIndex } = req.body;
  const userId = req.user!.id;

  const quiz = db.quizzes.get(quizId);
  if (!quiz) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Quiz question not found' });
    return;
  }

  const isCorrect = selectedOptionIndex === quiz.correct_option_index;
  const attemptRow: QuizAttemptRow = {
    id: `qa_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    user_id: userId,
    quiz_id: quizId,
    selected_option_index: selectedOptionIndex,
    is_correct: isCorrect,
    score: isCorrect ? 100 : 0,
    created_at: new Date().toISOString(),
  };

  db.quizAttempts.push(attemptRow);
  db.persist();

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
    correctOptionIndex: quiz.correct_option_index,
    explanation: quiz.explanation,
  });
});

export default router;
