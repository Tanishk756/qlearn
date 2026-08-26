/**
 * Q-Learn Nexus - Sandboxed Quantum Code Execution API
 * Verifies AST security, prevents shell/system syscalls, limits resources, and returns isolated output.
 * @license Apache-2.0
 */

import { Router, Response } from 'express';
import { optionalAuth, AuthenticatedRequest } from '../auth/middleware';
import { validateBody, sandboxCodeSchema } from '../security/validation';
import { sandboxRateLimiter } from '../security/rateLimiter';
import { QuantumSandbox } from '../quantum/sandbox';

const router = Router();

/**
 * POST /api/v1/sandbox/run
 */
router.post('/run', optionalAuth, sandboxRateLimiter, validateBody(sandboxCodeSchema), async (req: AuthenticatedRequest, res: Response) => {
  const { code, framework } = req.body;
  const userId = req.user?.id;
  const ipAddress = req.ip;

  const result = await QuantumSandbox.execute(code, framework || 'qiskit', userId, ipAddress);

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error,
      durationMs: result.durationMs,
      memoryMb: result.memoryMb,
    });
    return;
  }

  res.json({
    success: true,
    output: result.output,
    durationMs: result.durationMs,
    memoryMb: result.memoryMb,
  });
});

export default router;
