/**
 * Q-Learn Nexus - Quantum Gate Palette
 * Categorized quantum gate collection with matrix previews, tooltips, and click-to-place selection.
 * @license Apache-2.0
 */

import React from 'react';
import { GateType } from '../../types/quantum';
import { HelpCircle } from 'lucide-react';

interface GatePaletteProps {
  selectedGateType: GateType | null;
  onSelectGateType: (gate: GateType) => void;
}

interface GateDef {
  type: GateType;
  name: string;
  category: 'Clifford & Pauli' | 'Phase & Rotations' | 'Multi-Qubit' | 'Measurement';
  symbol: string;
  matrixDesc: string;
  description: string;
  badgeColor?: string;
}

export const GATE_DEFINITIONS: GateDef[] = [
  // Clifford & Pauli
  {
    type: 'H',
    name: 'Hadamard',
    category: 'Clifford & Pauli',
    symbol: 'H',
    matrixDesc: '1/√2 [[1, 1], [1, -1]]',
    description: 'Creates equal superposition |0⟩ → (|0⟩+|1⟩)/√2 and |1⟩ → (|0⟩-|1⟩)/√2.',
  },
  {
    type: 'X',
    name: 'Pauli-X (NOT)',
    category: 'Clifford & Pauli',
    symbol: 'X',
    matrixDesc: '[[0, 1], [1, 0]]',
    description: 'Quantum bit flip: |0⟩ ↔ |1⟩.',
  },
  {
    type: 'Y',
    name: 'Pauli-Y',
    category: 'Clifford & Pauli',
    symbol: 'Y',
    matrixDesc: '[[0, -i], [i, 0]]',
    description: 'Bit and phase flip: |0⟩ → i|1⟩, |1⟩ → -i|0⟩.',
  },
  {
    type: 'Z',
    name: 'Pauli-Z (Phase Flip)',
    category: 'Clifford & Pauli',
    symbol: 'Z',
    matrixDesc: '[[1, 0], [0, -1]]',
    description: 'Phase flip: |1⟩ → -|1⟩, leaves |0⟩ unchanged.',
  },

  // Phase & Rotations
  {
    type: 'S',
    name: 'Phase (S)',
    category: 'Phase & Rotations',
    symbol: 'S',
    matrixDesc: '[[1, 0], [0, i]]',
    description: 'Rotation by π/2 around Z-axis (S = √Z).',
  },
  {
    type: 'Sdg',
    name: 'S-Dagger (S†)',
    category: 'Phase & Rotations',
    symbol: 'S†',
    matrixDesc: '[[1, 0], [0, -i]]',
    description: 'Rotation by -π/2 around Z-axis.',
  },
  {
    type: 'T',
    name: 'T-Gate (π/8)',
    category: 'Phase & Rotations',
    symbol: 'T',
    matrixDesc: '[[1, 0], [0, e^{iπ/4}]]',
    description: 'Rotation by π/4 around Z-axis (T = √S). Non-Clifford universal gate.',
  },
  {
    type: 'Tdg',
    name: 'T-Dagger (T†)',
    category: 'Phase & Rotations',
    symbol: 'T†',
    matrixDesc: '[[1, 0], [0, e^{-iπ/4}]]',
    description: 'Rotation by -π/4 around Z-axis.',
  },
  {
    type: 'Rx',
    name: 'Rx(θ)',
    category: 'Phase & Rotations',
    symbol: 'Rx',
    matrixDesc: 'cos(θ/2)I - i sin(θ/2)X',
    description: 'Continuous rotation around X-axis by parameterized angle θ.',
  },
  {
    type: 'Ry',
    name: 'Ry(θ)',
    category: 'Phase & Rotations',
    symbol: 'Ry',
    matrixDesc: 'cos(θ/2)I - i sin(θ/2)Y',
    description: 'Continuous rotation around Y-axis by parameterized angle θ.',
  },
  {
    type: 'Rz',
    name: 'Rz(θ)',
    category: 'Phase & Rotations',
    symbol: 'Rz',
    matrixDesc: 'diag(e^{-iθ/2}, e^{iθ/2})',
    description: 'Continuous rotation around Z-axis by parameterized angle θ.',
  },

  // Multi-Qubit
  {
    type: 'CX',
    name: 'CNOT (CX)',
    category: 'Multi-Qubit',
    symbol: 'CX',
    matrixDesc: '4x4 Controlled-NOT',
    description: 'Flips target qubit if control qubit is |1⟩. Core entangling gate.',
  },
  {
    type: 'CZ',
    name: 'Controlled-Z',
    category: 'Multi-Qubit',
    symbol: 'CZ',
    matrixDesc: 'diag(1, 1, 1, -1)',
    description: 'Applies phase flip -1 only when both control and target are |1⟩.',
  },
  {
    type: 'SWAP',
    name: 'SWAP Gate',
    category: 'Multi-Qubit',
    symbol: 'SWAP',
    matrixDesc: '4x4 Qubit Exchanger',
    description: 'Swaps the quantum states of two selected qubits.',
  },
  {
    type: 'CCX',
    name: 'Toffoli (CCX)',
    category: 'Multi-Qubit',
    symbol: 'CCX',
    matrixDesc: '8x8 Controlled-Controlled-NOT',
    description: 'Flips target qubit only if BOTH control qubits are |1⟩.',
  },

  // Measurement & Barrier
  {
    type: 'M',
    name: 'Measure',
    category: 'Measurement',
    symbol: 'M',
    matrixDesc: 'Projection Postulate',
    description: 'Collapses quantum state into classical bit register.',
  },
  {
    type: 'Barrier',
    name: 'Barrier',
    category: 'Measurement',
    symbol: '||',
    matrixDesc: 'Compiler Boundary',
    description: 'Prevents compiler gate reordering and visually organizes stages.',
  },
];

export const GatePalette: React.FC<GatePaletteProps> = ({
  selectedGateType,
  onSelectGateType,
}) => {
  const categories: GateDef['category'][] = [
    'Clifford & Pauli',
    'Phase & Rotations',
    'Multi-Qubit',
    'Measurement',
  ];

  return (
    <div id="gate-palette-container" className="bg-white rounded-3xl p-5 border border-[#E8E4DA] shadow-xs flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-medium text-[#2D3326]">Gate Palette</h3>
        <span className="text-[11px] text-[#8C857B] bg-[#F3F0E9] px-2.5 py-1 rounded-full border border-[#E8E4DA]">
          Select & Click Wire
        </span>
      </div>

      <div className="space-y-4">
        {categories.map((cat) => {
          const gatesInCat = GATE_DEFINITIONS.filter((g) => g.category === cat);
          return (
            <div key={cat} className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B] block">
                {cat}
              </span>
              <div className="grid grid-cols-4 gap-2">
                {gatesInCat.map((gate) => {
                  const isSelected = selectedGateType === gate.type;
                  return (
                    <button
                      key={gate.type}
                      id={`palette-gate-${gate.type}`}
                      onClick={() => onSelectGateType(gate.type)}
                      title={`${gate.name} - ${gate.description}\nMatrix: ${gate.matrixDesc}`}
                      className={`h-11 rounded-2xl flex flex-col items-center justify-center font-mono font-bold text-xs transition-all border relative group ${
                        isSelected
                          ? 'bg-[#5A634E] text-white border-[#5A634E] shadow-sm scale-105'
                          : 'bg-[#FDFCF9] hover:bg-[#F3F0E9] text-[#2D3326] border-[#E8E4DA] hover:border-[#D9D5CB]'
                      }`}
                    >
                      <span>{gate.symbol}</span>
                      <span className="text-[8px] opacity-70 font-sans tracking-tight truncate max-w-[90%]">
                        {gate.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedGateType && (
        <div className="p-3 bg-[#F3F0E9] rounded-2xl border border-[#E8E4DA] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8DA47E]" />
            <span className="font-medium text-[#5A634E]">
              Active: <strong>{selectedGateType}</strong>
            </span>
          </div>
          <button
            onClick={() => onSelectGateType(null as any)}
            className="text-[11px] text-[#8C857B] hover:text-[#2D3326] underline"
          >
            Deselect
          </button>
        </div>
      )}
    </div>
  );
};
