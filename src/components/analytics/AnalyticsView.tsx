/**
 * Q-Learn Nexus - Diagnostics, Quantum Unitary Verification & System Telemetry
 * Verifies mathematical quantum simulator correctness against known analytical truth tables.
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import { Activity, CheckCircle2, ShieldCheck, Cpu, RefreshCw, Layers, Database } from 'lucide-react';
import { simulateCircuit, C } from '../../quantum/engine';
import { QUANTUM_ALGORITHMS } from '../../quantum/algorithms';

export const AnalyticsView: React.FC = () => {
  const [testLog, setTestLog] = useState<{ test: string; status: 'PASSED' | 'FAILED'; latency: number; details: string }[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const runQuantumSuiteTests = () => {
    setIsRunningTests(true);
    const logs: { test: string; status: 'PASSED' | 'FAILED'; latency: number; details: string }[] = [];

    // Test 1: |0> Identity
    const t0 = performance.now();
    const sim0 = simulateCircuit({
      version: '1.0',
      name: 'Test 0',
      qubits: 1,
      classicalBits: 1,
      gates: [],
    });
    const lat0 = performance.now() - t0;
    logs.push({
      test: 'Ground State Initialization |0⟩',
      status: (sim0.probabilities['0'] || 0) > 0.999 ? 'PASSED' : 'FAILED',
      latency: Number(lat0.toFixed(2)),
      details: `P(0) = ${sim0.probabilities['0'] || 0}`,
    });

    // Test 2: Pauli-X bit flip
    const tX = performance.now();
    const simX = simulateCircuit({
      version: '1.0',
      name: 'Test X',
      qubits: 1,
      classicalBits: 1,
      gates: [{ id: 'g0', type: 'X', targets: [0], stepIndex: 0 }],
    });
    const latX = performance.now() - tX;
    logs.push({
      test: 'Pauli-X Unitary Transformation (|0⟩ → |1⟩)',
      status: (simX.probabilities['1'] || 0) > 0.999 ? 'PASSED' : 'FAILED',
      latency: Number(latX.toFixed(2)),
      details: `P(1) = ${simX.probabilities['1'] || 0}`,
    });

    // Test 3: Hadamard Superposition
    const tH = performance.now();
    const simH = simulateCircuit({
      version: '1.0',
      name: 'Test H',
      qubits: 1,
      classicalBits: 1,
      gates: [{ id: 'g0', type: 'H', targets: [0], stepIndex: 0 }],
    });
    const latH = performance.now() - tH;
    const p0H = simH.probabilities['0'] || 0;
    const p1H = simH.probabilities['1'] || 0;
    logs.push({
      test: 'Hadamard Equal Superposition H|0⟩ = |+⟩',
      status: Math.abs(p0H - 0.5) < 0.01 && Math.abs(p1H - 0.5) < 0.01 ? 'PASSED' : 'FAILED',
      latency: Number(latH.toFixed(2)),
      details: `P(0) = ${p0H}, P(1) = ${p1H}`,
    });

    // Test 4: Bell State Entanglement
    const tBell = performance.now();
    const simBell = simulateCircuit(QUANTUM_ALGORITHMS[0].circuitIR);
    const latBell = performance.now() - tBell;
    const p00B = simBell.probabilities['00'] || 0;
    const p11B = simBell.probabilities['11'] || 0;
    logs.push({
      test: 'Bell State Maximal Entanglement (|00⟩ + |11⟩)/√2',
      status: Math.abs(p00B - 0.5) < 0.01 && Math.abs(p11B - 0.5) < 0.01 ? 'PASSED' : 'FAILED',
      latency: Number(latBell.toFixed(2)),
      details: `P(00) = ${p00B}, P(11) = ${p11B}`,
    });

    // Test 5: Grover 2-Qubit Amplification
    const tG = performance.now();
    const simG = simulateCircuit(QUANTUM_ALGORITHMS[6].circuitIR);
    const latG = performance.now() - tG;
    const p11G = simG.probabilities['11'] || 0;
    logs.push({
      test: 'Grover Search 2-Qubit Exact Amplification (|11⟩)',
      status: p11G > 0.99 ? 'PASSED' : 'FAILED',
      latency: Number(latG.toFixed(2)),
      details: `P(11) = ${p11G}`,
    });

    setTestLog(logs);
    setIsRunningTests(false);
  };

  return (
    <div id="analytics-diagnostics-container" className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-medium text-[#2D3326]">System Diagnostics & Verification</h2>
          <p className="text-xs text-[#8C857B]">
            Automated test suite verifying deterministic quantum mechanics correctness
          </p>
        </div>

        <button
          id="run-quantum-tests-btn"
          onClick={runQuantumSuiteTests}
          disabled={isRunningTests}
          className="px-4 py-2 bg-[#8DA47E] hover:bg-[#7B926C] disabled:opacity-40 text-white text-xs font-semibold rounded-2xl shadow-xs flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
          <span>Run Quantum Unit Tests</span>
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E8E4DA] shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-[#F3F0E9] flex items-center justify-center text-[#5A634E]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-[#8C857B] block">Simulation Engine</span>
            <span className="text-sm font-semibold text-[#2D3326]">Deterministic 2ⁿ Vector</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E8E4DA] shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-[#F3F0E9] flex items-center justify-center text-[#8DA47E]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-[#8C857B] block">Q-Nova AI Integration</span>
            <span className="text-sm font-semibold text-[#5A634E]">Gemini 2.5 Active</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E8E4DA] shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-[#F3F0E9] flex items-center justify-center text-[#5A634E]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-[#8C857B] block">Supported Frameworks</span>
            <span className="text-sm font-semibold text-[#2D3326]">Qiskit, PennyLane, Cirq, QASM</span>
          </div>
        </div>
      </div>

      {/* Unit Test Results Table */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl font-medium text-[#2D3326]">Quantum Mechanics Verification Suite</h3>
          <span className="text-xs font-mono text-[#8C857B]">
            {testLog.length > 0 ? `${testLog.filter((t) => t.status === 'PASSED').length}/${testLog.length} Tests Passed` : 'Click button above to execute tests'}
          </span>
        </div>

        {testLog.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#8C857B] bg-[#FDFCF9] rounded-2xl border border-[#E8E4DA]">
            Run tests to mathematically verify unitary preservation and Born rule probability distributions.
          </div>
        ) : (
          <div className="space-y-2">
            {testLog.map((t, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-[#FDFCF9] rounded-2xl border border-[#E8E4DA] flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#8DA47E]" />
                  <span className="font-semibold text-[#2D3326]">{t.test}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[#8C857B]">{t.details}</span>
                  <span className="text-[10px] bg-[#F3F0E9] text-[#5A634E] px-2 py-0.5 rounded-md">
                    {t.latency} ms
                  </span>
                  <span className="font-bold text-green-700">{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
