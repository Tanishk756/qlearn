/**
 * Q-Learn Nexus - Quantum Algorithms Suite Explorer
 * Comprehensive interactive algorithmic demonstrations with mathematical formulations and 1-click circuit loading.
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import { QUANTUM_ALGORITHMS } from '../../quantum/algorithms';
import { QuantumAlgorithm, QuantumCircuitIR } from '../../types/quantum';
import { Play, Sparkles, BookOpen, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AlgorithmsViewProps {
  onLoadAlgorithm: (algo: QuantumAlgorithm) => void;
  onAskAI: (query: string, algoName: string) => void;
}

export const AlgorithmsView: React.FC<AlgorithmsViewProps> = ({
  onLoadAlgorithm,
  onAskAI,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeAlgoId, setActiveAlgoId] = useState<string>(QUANTUM_ALGORITHMS[0].id);

  const categories = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredAlgorithms = QUANTUM_ALGORITHMS.filter(
    (a) => selectedCategory === 'All' || a.category === selectedCategory
  );

  const activeAlgo = QUANTUM_ALGORITHMS.find((a) => a.id === activeAlgoId) || QUANTUM_ALGORITHMS[0];

  return (
    <div id="algorithms-suite-container" className="space-y-6">
      {/* Header & Category Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs">
        <div>
          <h2 className="font-serif text-2xl font-medium text-[#2D3326]">Standard Quantum Algorithms Suite</h2>
          <p className="text-xs text-[#8C857B]">
            From Bell states to Grover Search, Quantum Fourier Transform, and VQE
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 bg-[#F3F0E9] p-1 rounded-2xl border border-[#E8E4DA]">
          {categories.map((cat) => (
            <button
              key={cat}
              id={`algo-cat-${cat.toLowerCase()}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all ${
                selectedCategory === cat
                  ? 'bg-white text-[#5A634E] shadow-xs font-semibold'
                  : 'text-[#6D7268] hover:text-[#2D3326]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split: Algorithm List on Left, Deep Dive on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Algorithm Cards List */}
        <div className="lg:col-span-4 space-y-3">
          {filteredAlgorithms.map((algo) => {
            const isSelected = activeAlgo.id === algo.id;
            return (
              <div
                key={algo.id}
                id={`algo-card-${algo.id}`}
                onClick={() => setActiveAlgoId(algo.id)}
                className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col gap-2 ${
                  isSelected
                    ? 'bg-[#5A634E] text-[#F3F0E9] border-[#5A634E] shadow-md'
                    : 'bg-white hover:bg-[#F3F0E9] text-[#2D3326] border-[#E8E4DA]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#F3F0E9] text-[#5A634E]'
                    }`}
                  >
                    {algo.category}
                  </span>
                  <span className={`text-xs ${isSelected ? 'text-[#8DA47E]' : 'text-[#8C857B]'}`}>
                    {algo.difficulty}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-medium leading-snug">{algo.title}</h3>
                <p
                  className={`text-xs line-clamp-2 leading-relaxed ${
                    isSelected ? 'text-[#F3F0E9]/80' : 'text-[#6D7268]'
                  }`}
                >
                  {algo.summary}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right Side: Active Algorithm Details & Visual Sandbox */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E8E4DA]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-[#F3F0E9] text-[#5A634E] px-2.5 py-0.5 rounded-lg border border-[#E8E4DA]">
                  {activeAlgo.category} • {activeAlgo.defaultQubits} Qubits
                </span>
                <span className="text-xs text-[#8C857B]">{activeAlgo.difficulty}</span>
              </div>
              <h2 className="font-serif text-2xl font-semibold text-[#2D3326] mt-1.5">
                {activeAlgo.title}
              </h2>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                id="algo-ask-ai-btn"
                onClick={() =>
                  onAskAI(
                    `Explain the theoretical intuition, phase mathematics, and circuit structure of ${activeAlgo.title}.`,
                    activeAlgo.title
                  )
                }
                className="px-3.5 py-2 bg-[#F3F0E9] hover:bg-[#EAE7E0] text-[#5A634E] text-xs font-medium rounded-2xl border border-[#E8E4DA] flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8DA47E]" />
                <span>Ask Q-Nova AI</span>
              </button>

              <button
                id="algo-load-circuit-btn"
                onClick={() => onLoadAlgorithm(activeAlgo)}
                className="px-4 py-2 bg-[#8DA47E] hover:bg-[#7B926C] text-white text-xs font-semibold rounded-2xl shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Load in Lab & Run</span>
              </button>
            </div>
          </div>

          {/* Problem Statement & Intuition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#FDFCF9] rounded-2xl border border-[#E8E4DA] space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B] block">
                Problem Formulation
              </span>
              <p className="text-xs leading-relaxed text-[#2D3326]">{activeAlgo.problemStatement}</p>
            </div>

            <div className="p-4 bg-[#FDFCF9] rounded-2xl border border-[#E8E4DA] space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B] block">
                Core Quantum Intuition
              </span>
              <p className="text-xs leading-relaxed text-[#2D3326]">{activeAlgo.intuition}</p>
            </div>
          </div>

          {/* Mathematical Formulations & Circuit Flow */}
          <div className="p-4 bg-[#F3F0E9] rounded-2xl border border-[#E8E4DA] space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A634E] block">
              Mathematical Derivation
            </span>
            <pre className="font-mono text-xs text-[#2D3326] whitespace-pre-wrap leading-relaxed bg-white/70 p-3 rounded-xl border border-[#E8E4DA]/60">
              {activeAlgo.mathExplanation}
            </pre>
          </div>

          {/* Complexity Speedup Analysis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[#FDFCF9] rounded-2xl border border-[#E8E4DA] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B] block">
                Classical Complexity
              </span>
              <span className="text-xs font-mono font-semibold text-[#2D3326] block">
                {activeAlgo.classicalComplexity}
              </span>
            </div>

            <div className="p-4 bg-[#FDFCF9] rounded-2xl border border-[#8DA47E]/40 space-y-1 bg-[#8DA47E]/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A634E] block">
                Quantum Speedup & Complexity
              </span>
              <span className="text-xs font-mono font-bold text-[#5A634E] block">
                {activeAlgo.quantumComplexity}
              </span>
            </div>
          </div>

          {/* Practical Applications */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B] block">
              Real-World Applications & Industry Impact
            </span>
            <div className="flex flex-wrap gap-2">
              {activeAlgo.practicalApplications.map((app, idx) => (
                <div
                  key={idx}
                  className="bg-[#F3F0E9] text-[#5A634E] text-xs font-medium px-3 py-1.5 rounded-xl border border-[#E8E4DA] flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#8DA47E]" />
                  <span>{app}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
