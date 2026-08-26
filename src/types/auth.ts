/**
 * User Authentication, Profile & Theming Types
 * @license Apache-2.0
 */

export type ThemeId = 'natural' | 'quantum-dark' | 'nordic' | 'sandstone';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  previewBg: string;
  previewPrimary: string;
  previewAccent: string;
  previewText: string;
}

export interface UserBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt: string;
}

export interface UserNotificationSettings {
  newMessages: boolean;
  importantUpdates: boolean;
  mentions: boolean;
  soundAlerts: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl: string;
  avatarPreset?: string;
  bio: string;
  affiliation: string;
  quantumLevel: 'Beginner' | 'Student' | 'Researcher' | 'Quantum Engineer';
  theme: ThemeId;
  joinedDate: string;
  stats: {
    completedLessons: number;
    completedChallenges: number;
    circuitsRun: number;
    qubitMasteryPoints: number;
  };
  badges: UserBadge[];
  notificationSettings: UserNotificationSettings;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
