/**
 * Q-Learn Nexus - Student & Researcher Dashboard View
 * Personalized overview, learning streaks, quick lab launches, and recommended modules.
 * @license Apache-2.0
 */

import React from 'react';
import {
  Sparkles,
  Play,
  Award,
  BookOpen,
  Trophy,
  ArrowRight,
  Boxes,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';
import { QuantumAlgorithm, CourseModule } from '../../types/quantum';
import { QUANTUM_ALGORITHMS } from '../../quantum/algorithms';
import { COURSE_MODULES } from '../../data/courses';

interface DashboardViewProps {
  onNavigateTab: (tabId: string) => void;
  onLoadAlgorithm: (algo: QuantumAlgorithm) => void;
  completedLessonsCount: number;
  completedChallengesCount: number;
  simulationsRunCount: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onLoadAlgorithm,
  completedLessonsCount,
  completedChallengesCount,
  simulationsRunCount,
}) => {
  const featuredAlgo = QUANTUM_ALGORITHMS[6] || QUANTUM_ALGORITHMS[0];

  return (
    <div id="dashboard-container" className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="bg-[#8DA47E] rounded-[32px] p-8 text-white relative overflow-hidden shadow-xs">
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
              Quantum Workspace Online
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif leading-tight">
            Learn Quantum Computing by Building It.
          </h1>
          <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
            Welcome to <strong>Q-Learn Nexus</strong>. Build graphical circuits, execute on high-precision statevector
            simulators, explore standard algorithms, and study with Q-Nova AI.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="dash-open-lab-btn"
              onClick={() => onNavigateTab('lab')}
              className="bg-white text-[#5A634E] hover:bg-[#F3F0E9] px-5 py-2.5 rounded-full text-xs font-semibold shadow-xs flex items-center gap-2 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Open Quantum Lab</span>
            </button>
            <button
              id="dash-start-learning-btn"
              onClick={() => onNavigateTab('courses')}
              className="bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-full text-xs font-medium backdrop-blur-xs transition-all"
            >
              Explore Curriculum
            </button>
          </div>
        </div>
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute right-12 top-8 w-32 h-32 bg-[#5A634E]/20 rounded-full blur-2xl" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E8E4DA] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F3F0E9] flex items-center justify-center text-[#5A634E]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-serif font-bold text-[#2D3326] block">
              {completedLessonsCount}
            </span>
            <span className="text-[11px] text-[#8C857B]">Completed Lessons</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E8E4DA] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F3F0E9] flex items-center justify-center text-[#5A634E]">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-serif font-bold text-[#2D3326] block">
              {completedChallengesCount}
            </span>
            <span className="text-[11px] text-[#8C857B]">Solved Challenges</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E8E4DA] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F3F0E9] flex items-center justify-center text-[#5A634E]">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-serif font-bold text-[#2D3326] block">
              {simulationsRunCount}
            </span>
            <span className="text-[11px] text-[#8C857B]">Simulations Run</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E8E4DA] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F3F0E9] flex items-center justify-center text-[#8DA47E]">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-serif font-bold text-[#2D3326] block">100%</span>
            <span className="text-[11px] text-[#8C857B]">Simulation Precision</span>
          </div>
        </div>
      </div>

      {/* Featured Grid: Featured Algorithm & Recommended Next Step */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Featured Algorithm Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B]">
                Featured Algorithm Spotlight
              </span>
              <span className="text-xs font-mono bg-[#F3F0E9] text-[#5A634E] px-2.5 py-0.5 rounded-full">
                {featuredAlgo.category}
              </span>
            </div>
            <h3 className="font-serif text-2xl font-medium text-[#2D3326] mb-2">
              {featuredAlgo.title}
            </h3>
            <p className="text-xs text-[#6D7268] leading-relaxed mb-4">
              {featuredAlgo.summary} Grover's quadratic speedup rotates the statevector in the 2D subspace
              spanned by the uniform superposition and the target marked state.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E8E4DA]">
            <span className="text-xs font-mono font-semibold text-[#5A634E]">
              Speedup: {featuredAlgo.quantumSpeedup}
            </span>
            <button
              onClick={() => onLoadAlgorithm(featuredAlgo)}
              className="px-4 py-2 bg-[#8DA47E] hover:bg-[#7B926C] text-white text-xs font-medium rounded-full shadow-xs flex items-center gap-1.5 transition-all"
            >
              <span>Load in Quantum Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick AI Quantum Tip */}
        <div className="bg-[#5A634E] rounded-3xl p-6 text-[#F3F0E9] shadow-xs flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#8DA47E]" />
              <h3 className="font-serif text-lg font-medium">Q-Nova Concept Tip</h3>
            </div>
            <p className="text-xs text-[#F3F0E9]/90 leading-relaxed italic">
              "Remember: An unmeasured qubit in superposition |+⟩ = (|0⟩+|1⟩)/√2 is not secretly 0 or 1. It is in a coherent
              quantum state that produces deterministic interference when transformed by unitary matrices!"
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('tutor')}
            className="mt-auto bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-2xl text-xs font-medium flex items-center justify-center gap-2 transition-all"
          >
            <span>Ask Q-Nova a Question</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
