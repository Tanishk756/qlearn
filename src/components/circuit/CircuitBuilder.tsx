/**
 * Q-Learn Nexus - Quantum Circuit Builder Canvas
 * Interactive multi-qubit timeline canvas with gate placement, wire manipulation,
 * parameter configuration, and live state updates.
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import {
  CircuitGate,
  GateType,
  QuantumCircuitIR,
  SimulationResult,
} from '../../types/quantum';
import {
  Play,
  RotateCcw,
  Plus,
  Minus,
  Sparkles,
  Trash2,
  Sliders,
  Settings2,
  Zap,
  Download,
  Share2,
  Check,
} from 'lucide-react';
import { QUANTUM_ALGORITHMS } from '../../quantum/algorithms';
import { analyzeAndOptimizeCircuit } from '../../quantum/engine';
import { irToOpenQASM } from '../../quantum/converters';

interface CircuitBuilderProps {
  circuitIR: QuantumCircuitIR;
  onUpdateCircuit: (ir: QuantumCircuitIR) => void;
  onRunSimulation: () => void;
  simulationResult: SimulationResult | null;
  selectedGateType: GateType | null;
  onSelectGateType: (gate: GateType) => void;
}

export const CircuitBuilder: React.FC<CircuitBuilderProps> = ({
  circuitIR,
  onUpdateCircuit,
  onRunSimulation,
  simulationResult,
  selectedGateType,
  onSelectGateType,
}) => {
  const [totalSteps, setTotalSteps] = useState(8);
  const [editingGate, setEditingGate] = useState<CircuitGate | null>(null);
  const [controlQubitSelection, setControlQubitSelection] = useState<{
    gateType: GateType;
    stepIndex: number;
    control?: number;
  } | null>(null);
  const [optimizationNotice, setOptimizationNotice] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const qubits = circuitIR.qubits || 2;
  const gates = circuitIR.gates || [];

  // Helper to find gate at specific qubit and step
  const getGateAt = (q: number, step: number): CircuitGate | undefined => {
    return gates.find(
      (g) => g.stepIndex === step && (g.targets.includes(q) || g.controls?.includes(q))
    );
  };

  // Add / Remove Qubits
  const handleAddQubit = () => {
    if (qubits < 6) {
      onUpdateCircuit({
        ...circuitIR,
        qubits: qubits + 1,
        classicalBits: qubits + 1,
      });
    }
  };

  const handleRemoveQubit = () => {
    if (qubits > 1) {
      const newQ = qubits - 1;
      const filteredGates = gates.filter(
        (g) => !g.targets.some((t) => t >= newQ) && !(g.controls && g.controls.some((c) => c >= newQ))
      );
      onUpdateCircuit({
        ...circuitIR,
        qubits: newQ,
        classicalBits: newQ,
        gates: filteredGates,
      });
    }
  };

  // Clear Circuit
  const handleClearCircuit = () => {
    onUpdateCircuit({
      ...circuitIR,
      gates: [],
    });
    setOptimizationNotice(null);
  };

  // Load Preset Algorithm
  const handleLoadPreset = (algoId: string) => {
    const algo = QUANTUM_ALGORITHMS.find((a) => a.id === algoId);
    if (algo) {
      onUpdateCircuit({
        ...algo.circuitIR,
        name: algo.title,
      });
      setOptimizationNotice(null);
    }
  };

  // Run Optimization Analyzer
  const handleOptimize = () => {
    const result = analyzeAndOptimizeCircuit(circuitIR);
    if (result.redundantGatesFound > 0) {
      onUpdateCircuit(result.optimizedIR);
      setOptimizationNotice(
        `Optimized! Removed ${result.redundantGatesFound} redundant gate(s). Depth reduced by ${result.depthSavings}.`
      );
    } else {
      setOptimizationNotice('Circuit is already minimal. No redundant gate pairs found.');
    }
  };

  // Export OpenQASM File Download
  const handleExportQASM = () => {
    const qasm = irToOpenQASM(circuitIR);
    const blob = new Blob([qasm], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const name = (circuitIR.name || 'quantum_circuit').toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.download = `${name}.qasm`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setShareNotice('OpenQASM 2.0 file exported and downloaded successfully.');
    setTimeout(() => setShareNotice(null), 4000);
  };

  // Share Circuit Link
  const handleShareCircuit = () => {
    try {
      const payload = encodeURIComponent(JSON.stringify(circuitIR));
      const url = `${window.location.origin}${window.location.pathname}?circuit=${payload}`;
      navigator.clipboard.writeText(url);
      setShareNotice('Shareable circuit link copied to clipboard!');
    } catch {
      setShareNotice('Circuit encoded: Open link copied to clipboard.');
    }
    setTimeout(() => setShareNotice(null), 4000);
  };

  // Slot Click Handler
  const handleSlotClick = (q: number, step: number) => {
    const existingGate = getGateAt(q, step);

    if (existingGate) {
      // If clicking existing gate, open editor or delete
      setEditingGate(existingGate);
      return;
    }

    if (!selectedGateType) {
      return;
    }

    // Handle Multi-Qubit Gate (CX / CZ / SWAP)
    if (['CX', 'CZ'].includes(selectedGateType)) {
      if (!controlQubitSelection) {
        // First click: select control qubit
        setControlQubitSelection({
          gateType: selectedGateType,
          stepIndex: step,
          control: q,
        });
      } else {
        // Second click: select target qubit
        const ctrl = controlQubitSelection.control!;
        if (ctrl !== q) {
          const newGate: CircuitGate = {
            id: `gate_${Date.now()}_${step}`,
            type: selectedGateType,
            controls: [ctrl],
            targets: [q],
            stepIndex: step,
          };
          onUpdateCircuit({
            ...circuitIR,
            gates: [...gates, newGate],
          });
        }
        setControlQubitSelection(null);
      }
      return;
    }

    if (selectedGateType === 'SWAP') {
      if (!controlQubitSelection) {
        setControlQubitSelection({
          gateType: 'SWAP',
          stepIndex: step,
          control: q,
        });
      } else {
        const q1 = controlQubitSelection.control!;
        if (q1 !== q) {
          const newGate: CircuitGate = {
            id: `gate_${Date.now()}_${step}`,
            type: 'SWAP',
            targets: [q1, q],
            stepIndex: step,
          };
          onUpdateCircuit({
            ...circuitIR,
            gates: [...gates, newGate],
          });
        }
        setControlQubitSelection(null);
      }
      return;
    }

    // Single Qubit Gate placement
    const newGate: CircuitGate = {
      id: `gate_${Date.now()}_${step}`,
      type: selectedGateType,
      targets: [q],
      stepIndex: step,
      params: ['Rx', 'Ry', 'Rz'].includes(selectedGateType) ? { theta: Math.PI / 2 } : undefined,
    };

    onUpdateCircuit({
      ...circuitIR,
      gates: [...gates, newGate],
    });
  };

  // Delete specific gate
  const handleDeleteGate = (gateId: string) => {
    onUpdateCircuit({
      ...circuitIR,
      gates: gates.filter((g) => g.id !== gateId),
    });
    setEditingGate(null);
  };

  // Update angle parameter for rotation gate
  const handleUpdateGateParam = (theta: number) => {
    if (!editingGate) return;
    onUpdateCircuit({
      ...circuitIR,
      gates: gates.map((g) => (g.id === editingGate.id ? { ...g, params: { theta } } : g)),
    });
    setEditingGate((prev) => (prev ? { ...prev, params: { theta } } : null));
  };

  return (
    <div id="circuit-builder-canvas" className="bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs flex flex-col gap-6">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-medium text-[#2D3326]">
              {circuitIR.name || 'Interactive Quantum Canvas'}
            </h2>
            <span className="text-xs font-mono bg-[#F3F0E9] text-[#5A634E] px-2.5 py-1 rounded-full border border-[#E8E4DA]">
              {qubits} Qubits • {gates.length} Gates
            </span>
          </div>
          <p className="text-xs text-[#8C857B] mt-0.5">
            Click on a wire step to place gates. Click any placed gate to edit or delete.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Algorithms Loader */}
          <select
            id="circuit-preset-select"
            onChange={(e) => e.target.value && handleLoadPreset(e.target.value)}
            defaultValue=""
            className="bg-[#F3F0E9] text-[#5A634E] text-xs font-medium px-3 py-2 rounded-2xl border border-[#E8E4DA] outline-none cursor-pointer hover:bg-[#EAE7E0] transition-all"
          >
            <option value="" disabled>
              Load Preset Circuit...
            </option>
            {QUANTUM_ALGORITHMS.map((algo) => (
              <option key={algo.id} value={algo.id}>
                {algo.title}
              </option>
            ))}
          </select>

          {/* Add / Remove Qubits */}
          <div className="flex items-center gap-1 bg-[#F3F0E9] p-1 rounded-2xl border border-[#E8E4DA]">
            <button
              id="circuit-remove-qubit"
              onClick={handleRemoveQubit}
              disabled={qubits <= 1}
              className="p-1 text-[#6D7268] hover:text-[#2D3326] disabled:opacity-30 rounded-lg"
              title="Remove Qubit"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold px-1.5 text-[#5A634E]">{qubits}Q</span>
            <button
              id="circuit-add-qubit"
              onClick={handleAddQubit}
              disabled={qubits >= 6}
              className="p-1 text-[#6D7268] hover:text-[#2D3326] disabled:opacity-30 rounded-lg"
              title="Add Qubit"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Optimize Button */}
          <button
            id="circuit-optimize-btn"
            onClick={handleOptimize}
            className="px-3.5 py-2 bg-[#F3F0E9] hover:bg-[#EAE7E0] text-[#5A634E] text-xs font-medium rounded-2xl border border-[#E8E4DA] flex items-center gap-1.5 transition-all"
            title="Transpile & cancel redundant inverse gates"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8DA47E]" />
            <span>Optimize</span>
          </button>

          {/* Export OpenQASM Button */}
          <button
            id="circuit-export-qasm-btn"
            onClick={handleExportQASM}
            className="px-3.5 py-2 bg-[#F3F0E9] hover:bg-[#EAE7E0] text-[#5A634E] text-xs font-medium rounded-2xl border border-[#E8E4DA] flex items-center gap-1.5 transition-all"
            title="Download OpenQASM 2.0 file"
          >
            <Download className="w-3.5 h-3.5 text-[#5A634E]" />
            <span>Export QASM</span>
          </button>

          {/* Share Circuit Link Button */}
          <button
            id="circuit-share-link-btn"
            onClick={handleShareCircuit}
            className="px-3.5 py-2 bg-[#F3F0E9] hover:bg-[#EAE7E0] text-[#5A634E] text-xs font-medium rounded-2xl border border-[#E8E4DA] flex items-center gap-1.5 transition-all"
            title="Copy shareable circuit link"
          >
            <Share2 className="w-3.5 h-3.5 text-[#5A634E]" />
            <span>Share</span>
          </button>

          {/* Clear Button */}
          <button
            id="circuit-clear-btn"
            onClick={handleClearCircuit}
            className="p-2 text-[#8C857B] hover:text-red-700 hover:bg-red-50 rounded-2xl border border-[#E8E4DA] transition-all"
            title="Clear All Gates"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Run Simulation Trigger */}
          <button
            id="circuit-run-sim-btn"
            onClick={onRunSimulation}
            className="px-5 py-2 bg-[#8DA47E] hover:bg-[#7B926C] text-white text-xs font-semibold rounded-2xl shadow-xs flex items-center gap-2 transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Simulation</span>
          </button>
        </div>
      </div>

      {/* Share / Export Notice Banner */}
      {shareNotice && (
        <div className="p-3 bg-[#EBF3E8] rounded-2xl border border-[#8DA47E]/60 flex items-center justify-between text-xs text-[#3E5C31]">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#5A824B]" />
            <span className="font-medium">{shareNotice}</span>
          </div>
          <button onClick={() => setShareNotice(null)} className="text-[#5A824B] hover:text-[#2D3326]">
            ✕
          </button>
        </div>
      )}

      {/* Optimization Notice Banner */}
      {optimizationNotice && (
        <div className="p-3 bg-[#F3F0E9] rounded-2xl border border-[#8DA47E]/40 flex items-center justify-between text-xs text-[#5A634E]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8DA47E]" />
            <span>{optimizationNotice}</span>
          </div>
          <button onClick={() => setOptimizationNotice(null)} className="text-[#8C857B] hover:text-[#2D3326]">
            ✕
          </button>
        </div>
      )}

      {/* Control Qubit Selection Instruction */}
      {controlQubitSelection && (
        <div className="p-3 bg-[#5A634E] text-white rounded-2xl text-xs flex items-center justify-between shadow-xs">
          <span>
            Control qubit selected on wire <strong>q[{controlQubitSelection.control}]</strong>. Now click the target
            wire to place <strong>{controlQubitSelection.gateType}</strong>.
          </span>
          <button
            onClick={() => setControlQubitSelection(null)}
            className="bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-lg font-medium"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Quantum Wire Matrix Timeline Canvas */}
      <div className="overflow-x-auto pb-4 pt-2">
        <div className="min-w-[640px] space-y-4">
          {Array.from({ length: qubits }).map((_, qIdx) => (
            <div key={qIdx} className="flex items-center gap-4 relative group">
              {/* Qubit Label & Initial State */}
              <div className="w-20 shrink-0 flex items-center justify-between bg-[#F3F0E9] px-3 py-2 rounded-2xl border border-[#E8E4DA]">
                <span className="font-mono text-xs font-bold text-[#2D3326]">q[{qIdx}]</span>
                <span className="font-mono text-[10px] text-[#8C857B]">|0⟩</span>
              </div>

              {/* Wire Line with Step Columns */}
              <div className="flex-1 relative flex items-center justify-between py-4">
                {/* Horizontal Wire Line */}
                <div className="absolute left-0 right-0 h-0.5 bg-[#D9D5CB] z-0" />

                {/* Step Slots */}
                {Array.from({ length: totalSteps }).map((_, stepIdx) => {
                  const gate = getGateAt(qIdx, stepIdx);
                  const isTarget = gate && gate.targets.includes(qIdx);
                  const isControl = gate && gate.controls?.includes(qIdx);
                  const isPendingControl =
                    controlQubitSelection?.stepIndex === stepIdx && controlQubitSelection?.control === qIdx;

                  return (
                    <button
                      key={stepIdx}
                      id={`slot-q${qIdx}-s${stepIdx}`}
                      onClick={() => handleSlotClick(qIdx, stepIdx)}
                      className={`relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center font-mono font-bold text-xs transition-all border ${
                        isPendingControl
                          ? 'bg-[#5A634E] text-white border-[#5A634E] ring-2 ring-[#8DA47E] scale-105'
                          : isControl
                          ? 'bg-[#2D3326] text-white border-[#2D3326] shadow-xs'
                          : isTarget
                          ? gate?.type === 'Barrier'
                            ? 'bg-[#E8E4DA] text-[#8C857B] border-dashed border-[#8C857B]'
                            : gate?.type === 'M'
                            ? 'bg-[#5A634E] text-white border-[#5A634E]'
                            : 'bg-[#8DA47E] text-white border-[#7B926C] shadow-xs hover:scale-105'
                          : 'bg-white hover:bg-[#F3F0E9] text-transparent hover:text-[#8C857B] border-[#E8E4DA] hover:border-[#D9D5CB]'
                      }`}
                      title={
                        gate
                          ? `${gate.type} on q[${qIdx}] step ${stepIdx}${
                              gate.params?.theta !== undefined ? ` (θ=${gate.params.theta})` : ''
                            }`
                          : `Place gate on q[${qIdx}] step ${stepIdx}`
                      }
                    >
                      {isControl ? (
                        <div className="w-3 h-3 rounded-full bg-white" />
                      ) : isTarget ? (
                        <span>
                          {gate?.type}
                          {gate?.params?.theta !== undefined && (
                            <span className="text-[8px] block opacity-80">
                              {((gate.params.theta / Math.PI) * 180).toFixed(0)}°
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-[10px] opacity-40">+</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Circuit Depth & Complexity Metrics Bar */}
      {simulationResult && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E8E4DA]">
          <div className="bg-[#F3F0E9] p-3 rounded-2xl border border-[#E8E4DA]">
            <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Circuit Depth</span>
            <span className="text-base font-mono font-semibold text-[#2D3326]">
              {simulationResult.circuitDepth}
            </span>
          </div>
          <div className="bg-[#F3F0E9] p-3 rounded-2xl border border-[#E8E4DA]">
            <span className="text-[10px] uppercase font-bold text-[#8C857B] block">2-Qubit Gates (CX/CZ)</span>
            <span className="text-base font-mono font-semibold text-[#5A634E]">
              {simulationResult.twoQubitGateCount}
            </span>
          </div>
          <div className="bg-[#F3F0E9] p-3 rounded-2xl border border-[#E8E4DA]">
            <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Entanglement Entropy</span>
            <span className="text-base font-mono font-semibold text-[#2D3326]">
              {simulationResult.entanglementEntropy ?? 0}
            </span>
          </div>
          <div className="bg-[#F3F0E9] p-3 rounded-2xl border border-[#E8E4DA]">
            <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Simulation Latency</span>
            <span className="text-base font-mono font-semibold text-[#5A634E]">
              {simulationResult.executionTimeMs} ms
            </span>
          </div>
        </div>
      )}

      {/* Parameter Adjustment Modal / Drawer */}
      {editingGate && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-[#E8E4DA] shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="font-serif text-lg font-medium text-[#2D3326]">
                Configure Gate: <strong>{editingGate.type}</strong>
              </h4>
              <button
                onClick={() => setEditingGate(null)}
                className="text-[#8C857B] hover:text-[#2D3326] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-[#6D7268] space-y-1">
              <p>
                <strong>Step Column:</strong> {editingGate.stepIndex}
              </p>
              <p>
                <strong>Target Qubit:</strong> q[{editingGate.targets.join(', ')}]
              </p>
              {editingGate.controls && (
                <p>
                  <strong>Control Qubit:</strong> q[{editingGate.controls.join(', ')}]
                </p>
              )}
            </div>

            {/* If rotation gate, show angle slider */}
            {['Rx', 'Ry', 'Rz'].includes(editingGate.type) && (
              <div className="space-y-2 bg-[#F3F0E9] p-3 rounded-2xl border border-[#E8E4DA]">
                <label className="text-xs font-semibold text-[#5A634E] block">
                  Rotation Angle θ: {(editingGate.params?.theta ?? Math.PI / 2).toFixed(3)} rad (
                  {(((editingGate.params?.theta ?? Math.PI / 2) / Math.PI) * 180).toFixed(0)}°)
                </label>
                <input
                  type="range"
                  min="0"
                  max={Math.PI * 2}
                  step="0.05"
                  value={editingGate.params?.theta ?? Math.PI / 2}
                  onChange={(e) => handleUpdateGateParam(parseFloat(e.target.value))}
                  className="w-full accent-[#8DA47E]"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#8C857B]">
                  <button onClick={() => handleUpdateGateParam(Math.PI / 4)} className="hover:text-[#2D3326]">
                    π/4
                  </button>
                  <button onClick={() => handleUpdateGateParam(Math.PI / 2)} className="hover:text-[#2D3326]">
                    π/2
                  </button>
                  <button onClick={() => handleUpdateGateParam(Math.PI)} className="hover:text-[#2D3326]">
                    π
                  </button>
                  <button onClick={() => handleUpdateGateParam(2 * Math.PI)} className="hover:text-[#2D3326]">
                    2π
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                id="modal-delete-gate-btn"
                onClick={() => handleDeleteGate(editingGate.id)}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded-xl transition-all"
              >
                Delete Gate
              </button>
              <button
                id="modal-close-gate-btn"
                onClick={() => setEditingGate(null)}
                className="px-5 py-2 bg-[#8DA47E] hover:bg-[#7B926C] text-white text-xs font-medium rounded-xl transition-all shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
