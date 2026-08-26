/**
 * Notification System Context & Real-Time Alert Manager
 * Supports new messages, important updates, and mentions.
 * @license Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppNotification, NotificationType } from '../types/notifications';
import { INITIAL_NOTIFICATIONS } from '../data/notifications';

const STORAGE_KEY_NOTIFS = 'qlearn_nexus_notifications';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  activeToast: AppNotification | null;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  addNotification: (
    notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { timestamp?: string }
  ) => void;
  dismissToast: () => void;
  triggerSimulatedAlert: (type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load notifications from storage', e);
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    } catch (e) {
      console.warn(e);
    }
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (activeToast?.id === id) {
      setActiveToast(null);
    }
  };

  const clearAll = () => {
    setNotifications([]);
    setActiveToast(null);
  };

  const addNotification = (
    notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { timestamp?: string }
  ) => {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...notif,
      timestamp: notif.timestamp || 'Just now',
      read: false,
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setActiveToast(newNotif);

    // Auto-dismiss toast after 6 seconds
    setTimeout(() => {
      setActiveToast((current) => (current?.id === newNotif.id ? null : current));
    }, 6000);
  };

  const dismissToast = () => {
    setActiveToast(null);
  };

  // Helper to trigger realistic simulated live notifications for testing
  const triggerSimulatedAlert = (type: NotificationType) => {
    if (type === 'message') {
      addNotification({
        type: 'message',
        title: 'New message from Dr. Elena Rostova',
        description: 'Great work! Have you tried applying Grover diffusion operator to 4 qubits? The amplitude amplification is fascinating.',
        sender: {
          name: 'Dr. Elena Rostova',
          role: 'Quantum Information Mentor',
          avatar: '👩‍🔬',
        },
        linkTab: 'tutor',
        actionLabel: 'Reply to Message',
      });
    } else if (type === 'update') {
      addNotification({
        type: 'update',
        title: 'Quantum Benchmark Update',
        description: 'New verified benchmark dataset added for 5-qubit Greenberger-Horne-Zeilinger (GHZ) state entanglement fidelity.',
        priority: 'high',
        linkTab: 'analytics',
        actionLabel: 'View Benchmarks',
      });
    } else if (type === 'mention') {
      addNotification({
        type: 'mention',
        title: '@Kavita_Quantum mentioned you',
        description: 'Mentioned in Quantum Circuit Lab: "Check out this optimized 3-qubit Toffoli decomposition submitted by @You"',
        sender: {
          name: 'Kavita Chen',
          role: 'Student Researcher',
          avatar: '👩‍🎓',
        },
        linkTab: 'lab',
        actionLabel: 'View Circuit Discussion',
      });
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeToast,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        addNotification,
        dismissToast,
        triggerSimulatedAlert,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
