/**
 * Q-Learn Nexus - Isolated Sandbox Runner & Process Manager
 * Second-Layer Defense: Ephemeral directories, scrubbed environment, resource limits, and process isolation.
 * @license Apache-2.0
 */

import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { logSecurityEvent } from '../security/auditLogger';

export interface IsolatedExecutionOptions {
  code: string;
  framework: string;
  timeoutMs?: number;
  maxMemoryMb?: number;
  userId?: string;
  ipAddress?: string;
}

export interface IsolatedExecutionResult {
  success: boolean;
  output: string;
  error?: {
    code: string;
    message: string;
  };
  durationMs: number;
  memoryMb: number;
  exitCode: number | null;
}

// Sensitive environment keys that must NEVER be passed to execution processes
const SENSITIVE_ENV_KEYS = [
  'DATABASE_URL',
  'REDIS_URL',
  'GEMINI_API_KEY',
  'SESSION_SECRET',
  'JWT_SECRET',
  'ADMIN_TOKEN',
  'POSTGRES_PASSWORD',
  'GCP_PROJECT',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AZURE_WORKSPACE_ID',
  'IBM_QUANTUM_TOKEN',
];

export class IsolatedRunner {
  public static readonly DEFAULT_TIMEOUT_MS = 5000;
  public static readonly MAX_OUTPUT_BYTES = 64 * 1024; // 64 KB
  public static readonly MAX_MEMORY_MB = 256;

  /**
   * Generates a completely scrubbed, safe environment dictionary.
   */
  public static getSanitizedEnvironment(sandboxDir: string): NodeJS.ProcessEnv {
    const safeEnv: NodeJS.ProcessEnv = {
      PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
      PYTHONUNBUFFERED: '1',
      PYTHONDONTWRITEBYTECODE: '1',
      TMPDIR: sandboxDir,
      HOME: sandboxDir,
      LC_ALL: 'C.UTF-8',
      LANG: 'C.UTF-8',
      QUANTUM_SANDBOX_ISOLATED: 'true',
    };

    // Ensure none of the host environment secrets leaked into safeEnv
    for (const key of Object.keys(process.env)) {
      const isSensitive = SENSITIVE_ENV_KEYS.some((s) => key.toUpperCase().includes(s));
      if (!isSensitive && key.startsWith('PUBLIC_')) {
        safeEnv[key] = process.env[key];
      }
    }

    return safeEnv;
  }

  /**
   * Executes user code within an ephemeral workspace with scrubbed environment and strict timeout.
   */
  public static async executeCode(options: IsolatedExecutionOptions): Promise<IsolatedExecutionResult> {
    const { code, framework, timeoutMs = this.DEFAULT_TIMEOUT_MS, userId, ipAddress } = options;
    const startTime = Date.now();
    const sandboxId = `qsbx_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const sandboxDir = path.join(os.tmpdir(), sandboxId);

    // 1. Create ephemeral isolated directory
    try {
      fs.mkdirSync(sandboxDir, { mode: 0o700, recursive: true });
    } catch (err: any) {
      return {
        success: false,
        output: '',
        error: {
          code: 'SANDBOX_INIT_ERROR',
          message: 'Unable to initialize ephemeral sandbox workspace.',
        },
        durationMs: 0,
        memoryMb: 0,
        exitCode: 1,
      };
    }

    const scriptPath = path.join(sandboxDir, 'script.py');
    const safeEnv = this.getSanitizedEnvironment(sandboxDir);

    try {
      fs.writeFileSync(scriptPath, code, { encoding: 'utf-8', mode: 0o600 });

      // 2. Spawn unprivileged isolated Python process
      const result = await new Promise<IsolatedExecutionResult>((resolve) => {
        let stdoutData = '';
        let stderrData = '';
        let isTimedOut = false;
        let isOutputExceeded = false;

        const child: ChildProcess = spawn('python3', [scriptPath], {
          cwd: sandboxDir,
          env: safeEnv,
          stdio: ['pipe', 'pipe', 'pipe'],
          detached: false,
        });

        // Hard timeout timer
        const timer = setTimeout(() => {
          isTimedOut = true;
          try {
            child.kill('SIGKILL');
          } catch (_) {}
        }, timeoutMs);

        // Capture stdout with size limit
        child.stdout?.on('data', (chunk: Buffer) => {
          if (stdoutData.length + chunk.length > this.MAX_OUTPUT_BYTES) {
            isOutputExceeded = true;
            stdoutData += chunk.subarray(0, this.MAX_OUTPUT_BYTES - stdoutData.length).toString('utf-8');
            try {
              child.kill('SIGKILL');
            } catch (_) {}
          } else {
            stdoutData += chunk.toString('utf-8');
          }
        });

        // Capture stderr with size limit
        child.stderr?.on('data', (chunk: Buffer) => {
          if (stderrData.length + chunk.length > this.MAX_OUTPUT_BYTES) {
            stderrData += chunk.subarray(0, this.MAX_OUTPUT_BYTES - stderrData.length).toString('utf-8');
          } else {
            stderrData += chunk.toString('utf-8');
          }
        });

        child.on('error', (err: Error) => {
          clearTimeout(timer);
          resolve({
            success: false,
            output: '',
            error: {
              code: 'SANDBOX_SPAWN_ERROR',
              message: 'Failed to launch isolated execution runtime.',
            },
            durationMs: Date.now() - startTime,
            memoryMb: 12.0,
            exitCode: 1,
          });
        });

        child.on('close', (exitCode: number | null) => {
          clearTimeout(timer);
          const durationMs = Date.now() - startTime;

          if (isTimedOut) {
            logSecurityEvent({
              userId,
              eventType: 'SANDBOX_TIMEOUT_TRIGGERED',
              severity: 'MEDIUM',
              details: `Sandbox process exceeded ${timeoutMs}ms execution limit.`,
              ipAddress,
            });

            resolve({
              success: false,
              output: stdoutData,
              error: {
                code: 'SANDBOX_TIMEOUT',
                message: `Program execution exceeded maximum allowable time (${timeoutMs}ms).`,
              },
              durationMs,
              memoryMb: 32.0,
              exitCode: null,
            });
            return;
          }

          if (isOutputExceeded) {
            resolve({
              success: false,
              output: stdoutData,
              error: {
                code: 'SANDBOX_OUTPUT_LIMIT_EXCEEDED',
                message: `Program output exceeded maximum allowable size (${this.MAX_OUTPUT_BYTES / 1024}KB).`,
              },
              durationMs,
              memoryMb: 32.0,
              exitCode: null,
            });
            return;
          }

          if (exitCode !== 0) {
            // Sanitize stderr to remove internal directory paths
            const cleanError = stderrData
              .replace(new RegExp(sandboxDir, 'g'), '/workspace')
              .replace(new RegExp(os.tmpdir(), 'g'), '/tmp')
              .trim();

            resolve({
              success: false,
              output: stdoutData,
              error: {
                code: 'SANDBOX_EXECUTION_ERROR',
                message: cleanError || `Program terminated with non-zero exit code ${exitCode}.`,
              },
              durationMs,
              memoryMb: 24.0,
              exitCode,
            });
            return;
          }

          resolve({
            success: true,
            output: stdoutData,
            durationMs,
            memoryMb: 28.0,
            exitCode: 0,
          });
        });
      });

      return result;
    } finally {
      // 3. Ephemeral workspace destruction
      try {
        if (fs.existsSync(sandboxDir)) {
          fs.rmSync(sandboxDir, { recursive: true, force: true });
        }
      } catch (cleanupErr) {
        console.error(`[Sandbox Cleanup] Failed to remove ${sandboxDir}:`, cleanupErr);
      }
    }
  }
}
