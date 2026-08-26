/**
 * Q-Learn Nexus - Step-by-Step Circuit State Stepper
 * Animates state evolution gate-by-gate across circuit timeline columns.
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, ArrowRight } from 'lucide-react';
import { Complex } from '../../types/quantum';
import { C } from '../../quantum/engine';

interface StepSnapshot {
  stepIndex: number;
  gateName: string;
  statevector: Complex[];
  probabilities: Record<string, number>;
}

interface StepByStepStepperProps {
  stepStates?: StepSnapshot[];
  qubits: number;
}

export const StepByStepStepper: React.FC<StepByStepStepperProps> = ({
  stepStates = [],
  qubits,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  if (stepStates.length === 0) return null;

  const currentSnapshot = stepStates[currentStepIdx] || stepStates[0];

  const handleNext = () => {
    setCurrentStepIdx((prev) => Math.min(stepStates.length - 1, prev + 1));
  };

  const handlePrev = () => {
    setCurrentStepIdx((prev) => Math.max(0, prev - 1));
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      const interval = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev >= stepStates.length - 1) {
            clearInterval(interval);
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 900);
    }
  };

  return (
    <div id="step-by-step-stepper" className="bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-serif text-xl font-medium text-[#2D3326]">Circuit State Evolution Stepper</h3>
          <p className="text-xs text-[#8C857B]">
            Step through each unitary gate transformation sequentially
          </p>
        </div>

        {/* Step Controls */}
        <div className="flex items-center gap-2">
          <button
            id="stepper-prev-btn"
            onClick={handlePrev}
            disabled={currentStepIdx === 0}
            className="p-2 bg-[#F3F0E9] hover:bg-[#EAE7E0] disabled:opacity-40 text-[#5A634E] rounded-xl border border-[#E8E4DA] transition-all"
            title="Previous Gate"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            id="stepper-play-btn"
            onClick={togglePlay}
            className="px-4 py-2 bg-[#8DA47E] hover:bg-[#7B926C] text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause' : 'Animate'}</span>
          </button>
          <button
            id="stepper-next-btn"
            onClick={handleNext}
            disabled={currentStepIdx >= stepStates.length - 1}
            className="p-2 bg-[#F3F0E9] hover:bg-[#EAE7E0] disabled:opacity-40 text-[#5A634E] rounded-xl border border-[#E8E4DA] transition-all"
            title="Next Gate"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Timeline Pills */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 mb-4">
        {stepStates.map((step, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentStepIdx(idx)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              currentStepIdx === idx
                ? 'bg-[#5A634E] text-white border-[#5A634E] shadow-xs font-semibold'
                : 'bg-[#F3F0E9] text-[#6D7268] border-[#E8E4DA] hover:bg-[#EAE7E0]'
            }`}
          >
            <span>{idx === 0 ? 'Init' : `Step ${idx}`}</span>
            <span className="opacity-80 text-[10px]">({step.gateName})</span>
          </button>
        ))}
      </div>

      {/* Current Step State Display */}
      <div className="p-4 bg-[#FDFCF9] rounded-2xl border border-[#E8E4DA] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-[#8C857B]">Active Gate:</span>
            <span className="font-mono text-sm font-bold text-[#5A634E] bg-white px-2.5 py-1 rounded-lg border border-[#E8E4DA]">
              {currentSnapshot.gateName}
            </span>
          </div>
          <span className="text-xs font-mono text-[#8C857B]">
            Step {currentStepIdx + 1} of {stepStates.length}
          </span>
        </div>

        {/* State Probabilities in current step */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(currentSnapshot.probabilities).map(([state, prob]) => (
            <div key={state} className="bg-white p-2 rounded-xl border border-[#E8E4DA] flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-[#2D3326]">|{state}⟩</span>
              <span className="text-[#5A634E] font-semibold">{(Number(prob) * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
