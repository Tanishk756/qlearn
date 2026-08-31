/**
 * Q-Learn Nexus - Notification Repository
 * Parameterized PostgreSQL queries for user alerts, system broadcasts, and preferences.
 * @license Apache-2.0
 */

import { eq, and, desc } from 'drizzle-orm';
import { pgDb } from '../client';
import { notifications, notificationPreferences } from '../schema/schema';

export interface NotificationDTO {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  actionLink?: string | null;
  createdAt: string;
}

export class NotificationRepository {
  public static async listByUser(userId: string): Promise<NotificationDTO[]> {
    try {
      const rows = await pgDb
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));

      return rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        title: r.title,
        message: r.message,
        type: r.type,
        read: r.read,
        actionLink: r.actionLink,
        createdAt: r.createdAt.toISOString(),
      }));
    } catch {
      return [];
    }
  }

  public static async markAsRead(id: string, userId: string): Promise<boolean> {
    try {
      const res = await pgDb
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
        .returning();
      return res.length > 0;
    } catch {
      return false;
    }
  }

  public static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      await pgDb
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, userId));
      return true;
    } catch {
      return false;
    }
  }

  public static async delete(id: string, userId: string): Promise<boolean> {
    try {
      const res = await pgDb
        .delete(notifications)
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
        .returning();
      return res.length > 0;
    } catch {
      return false;
    }
  }

  public static async create(data: {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    actionLink?: string;
  }): Promise<NotificationDTO | null> {
    try {
      const inserted = await pgDb
        .insert(notifications)
        .values({
          id: data.id,
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          read: false,
          actionLink: data.actionLink,
        })
        .returning();

      const r = inserted[0];
      return {
        id: r.id,
        userId: r.userId,
        title: r.title,
        message: r.message,
        type: r.type,
        read: r.read,
        actionLink: r.actionLink,
        createdAt: r.createdAt.toISOString(),
      };
    } catch {
      return null;
    }
  }
}
