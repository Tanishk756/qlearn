/**
 * Q-Learn Nexus - Request Schema Validation (Zod)
 * Validates request bodies, query params, and JSON structures before executing privileged logic.
 * @license Apache-2.0
 */

import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address format').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters long').max(128),
  name: z.string().min(1, 'Name is required').max(100),
  username: z.string().min(2).max(50).optional(),
  affiliation: z.string().max(150).optional(),
  quantumLevel: z.enum(['Beginner', 'Student', 'Researcher', 'Quantum Engineer']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

export const passwordRecoverSchema = z.object({
  email: z.string().email().max(255),
});

export const passwordResetSchema = z.object({
  email: z.string().email().max(255),
  code: z.string().length(6, 'Verification code must be exactly 6 digits'),
  newPassword: z.string().min(8).max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  affiliation: z.string().max(150).optional(),
  quantum_proficiency: z.enum(['Beginner', 'Student', 'Researcher', 'Quantum Engineer']).optional(),
  theme: z.string().max(50).optional(),
  avatar_preset: z.string().max(50).optional(),
  preferences: z.record(z.string(), z.any()).optional(),
});

export const circuitGateSchema = z.object({
  id: z.string(),
  type: z.string(),
  targets: z.array(z.number().int().min(0).max(15)),
  controls: z.array(z.number().int().min(0).max(15)).optional(),
  params: z.object({
    theta: z.number().optional(),
    phi: z.number().optional(),
    lambda: z.number().optional(),
  }).optional(),
  stepIndex: z.number().int().min(0).max(100),
});

export const circuitIRSchema = z.object({
  version: z.string(),
  name: z.string().max(150),
  qubits: z.number().int().min(1).max(16),
  classicalBits: z.number().int().min(1).max(16),
  gates: z.array(circuitGateSchema).max(500),
});

export const createProjectSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  circuitIR: circuitIRSchema,
  isPublic: z.boolean().optional(),
});

export const simulationJobSchema = z.object({
  circuitIR: circuitIRSchema,
  provider: z.enum(['NEXUS_SIM', 'QISKIT_AER', 'PENNYLANE', 'CIRQ']).optional(),
  shots: z.number().int().min(1).max(100000).optional(),
});

export const sandboxCodeSchema = z.object({
  code: z.string().min(1).max(50000),
  framework: z.enum(['qiskit', 'pennylane', 'cirq', 'openqasm']).optional(),
});

export const aiAskSchema = z.object({
  query: z.string().min(1).max(4000),
  context: z.object({
    activeCircuitIR: circuitIRSchema.optional(),
    simulationResult: z.any().optional(),
    currentAlgorithmName: z.string().max(100).optional(),
    currentLessonTitle: z.string().max(100).optional(),
  }).optional(),
});

/**
 * Middleware generator for Zod body validation.
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid request payload format',
        details: parseResult.error.issues?.map((e) => ({ field: e.path.join('.'), message: e.message })) || [],
      });
      return;
    }
    req.body = parseResult.data;
    next();
  };
}
