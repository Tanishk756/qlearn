/**
 * Q-Learn Nexus - Quantum Simulation API
 * Asynchronous job dispatch, status polling, cancellation, and validation.
 * @license Apache-2.0
 */

import { Router, Response } from 'express';
import { authenticateToken, optionalAuth, AuthenticatedRequest } from '../auth/middleware';
import { validateBody, simulationJobSchema } from '../security/validation';
import { simulationRateLimiter } from '../security/rateLimiter';
import { SimulationQueue } from '../workers/simulationQueue';
import { simulateServerCircuit } from '../quantum/engine';
import { QuantumAdapters } from '../quantum/adapters';

const router = Router();

/**
 * POST /api/v1/simulations (Async Queue Dispatch)
 */
router.post('/', authenticateToken, simulationRateLimiter, validateBody(simulationJobSchema), async (req: AuthenticatedRequest, res: Response) => {
  const { circuitIR, provider, shots } = req.body;
  const userId = req.user!.id;

  try {
    const job = await SimulationQueue.enqueueJob({
      userId,
      circuitIR,
      provider: provider || 'NEXUS_SIM',
      shots: shots || 1024,
    });

    res.status(202).json({
      success: true,
      jobId: job.id,
      status: job.status,
      message: 'Quantum simulation job queued for execution.',
    });
  } catch (err: any) {
    res.status(400).json({
      error: 'SIMULATION_ERROR',
      message: err?.message || 'Failed to enqueue simulation job.',
    });
  }
});

/**
 * POST /api/v1/simulations/sync (Synchronous Instant Execution for Lab UI)
 */
router.post('/sync', optionalAuth, simulationRateLimiter, validateBody(simulationJobSchema), (req: AuthenticatedRequest, res: Response) => {
  const { circuitIR, shots } = req.body;

  try {
    const results = simulateServerCircuit(circuitIR, shots || 1024);
    res.json({
      success: true,
      results,
    });
  } catch (err: any) {
    res.status(400).json({
      error: 'SIMULATION_CALCULATION_ERROR',
      message: err?.message || 'Mathematical statevector evaluation failed.',
    });
  }
});

/**
 * GET /api/v1/simulations/:id (Job Polling)
 */
router.get('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const jobId = req.params.id;
  const job = SimulationQueue.getJob(jobId, req.user!.id);

  if (!job) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Simulation job not found.' });
    return;
  }

  res.json({
    id: job.id,
    status: job.status,
    provider: job.provider,
    shots: job.shots,
    results: job.results_json ? JSON.parse(job.results_json) : null,
    errorMessage: job.error_message,
    durationMs: job.duration_ms,
    createdAt: job.created_at,
    completedAt: job.completed_at,
  });
});

/**
 * POST /api/v1/simulations/:id/cancel
 */
router.post('/:id/cancel', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const jobId = req.params.id;
  try {
    const cancelled = SimulationQueue.cancelJob(jobId, req.user!.id);
    if (!cancelled) {
      res.status(400).json({ error: 'CANNOT_CANCEL', message: 'Job is already finished or could not be cancelled.' });
      return;
    }
    res.json({ success: true, message: 'Simulation job successfully cancelled.' });
  } catch (err: any) {
    res.status(403).json({ error: 'FORBIDDEN', message: err?.message || 'Cannot cancel this job.' });
  }
});

/**
 * POST /api/v1/simulations/transpile (SDK Exporters)
 */
router.post('/transpile', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { circuitIR, target } = req.body;
  if (!circuitIR) {
    res.status(400).json({ error: 'INVALID_IR', message: 'Valid circuitIR required' });
    return;
  }

  let code = '';
  switch (target) {
    case 'qiskit':
      code = QuantumAdapters.toQiskit(circuitIR);
      break;
    case 'pennylane':
      code = QuantumAdapters.toPennyLane(circuitIR);
      break;
    case 'cirq':
      code = QuantumAdapters.toCirq(circuitIR);
      break;
    case 'openqasm':
    default:
      code = QuantumAdapters.toOpenQASM(circuitIR);
      break;
  }

  res.json({ success: true, target, code });
});

export default router;
