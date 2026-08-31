/**
 * Q-Learn Nexus - Course & Challenge Repositories
 * Parameterized access for Curriculum, Lessons, Quizzes, Challenges, and Progress.
 * @license Apache-2.0
 */

import { eq, and, desc } from 'drizzle-orm';
import { pgDb } from '../client';
import {
  courses,
  modules,
  lessons,
  lessonProgress,
  quizzes,
  quizAttempts,
  codingChallenges,
  challengeSubmissions,
} from '../schema/schema';

export class CourseRepository {
  public static async getCourse(courseId: string) {
    try {
      const rows = await pgDb.select().from(courses).where(eq(courses.id, courseId)).limit(1);
      return rows.length ? rows[0] : null;
    } catch {
      return null;
    }
  }

  public static async createCourse(params: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    category: string;
    authorId?: string;
    published?: boolean;
  }) {
    try {
      const slug = `${params.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${params.id.slice(-6)}`;
      const inserted = await pgDb
        .insert(courses)
        .values({
          id: params.id,
          title: params.title,
          slug,
          description: params.description,
          difficulty: params.difficulty,
          category: params.category,
          authorId: params.authorId,
          published: params.published !== undefined ? params.published : true,
        })
        .returning();
      return inserted[0];
    } catch {
      return null;
    }
  }

  public static async createLesson(params: {
    id: string;
    courseId: string;
    title: string;
    description: string;
    content: string;
    orderIndex: number;
    xp: number;
  }) {
    try {
      const inserted = await pgDb
        .insert(lessons)
        .values({
          id: params.id,
          courseId: params.courseId,
          title: params.title,
          description: params.description,
          content: params.content,
          orderIndex: params.orderIndex,
          xp: params.xp,
        })
        .returning();
      return inserted[0];
    } catch {
      return null;
    }
  }

  public static async listCourses(includeUnpublished = false) {
    try {
      const query = includeUnpublished
        ? pgDb.select().from(courses).orderBy(courses.orderIndex)
        : pgDb.select().from(courses).where(eq(courses.published, true)).orderBy(courses.orderIndex);
      return await query;
    } catch {
      return [];
    }
  }

  public static async getLessonsForCourse(courseId: string) {
    try {
      return await pgDb.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(lessons.orderIndex);
    } catch {
      return [];
    }
  }

  public static async getUserLessonProgress(userId: string) {
    try {
      return await pgDb.select().from(lessonProgress).where(eq(lessonProgress.userId, userId));
    } catch {
      return [];
    }
  }

  public static async getLessonWithDetails(lessonId: string, userId?: string) {
    try {
      const lessonRows = await pgDb.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
      if (!lessonRows.length) return null;
      const lesson = lessonRows[0];

      const quizRows = await pgDb.select().from(quizzes).where(eq(quizzes.lessonId, lessonId));

      let userProgress = null;
      if (userId) {
        const progressRows = await pgDb
          .select()
          .from(lessonProgress)
          .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)))
          .limit(1);
        if (progressRows.length) userProgress = progressRows[0];
      }

      return {
        lesson,
        quizzes: quizRows,
        progress: userProgress,
      };
    } catch {
      return null;
    }
  }

  public static async markLessonComplete(userId: string, lessonId: string): Promise<boolean> {
    try {
      await pgDb
        .insert(lessonProgress)
        .values({
          id: `lp_${userId}_${lessonId}`,
          userId,
          lessonId,
          completed: true,
          completedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [lessonProgress.userId, lessonProgress.lessonId],
          set: {
            completed: true,
            completedAt: new Date(),
          },
        });
      return true;
    } catch {
      return false;
    }
  }

  public static async getLesson(lessonId: string) {
    try {
      const rows = await pgDb.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
      return rows.length ? rows[0] : null;
    } catch {
      return null;
    }
  }

  public static async getQuiz(quizId: string) {
    try {
      const rows = await pgDb.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
      return rows.length ? rows[0] : null;
    } catch {
      return null;
    }
  }

  public static async recordQuizAttempt(params: {
    id: string;
    userId: string;
    quizId: string;
    selectedOptionIndex: number;
    isCorrect: boolean;
    score: number;
  }): Promise<boolean> {
    try {
      await pgDb.insert(quizAttempts).values({
        id: params.id,
        userId: params.userId,
        quizId: params.quizId,
        selectedOptionIndex: params.selectedOptionIndex,
        isCorrect: params.isCorrect,
        score: params.score,
      });
      return true;
    } catch {
      return false;
    }
  }
}

export class ChallengeRepository {
  public static async listChallenges() {
    try {
      return await pgDb.select().from(codingChallenges);
    } catch {
      return [];
    }
  }

  public static async getChallenge(id: string) {
    try {
      const rows = await pgDb.select().from(codingChallenges).where(eq(codingChallenges.id, id)).limit(1);
      return rows.length ? rows[0] : null;
    } catch {
      return null;
    }
  }

  public static async getUserSubmissions(userId: string) {
    try {
      return await pgDb.select().from(challengeSubmissions).where(eq(challengeSubmissions.userId, userId));
    } catch {
      return [];
    }
  }

  public static async recordSubmission(params: {
    id: string;
    userId: string;
    challengeId: string;
    codeSubmitted: string;
    passed: boolean;
    output: string;
    executionTimeMs?: number;
  }) {
    try {
      await pgDb.insert(challengeSubmissions).values({
        id: params.id,
        userId: params.userId,
        challengeId: params.challengeId,
        codeSubmitted: params.codeSubmitted,
        passed: params.passed,
        output: params.output,
        executionTimeMs: params.executionTimeMs || 0,
      });
      return true;
    } catch {
      return false;
    }
  }
}
