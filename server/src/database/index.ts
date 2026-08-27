/**
 * Q-Learn Nexus - Database Access Layer
 * Unified enterprise relational database layer powered by PostgreSQL, Drizzle ORM,
 * connection pooling, and multi-tenant security guarantees.
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

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  username: string;
  role: 'STUDENT' | 'RESEARCHER' | 'INSTRUCTOR' | 'ADMIN';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  user_id: string;
  avatar_url: string;
  avatar_preset: string;
  bio: string;
  affiliation: string;
  quantum_proficiency: 'Beginner' | 'Student' | 'Researcher' | 'Quantum Engineer';
  theme: string;
  preferences: string; // JSON string
  created_at: string;
  updated_at: string;
}

export interface SessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  ip_address: string;
  user_agent: string;
  expires_at: string;
  created_at: string;
}

export interface PasswordResetRow {
  id: string;
  user_id: string;
  token_hash: string;
  code_hash: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

export interface ProjectRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  tags_json: string; // JSON string array
  circuit_id: string;
  circuit_ir?: string; // JSON string
  is_public: boolean;
  visibility?: 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectVersionRow {
  id: string;
  project_id: string;
  version: number;
  note: string;
  circuit_ir: string; // JSON string
  created_at: string;
}

export interface CircuitRow {
  id: string;
  user_id: string;
  project_id?: string;
  name: string;
  qubits: number;
  classical_bits: number;
  gates_json: string;
  version: number;
  is_public?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SimulationJobRow {
  id: string;
  user_id: string;
  circuit_id?: string;
  circuit_ir: string; // JSON string
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  provider: 'NEXUS_SIM' | 'QISKIT_AER' | 'PENNYLANE' | 'CIRQ';
  shots: number;
  results_json?: string;
  error_message?: string;
  duration_ms?: number;
  created_at: string;
  completed_at?: string;
}

export interface CourseRow {
  id: string;
  title: string;
  slug?: string;
  description: string;
  difficulty?: string;
  category?: string;
  level?: string;
  estimated_hours?: number;
  published: boolean;
  is_published?: boolean;
  author_id?: string;
  order_index?: number;
  created_at: string;
  updated_at?: string;
}

export interface ModuleRow {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
}

export interface LessonRow {
  id: string;
  course_id: string;
  module_id?: string;
  title: string;
  description?: string;
  content: string; // Markdown
  math_content?: string;
  interactive_circuit?: string; // JSON IR
  order_index: number;
  xp: number;
  created_at: string;
  updated_at?: string;
}

export interface QuizRow {
  id: string;
  lesson_id: string;
  question: string;
  options_json: string;
  correct_option_index: number;
  explanation: string;
}

export interface LessonProgressRow {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
}

export interface QuizAttemptRow {
  id: string;
  user_id: string;
  quiz_id: string;
  selected_option_index: number;
  is_correct: boolean;
  score: number;
  created_at: string;
}

export interface ChallengeRow {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  starter_code: string;
  xp: number;
}

export interface ChallengeSubmissionRow {
  id: string;
  user_id: string;
  challenge_id: string;
  code_submitted: string;
  passed: boolean;
  output: string;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'SIMULATION_COMPLETED' | 'COURSE_COMPLETED' | 'QUIZ_COMPLETED' | 'ACHIEVEMENT_UNLOCKED' | 'PROJECT_SHARED' | 'MENTION' | 'NEW_COURSE' | 'SYSTEM_ANNOUNCEMENT' | 'SECURITY_ALERT';
  read: boolean;
  action_link?: string;
  created_at: string;
}

export interface AnalyticsEventRow {
  id: string;
  user_id?: string;
  event_type: string;
  event_data: string; // JSON string
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address: string;
  user_agent: string;
  status: 'SUCCESS' | 'FAILURE' | 'DENIED';
  metadata: string; // JSON string
  created_at: string;
}

export interface SecurityEventRow {
  id: string;
  user_id?: string;
  event_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
  ip_address: string;
  created_at: string;
}

/**
 * Development-only InMemory/Snapshot Database Manager.
 * In PRODUCTION (NODE_ENV=production):
 * - Disk persistence is strictly DISABLED.
 * - Auto-seeding of demo/admin accounts is strictly DISABLED.
 * - PostgreSQL relational storage is the ONLY permitted persistence layer.
 * - No local files or directories (/app/data_storage) are EVER read, written, or created.
 */
class DatabaseManager {
  private isProduction: boolean;

  public users: Map<string, UserRow> = new Map();
  public profiles: Map<string, ProfileRow> = new Map();
  public sessions: Map<string, SessionRow> = new Map();
  public passwordResets: Map<string, PasswordResetRow> = new Map();
  public projects: Map<string, ProjectRow> = new Map();
  public projectVersions: Map<string, ProjectVersionRow> = new Map();
  public circuits: Map<string, CircuitRow> = new Map();
  public simulationJobs: Map<string, SimulationJobRow> = new Map();
  public courses: Map<string, CourseRow> = new Map();
  public modules: Map<string, ModuleRow> = new Map();
  public lessons: Map<string, LessonRow> = new Map();
  public quizzes: Map<string, QuizRow> = new Map();
  public challenges: Map<string, ChallengeRow> = new Map();
  public lessonProgress: Map<string, LessonProgressRow> = new Map();
  public quizAttempts: QuizAttemptRow[] = [];
  public challengeSubmissions: ChallengeSubmissionRow[] = [];
  public notifications: Map<string, NotificationRow> = new Map();
  public analyticsEvents: AnalyticsEventRow[] = [];
  public auditLogs: AuditLogRow[] = [];
  public securityEvents: SecurityEventRow[] = [];

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    if (!this.isProduction) {
      this.seedInitialSyntheticData();
    }
  }

  public persist() {
    // In-memory or production no-op. Authoritative data persists solely to PostgreSQL.
  }

  private seedInitialSyntheticData() {
    if (this.isProduction) return;

    const now = new Date().toISOString();
    // Seed Courses
    const course1Id = 'course_foundations';
    this.courses.set(course1Id, {
      id: course1Id,
      title: 'Quantum Computing Foundations',
      slug: 'quantum-foundations',
      description: 'Master qubits, superposition, Bloch sphere geometry, and single/multi-qubit unitary operations.',
      difficulty: 'Beginner',
      category: 'Quantum Fundamentals',
      level: 'Beginner',
      estimated_hours: 8,
      published: true,
      is_published: true,
      order_index: 0,
      created_at: now,
    });

    const lsn1Id = 'lesson_1_1';
    this.lessons.set(lsn1Id, {
      id: lsn1Id,
      course_id: course1Id,
      title: 'Qubits & Superposition',
      description: 'Understand linear state combinations and the Hadamard gate.',
      content: 'A qubit is a normalized vector $|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$ where $|\\alpha|^2 + |\\beta|^2 = 1$. The Hadamard gate creates equal superposition.',
      interactive_circuit: JSON.stringify({
        version: '1.0',
        name: 'Single Qubit Superposition',
        qubits: 1,
        classicalBits: 1,
        gates: [{ id: 'g0', type: 'H', targets: [0], stepIndex: 0 }],
      }),
      order_index: 0,
      xp: 50,
      created_at: now,
    });

    this.quizzes.set('quiz_1_1', {
      id: 'quiz_1_1',
      lesson_id: lsn1Id,
      question: 'What is the state of a qubit initialized to |0⟩ after applying a Hadamard gate?',
      options_json: JSON.stringify([
        '|1⟩ with 100% certainty',
        '(|0⟩ + |1⟩) / √2 (Equal Superposition)',
        '|0⟩ with 100% certainty',
        '(|0⟩ - i|1⟩) / √2',
      ]),
      correct_option_index: 1,
      explanation: 'Applying the Hadamard gate H to |0⟩ transforms the state to |+⟩ = (|0⟩ + |1⟩)/√2.',
    });

    // Seed Challenges
    this.challenges.set('ch_bell', {
      id: 'ch_bell',
      title: 'Construct the Bell State |Φ⁺⟩',
      description: 'Write a quantum circuit using Qiskit or OpenQASM that creates maximal 2-qubit entanglement.',
      difficulty: 'Beginner',
      starter_code: 'from qiskit import QuantumCircuit\nqc = QuantumCircuit(2, 2)\n# Write your code here\n',
      xp: 100,
    });
  }
}

export const db = new DatabaseManager();
