/**
 * Q-Learn Nexus - Event-Driven Notification Dispatcher
 * Persists notifications to database and supports real-time dispatch.
 * @license Apache-2.0
 */

import { db, NotificationRow } from '../database/index';
import crypto from 'crypto';

export interface DispatchNotificationEvent {
  userId: string;
  type: 'SIMULATION_COMPLETED' | 'COURSE_COMPLETED' | 'QUIZ_COMPLETED' | 'ACHIEVEMENT_UNLOCKED' | 'PROJECT_SHARED' | 'MENTION' | 'NEW_COURSE' | 'SYSTEM_ANNOUNCEMENT' | 'SECURITY_ALERT';
  title: string;
  message: string;
  actionLink?: string;
}

export class NotificationDispatcher {
  /**
   * Dispatches a persistent notification to a user.
   */
  public static async dispatch(event: DispatchNotificationEvent): Promise<NotificationRow> {
    const userProfile = db.profiles.get(event.userId);
    let allowNotification = true;

    if (userProfile?.preferences) {
      try {
        const prefs = JSON.parse(userProfile.preferences);
        if (event.type === 'MENTION' && prefs.mentions === false) allowNotification = false;
        if (event.type === 'SYSTEM_ANNOUNCEMENT' && prefs.importantUpdates === false) allowNotification = false;
      } catch {
        // Fallback default
      }
    }

    const notifId = `notif_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const row: NotificationRow = {
      id: notifId,
      user_id: event.userId,
      title: event.title,
      message: event.message,
      type: event.type,
      read: false,
      action_link: event.actionLink,
      created_at: new Date().toISOString(),
    };

    if (allowNotification) {
      db.notifications.set(notifId, row);
      db.persist();
    }

    return row;
  }

  /**
   * Broadcasts a system announcement to all active users.
   */
  public static async broadcastAnnouncement(title: string, message: string): Promise<number> {
    let count = 0;
    for (const user of db.users.values()) {
      if (user.is_active) {
        await this.dispatch({
          userId: user.id,
          type: 'SYSTEM_ANNOUNCEMENT',
          title,
          message,
        });
        count++;
      }
    }
    return count;
  }
}
