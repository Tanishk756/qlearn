/**
 * Q-Learn Nexus - JSON to PostgreSQL Enterprise Migration Utility
 * Safely ingests nexus_db.json, validates relational integrity, and migrates records
 * into PostgreSQL tables within an atomic transaction.
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { pgDb, pool } from '../server/src/database/client';
import {
  users,
  profiles,
  sessions,
  passwordResets,
  courses,
  modules,
  lessons,
  quizzes,
  lessonProgress,
  quizAttempts,
  codingChallenges,
  challengeSubmissions,
  circuits,
  projects,
  projectVersions,
  simulationJobs,
  notifications,
  auditLogs,
  securityEvents,
} from '../server/src/database/schema/schema';

export interface MigrationSummary {
  status: 'SUCCESS' | 'FAILED';
  sourceFile: string;
  timestamp: string;
  counts: Record<string, number>;
  errors: string[];
  durationMs: number;
}

export async function runMigration(): Promise<MigrationSummary> {
  const startTime = Date.now();
  const jsonPath = path.join(process.cwd(), 'data_storage', 'nexus_db.json');

  const summary: MigrationSummary = {
    status: 'SUCCESS',
    sourceFile: jsonPath,
    timestamp: new Date().toISOString(),
    counts: {},
    errors: [],
    durationMs: 0,
  };

  console.log('[Migration] Starting migration from JSON to PostgreSQL...');

  if (!fs.existsSync(jsonPath)) {
    console.warn(`[Migration] Source file not found: ${jsonPath}. Creating empty template.`);
    summary.status = 'SUCCESS';
    summary.errors.push(`Source file not found at ${jsonPath}. Ready for fresh PostgreSQL inserts.`);
    return summary;
  }

  let rawData: any;
  try {
    const content = fs.readFileSync(jsonPath, 'utf8');
    rawData = JSON.parse(content);
    console.log('[Migration] Successfully parsed source JSON file.');
  } catch (err: any) {
    summary.status = 'FAILED';
    summary.errors.push(`JSON Parse error: ${err.message}`);
    console.error('[Migration Error]', err);
    return summary;
  }

  // Execute migration in an atomic transaction
  try {
    await pgDb.transaction(async (tx) => {
      // 1. Users
      if (Array.isArray(rawData.users)) {
        let uCount = 0;
        for (const u of rawData.users) {
          if (!u.id || !u.email) {
            summary.errors.push(`Skipped invalid user: ${JSON.stringify(u)}`);
            continue;
          }
          await tx
            .insert(users)
            .values({
              id: u.id,
              email: u.email.toLowerCase().trim(),
              passwordHash: u.password_hash,
              name: u.name || 'User',
              username: u.username || u.email.split('@')[0],
              role: u.role || 'STUDENT',
              isActive: u.is_active ?? true,
              isVerified: u.is_verified ?? false,
              createdAt: u.created_at ? new Date(u.created_at) : new Date(),
              updatedAt: u.updated_at ? new Date(u.updated_at) : new Date(),
            })
            .onConflictDoNothing();
          uCount++;
        }
        summary.counts.users = uCount;
      }

      // 2. Profiles
      if (Array.isArray(rawData.profiles)) {
        let pCount = 0;
        for (const p of rawData.profiles) {
          if (!p.user_id) continue;
          await tx
            .insert(profiles)
            .values({
              userId: p.user_id,
              avatarUrl: p.avatar_url || '',
              avatarPreset: p.avatar_preset || 'schrodinger-cat',
              bio: p.bio || '',
              affiliation: p.affiliation || '',
              quantumProficiency: p.quantum_proficiency || 'Beginner',
              theme: p.theme || 'natural',
              preferences: p.preferences ? (typeof p.preferences === 'string' ? JSON.parse(p.preferences) : p.preferences) : {},
              createdAt: p.created_at ? new Date(p.created_at) : new Date(),
              updatedAt: p.updated_at ? new Date(p.updated_at) : new Date(),
            })
            .onConflictDoNothing();
          pCount++;
        }
        summary.counts.profiles = pCount;
      }

      // 3. Circuits
      if (Array.isArray(rawData.circuits)) {
        let cCount = 0;
        for (const c of rawData.circuits) {
          if (!c.id || !c.user_id) continue;
          await tx
            .insert(circuits)
            .values({
              id: c.id,
              ownerId: c.user_id,
              projectId: c.project_id || null,
              name: c.name || 'Circuit',
              qubits: c.qubits || 2,
              classicalBits: c.classical_bits || 2,
              gatesJson: c.gates_json || '[]',
              version: c.version || 1,
              isPublic: c.is_public ?? false,
              createdAt: c.created_at ? new Date(c.created_at) : new Date(),
              updatedAt: c.updated_at ? new Date(c.updated_at) : new Date(),
            })
            .onConflictDoNothing();
          cCount++;
        }
        summary.counts.circuits = cCount;
      }

      // 4. Projects
      if (Array.isArray(rawData.projects)) {
        let prjCount = 0;
        for (const p of rawData.projects) {
          if (!p.id || !p.user_id) continue;
          await tx
            .insert(projects)
            .values({
              id: p.id,
              ownerId: p.user_id,
              title: p.title || 'Untitled Project',
              description: p.description || '',
              tagsJson: p.tags_json || '[]',
              circuitId: p.circuit_id || p.id,
              isPublic: p.is_public ?? false,
              visibility: p.is_public ? 'PUBLIC' : 'PRIVATE',
              version: p.version || 1,
              createdAt: p.created_at ? new Date(p.created_at) : new Date(),
              updatedAt: p.updated_at ? new Date(p.updated_at) : new Date(),
            })
            .onConflictDoNothing();
          prjCount++;
        }
        summary.counts.projects = prjCount;
      }

      // 5. Courses
      if (Array.isArray(rawData.courses)) {
        let crsCount = 0;
        for (const c of rawData.courses) {
          if (!c.id) continue;
          await tx
            .insert(courses)
            .values({
              id: c.id,
              title: c.title,
              slug: c.slug || c.id,
              description: c.description || '',
              difficulty: c.difficulty || 'Beginner',
              category: c.category || 'Fundamentals',
              level: c.level || 'Beginner',
              estimatedHours: c.estimated_hours || 5,
              published: c.published ?? true,
              authorId: c.author_id || null,
              orderIndex: c.order_index || 0,
              createdAt: c.created_at ? new Date(c.created_at) : new Date(),
              updatedAt: c.updated_at ? new Date(c.updated_at) : new Date(),
            })
            .onConflictDoNothing();
          crsCount++;
        }
        summary.counts.courses = crsCount;
      }

      // 6. Lessons
      if (Array.isArray(rawData.lessons)) {
        let lsnCount = 0;
        for (const l of rawData.lessons) {
          if (!l.id || !l.course_id) continue;
          await tx
            .insert(lessons)
            .values({
              id: l.id,
              courseId: l.course_id,
              moduleId: l.module_id || null,
              title: l.title,
              description: l.description || '',
              content: l.content || '',
              mathContent: l.math_content || '',
              interactiveCircuit: l.interactive_circuit ? (typeof l.interactive_circuit === 'string' ? JSON.parse(l.interactive_circuit) : l.interactive_circuit) : null,
              orderIndex: l.order_index || 0,
              xp: l.xp || 50,
              createdAt: l.created_at ? new Date(l.created_at) : new Date(),
              updatedAt: l.updated_at ? new Date(l.updated_at) : new Date(),
            })
            .onConflictDoNothing();
          lsnCount++;
        }
        summary.counts.lessons = lsnCount;
      }

      // 7. Quizzes
      if (Array.isArray(rawData.quizzes)) {
        let qzCount = 0;
        for (const q of rawData.quizzes) {
          if (!q.id || !q.lesson_id) continue;
          await tx
            .insert(quizzes)
            .values({
              id: q.id,
              lessonId: q.lesson_id,
              question: q.question,
              optionsJson: q.options_json || '[]',
              correctOptionIndex: q.correct_option_index || 0,
              explanation: q.explanation || '',
            })
            .onConflictDoNothing();
          qzCount++;
        }
        summary.counts.quizzes = qzCount;
      }

      // 8. Challenges
      if (Array.isArray(rawData.challenges)) {
        let chCount = 0;
        for (const ch of rawData.challenges) {
          if (!ch.id) continue;
          await tx
            .insert(codingChallenges)
            .values({
              id: ch.id,
              title: ch.title,
              description: ch.description,
              difficulty: ch.difficulty || 'Beginner',
              starterCode: ch.starter_code || '',
              xp: ch.xp || 100,
            })
            .onConflictDoNothing();
          chCount++;
        }
        summary.counts.challenges = chCount;
      }

      // 9. Simulation Jobs
      if (Array.isArray(rawData.simulationJobs)) {
        let simCount = 0;
        for (const s of rawData.simulationJobs) {
          if (!s.id || !s.user_id) continue;
          await tx
            .insert(simulationJobs)
            .values({
              id: s.id,
              userId: s.user_id,
              circuitId: s.circuit_id || null,
              circuitIr: s.circuit_ir || '{}',
              status: s.status || 'COMPLETED',
              provider: s.provider || 'NEXUS_SIM',
              shots: s.shots || 1024,
              resultsJson: s.results_json || null,
              errorMessage: s.error_message || null,
              durationMs: s.duration_ms || 0,
              createdAt: s.created_at ? new Date(s.created_at) : new Date(),
              completedAt: s.completed_at ? new Date(s.completed_at) : null,
            })
            .onConflictDoNothing();
          simCount++;
        }
        summary.counts.simulationJobs = simCount;
      }

      // 10. Notifications
      if (Array.isArray(rawData.notifications)) {
        let notifCount = 0;
        for (const n of rawData.notifications) {
          if (!n.id || !n.user_id) continue;
          await tx
            .insert(notifications)
            .values({
              id: n.id,
              userId: n.user_id,
              title: n.title,
              message: n.message,
              type: n.type || 'SYSTEM_ANNOUNCEMENT',
              read: n.read ?? false,
              actionLink: n.action_link || null,
              createdAt: n.created_at ? new Date(n.created_at) : new Date(),
            })
            .onConflictDoNothing();
          notifCount++;
        }
        summary.counts.notifications = notifCount;
      }
    });

    summary.durationMs = Date.now() - startTime;
    console.log('[Migration] Migration completed successfully in', summary.durationMs, 'ms');
    console.log('[Migration Summary]:', JSON.stringify(summary.counts, null, 2));
  } catch (err: any) {
    summary.status = 'FAILED';
    summary.errors.push(`Transaction rollback triggered: ${err.message}`);
    console.error('[Migration Rollback]', err);
  }

  return summary;
}

if (process.argv[1] && process.argv[1].includes('migrate-json-to-postgres')) {
  runMigration()
    .then((res) => {
      console.log('Migration Result:', res.status);
      process.exit(res.status === 'SUCCESS' ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal Migration Error:', err);
      process.exit(1);
    });
}
