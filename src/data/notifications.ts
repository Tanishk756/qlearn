/**
 * Initial Notification Feed & Templates
 * @license Apache-2.0
 */

import { AppNotification } from '../types/notifications';

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'message',
    title: 'New message from Dr. Elena Rostova',
    description: 'Reviewed your Deutsch-Jozsa phase kickback submission! The implementation is mathematically sound.',
    timestamp: '10 minutes ago',
    read: false,
    sender: {
      name: 'Dr. Elena Rostova',
      role: 'Quantum Information Fellow',
      avatar: '👩‍🔬',
    },
    linkTab: 'tutor',
    actionLabel: 'Open Conversation',
  },
  {
    id: 'notif-2',
    type: 'mention',
    title: 'Alex_Quantum mentioned you',
    description: 'Tagged you in Circuit Discussion: "Check out the elegant Bell state generator with zero gate crosstalk!"',
    timestamp: '45 minutes ago',
    read: false,
    sender: {
      name: 'Alex Rivera',
      role: 'Algorithm Researcher',
      avatar: '👨‍💻',
    },
    linkTab: 'lab',
    actionLabel: 'View Circuit',
  },
  {
    id: 'notif-3',
    type: 'update',
    title: 'Engine Update: Sim-Vector2ⁿ v2.4.1',
    description: 'Added support for arbitrary phase rotation tracking and OpenQASM 3.0 export synchronization.',
    timestamp: '2 hours ago',
    read: false,
    linkTab: 'codelab',
    actionLabel: 'Explore Code Lab',
    priority: 'high',
  },
  {
    id: 'notif-4',
    type: 'mention',
    title: 'Quantum Leaderboard Mention',
    description: 'Rank update: You have entered the top 10% on the Quantum Teleportation Challenge with 100% fidelity!',
    timestamp: 'Yesterday',
    read: true,
    sender: {
      name: 'Leaderboard Bot',
      role: 'System',
      avatar: '🏆',
    },
    linkTab: 'challenges',
    actionLabel: 'View Challenges',
  },
  {
    id: 'notif-5',
    type: 'message',
    title: 'Q-Nova AI Tutor Note',
    description: 'Proactive analysis: I generated 3 recommended exercises on Quantum Superdense Coding tailored to your progress.',
    timestamp: '2 days ago',
    read: true,
    sender: {
      name: 'Q-Nova AI',
      role: 'Intelligent Tutor',
      avatar: '✨',
    },
    linkTab: 'tutor',
    actionLabel: 'Chat with Q-Nova',
  },
];
