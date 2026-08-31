/**
 * Q-Learn Nexus - Event-Driven Notification Dispatcher
 * Persists notifications to database and supports real-time dispatch.
 * Uses PostgreSQL NotificationRepository and UserRepository.
 * @license Apache-2.0
 */

import { NotificationRepository } from '../database/repositories/NotificationRepository';
import { UserRepository } from '../database/repositories/UserRepository';
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
  public static async dispatch(event: DispatchNotificationEvent): Promise<any> {
    const userProfile = await UserRepository.getProfile(event.userId);
    let allowNotification = true;

    if (userProfile?.preferences) {
      try {
        const prefs = typeof userProfile.preferences === 'string' ? JSON.parse(userProfile.preferences) : userProfile.preferences;
        if (event.type === 'MENTION' && prefs.mentions === false) allowNotification = false;
        if (event.type === 'SYSTEM_ANNOUNCEMENT' && prefs.importantUpdates === false) allowNotification = false;
      } catch {
        // Fallback default
      }
    }

    const notifId = `notif_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    if (allowNotification) {
      return await NotificationRepository.create({
        id: notifId,
        userId: event.userId,
        title: event.title,
        message: event.message,
        type: event.type,
        actionLink: event.actionLink,
      });
    }

    return null;
  }

  /**
   * Broadcasts a system announcement to all active users.
   */
  public static async broadcastAnnouncement(title: string, message: string): Promise<number> {
    let count = 0;
    const users = await UserRepository.listAll();
    for (const user of users) {
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

