/**
 * Q-Learn Nexus - Quantum Simulation Queue & Worker Service
 * Asynchronous job scheduling, resource limit enforcement, and result persistence.
 * Uses PostgreSQL SimulationRepository.
 * @license Apache-2.0
 */

import { SimulationRepository } from '../database/repositories/SimulationRepository';
import { UserRepository } from '../database/repositories/UserRepository';
import {
  simulateServerCircuit,
  QuantumCircuitIR,
  SimulationResult,
  MAX_STATEVECTOR_QUBITS,
  MAX_DENSITY_MATRIX_QUBITS,
  MAX_GATES,
  MAX_SHOTS,
} from '../quantum/engine';
import { NotificationDispatcher } from '../notifications/dispatcher';
import crypto from 'crypto';

export interface EnqueueSimulationParams {
  userId: string;
  circuitIR: QuantumCircuitIR;
  provider?: 'NEXUS_SIM' | 'QISKIT_AER' | 'PENNYLANE' | 'CIRQ';
  simulationType?: 'STATEVECTOR' | 'DENSITY_MATRIX';
  shots?: number;
}

export class SimulationQueue {
  public static readonly MAX_STATEVECTOR_QUBITS = MAX_STATEVECTOR_QUBITS;
  public static readonly MAX_DENSITY_MATRIX_QUBITS = MAX_DENSITY_MATRIX_QUBITS;
  public static readonly MAX_GATES = MAX_GATES;
  public static readonly MAX_SHOTS = MAX_SHOTS;

  /**
   * Validates circuit resources and enqueues a new simulation job.
   */
  public static async enqueueJob(params: EnqueueSimulationParams): Promise<any> {
    const { userId, circuitIR } = params;
    const simType = params.simulationType || 'STATEVECTOR';
    const shots = Math.min(Math.max(1, params.shots || 1024), this.MAX_SHOTS);
    const provider = params.provider || 'NEXUS_SIM';

    // 1. Separate Resource Limit Validations for Statevector (2^n) vs Density Matrix (2^2n)
    if (simType === 'DENSITY_MATRIX') {
      if (circuitIR.qubits > this.MAX_DENSITY_MATRIX_QUBITS) {
        throw new Error(
          `Circuit qubit count (${circuitIR.qubits}) exceeds density matrix simulation maximum of ${this.MAX_DENSITY_MATRIX_QUBITS} qubits (scales as 2^(2N) = ${1 << (2 * circuitIR.qubits)} elements).`
        );
      }
    } else {
      if (circuitIR.qubits > this.MAX_STATEVECTOR_QUBITS) {
        throw new Error(
          `Circuit qubit count (${circuitIR.qubits}) exceeds server maximum of ${this.MAX_STATEVECTOR_QUBITS} qubits.`
        );
      }
    }

    if (circuitIR.gates.length > this.MAX_GATES) {
      throw new Error(`Circuit gate count (${circuitIR.gates.length}) exceeds server maximum of ${this.MAX_GATES} gates.`);
    }

    const jobId = `sim_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    await SimulationRepository.createJob({
      id: jobId,
      userId,
      circuitIr: JSON.stringify(circuitIR),
      provider,
      shots,
    });

    const jobRow = {
      id: jobId,
      user_id: userId,
      circuit_ir: JSON.stringify(circuitIR),
      status: 'QUEUED',
      provider,
      shots,
      created_at: now,
    };

    // Process job asynchronously in worker
    setImmediate(() => {
      this.processJob(jobId, circuitIR, shots, userId);
    });

    return jobRow;
  }

  /**
   * Worker process: executes simulation and persists results.
   */
  private static async processJob(jobId: string, ir: QuantumCircuitIR, shots: number, userId: string) {
    const job = await SimulationRepository.getJobById(jobId);
    if (!job || job.status === 'CANCELLED') return;

    await SimulationRepository.updateJobStatus({
      id: jobId,
      status: 'RUNNING',
    });

    try {
      const startTime = Date.now();
      const result: SimulationResult = simulateServerCircuit(ir, shots);
      const durationMs = Date.now() - startTime;

      await SimulationRepository.updateJobStatus({
        id: jobId,
        status: 'COMPLETED',
        resultsJson: JSON.stringify(result),
        durationMs,
      });

      // Dispatch real-time notification
      await NotificationDispatcher.dispatch({
        userId,
        type: 'SIMULATION_COMPLETED',
        title: 'Quantum Simulation Completed',
        message: `Circuit "${ir.name}" (${ir.qubits} qubits) completed with ${shots} shots in ${durationMs}ms.`,
        actionLink: `/lab?circuit=${ir.name}`,
      });
    } catch (err: any) {
      await SimulationRepository.updateJobStatus({
        id: jobId,
        status: 'FAILED',
        errorMessage: err?.message || 'Internal simulation engine error',
      });
    }
  }

  /**
   * Cancels a queued or running simulation job.
   */
  public static async cancelJob(jobId: string, userId: string): Promise<boolean> {
    const job = await SimulationRepository.getJobById(jobId);
    if (!job) return false;
    const user = await UserRepository.findById(userId);
    if (job.userId !== userId && !user?.role?.includes('ADMIN')) {
      throw new Error('Unauthorized to cancel this job.');
    }

    if (job.status === 'COMPLETED' || job.status === 'FAILED') {
      return false;
    }

    await SimulationRepository.updateJobStatus({
      id: jobId,
      status: 'CANCELLED',
    });
    return true;
  }

  /**
   * Retrieves simulation job status and results.
   */
  public static async getJob(jobId: string, userId: string): Promise<any> {
    const job = await SimulationRepository.getJobById(jobId);
    if (!job) return null;
    return {
      id: job.id,
      user_id: job.userId,
      circuit_ir: job.circuitIr,
      status: job.status,
      provider: job.provider,
      shots: job.shots,
      results_json: job.resultsJson,
      error_message: job.errorMessage,
      duration_ms: job.durationMs,
      created_at: job.createdAt.toISOString(),
      completed_at: job.completedAt?.toISOString(),
    };
  }
}

