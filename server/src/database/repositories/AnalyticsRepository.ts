/**
 * Q-Learn Nexus - Analytics Repository
 * Records telemetry events and aggregates platform usage metrics in PostgreSQL.
 * @license Apache-2.0
 */

import { eq, and } from 'drizzle-orm';
import { pgDb } from '../client';
import { learningEvents, users, projects, simulationJobs, lessonProgress } from '../schema/schema';

export class AnalyticsRepository {
  public static async recordEvent(params: {
    id: string;
    userId?: string;
    eventType: string;
    eventData?: Record<string, any>;
  }): Promise<void> {
    try {
      if (!params.userId) return;
      await pgDb.insert(learningEvents).values({
        id: params.id,
        userId: params.userId,
        eventType: params.eventType,
        eventDataJson: JSON.stringify(params.eventData || {}),
      });
    } catch (err) {
      console.error('[AnalyticsRepository] Failed to record event:', err);
    }
  }

  public static async getSummary(userId?: string) {
    try {
      const [uList, pList, sList, lList] = await Promise.all([
        pgDb.select().from(users),
        pgDb.select().from(projects),
        pgDb.select().from(simulationJobs),
        pgDb.select().from(lessonProgress),
      ]);

      const completedLessons = lList.filter((l) => l.completed).length;

      let userStats = null;
      if (userId) {
        const myCompletedLessons = lList.filter((l) => l.userId === userId && l.completed).length;
        const myProjects = pList.filter((p) => p.ownerId === userId).length;
        const mySimulations = sList.filter((s) => s.userId === userId).length;

        userStats = {
          myCompletedLessons,
          myProjectsCount: myProjects,
          mySimulationsCount: mySimulations,
        };
      }

      return {
        platformStats: {
          activeLearners: uList.length,
          publishedProjects: pList.length,
          simulationsExecuted: sList.length,
          lessonsCompleted: completedLessons,
        },
        userStats,
      };
    } catch {
      return {
        platformStats: {
          activeLearners: 0,
          publishedProjects: 0,
          simulationsExecuted: 0,
          lessonsCompleted: 0,
        },
        userStats: userId
          ? {
              myCompletedLessons: 0,
              myProjectsCount: 0,
              mySimulationsCount: 0,
            }
          : null,
      };
    }
  }
}
