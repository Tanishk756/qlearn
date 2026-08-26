/**
 * Q-Learn Nexus - Isolated Code Execution API
 * Pipeline: Auth -> Code Validator (AST) -> Resource Validator -> Isolated Sandbox Worker -> Result Normalizer
 * @license Apache-2.0
 */

import { Router, Response } from 'express';
import { optionalAuth, AuthenticatedRequest } from '../auth/middleware';
import { sandboxRateLimiter } from '../security/rateLimiter';
import { QuantumSandbox } from '../quantum/sandbox';

const router = Router();

/**
 * POST /api/v1/code/validate
 * Validates Python/Qiskit AST code without executing.
 */
router.post('/validate', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    res.status(400).json({ safe: false, reason: 'Code string is required.' });
    return;
  }

  const inspection = QuantumSandbox.inspectCodeSecurity(code, req.user?.id, req.ip);
  res.json(inspection);
});

/**
 * POST /api/v1/code/execute
 * Main code execution endpoint following two-layer security isolation.
 */
router.post('/execute', optionalAuth, sandboxRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const { code, framework = 'qiskit', timeoutMs } = req.body;
  const userId = req.user?.id;
  const ipAddress = req.ip;

  if (!code || typeof code !== 'string') {
    res.status(400).json({
      success: false,
      errorCode: 'INVALID_PAYLOAD',
      error: 'Code payload must be a non-empty string.',
    });
    return;
  }

  const result = await QuantumSandbox.execute(code, framework, userId, ipAddress);

  if (!result.success) {
    res.status(400).json({
      success: false,
      errorCode: result.errorCode || 'SANDBOX_EXECUTION_ERROR',
      error: result.error,
      output: result.output,
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
