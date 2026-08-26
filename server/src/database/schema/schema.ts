/**
 * Q-Learn Nexus - PostgreSQL Drizzle Relational Schema
 * Production-grade data model supporting multi-tenancy, transactions, concurrency, and RBAC.
 * @license Apache-2.0
 */

import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  primaryKey,
  doublePrecision,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==========================================
// 1. IDENTITY & AUTHENTICATION
// ==========================================

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    username: text('username').notNull().unique(),
    role: text('role').notNull().default('STUDENT'), // 'STUDENT' | 'RESEARCHER' | 'INSTRUCTOR' | 'ADMIN'
    isActive: boolean('is_active').notNull().default(true),
    isVerified: boolean('is_verified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    usernameIdx: uniqueIndex('users_username_idx').on(table.username),
    roleIdx: index('users_role_idx').on(table.role),
  })
);

export const profiles = pgTable(
  'profiles',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    avatarUrl: text('avatar_url').default(''),
    avatarPreset: text('avatar_preset').default('schrodinger-cat'),
    bio: text('bio').default(''),
    affiliation: text('affiliation').default(''),
    quantumProficiency: text('quantum_proficiency').default('Beginner'),
    theme: text('theme').default('natural'),
    preferences: jsonb('preferences').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    ipAddress: text('ip_address').default('127.0.0.1'),
    userAgent: text('user_agent').default('unknown'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
    tokenHashIdx: uniqueIndex('sessions_token_hash_idx').on(table.tokenHash),
    expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
  })
);

export const roles = pgTable(
  'roles',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
    description: text('description').default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

export const userRoles = pgTable(
  'user_roles',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: text('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userRoleIdx: uniqueIndex('user_role_unique_idx').on(table.userId, table.roleId),
  })
);

export const passwordResets = pgTable(
  'password_resets',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    codeHash: text('code_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    used: boolean('used').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('password_resets_user_id_idx').on(table.userId),
    tokenHashIdx: index('password_resets_token_hash_idx').on(table.tokenHash),
  })
);

// ==========================================
// 2. COURSES, MODULES, LESSONS, QUIZZES
// ==========================================

export const courses = pgTable(
  'courses',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description').default(''),
    difficulty: text('difficulty').default('Beginner'),
    category: text('category').default('Fundamentals'),
    level: text('level').default('Beginner'),
    estimatedHours: integer('estimated_hours').default(5),
    published: boolean('published').default(true).notNull(),
    authorId: text('author_id').references(() => users.id, { onDelete: 'set null' }),
    orderIndex: integer('order_index').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex('courses_slug_idx').on(table.slug),
    publishedIdx: index('courses_published_idx').on(table.published),
  })
);

export const modules = pgTable(
  'modules',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').default(''),
    orderIndex: integer('order_index').default(0).notNull(),
  },
  (table) => ({
    courseIdIdx: index('modules_course_id_idx').on(table.courseId),
  })
);

export const lessons = pgTable(
  'lessons',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    moduleId: text('module_id').references(() => modules.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description').default(''),
    content: text('content').notNull(),
    mathContent: text('math_content').default(''),
    interactiveCircuit: jsonb('interactive_circuit'),
    orderIndex: integer('order_index').default(0).notNull(),
    xp: integer('xp').default(50).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    courseIdIdx: index('lessons_course_id_idx').on(table.courseId),
    orderIndexIdx: index('lessons_order_idx').on(table.orderIndex),
  })
);

export const lessonProgress = pgTable(
  'lesson_progress',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: text('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    completed: boolean('completed').default(false).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userLessonIdx: uniqueIndex('lesson_progress_user_lesson_idx').on(table.userId, table.lessonId),
    userIdIdx: index('lesson_progress_user_id_idx').on(table.userId),
  })
);

export const quizzes = pgTable(
  'quizzes',
  {
    id: text('id').primaryKey(),
    lessonId: text('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    question: text('question').notNull(),
    optionsJson: text('options_json').notNull(),
    correctOptionIndex: integer('correct_option_index').notNull(),
    explanation: text('explanation').default(''),
  },
  (table) => ({
    lessonIdIdx: index('quizzes_lesson_id_idx').on(table.lessonId),
  })
);

export const questions = pgTable(
  'questions',
  {
    id: text('id').primaryKey(),
    quizId: text('quiz_id')
      .notNull()
      .references(() => quizzes.id, { onDelete: 'cascade' }),
    questionText: text('question_text').notNull(),
    optionsJson: text('options_json').notNull(),
    correctAnswer: text('correct_answer').notNull(),
    explanation: text('explanation').default(''),
  },
  (table) => ({
    quizIdIdx: index('questions_quiz_id_idx').on(table.quizId),
  })
);

export const quizAttempts = pgTable(
  'quiz_attempts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    quizId: text('quiz_id')
      .notNull()
      .references(() => quizzes.id, { onDelete: 'cascade' }),
    selectedOptionIndex: integer('selected_option_index').notNull(),
    isCorrect: boolean('is_correct').notNull(),
    score: integer('score').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('quiz_attempts_user_id_idx').on(table.userId),
    quizIdIdx: index('quiz_attempts_quiz_id_idx').on(table.quizId),
  })
);

export const quizAnswers = pgTable(
  'quiz_answers',
  {
    id: text('id').primaryKey(),
    attemptId: text('attempt_id')
      .notNull()
      .references(() => quizAttempts.id, { onDelete: 'cascade' }),
    questionId: text('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    selectedOption: text('selected_option').notNull(),
    isCorrect: boolean('is_correct').notNull(),
  },
  (table) => ({
    attemptIdIdx: index('quiz_answers_attempt_id_idx').on(table.attemptId),
  })
);

// ==========================================
// 3. CODING CHALLENGES
// ==========================================

export const codingChallenges = pgTable(
  'coding_challenges',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    difficulty: text('difficulty').default('Beginner').notNull(),
    starterCode: text('starter_code').notNull(),
    solutionCode: text('solution_code').default(''),
    testCasesJson: text('test_cases_json').default('[]'),
    xp: integer('xp').default(100).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

export const challengeSubmissions = pgTable(
  'challenge_submissions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    challengeId: text('challenge_id')
      .notNull()
      .references(() => codingChallenges.id, { onDelete: 'cascade' }),
    codeSubmitted: text('code_submitted').notNull(),
    passed: boolean('passed').default(false).notNull(),
    output: text('output').default(''),
    executionTimeMs: integer('execution_time_ms').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('challenge_sub_user_id_idx').on(table.userId),
    challengeIdIdx: index('challenge_sub_challenge_id_idx').on(table.challengeId),
  })
);

// ==========================================
// 4. PROJECTS & CIRCUITS
// ==========================================

export const circuits = pgTable(
  'circuits',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    projectId: text('project_id')
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    qubits: integer('qubits').default(2).notNull(),
    classicalBits: integer('classical_bits').default(2).notNull(),
    gatesJson: text('gates_json').default('[]').notNull(),
    version: integer('version').default(1).notNull(),
    isPublic: boolean('is_public').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ownerIdIdx: index('circuits_owner_id_idx').on(table.ownerId),
    projectIdIdx: index('circuits_project_id_idx').on(table.projectId),
  })
);

export const circuitVersions = pgTable(
  'circuit_versions',
  {
    id: text('id').primaryKey(),
    circuitId: text('circuit_id')
      .notNull()
      .references(() => circuits.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    gatesJson: text('gates_json').notNull(),
    qubits: integer('qubits').notNull(),
    classicalBits: integer('classical_bits').notNull(),
    note: text('note').default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    circuitVersionIdx: uniqueIndex('circuit_version_unique_idx').on(table.circuitId, table.version),
  })
);

export const projects = pgTable(
  'projects',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').default(''),
    tagsJson: text('tags_json').default('[]').notNull(),
    circuitId: text('circuit_id').default('').notNull(),
    isPublic: boolean('is_public').default(false).notNull(),
    visibility: text('visibility').default('PRIVATE').notNull(), // 'PRIVATE' | 'UNLISTED' | 'PUBLIC'
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ownerIdIdx: index('projects_owner_id_idx').on(table.ownerId),
    visibilityIdx: index('projects_visibility_idx').on(table.visibility),
    updatedAtIdx: index('projects_updated_at_idx').on(table.updatedAt),
  })
);

export const projectMembers = pgTable(
  'project_members',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').default('VIEWER').notNull(), // 'VIEWER' | 'EDITOR' | 'ADMIN'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectUserIdx: uniqueIndex('project_member_unique_idx').on(table.projectId, table.userId),
    projectIdIdx: index('project_members_project_id_idx').on(table.projectId),
    userIdIdx: index('project_members_user_id_idx').on(table.userId),
  })
);

export const projectVersions = pgTable(
  'project_versions',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    note: text('note').default(''),
    circuitIr: text('circuit_ir').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectVersionIdx: uniqueIndex('project_version_unique_idx').on(table.projectId, table.version),
  })
);

export const sharedProjects = pgTable(
  'shared_projects',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    shareTokenHash: text('share_token_hash').notNull().unique(),
    visibility: text('visibility').default('UNLISTED').notNull(), // 'UNLISTED' | 'PUBLIC'
    permission: text('permission').default('VIEW').notNull(), // 'VIEW' | 'EDIT' | 'FORK'
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    revoked: boolean('revoked').default(false).notNull(),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdIdx: index('shared_projects_project_id_idx').on(table.projectId),
    tokenHashIdx: uniqueIndex('shared_projects_token_hash_idx').on(table.shareTokenHash),
  })
);

export const shareTokens = pgTable(
  'share_tokens',
  {
    id: text('id').primaryKey(),
    tokenHash: text('token_hash').notNull().unique(),
    resourceType: text('resource_type').notNull(), // 'PROJECT' | 'CIRCUIT'
    resourceId: text('resource_id').notNull(),
    permissions: text('permissions').default('VIEW').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    revoked: boolean('revoked').default(false).notNull(),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tokenHashIdx: uniqueIndex('share_tokens_hash_idx').on(table.tokenHash),
    resourceIdx: index('share_tokens_resource_idx').on(table.resourceType, table.resourceId),
  })
);

// ==========================================
// 5. SIMULATION ENGINE JOBS & RESULTS
// ==========================================

export const simulationJobs = pgTable(
  'simulation_jobs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    circuitId: text('circuit_id'),
    circuitIr: text('circuit_ir').notNull(),
    status: text('status').default('QUEUED').notNull(), // 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
    provider: text('provider').default('NEXUS_SIM').notNull(),
    shots: integer('shots').default(1024).notNull(),
    resultsJson: text('results_json'),
    errorMessage: text('error_message'),
    durationMs: integer('duration_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index('sim_jobs_user_id_idx').on(table.userId),
    statusIdx: index('sim_jobs_status_idx').on(table.status),
    createdAtIdx: index('sim_jobs_created_at_idx').on(table.createdAt),
  })
);

export const simulationResults = pgTable(
  'simulation_results',
  {
    id: text('id').primaryKey(),
    jobId: text('job_id')
      .notNull()
      .references(() => simulationJobs.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    statevectorJson: text('statevector_json'),
    probabilitiesJson: text('probabilities_json'),
    countsJson: text('counts_json'),
    fidelity: doublePrecision('fidelity').default(1.0),
    durationMs: integer('duration_ms').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    jobIdIdx: uniqueIndex('sim_results_job_id_idx').on(table.jobId),
    userIdIdx: index('sim_results_user_id_idx').on(table.userId),
  })
);

// ==========================================
// 6. AI CONVERSATIONS & TUTORING
// ==========================================

export const aiConversations = pgTable(
  'ai_conversations',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').default('Quantum Tutoring Session').notNull(),
    context: text('context').default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('ai_conv_user_id_idx').on(table.userId),
  })
);

export const aiMessages = pgTable(
  'ai_messages',
  {
    id: text('id').primaryKey(),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => aiConversations.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // 'user' | 'assistant' | 'system'
    content: text('content').notNull(),
    model: text('model').default('gemini-3.7-flash'),
    tokensUsed: integer('tokens_used').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    conversationIdIdx: index('ai_messages_conv_id_idx').on(table.conversationId),
  })
);

// ==========================================
// 7. NOTIFICATIONS & PREFERENCES
// ==========================================

export const notifications = pgTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    message: text('message').notNull(),
    type: text('type').default('SYSTEM_ANNOUNCEMENT').notNull(),
    read: boolean('read').default(false).notNull(),
    actionLink: text('action_link'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('notifications_user_id_idx').on(table.userId),
    readIdx: index('notifications_read_idx').on(table.userId, table.read),
    createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
  })
);

export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    newMessages: boolean('new_messages').default(true).notNull(),
    importantUpdates: boolean('important_updates').default(true).notNull(),
    mentions: boolean('mentions').default(true).notNull(),
    soundAlerts: boolean('sound_alerts').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

// ==========================================
// 8. GAMIFICATION, LEARNING PROFILES & ACHIEVEMENTS
// ==========================================

export const achievements = pgTable(
  'achievements',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
    description: text('description').notNull(),
    badgeIcon: text('badge_icon').default('award').notNull(),
    xpReward: integer('xp_reward').default(100).notNull(),
    criteriaJson: text('criteria_json').default('{}'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

export const userAchievements = pgTable(
  'user_achievements',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    achievementId: text('achievement_id')
      .notNull()
      .references(() => achievements.id, { onDelete: 'cascade' }),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userAchievementIdx: uniqueIndex('user_achievement_unique_idx').on(table.userId, table.achievementId),
  })
);

export const learningProfiles = pgTable(
  'learning_profiles',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    totalXp: integer('total_xp').default(0).notNull(),
    streakDays: integer('streak_days').default(1).notNull(),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).defaultNow().notNull(),
    level: integer('level').default(1).notNull(),
    badgesJson: text('badges_json').default('[]'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

export const learningEvents = pgTable(
  'learning_events',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventType: text('event_type').notNull(),
    eventDataJson: text('event_data_json').default('{}'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('learning_events_user_id_idx').on(table.userId),
    createdAtIdx: index('learning_events_created_at_idx').on(table.createdAt),
  })
);

// ==========================================
// 9. AUDITING, SECURITY & SYSTEM SETTINGS
// ==========================================

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    resourceType: text('resource_type').notNull(),
    resourceId: text('resource_id'),
    ipAddress: text('ip_address').default('127.0.0.1').notNull(),
    userAgent: text('user_agent').default('unknown').notNull(),
    status: text('status').default('SUCCESS').notNull(), // 'SUCCESS' | 'FAILURE' | 'DENIED'
    metadata: text('metadata').default('{}').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
    actionIdx: index('audit_logs_action_idx').on(table.action),
    createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
  })
);

export const securityEvents = pgTable(
  'security_events',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    eventType: text('event_type').notNull(),
    severity: text('severity').default('LOW').notNull(), // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    details: text('details').notNull(),
    ipAddress: text('ip_address').default('127.0.0.1').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('security_events_user_id_idx').on(table.userId),
    severityIdx: index('security_events_severity_idx').on(table.severity),
    createdAtIdx: index('security_events_created_at_idx').on(table.createdAt),
  })
);

export const systemSettings = pgTable(
  'system_settings',
  {
    id: text('id').primaryKey(),
    key: text('key').notNull().unique(),
    valueJson: text('value_json').notNull(),
    description: text('description').default(''),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    keyIdx: uniqueIndex('system_settings_key_idx').on(table.key),
  })
);

// ==========================================
// 10. RELATIONS DEFINITIONS
// ==========================================

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  sessions: many(sessions),
  projects: many(projects),
  circuits: many(circuits),
  simulationJobs: many(simulationJobs),
  lessonProgress: many(lessonProgress),
  quizAttempts: many(quizAttempts),
  challengeSubmissions: many(challengeSubmissions),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
  userRoles: many(userRoles),
  userAchievements: many(userAchievements),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  members: many(projectMembers),
  versions: many(projectVersions),
  shares: many(sharedProjects),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  modules: many(modules),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
  quizzes: many(quizzes),
  progress: many(lessonProgress),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [quizzes.lessonId],
    references: [lessons.id],
  }),
  questions: many(questions),
  attempts: many(quizAttempts),
}));
