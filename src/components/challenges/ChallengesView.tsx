/**
 * Q-Learn Nexus - Quantum Circuit Coding Challenges View
 * Automated verification engine for quantum state synthesis and circuit construction challenges.
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import { CODING_CHALLENGES } from '../../data/challenges';
import { CodingChallenge, QuantumCircuitIR } from '../../types/quantum';
import { simulateCircuit } from '../../quantum/engine';
import { Trophy, CheckCircle2, Play, Sparkles, HelpCircle, Award, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChallengesViewProps {
  onLoadChallengeToLab: (challenge: CodingChallenge) => void;
  onAskAI: (query: string) => void;
}

export const ChallengesView: React.FC<ChallengesViewProps> = ({
  onLoadChallengeToLab,
  onAskAI,
}) => {
  const [activeChallenge, setActiveChallenge] = useState<CodingChallenge>(CODING_CHALLENGES[0]);
  const [completedChallengeIds, setCompletedChallengeIds] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<{ passed: boolean; message: string; feedback: string } | null>(null);
  const [showHintIndex, setShowHintIndex] = useState<number>(-1);

  const handleTestChallenge = () => {
    const simResult = simulateCircuit(activeChallenge.starterIR);
    const evaluation = activeChallenge.testRunner(simResult);
    setTestResult(evaluation);

    if (evaluation.passed) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 },
      });
      if (!completedChallengeIds.includes(activeChallenge.id)) {
        setCompletedChallengeIds((prev) => [...prev, activeChallenge.id]);
      }
    }
  };

  return (
    <div id="challenges-view-container" className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-medium text-[#2D3326]">Quantum Circuit Challenges</h2>
          <p className="text-xs text-[#8C857B]">
            Construct circuits to synthesize target quantum states and unitaries
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#F3F0E9] px-4 py-2 rounded-2xl border border-[#E8E4DA] text-xs font-medium text-[#5A634E] flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#8DA47E]" />
            <span>
              Solved: <strong>{completedChallengeIds.length}</strong> / {CODING_CHALLENGES.length} Challenges
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Challenge list and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Challenge List */}
        <div className="lg:col-span-4 space-y-3">
          {CODING_CHALLENGES.map((ch) => {
            const isSelected = activeChallenge.id === ch.id;
            const isSolved = completedChallengeIds.includes(ch.id);
            return (
              <div
                key={ch.id}
                id={`challenge-card-${ch.id}`}
                onClick={() => {
                  setActiveChallenge(ch);
                  setTestResult(null);
                  setShowHintIndex(-1);
                }}
                className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col gap-2 ${
                  isSelected
                    ? 'bg-[#5A634E] text-[#F3F0E9] border-[#5A634E] shadow-sm'
                    : 'bg-white hover:bg-[#F3F0E9] text-[#2D3326] border-[#E8E4DA]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#F3F0E9] text-[#5A634E]'
                    }`}
                  >
                    {ch.difficulty} • {ch.category}
                  </span>
                  {isSolved && <CheckCircle2 className="w-4 h-4 text-[#8DA47E]" />}
                </div>
                <h3 className="font-serif text-base font-medium leading-snug">{ch.title}</h3>
                <span className={`text-[11px] font-mono ${isSelected ? 'text-[#8DA47E]' : 'text-[#8C857B]'}`}>
                  +{ch.rewardPoints} XP
                </span>
              </div>
            );
          })}
        </div>

        {/* Right Side: Active Challenge Workspace & Test Runner */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E8E4DA]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-[#F3F0E9] text-[#5A634E] px-2.5 py-0.5 rounded-lg border border-[#E8E4DA]">
                  {activeChallenge.difficulty} • {activeChallenge.category}
                </span>
                <span className="text-xs font-mono text-[#8C857B]">+{activeChallenge.rewardPoints} XP</span>
              </div>
              <h2 className="font-serif text-2xl font-semibold text-[#2D3326] mt-1">
                {activeChallenge.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="challenge-ask-ai-btn"
                onClick={() =>
                  onAskAI(`Give me a conceptual hint for solving the challenge: "${activeChallenge.title}" without revealing the full answer.`)
                }
                className="px-3.5 py-2 bg-[#F3F0E9] hover:bg-[#EAE7E0] text-[#5A634E] text-xs font-medium rounded-2xl border border-[#E8E4DA] flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8DA47E]" />
                <span>Ask AI Hint</span>
              </button>

              <button
                id="challenge-open-lab-btn"
                onClick={() => onLoadChallengeToLab(activeChallenge)}
                className="px-4 py-2 bg-[#8DA47E] hover:bg-[#7B926C] text-white text-xs font-semibold rounded-2xl shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Edit & Solve in Lab</span>
              </button>
            </div>
          </div>

          {/* Description & Goal */}
          <div className="space-y-3">
            <div className="p-4 bg-[#FDFCF9] rounded-2xl border border-[#E8E4DA] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B] block">
                Challenge Objective
              </span>
              <p className="text-xs leading-relaxed text-[#2D3326]">{activeChallenge.description}</p>
            </div>

            <div className="p-4 bg-[#F3F0E9] rounded-2xl border border-[#E8E4DA] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A634E] block">
                Target Condition
              </span>
              <p className="text-xs font-mono font-medium text-[#2D3326]">{activeChallenge.goal}</p>
            </div>
          </div>

          {/* Hints Accordion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B]">
                Need a hint?
              </span>
              {showHintIndex < activeChallenge.hints.length - 1 && (
                <button
                  onClick={() => setShowHintIndex((prev) => prev + 1)}
                  className="text-xs text-[#5A634E] hover:underline font-medium"
                >
                  Reveal Hint {showHintIndex + 2}
                </button>
              )}
            </div>

            {showHintIndex >= 0 && (
              <div className="space-y-2">
                {activeChallenge.hints.slice(0, showHintIndex + 1).map((hint, idx) => (
                  <div key={idx} className="p-3 bg-[#FDFCF9] rounded-xl border border-[#8DA47E]/30 text-xs text-[#5A634E] flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 shrink-0 text-[#8DA47E] mt-0.5" />
                    <span>{hint}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evaluation Result Box */}
          {testResult && (
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed flex flex-col gap-1 ${
                testResult.passed
                  ? 'bg-[#8DA47E]/15 border-[#8DA47E] text-[#2D3326]'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <span className="font-bold">
                {testResult.passed ? '✓ Challenge Passed!' : '✕ Verification Failed'}
              </span>
              <p>{testResult.message}</p>
              <p className="text-[11px] opacity-80">{testResult.feedback}</p>
            </div>
          )}

          {/* Verify Button */}
          <div className="pt-2 flex justify-end">
            <button
              id="challenge-test-btn"
              onClick={handleTestChallenge}
              className="px-5 py-2.5 bg-[#5A634E] hover:bg-[#2D3326] text-white text-xs font-semibold rounded-2xl shadow-xs flex items-center gap-2 transition-all"
            >
              <Award className="w-4 h-4 text-[#8DA47E]" />
              <span>Evaluate Current State</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
