/**
 * Q-Learn Nexus - Database Access Layer
 * Unified enterprise relational database layer powered by PostgreSQL, Drizzle ORM,
 * connection pooling, and multi-tenant security guarantees.
 * Zero-filesystem persistence: PostgreSQL is the single authoritative source of truth.
 * @license Apache-2.0
 */

import { pgDb, pool, checkDatabaseHealth } from './client';
import { withTransaction, withRawTransaction } from './transactions';
export * from './schema/schema';
export * from './client';
export * from './transactions';
export * from './repositories/UserRepository';
export * from './repositories/SessionRepository';
export * from './repositories/ProjectRepository';
export * from './repositories/CourseRepository';
export * from './repositories/SimulationRepository';
export * from './repositories/NotificationRepository';
export * from './repositories/AuditRepository';
export * from './repositories/AnalyticsRepository';

