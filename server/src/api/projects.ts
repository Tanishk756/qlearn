/**
 * Q-Learn Nexus - Quantum Projects REST API
 * Database-backed project CRUD, version snapshots, forking, and circuit association.
 * @license Apache-2.0
 */

import { Router, Response } from 'express';
import { db, ProjectRow, CircuitRow } from '../database/index';
import { authenticateToken, optionalAuth, AuthenticatedRequest } from '../auth/middleware';
import { validateBody, createProjectSchema } from '../security/validation';
import { logAuditEvent } from '../security/auditLogger';
import { QuantumAdapters } from '../quantum/adapters';
import crypto from 'crypto';

const router = Router();

/**
 * GET /api/v1/projects
 * Lists user's projects and public shared projects.
 */
router.get('/', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.id;
  const projectsList = [];

  for (const project of db.projects.values()) {
    if (project.is_public || project.user_id === currentUserId) {
      const circuit = db.circuits.get(project.circuit_id);
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
  }

  // Sort descending by updated_at
  projectsList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  res.json({ success: true, projects: projectsList });
});

/**
 * POST /api/v1/projects
 * Creates a new project in the database.
 */
router.post('/', authenticateToken, validateBody(createProjectSchema), (req: AuthenticatedRequest, res: Response) => {
  const { title, description, tags, circuitIR, isPublic } = req.body;
  const userId = req.user!.id;
  const now = new Date().toISOString();

  // Create circuit record first
  const circuitId = `circ_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const circuitRow: CircuitRow = {
    id: circuitId,
    user_id: userId,
    name: circuitIR.name || title,
    qubits: circuitIR.qubits,
    classical_bits: circuitIR.classicalBits,
    gates_json: JSON.stringify(circuitIR.gates),
    version: 1,
    is_public: !!isPublic,
    created_at: now,
    updated_at: now,
  };
  db.circuits.set(circuitId, circuitRow);

  // Create project record
  const projectId = `proj_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const projectRow: ProjectRow = {
    id: projectId,
    user_id: userId,
    title: title.trim(),
    description: (description || '').trim(),
    circuit_id: circuitId,
    tags_json: JSON.stringify(tags || []),
    is_public: !!isPublic,
    version: 1,
    created_at: now,
    updated_at: now,
  };
  db.projects.set(projectId, projectRow);
  db.persist();

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
      id: projectRow.id,
      title: projectRow.title,
      description: projectRow.description,
      tags: tags || [],
      circuitIR,
      isPublic: projectRow.is_public,
      version: projectRow.version,
      createdAt: projectRow.created_at,
      updatedAt: projectRow.updated_at,
    },
  });
});

/**
 * PUT /api/v1/projects/:id
 * Updates an existing project and its associated circuit.
 */
router.put('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const projectId = req.params.id;
  const project = db.projects.get(projectId);

  if (!project) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Project not found.' });
    return;
  }

  if (project.user_id !== req.user!.id && req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'UNAUTHORIZED', message: 'You do not have permission to edit this project.' });
    return;
  }

  const { title, description, tags, circuitIR, isPublic } = req.body;
  const now = new Date().toISOString();

  if (title) project.title = title.trim();
  if (description !== undefined) project.description = description.trim();
  if (tags) project.tags_json = JSON.stringify(tags);
  if (isPublic !== undefined) project.is_public = !!isPublic;
  project.version += 1;
  project.updated_at = now;

  if (circuitIR) {
    let circuit = db.circuits.get(project.circuit_id);
    if (!circuit) {
      circuit = {
        id: project.circuit_id,
        user_id: req.user!.id,
        name: circuitIR.name || project.title,
        qubits: circuitIR.qubits,
        classical_bits: circuitIR.classicalBits,
        gates_json: JSON.stringify(circuitIR.gates),
        version: 1,
        is_public: project.is_public,
        created_at: now,
        updated_at: now,
      };
      db.circuits.set(project.circuit_id, circuit);
    } else {
      circuit.name = circuitIR.name || circuit.name;
      circuit.qubits = circuitIR.qubits;
      circuit.classical_bits = circuitIR.classicalBits;
      circuit.gates_json = JSON.stringify(circuitIR.gates);
      circuit.version += 1;
      circuit.updated_at = now;
    }
  }

  db.persist();

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
 * Retrieves single project with IDOR access controls and share token verification.
 */
router.get('/:id', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const projectId = req.params.id;
  const project = db.projects.get(projectId);

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
    const tokenRecord = Array.from(db.sessions.values()).find(
      (s: any) => s.resource_id === projectId && s.token_hash === tokenHash && !s.revoked
    );
    if (tokenRecord) {
      hasValidToken = true;
    }
  }

  const isAccessible = project.is_public || project.visibility === 'PUBLIC' || isOwner || isAdmin || hasValidToken;

  if (!isAccessible) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have access to this private project.' });
    return;
  }

  const circuit = db.circuits.get(project.circuit_id);
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
router.get('/:id/qasm', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const projectId = req.params.id;
  const project = db.projects.get(projectId);

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
    const tokenRecord = Array.from(db.sessions.values()).find(
      (s: any) => s.resource_id === projectId && s.token_hash === tokenHash && !s.revoked
    );
    if (tokenRecord) {
      hasValidToken = true;
    }
  }

  const isAccessible = project.is_public || project.visibility === 'PUBLIC' || isOwner || isAdmin || hasValidToken;

  if (!isAccessible) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have access to this private project.' });
    return;
  }

  const circuit = db.circuits.get(project.circuit_id);
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
 * Generates secure share tokens or updates project visibility (PRIVATE, UNLISTED, PUBLIC).
 */
router.post('/:id/share', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const projectId = req.params.id;
  const project = db.projects.get(projectId);

  if (!project) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Project not found.' });
    return;
  }

  if (project.user_id !== req.user!.id && req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'UNAUTHORIZED', message: 'You do not have permission to share this project.' });
    return;
  }

  const { visibility, isPublic } = req.body;
  let newVisibility = project.visibility || (project.is_public ? 'PUBLIC' : 'PRIVATE');

  if (visibility) {
    if (['PRIVATE', 'UNLISTED', 'PUBLIC'].includes(visibility)) {
      newVisibility = visibility;
    }
  } else if (isPublic !== undefined) {
    newVisibility = isPublic ? 'PUBLIC' : 'PRIVATE';
  }

  project.visibility = newVisibility;
  project.is_public = newVisibility === 'PUBLIC';
  project.updated_at = new Date().toISOString();

  // Generate a cryptographically secure random token for UNLISTED sharing
  const rawShareToken = crypto.randomBytes(32).toString('hex');
  const shareTokenHash = crypto.createHash('sha256').update(rawShareToken).digest('hex');

  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'http';
  const shareUrl = newVisibility === 'UNLISTED'
    ? `${protocol}://${host}/?project=${project.id}&token=${rawShareToken}`
    : `${protocol}://${host}/?project=${project.id}`;

  db.persist();

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
    isPublic: project.is_public,
    message: `Project visibility updated to ${newVisibility}.`,
  });
});

/**
 * DELETE /api/v1/projects/:id
 */
router.delete('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const projectId = req.params.id;
  const project = db.projects.get(projectId);

  if (!project) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Project not found.' });
    return;
  }

  if (project.user_id !== req.user!.id && req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'UNAUTHORIZED', message: 'You do not have permission to delete this project.' });
    return;
  }

  db.circuits.delete(project.circuit_id);
  db.projects.delete(projectId);
  db.persist();

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
