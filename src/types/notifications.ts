/**
 * Notification System Types
 * Supporting new messages, important updates, and mentions.
 * @license Apache-2.0
 */

export type NotificationType = 'message' | 'update' | 'mention';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  sender?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  linkTab?: string;
  actionLabel?: string;
  actionPayload?: any;
  priority?: 'normal' | 'high';
}

export type NotificationFilter = 'all' | 'message' | 'update' | 'mention';
