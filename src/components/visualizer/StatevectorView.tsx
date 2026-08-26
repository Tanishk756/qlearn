/**
 * Q-Learn Nexus - Quantum Statevector & Phasor Dial Visualizer
 * Shows complex amplitudes (a + bi), magnitudes |α|², phase angles θ, and basis states.
 * @license Apache-2.0
 */

import React from 'react';
import { Complex } from '../../types/quantum';
import { C } from '../../quantum/engine';

interface StatevectorViewProps {
  statevector: Complex[];
  qubits: number;
}

export const StatevectorView: React.FC<StatevectorViewProps> = ({
  statevector,
  qubits,
}) => {
  const dim = 1 << qubits;

  return (
    <div id="statevector-container" className="bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-serif text-xl font-medium text-[#2D3326]">Statevector Amplitudes & Phases</h3>
          <p className="text-xs text-[#8C857B]">
            |ψ⟩ = ∑ αᵢ |i⟩ in {dim}-Dimensional Complex Hilbert Space
          </p>
        </div>
        <span className="text-xs font-mono bg-[#F3F0E9] text-[#5A634E] px-3 py-1 rounded-full border border-[#E8E4DA]">
          {dim} Basis States
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto pr-1">
        {statevector.map((amp, index) => {
          const bitstring = index.toString(2).padStart(qubits, '0');
          const prob = C.absSq(amp);
          const mag = C.abs(amp);
          const phase = C.phase(amp);
          const phaseDeg = ((phase / Math.PI) * 180).toFixed(0);
          const isActive = prob > 0.001;

          return (
            <div
              key={bitstring}
              id={`state-basis-${bitstring}`}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-[#FDFCF9] border-[#8DA47E]/40 shadow-xs'
                  : 'bg-[#F3F0E9]/40 border-[#E8E4DA]/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm font-bold text-[#2D3326] bg-[#E8E4DA] px-2 py-0.5 rounded-lg">
                  |{bitstring}⟩
                </span>
                <span className="text-xs font-mono font-semibold text-[#5A634E]">
                  {(prob * 100).toFixed(1)}%
                </span>
              </div>

              {/* Phasor Dial & Magnitude Bar */}
              <div className="flex items-center gap-3 my-1">
                {/* 2D Phase Compass Dial */}
                <div className="relative w-9 h-9 rounded-full bg-white border border-[#D9D5CB] flex items-center justify-center shrink-0">
                  <div
                    className="absolute w-3.5 h-0.5 bg-[#8DA47E] origin-left rounded-full transition-transform duration-300"
                    style={{
                      left: '50%',
                      transform: `rotate(${-phase}rad)`,
                      opacity: mag > 0.05 ? 1 : 0.2,
                    }}
                  />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2D3326]" />
                </div>

                {/* Magnitude progress */}
                <div className="flex-1">
                  <div className="w-full bg-[#E8E4DA] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#8DA47E] h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, prob * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#8C857B] mt-1 font-mono">
                    <span>|α|: {mag.toFixed(3)}</span>
                    <span>∠ {phaseDeg}°</span>
                  </div>
                </div>
              </div>

              {/* Complex Formula Notation */}
              <div className="text-[11px] font-mono text-[#6D7268] mt-1 truncate bg-white/70 px-2 py-1 rounded-md border border-[#E8E4DA]/50">
                {C.format(amp, 3)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
