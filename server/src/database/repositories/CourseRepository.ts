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
}

export class ChallengeRepository {
  public static async listChallenges() {
    try {
      return await pgDb.select().from(codingChallenges);
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
