/**
 * Q-Learn Nexus - Quantum Concept Explorer (Interactive Micro-Labs)
 * Hands-on interactive experiments for superposition, interference, entanglement,
 * teleportation, unitary reversibility, and no-cloning theorem.
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import { Sliders, Zap, Network, ArrowRight, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

export const ConceptExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'superposition' | 'interference' | 'entanglement' | 'teleportation' | 'nocloning'>('superposition');

  // Superposition Interactive State
  const [theta, setTheta] = useState(Math.PI / 3); // 60 degrees
  const alpha = Math.cos(theta / 2);
  const beta = Math.sin(theta / 2);
  const p0 = alpha * alpha;
  const p1 = beta * beta;

  // Interference State
  const [phaseShift, setPhaseShift] = useState(0); // 0 to 2*PI
  // After H -> Phase(phi) -> H:
  // State before second H: 1/sqrt(2) (|0> + e^{i phi} |1>)
  // After second H: 1/2 [ (1 + e^{i phi}) |0> + (1 - e^{i phi}) |1> ]
  const intProb0 = 0.5 * (1 + Math.cos(phaseShift));
  const intProb1 = 0.5 * (1 - Math.cos(phaseShift));

  // Entanglement State
  const [aliceMeasured, setAliceMeasured] = useState<number | null>(null);
  const [bobCollapsed, setBobCollapsed] = useState<number | null>(null);

  const handleAliceMeasure = () => {
    const outcome = Math.random() < 0.5 ? 0 : 1;
    setAliceMeasured(outcome);
    setBobCollapsed(outcome); // 100% correlation in Bell |Phi+>
  };

  const handleResetBell = () => {
    setAliceMeasured(null);
    setBobCollapsed(null);
  };

  return (
    <div id="concept-explorer-container" className="bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs flex flex-col gap-6">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-medium text-[#2D3326]">Quantum Concept Micro-Labs</h2>
          <p className="text-xs text-[#8C857B]">
            Interactive physical intuitions behind quantum mechanics
          </p>
        </div>

        {/* Experiment Selector */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#F3F0E9] p-1 rounded-2xl border border-[#E8E4DA]">
          {[
            { id: 'superposition', label: 'Superposition', icon: Sliders },
            { id: 'interference', label: 'Interference', icon: Zap },
            { id: 'entanglement', label: 'Entanglement & Bell', icon: Network },
            { id: 'nocloning', label: 'No-Cloning Theorem', icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                id={`concept-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-[#5A634E] shadow-xs font-semibold'
                    : 'text-[#6D7268] hover:text-[#2D3326]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Superposition Micro-Lab */}
      {activeTab === 'superposition' && (
        <div className="p-6 bg-[#FDFCF9] rounded-3xl border border-[#E8E4DA] flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-xl font-medium text-[#2D3326]">Qubit Superposition Slider</h3>
                <p className="text-xs text-[#6D7268] mt-1 leading-relaxed">
                  Unlike a classical bit which is locked in 0 or 1, a qubit's state is a continuous linear combination
                  $|\psi\rangle = \cos(\theta/2)|0\rangle + \sin(\theta/2)|1\rangle$. Adjust angle $\theta$ below:
                </p>
              </div>

              {/* Slider */}
              <div className="bg-white p-4 rounded-2xl border border-[#E8E4DA] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-semibold text-[#5A634E]">
                  <span>Polar Angle θ: {((theta / Math.PI) * 180).toFixed(0)}°</span>
                  <span>{theta.toFixed(2)} rad</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.PI}
                  step="0.01"
                  value={theta}
                  onChange={(e) => setTheta(parseFloat(e.target.value))}
                  className="w-full accent-[#8DA47E]"
                />
                <div className="flex justify-between text-[11px] font-mono text-[#8C857B]">
                  <span>|0⟩ (0°)</span>
                  <span>|+⟩ (90°)</span>
                  <span>|1⟩ (180°)</span>
                </div>
              </div>

              {/* Quantum State Equation */}
              <div className="bg-[#F3F0E9] p-4 rounded-2xl border border-[#E8E4DA] font-mono text-xs text-[#2D3326] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Wavefunction State</span>
                <p className="text-sm font-semibold text-[#5A634E]">
                  |ψ⟩ = {alpha.toFixed(3)} |0⟩ + {beta.toFixed(3)} |1⟩
                </p>
                <p className="text-[11px] text-[#8C857B]">
                  Normalization: |α|² + |β|² = {p0.toFixed(3)} + {p1.toFixed(3)} = 1.000
                </p>
              </div>
            </div>

            {/* Measurement Probabilities Breakdown */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-[#E8E4DA] space-y-4">
                <span className="text-[10px] uppercase font-bold text-[#8C857B] block">
                  Born Rule Measurement Probabilities
                </span>

                {/* State |0> */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-bold text-[#2D3326]">P(|0⟩) = |α|²</span>
                    <span className="font-semibold text-[#5A634E]">{(p0 * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-[#E8E4DA] h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-[#5A634E] h-full rounded-full transition-all"
                      style={{ width: `${p0 * 100}%` }}
                    />
                  </div>
                </div>

                {/* State |1> */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-bold text-[#2D3326]">P(|1⟩) = |β|²</span>
                    <span className="font-semibold text-[#8DA47E]">{(p1 * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-[#E8E4DA] h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-[#8DA47E] h-full rounded-full transition-all"
                      style={{ width: `${p1 * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#F3F0E9] rounded-2xl border border-[#E8E4DA] text-xs text-[#6D7268] leading-relaxed">
                <strong>Key Takeaway:</strong> In quantum mechanics, probabilities arise from squared complex amplitudes.
                Continuous rotations in Hilbert space generate smooth, deterministic probability controls before measurement.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Interference Micro-Lab */}
      {activeTab === 'interference' && (
        <div className="p-6 bg-[#FDFCF9] rounded-3xl border border-[#E8E4DA] flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-medium text-[#2D3326]">Quantum Wave Interference (Mach-Zehnder Analogue)</h3>
              <p className="text-xs text-[#6D7268] leading-relaxed">
                Quantum algorithms achieve computational speedups by inducing <strong>constructive interference</strong> on
                the correct answer and <strong>destructive interference</strong> on incorrect paths.
              </p>

              {/* Phase Shift Slider */}
              <div className="bg-white p-4 rounded-2xl border border-[#E8E4DA] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-semibold text-[#5A634E]">
                  <span>Relative Phase Shift Δϕ: {((phaseShift / Math.PI) * 180).toFixed(0)}°</span>
                  <span>{phaseShift.toFixed(2)} rad</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.PI * 2}
                  step="0.05"
                  value={phaseShift}
                  onChange={(e) => setPhaseShift(parseFloat(e.target.value))}
                  className="w-full accent-[#8DA47E]"
                />
                <div className="flex justify-between text-[11px] font-mono text-[#8C857B]">
                  <span>0 (H·H = |0⟩)</span>
                  <span>π (H·Z·H = |1⟩)</span>
                  <span>2π (Constructive)</span>
                </div>
              </div>
            </div>

            {/* Output Interference Amplitudes */}
            <div className="bg-white p-5 rounded-2xl border border-[#E8E4DA] space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B] block">
                Output State Interferences
              </span>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold text-[#2D3326]">Constructive Amplitude |0⟩</span>
                  <span className="font-semibold text-[#5A634E]">{(intProb0 * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#E8E4DA] h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-[#5A634E] h-full rounded-full transition-all"
                    style={{ width: `${intProb0 * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold text-[#2D3326]">Destructive Amplitude |1⟩</span>
                  <span className="font-semibold text-[#8DA47E]">{(intProb1 * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#E8E4DA] h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-[#8DA47E] h-full rounded-full transition-all"
                    style={{ width: `${intProb1 * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Entanglement Micro-Lab */}
      {activeTab === 'entanglement' && (
        <div className="p-6 bg-[#FDFCF9] rounded-3xl border border-[#E8E4DA] flex flex-col gap-6">
          <div>
            <h3 className="font-serif text-xl font-medium text-[#2D3326]">EPR Entangled Pair Measurement Simulator</h3>
            <p className="text-xs text-[#6D7268] mt-1 leading-relaxed">
              Alice and Bob share the maximally entangled state $|\Phi^+\rangle = (|00\rangle + |11\rangle)/\sqrt{2}$.
              When Alice measures her qubit, notice how Bob's qubit collapses instantaneously.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alice Lab */}
            <div className="bg-white p-5 rounded-2xl border border-[#E8E4DA] flex flex-col items-center justify-center gap-3 text-center">
              <span className="text-xs font-mono font-bold text-[#5A634E] bg-[#F3F0E9] px-3 py-1 rounded-full">
                Alice (Qubit 0)
              </span>
              <div className="w-20 h-20 rounded-full bg-[#FDFCF9] border-2 border-[#8DA47E] flex items-center justify-center font-mono text-2xl font-bold text-[#2D3326] shadow-xs">
                {aliceMeasured !== null ? aliceMeasured : '?'}
              </div>
              <button
                id="alice-measure-btn"
                onClick={handleAliceMeasure}
                disabled={aliceMeasured !== null}
                className="px-5 py-2 bg-[#8DA47E] hover:bg-[#7B926C] disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
              >
                Perform Measurement
              </button>
            </div>

            {/* Bob Lab */}
            <div className="bg-white p-5 rounded-2xl border border-[#E8E4DA] flex flex-col items-center justify-center gap-3 text-center">
              <span className="text-xs font-mono font-bold text-[#5A634E] bg-[#F3F0E9] px-3 py-1 rounded-full">
                Bob (Qubit 1)
              </span>
              <div className="w-20 h-20 rounded-full bg-[#FDFCF9] border-2 border-[#5A634E] flex items-center justify-center font-mono text-2xl font-bold text-[#2D3326] shadow-xs">
                {bobCollapsed !== null ? bobCollapsed : '?'}
              </div>
              <span className="text-xs text-[#8C857B]">
                {bobCollapsed !== null ? 'Instantaneous state collapse confirmed!' : 'Awaiting Alice measurement...'}
              </span>
            </div>
          </div>

          {aliceMeasured !== null && (
            <div className="flex justify-center">
              <button
                id="reset-bell-btn"
                onClick={handleResetBell}
                className="px-4 py-2 bg-[#F3F0E9] hover:bg-[#EAE7E0] text-[#5A634E] text-xs font-medium rounded-xl border border-[#E8E4DA] flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Prepare New Entangled Pair</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. No-Cloning Theorem Micro-Lab */}
      {activeTab === 'nocloning' && (
        <div className="p-6 bg-[#FDFCF9] rounded-3xl border border-[#E8E4DA] flex flex-col gap-4">
          <h3 className="font-serif text-xl font-medium text-[#2D3326]">The No-Cloning Theorem</h3>
          <p className="text-xs text-[#6D7268] leading-relaxed">
            The linearity of quantum mechanics mathematically prevents the existence of a universal unitary operator $U$
            capable of duplicating an arbitrary unknown state $|\psi\rangle$:
          </p>

          <div className="p-4 bg-white rounded-2xl border border-[#E8E4DA] font-mono text-xs text-[#2D3326] space-y-2">
            <p className="text-[#5A634E] font-semibold">Suppose $U(|\psi\rangle |0\rangle) = |\psi\rangle |\psi\rangle$ and $U(|\phi\rangle |0\rangle) = |\phi\rangle |\phi\rangle$</p>
            <p>Then inner product conservation requires: $\langle\psi|\phi\rangle = (\langle\psi|\phi\rangle)^2$</p>
            <p className="text-[#8C857B]">
              This is only true if $\langle\psi|\phi\rangle = 0$ (orthogonal) or $\langle\psi|\phi\rangle = 1$ (identical).
            </p>
          </div>

          <div className="p-4 bg-[#F3F0E9] rounded-2xl border border-[#E8E4DA] text-xs text-[#5A634E]">
            <strong>Security Implication:</strong> Because an eavesdropper cannot copy unknown transmitted qubits without
            destroying their delicate superposition, quantum cryptography protocols (such as BB84 and E91) detect any interception with 100% mathematical guarantee.
          </div>
        </div>
      )}
    </div>
  );
};
