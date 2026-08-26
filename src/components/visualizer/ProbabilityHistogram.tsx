/**
 * Q-Learn Nexus - Quantum Probability & Measurement Histogram
 * Visualizes simulated measurement shot distributions and exact Born rule theoretical probabilities.
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import { BarChart3, Shuffle } from 'lucide-react';

interface ProbabilityHistogramProps {
  probabilities: Record<string, number>;
  counts: Record<string, number>;
  shots: number;
  onResampleShots?: (shots: number) => void;
}

export const ProbabilityHistogram: React.FC<ProbabilityHistogramProps> = ({
  probabilities,
  counts,
  shots,
  onResampleShots,
}) => {
  const [selectedShots, setSelectedShots] = useState(shots);
  const basisStates = Object.keys(probabilities).sort();

  const handleShotChange = (newShots: number) => {
    setSelectedShots(newShots);
    onResampleShots?.(newShots);
  };

  return (
    <div id="probability-histogram-container" className="bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="font-serif text-xl font-medium text-[#2D3326]">Measurement Outcome Histogram</h3>
          <p className="text-xs text-[#8C857B]">
            Sampled Shots vs Theoretical Born Probabilities $P(|x\rangle) = |\langle x|\psi\rangle|^2$
          </p>
        </div>

        {/* Shot Configuration Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#F3F0E9] p-1 rounded-2xl border border-[#E8E4DA]">
            {[100, 1024, 4096, 8192].map((s) => (
              <button
                key={s}
                id={`histogram-shots-${s}`}
                onClick={() => handleShotChange(s)}
                className={`px-3 py-1 text-xs font-mono rounded-xl transition-all ${
                  selectedShots === s
                    ? 'bg-white text-[#5A634E] shadow-xs font-semibold'
                    : 'text-[#6D7268] hover:text-[#2D3326]'
                }`}
              >
                {s} shots
              </button>
            ))}
          </div>

          <button
            id="histogram-resample-btn"
            onClick={() => onResampleShots?.(selectedShots)}
            className="p-2 bg-[#F3F0E9] hover:bg-[#EAE7E0] text-[#5A634E] rounded-2xl border border-[#E8E4DA] transition-all"
            title="Resample Measurement Shots"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Histogram Bars */}
      {basisStates.length === 0 ? (
        <div className="py-12 text-center text-[#8C857B] bg-[#FDFCF9] rounded-2xl border border-[#E8E4DA]/60">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#8DA47E]" />
          <p className="text-sm">No probability amplitudes detected.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {basisStates.map((state) => {
            const prob = probabilities[state] || 0;
            const count = counts[state] || 0;
            const empiricalProb = selectedShots > 0 ? count / selectedShots : 0;
            const percent = (prob * 100).toFixed(1);
            const empPercent = (empiricalProb * 100).toFixed(1);

            return (
              <div
                key={state}
                id={`histogram-bar-${state}`}
                className="p-3 bg-[#FDFCF9] rounded-2xl border border-[#E8E4DA] flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-[#2D3326] bg-[#E8E4DA] px-2.5 py-0.5 rounded-lg">
                    |{state}⟩
                  </span>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-[#6D7268]">
                      Counts: <strong className="text-[#2D3326]">{count}</strong> / {selectedShots} ({empPercent}%)
                    </span>
                    <span className="text-[#5A634E] font-semibold">
                      Exact: {percent}%
                    </span>
                  </div>
                </div>

                {/* Double Bar: Empirical vs Theoretical */}
                <div className="space-y-1">
                  {/* Empirical Bar (Green Sage) */}
                  <div className="w-full bg-[#E8E4DA] h-3 rounded-full overflow-hidden flex">
                    <div
                      className="bg-[#8DA47E] h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(2, empiricalProb * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend & Stats */}
      <div className="mt-4 pt-3 border-t border-[#E8E4DA] flex items-center justify-between text-xs text-[#8C857B]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#8DA47E]" />
            <span>Sampled Shot Frequency</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[#5A634E]">|⟨x|ψ⟩|²</span>
            <span>Born Rule Analytic Amplitude</span>
          </div>
        </div>
        <span className="font-mono text-[11px] text-[#5A634E]">
          Total States Sampled: {basisStates.length}
        </span>
      </div>
    </div>
  );
};
