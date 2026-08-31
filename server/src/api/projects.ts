/**
 * Q-Learn Nexus - Quantum Projects REST API
 * Database-backed project CRUD, version snapshots, forking, and circuit association.
 * Uses PostgreSQL ProjectRepository and SharingRepository.
 * @license Apache-2.0
 */

import { Router, Response } from 'express';
import { ProjectRepository, SharingRepository, ProjectDTO } from '../database/repositories/ProjectRepository';
import { authenticateToken, optionalAuth, AuthenticatedRequest } from '../auth/middleware';
import { validateBody, createProjectSchema } from '../security/validation';
import { logAuditEvent } from '../security/auditLogger';
import { QuantumAdapters } from '../quantum/adapters';
import crypto from 'crypto';

const router = Router();

/**
 * GET /api/v1/projects
 * Lists user's projects and public shared projects from PostgreSQL.
 */
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.id;
  const isAdmin = req.user?.role === 'ADMIN';

  const rows = await ProjectRepository.findAccessible(currentUserId, isAdmin);
  const projectsList = [];

  for (const project of rows) {
    const circuit = await ProjectRepository.getCircuit(project.circuit_id);
    projectsList.push({
      id: project.id,
      title: project.title,
      description: project.description,
      tags: JSON.parse(project.tags_json || '[]'),
      circuitIR: circuit ? {
        version: '1.0',
        name: circuit.name,
        qubits: circuit.qubits,
        classicalBits: circuit.classical_bits,
        gates: JSON.parse(circuit.gates_json || '[]'),
      } : null,
      isPublic: project.is_public,
      userId: project.user_id,
      version: project.version,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    });
  }

  res.json({ success: true, projects: projectsList });
});

/**
 * POST /api/v1/projects
 * Creates a new project and circuit in PostgreSQL.
 */
router.post('/', authenticateToken, validateBody(createProjectSchema), async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, tags, circuitIR, isPublic } = req.body;
  const userId = req.user!.id;
  const now = new Date().toISOString();

  const circuitId = `circ_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const projectId = `proj_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const projectRow: ProjectDTO = {
    id: projectId,
    user_id: userId,
    title: title.trim(),
    description: (description || '').trim(),
    circuit_id: circuitId,
    tags_json: JSON.stringify(tags || []),
    is_public: !!isPublic,
    visibility: isPublic ? 'PUBLIC' : 'PRIVATE',
    version: 1,
    created_at: now,
    updated_at: now,
  };

  const createdProject = await ProjectRepository.create(projectRow, {
    name: circuitIR.name || title,
    qubits: circuitIR.qubits,
    classical_bits: circuitIR.classicalBits,
    gates_json: JSON.stringify(circuitIR.gates || []),
  });

  logAuditEvent({
    userId,
    action: 'PROJECT_CREATE',
    resourceType: 'PROJECT',
    resourceId: projectId,
    ipAddress: req.ip,
    status: 'SUCCESS',
  });

  res.status(201).json({
    success: true,
    project: {
      id: createdProject.id,
      title: createdProject.title,
      description: createdProject.description,
      tags: tags || [],
      circuitIR,
      isPublic: createdProject.is_public,
      version: createdProject.version,
      createdAt: createdProject.created_at,
      updatedAt: createdProject.updated_at,
    },
  });
});

/**
 * PUT /api/v1/projects/:id
 * Updates an existing project and its associated circuit in PostgreSQL.
 */
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const projectId = req.params.id;
  const project = await ProjectRepository.findById(projectId);

  if (!project) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Project not found.' });
    return;
  }

  if (project.user_id !== req.user!.id && req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'UNAUTHORIZED', message: 'You do not have permission to edit this project.' });
    return;
  }

  const { title, description, tags, circuitIR, isPublic } = req.body;

  const success = await ProjectRepository.update(
    projectId,
    {
      title,
      description,
      tags,
      isPublic,
    },
    circuitIR
      ? {
          name: circuitIR.name,
          qubits: circuitIR.qubits,
          classicalBits: circuitIR.classicalBits,
          gates: circuitIR.gates,
        }
      : undefined
  );

  if (!success) {
    res.status(500).json({ error: 'UPDATE_FAILED', message: 'Failed to update project.' });
    return;
  }

  logAuditEvent({
    userId: req.user!.id,
    action: 'PROJECT_UPDATE',
    resourceType: 'PROJECT',
    resourceId: projectId,
    ipAddress: req.ip,
    status: 'SUCCESS',
  });

  res.json({ success: true, message: 'Project updated successfully.' });
});

/**
 * GET /api/v1/projects/:id
 * Retrieves single project with IDOR access controls and share token verification from PostgreSQL.
 */
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const projectId = req.params.id;
  const project = await ProjectRepository.findById(projectId);

  if (!project) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Project not found.' });
    return;
  }

  const currentUserId = req.user?.id;
  const isAdmin = req.user?.role === 'ADMIN';
  const isOwner = project.user_id === currentUserId;

  // Check share token for UNLISTED or access override
  const token = (req.query.token as string) || (req.headers['x-share-token'] as string);
  let hasValidToken = false;
  if (token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    hasValidToken = await SharingRepository.validateShareToken(tokenHash, projectId);
  }

  const isAccessible = project.is_public || project.visibility === 'PUBLIC' || isOwner || isAdmin || hasValidToken;

  if (!isAccessible) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have access to this private project.' });
    return;
  }

  const circuit = await ProjectRepository.getCircuit(project.circuit_id);
  const circuitIR = circuit
    ? {
        version: '1.0',
        name: circuit.name,
        qubits: circuit.qubits,
        classicalBits: circuit.classical_bits,
        gates: JSON.parse(circuit.gates_json || '[]'),
      }
    : null;

  res.json({
    success: true,
    project: {
      id: project.id,
      title: project.title,
      description: project.description,
      tags: JSON.parse(project.tags_json || '[]'),
      circuitIR,
      isPublic: project.is_public,
      visibility: project.visibility || (project.is_public ? 'PUBLIC' : 'PRIVATE'),
      userId: project.user_id,
      version: project.version,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    },
  });
});

/**
 * GET /api/v1/projects/:id/qasm
 * Directly downloads/exports the OpenQASM 2.0 representation of the project's circuit.
 */
router.get('/:id/qasm', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const projectId = req.params.id;
  const project = await ProjectRepository.findById(projectId);

  if (!project) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Project not found.' });
    return;
  }

  const currentUserId = req.user?.id;
  const isAdmin = req.user?.role === 'ADMIN';
  const isOwner = project.user_id === currentUserId;

  const token = (req.query.token as string) || (req.headers['x-share-token'] as string);
  let hasValidToken = false;
  if (token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    hasValidToken = await SharingRepository.validateShareToken(tokenHash, projectId);
  }

  const isAccessible = project.is_public || project.visibility === 'PUBLIC' || isOwner || isAdmin || hasValidToken;

  if (!isAccessible) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have access to this private project.' });
    return;
  }

  const circuit = await ProjectRepository.getCircuit(project.circuit_id);
  if (!circuit) {
    res.status(404).json({ error: 'CIRCUIT_NOT_FOUND', message: 'Circuit data not found.' });
    return;
  }

  const circuitIR = {
    version: '1.0',
    name: circuit.name,
    qubits: circuit.qubits,
    classicalBits: circuit.classical_bits,
    gates: JSON.parse(circuit.gates_json || '[]'),
  };

  const qasmText = QuantumAdapters.toOpenQASM(circuitIR);
  const filename = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.qasm`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(qasmText);
});

/**
 * POST /api/v1/projects/:id/share
 * Generates secure share tokens or updates project visibility in PostgreSQL.
 */
router.post('/:id/share', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const projectId = req.params.id;
  const project = await ProjectRepository.findById(projectId);

  if (!project) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Project not found.' });
    return;
  }

  if (project.user_id !== req.user!.id && req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'UNAUTHORIZED', message: 'You do not have permission to share this project.' });
    return;
  }

  const { visibility, isPublic } = req.body;
  let newVisibility: 'PRIVATE' | 'UNLISTED' | 'PUBLIC' = project.visibility || (project.is_public ? 'PUBLIC' : 'PRIVATE');

  if (visibility && ['PRIVATE', 'UNLISTED', 'PUBLIC'].includes(visibility)) {
    newVisibility = visibility as any;
  } else if (isPublic !== undefined) {
    newVisibility = isPublic ? 'PUBLIC' : 'PRIVATE';
  }

  await ProjectRepository.updateVisibility(projectId, newVisibility, newVisibility === 'PUBLIC');

  // Generate a cryptographically secure random token for UNLISTED sharing
  const rawShareToken = crypto.randomBytes(32).toString('hex');
  const shareTokenHash = crypto.createHash('sha256').update(rawShareToken).digest('hex');

  if (newVisibility === 'UNLISTED') {
    await SharingRepository.createShareToken({
      tokenHash: shareTokenHash,
      resourceType: 'PROJECT',
      resourceId: projectId,
      permissions: 'VIEW',
      createdBy: req.user!.id,
    });
  }

  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'http';
  const shareUrl = newVisibility === 'UNLISTED'
    ? `${protocol}://${host}/?project=${project.id}&token=${rawShareToken}`
    : `${protocol}://${host}/?project=${project.id}`;

  logAuditEvent({
    userId: req.user!.id,
    action: 'PROJECT_SHARE_UPDATE',
    resourceType: 'PROJECT',
    resourceId: projectId,
    ipAddress: req.ip,
    status: 'SUCCESS',
    metadata: { visibility: newVisibility },
  });

  res.json({
    success: true,
    shareUrl,
    shareToken: newVisibility === 'UNLISTED' ? rawShareToken : undefined,
    visibility: newVisibility,
    isPublic: newVisibility === 'PUBLIC',
    message: `Project visibility updated to ${newVisibility}.`,
  });
});

/**
 * DELETE /api/v1/projects/:id
 */
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const projectId = req.params.id;
  const project = await ProjectRepository.findById(projectId);

  if (!project) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Project not found.' });
    return;
  }

  if (project.user_id !== req.user!.id && req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'UNAUTHORIZED', message: 'You do not have permission to delete this project.' });
    return;
  }

  await ProjectRepository.delete(projectId);

  logAuditEvent({
    userId: req.user!.id,
    action: 'PROJECT_DELETE',
    resourceType: 'PROJECT',
    resourceId: projectId,
    ipAddress: req.ip,
    status: 'SUCCESS',
  });

  res.json({ success: true, message: 'Project deleted successfully.' });
});

export default router;

