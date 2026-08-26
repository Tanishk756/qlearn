/**
 * Q-Learn Nexus - Q-Nova AI Intelligence API
 * Secure server-side proxy for Gemini 3.7 Flash with prompt defense and quantum tutoring tools.
 * @license Apache-2.0
 */

import { Router, Response } from 'express';
import { optionalAuth, AuthenticatedRequest } from '../auth/middleware';
import { validateBody, aiAskSchema } from '../security/validation';
import { aiQueryRateLimiter } from '../security/rateLimiter';
import { AIService } from '../services/AIService';

const router = Router();

/**
 * POST /api/v1/ai/tutor
 */
router.post('/tutor', optionalAuth, aiQueryRateLimiter, validateBody(aiAskSchema), async (req: AuthenticatedRequest, res: Response) => {
  const { query, context } = req.body;
  const userId = req.user?.id;
  const ipAddress = req.ip;

  try {
    const result = await AIService.askTutor(query, context, userId, ipAddress);
    res.json({
      success: true,
      response: result.response,
      model: result.model,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'AI_SERVICE_ERROR',
      message: err?.message || 'Error processing AI query',
    });
  }
});

/**
 * POST /api/v1/ai/explain-circuit
 */
router.post('/explain-circuit', optionalAuth, aiQueryRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const { circuitIR } = req.body;
  if (!circuitIR) {
    res.status(400).json({ error: 'INVALID_REQUEST', message: 'circuitIR is required' });
    return;
  }
  const explanation = await AIService.explainCircuit(circuitIR);
  res.json({ success: true, explanation });
});

/**
 * POST /api/v1/ai/debug-code
 */
router.post('/debug-code', optionalAuth, aiQueryRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const { code, framework } = req.body;
  if (!code) {
    res.status(400).json({ error: 'INVALID_REQUEST', message: 'code is required' });
    return;
  }
  const response = await AIService.debugCode(code, framework || 'qiskit');
  res.json({ success: true, response });
});

/**
 * POST /api/v1/ai/optimize
 */
router.post('/optimize', optionalAuth, aiQueryRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const { circuitIR } = req.body;
  if (!circuitIR) {
    res.status(400).json({ error: 'INVALID_REQUEST', message: 'circuitIR is required' });
    return;
  }
  const suggestions = await AIService.optimizeCircuit(circuitIR);
  res.json({ success: true, suggestions });
});

export default router;
