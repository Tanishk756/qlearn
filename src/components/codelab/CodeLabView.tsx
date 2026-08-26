/**
 * Q-Learn Nexus - Multi-Framework Quantum Code Lab
 * Synchronized code generation and simulation for Qiskit, PennyLane, Cirq, and OpenQASM.
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import { QuantumCircuitIR, QuantumFramework, SimulationResult } from '../../types/quantum';
import { irToQiskit, irToPennyLane, irToCirq, irToOpenQASM, qasmToIR } from '../../quantum/converters';
import { Copy, Check, Download, Play, Terminal, Code2, RefreshCw } from 'lucide-react';

interface CodeLabViewProps {
  circuitIR: QuantumCircuitIR;
  onUpdateCircuit: (ir: QuantumCircuitIR) => void;
  simulationResult: SimulationResult | null;
  onRunSimulation: () => void;
}

export const CodeLabView: React.FC<CodeLabViewProps> = ({
  circuitIR,
  onUpdateCircuit,
  simulationResult,
  onRunSimulation,
}) => {
  const [activeFramework, setActiveFramework] = useState<QuantumFramework>('qiskit');
  const [copied, setCopied] = useState(false);
  const [qasmInput, setQasmInput] = useState('');
  const [isEditingQasm, setIsEditingQasm] = useState(false);

  // Generate framework code
  const getCode = (): string => {
    switch (activeFramework) {
      case 'qiskit':
        return irToQiskit(circuitIR);
      case 'pennylane':
        return irToPennyLane(circuitIR);
      case 'cirq':
        return irToCirq(circuitIR);
      case 'qasm':
        return isEditingQasm ? qasmInput : irToOpenQASM(circuitIR);
      default:
        return irToQiskit(circuitIR);
    }
  };

  const currentCode = getCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = activeFramework === 'qasm' ? 'qasm' : 'py';
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(circuitIR.name || 'circuit').toLowerCase().replace(/\s+/g, '_')}_${activeFramework}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportQasm = () => {
    try {
      const parsedIR = qasmToIR(qasmInput);
      onUpdateCircuit(parsedIR);
      setIsEditingQasm(false);
    } catch (e) {
      alert('Failed to parse OpenQASM 2.0 format.');
    }
  };

  return (
    <div id="codelab-container" className="bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs flex flex-col gap-5">
      {/* Header & Framework Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-medium text-[#2D3326]">Multi-Framework Quantum Code Lab</h2>
          <p className="text-xs text-[#8C857B]">
            Bidirectional synchronizer for Qiskit 1.x, PennyLane, Cirq, and OpenQASM
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Framework Switcher */}
          <div className="flex items-center gap-1 bg-[#F3F0E9] p-1 rounded-2xl border border-[#E8E4DA]">
            {(['qiskit', 'pennylane', 'cirq', 'qasm'] as QuantumFramework[]).map((fw) => (
              <button
                key={fw}
                id={`framework-tab-${fw}`}
                onClick={() => {
                  setActiveFramework(fw);
                  if (fw === 'qasm') {
                    setQasmInput(irToOpenQASM(circuitIR));
                  }
                }}
                className={`px-3.5 py-1.5 text-xs font-mono rounded-xl transition-all capitalize ${
                  activeFramework === fw
                    ? 'bg-white text-[#5A634E] shadow-xs font-bold'
                    : 'text-[#6D7268] hover:text-[#2D3326]'
                }`}
              >
                {fw === 'qasm' ? 'OpenQASM' : fw}
              </button>
            ))}
          </div>

          {/* Copy Button */}
          <button
            id="codelab-copy-btn"
            onClick={handleCopy}
            className="p-2 bg-[#F3F0E9] hover:bg-[#EAE7E0] text-[#5A634E] rounded-2xl border border-[#E8E4DA] transition-all flex items-center gap-1.5 text-xs font-medium"
            title="Copy Code"
          >
            {copied ? <Check className="w-4 h-4 text-green-700" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Download File */}
          <button
            id="codelab-download-btn"
            onClick={handleDownload}
            className="p-2 bg-[#F3F0E9] hover:bg-[#EAE7E0] text-[#5A634E] rounded-2xl border border-[#E8E4DA] transition-all"
            title="Download Script"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Run Simulator */}
          <button
            id="codelab-run-btn"
            onClick={onRunSimulation}
            className="px-4 py-2 bg-[#8DA47E] hover:bg-[#7B926C] text-white text-xs font-semibold rounded-2xl shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run in Engine</span>
          </button>
        </div>
      </div>

      {/* Code Editor / Viewer */}
      <div className="relative rounded-2xl bg-[#2D3326] text-[#F3F0E9] border border-[#2D3326] p-4 font-mono text-xs overflow-hidden shadow-inner flex flex-col min-h-[320px]">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-[11px] text-[#8DA47E]">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4" />
            <span className="font-semibold uppercase tracking-wider">
              {activeFramework.toUpperCase()} Specification ({circuitIR.qubits} Qubits)
            </span>
          </div>
          {activeFramework === 'qasm' && (
            <button
              onClick={() => {
                if (isEditingQasm) handleImportQasm();
                else setIsEditingQasm(true);
              }}
              className="text-white hover:text-[#8DA47E] underline text-[11px]"
            >
              {isEditingQasm ? 'Apply to Canvas' : 'Edit QASM'}
            </button>
          )}
        </div>

        {activeFramework === 'qasm' && isEditingQasm ? (
          <textarea
            value={qasmInput}
            onChange={(e) => setQasmInput(e.target.value)}
            className="flex-1 w-full bg-transparent text-[#F3F0E9] font-mono text-xs resize-none outline-none leading-relaxed"
            rows={12}
          />
        ) : (
          <pre className="flex-1 overflow-x-auto whitespace-pre leading-relaxed text-[#F3F0E9]/90 selection:bg-[#8DA47E]/40">
            <code>{currentCode}</code>
          </pre>
        )}
      </div>

      {/* Execution Terminal Console Output */}
      {simulationResult && (
        <div className="rounded-2xl bg-[#FDFCF9] border border-[#E8E4DA] p-4 flex flex-col gap-2 font-mono text-xs">
          <div className="flex items-center justify-between text-[#8C857B] pb-2 border-b border-[#E8E4DA]">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#5A634E]" />
              <span className="font-bold text-[#5A634E]">Simulation Execution Stdout</span>
            </div>
            <span>Status: 200 OK ({simulationResult.executionTimeMs}ms)</span>
          </div>

          <div className="text-[#2D3326] space-y-1 pt-1">
            <p>✓ Circuit transpiled successfully for backend: {simulationResult.backend}</p>
            <p>✓ Measured Shots: {simulationResult.shots} shots</p>
            <p className="text-[#5A634E] font-semibold">
              Sampled Counts: {JSON.stringify(simulationResult.counts)}
            </p>
            <p className="text-[#8C857B]">
              Circuit Depth: {simulationResult.circuitDepth} | Two-Qubit Entangling Gates: {simulationResult.twoQubitGateCount}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
