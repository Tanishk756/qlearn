/**
 * Q-Learn Nexus - Quantum Projects & Version History Manager
 * Connected to server-side database storage via API Client.
 * @license Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SavedProject, QuantumCircuitIR } from '../../types/quantum';
import { api } from '../../services/apiClient';
import {
  FolderKanban,
  Plus,
  Trash2,
  Download,
  Play,
  Share2,
  FileCode,
  Check,
} from 'lucide-react';
import { irToOpenQASM } from '../../quantum/converters';

interface ProjectsViewProps {
  currentCircuit: QuantumCircuitIR;
  onLoadProjectCircuit: (ir: QuantumCircuitIR) => void;
  onSaveCurrentAsProject: (title: string, description: string) => void;
}

const DEFAULT_PROJECTS: SavedProject[] = [
  {
    id: 'proj_1',
    title: 'Bell State Non-Locality Test',
    description: 'Standard 2-qubit EPR pair generation verifying Bell inequality Tsirelson bound.',
    createdAt: '2026-08-25',
    updatedAt: '2026-08-26',
    tags: ['Foundations', 'Entanglement'],
    circuitIR: {
      version: '1.0',
      name: 'Bell State |Φ⁺⟩',
      qubits: 2,
      classicalBits: 2,
      gates: [
        { id: 'g0', type: 'H', targets: [0], stepIndex: 0 },
        { id: 'g1', type: 'CX', controls: [0], targets: [1], stepIndex: 1 },
      ],
    },
    versionHistory: [],
  },
  {
    id: 'proj_2',
    title: 'Grover 2-Qubit Target |11⟩',
    description: 'Single-iteration Grover search with phase oracle and amplitude diffuser.',
    createdAt: '2026-08-24',
    updatedAt: '2026-08-26',
    tags: ['Search', 'Algorithms'],
    circuitIR: {
      version: '1.0',
      name: 'Grover Target |11⟩',
      qubits: 2,
      classicalBits: 2,
      gates: [
        { id: 'g0', type: 'H', targets: [0], stepIndex: 0 },
        { id: 'g1', type: 'H', targets: [1], stepIndex: 0 },
        { id: 'g2', type: 'CZ', controls: [0], targets: [1], stepIndex: 1 },
        { id: 'g3', type: 'H', targets: [0], stepIndex: 2 },
        { id: 'g4', type: 'H', targets: [1], stepIndex: 2 },
        { id: 'g5', type: 'X', targets: [0], stepIndex: 3 },
        { id: 'g6', type: 'X', targets: [1], stepIndex: 3 },
        { id: 'g7', type: 'CZ', controls: [0], targets: [1], stepIndex: 4 },
        { id: 'g8', type: 'X', targets: [0], stepIndex: 5 },
        { id: 'g9', type: 'X', targets: [1], stepIndex: 5 },
        { id: 'g10', type: 'H', targets: [0], stepIndex: 6 },
        { id: 'g11', type: 'H', targets: [1], stepIndex: 6 },
      ],
    },
    versionHistory: [],
  },
];

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  currentCircuit,
  onLoadProjectCircuit,
  onSaveCurrentAsProject,
}) => {
  const [projects, setProjects] = useState<SavedProject[]>(DEFAULT_PROJECTS);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api.getProjects()
      .then((res) => {
        if (res.success && res.projects && res.projects.length > 0) {
          const mapped: SavedProject[] = res.projects.map((p) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            createdAt: p.createdAt ? p.createdAt.split('T')[0] : '2026-08-26',
            updatedAt: p.updatedAt ? p.updatedAt.split('T')[0] : '2026-08-26',
            tags: p.tags || ['Quantum'],
            circuitIR: p.circuitIR || currentCircuit,
            versionHistory: [],
          }));
          setProjects(mapped);
        }
      })
      .catch(() => {
        // Fallback to local default state
      });
  }, [currentCircuit]);

  const handleSave = async () => {
    if (!newTitle.trim()) return;

    const circuitPayload = { ...currentCircuit, name: newTitle };

    try {
      const res = await api.createProject({
        title: newTitle,
        description: newDesc || 'User-created quantum circuit project.',
        tags: ['User Circuit'],
        circuitIR: circuitPayload,
        isPublic: false,
      });

      if (res.success && res.project) {
        const p = res.project;
        const newProj: SavedProject = {
          id: p.id,
          title: p.title,
          description: p.description,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
          tags: p.tags,
          circuitIR: p.circuitIR,
          versionHistory: [],
        };
        setProjects((prev) => [newProj, ...prev]);
      }
    } catch {
      // Local fallback
      const localProj: SavedProject = {
        id: `proj_${Date.now()}`,
        title: newTitle,
        description: newDesc || 'User-created quantum circuit project.',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        tags: ['User Circuit'],
        circuitIR: circuitPayload,
        versionHistory: [],
      };
      setProjects((prev) => [localProj, ...prev]);
    }

    onSaveCurrentAsProject(newTitle, newDesc);
    setNewTitle('');
    setNewDesc('');
    setShowSaveModal(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteProject(id);
    } catch {
      // Ignore
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleExportJSON = (proj: SavedProject) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(proj.circuitIR, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${proj.title.toLowerCase().replace(/\s+/g, '_')}_ir.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportQASM = (proj: SavedProject) => {
    const qasm = irToOpenQASM(proj.circuitIR);
    const blob = new Blob([qasm], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = `${proj.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.qasm`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
    setNotice(`Exported OpenQASM 2.0 file for "${proj.title}".`);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleShareProject = async (proj: SavedProject) => {
    try {
      const res = await api.shareProject(proj.id, true);
      const shareUrl = res.shareUrl || `${window.location.origin}${window.location.pathname}?project=${proj.id}`;
      navigator.clipboard.writeText(shareUrl);
      setNotice(`Shareable link for "${proj.title}" copied to clipboard!`);
    } catch {
      const fallbackUrl = `${window.location.origin}${window.location.pathname}?project=${proj.id}`;
      navigator.clipboard.writeText(fallbackUrl);
      setNotice(`Shareable project link copied to clipboard!`);
    }
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div id="projects-workspace-container" className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-medium text-[#2D3326]">Quantum Projects & Workspaces</h2>
          <p className="text-xs text-[#8C857B]">
            Database-persisted quantum circuit designs with version tracking, OpenQASM export, and collaboration links
          </p>
        </div>

        <button
          id="save-current-proj-btn"
          onClick={() => setShowSaveModal(true)}
          className="px-4 py-2 bg-[#8DA47E] hover:bg-[#7B926C] text-white text-xs font-semibold rounded-2xl shadow-xs flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Save Active Canvas as Project</span>
        </button>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className="p-3 bg-[#EBF3E8] rounded-2xl border border-[#8DA47E]/60 flex items-center justify-between text-xs text-[#3E5C31]">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#5A824B]" />
            <span className="font-medium">{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-[#5A824B] hover:text-[#2D3326]">
            ✕
          </button>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => (
          <div
            key={proj.id}
            id={`project-card-${proj.id}`}
            className="bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs flex flex-col justify-between gap-4 hover:border-[#8DA47E]/40 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono bg-[#F3F0E9] text-[#5A634E] px-2.5 py-0.5 rounded-full">
                  {proj.circuitIR.qubits} Qubits • {proj.circuitIR.gates.length} Gates
                </span>
                <span className="text-[10px] text-[#8C857B]">{proj.updatedAt}</span>
              </div>
              <h3 className="font-serif text-xl font-medium text-[#2D3326] mb-1">{proj.title}</h3>
              <p className="text-xs text-[#6D7268] leading-relaxed line-clamp-2">{proj.description}</p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {proj.tags.map((t, idx) => (
                <span key={idx} className="text-[10px] bg-[#FDFCF9] text-[#8C857B] px-2 py-0.5 rounded-md border border-[#E8E4DA]">
                  #{t}
                </span>
              ))}
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-[#E8E4DA]">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleExportQASM(proj)}
                  className="p-2 text-[#8C857B] hover:text-[#2D3326] hover:bg-[#F3F0E9] rounded-xl transition-all flex items-center gap-1"
                  title="Export OpenQASM (.qasm) File"
                >
                  <FileCode className="w-4 h-4 text-[#5A634E]" />
                </button>
                <button
                  onClick={() => handleExportJSON(proj)}
                  className="p-2 text-[#8C857B] hover:text-[#2D3326] hover:bg-[#F3F0E9] rounded-xl transition-all"
                  title="Export Circuit IR JSON"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShareProject(proj)}
                  className="p-2 text-[#8C857B] hover:text-[#2D3326] hover:bg-[#F3F0E9] rounded-xl transition-all"
                  title="Share Project Link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(proj.id)}
                  className="p-2 text-[#8C857B] hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                  title="Delete Project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => onLoadProjectCircuit(proj.circuitIR)}
                className="px-3.5 py-1.5 bg-[#5A634E] hover:bg-[#2D3326] text-white text-xs font-medium rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Open in Lab</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#E8E4DA] shadow-xl space-y-4">
            <h3 className="font-serif text-xl font-medium text-[#2D3326]">
              Save Active Quantum Canvas
            </h3>
            <p className="text-xs text-[#8C857B]">
              Save your current {currentCircuit.qubits}-qubit circuit into database workspace storage.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Project Title (e.g. My Entangled Teleportation Setup)"
                className="w-full bg-[#FDFCF9] text-xs px-4 py-2.5 rounded-2xl border border-[#E8E4DA] outline-none focus:border-[#8DA47E]"
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Brief description or hypothesis notes..."
                rows={3}
                className="w-full bg-[#FDFCF9] text-xs px-4 py-2.5 rounded-2xl border border-[#E8E4DA] outline-none focus:border-[#8DA47E]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-xs text-[#8C857B] hover:text-[#2D3326]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!newTitle.trim()}
                className="px-5 py-2 bg-[#8DA47E] hover:bg-[#7B926C] disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
              >
                Save Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
