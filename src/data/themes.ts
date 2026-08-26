/**
 * Theme Definitions & Avatar Presets for Q-Learn Nexus
 * @license Apache-2.0
 */

import { ThemeOption } from '../types/auth';

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'natural',
    name: 'Natural Earth & Sage',
    description: 'Serene warm cream, slate moss, and soothing sage green tones',
    previewBg: '#FDFCF9',
    previewPrimary: '#5A634E',
    previewAccent: '#8DA47E',
    previewText: '#2D3326',
  },
  {
    id: 'quantum-dark',
    name: 'Deep Quantum Slate',
    description: 'Refined deep charcoal background with glowing quantum emerald highlights',
    previewBg: '#131715',
    previewPrimary: '#3B5947',
    previewAccent: '#52A774',
    previewText: '#E6EFE9',
  },
  {
    id: 'nordic',
    name: 'Nordic Glacier',
    description: 'Crisp minimal cool-white canvas with ocean slate and polar cyan',
    previewBg: '#F8FAFC',
    previewPrimary: '#334155',
    previewAccent: '#0284C7',
    previewText: '#0F172A',
  },
  {
    id: 'sandstone',
    name: 'Warm Sandstone',
    description: 'Desert sunset tones with warm terracotta, bronze umber, and golden amber',
    previewBg: '#FAF7F2',
    previewPrimary: '#854D0E',
    previewAccent: '#D97706',
    previewText: '#3B240B',
  },
];

export interface AvatarPreset {
  id: string;
  name: string;
  emoji: string;
  bgColor: string;
  description: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'schrodinger-cat',
    name: "Schrödinger's Cat",
    emoji: '🐱',
    bgColor: 'bg-[#5A634E]',
    description: 'Superposed in both state |0⟩ and |1⟩ simultaneously',
  },
  {
    id: 'bloch-sphere',
    name: 'Bloch Sphere',
    emoji: '🌐',
    bgColor: 'bg-[#8DA47E]',
    description: 'Statevector vector on the 3D unit sphere',
  },
  {
    id: 'laser-interferometer',
    name: 'Interferometer',
    emoji: '⚡',
    bgColor: 'bg-[#C27D38]',
    description: 'Constructive and destructive quantum phase interference',
  },
  {
    id: 'dirac-braket',
    name: 'Dirac Notation',
    emoji: '⟨Ψ|',
    bgColor: 'bg-[#4A5D4E]',
    description: 'Hermitian conjugate and inner state representation',
  },
  {
    id: 'quantum-chip',
    name: 'QPU Processor',
    emoji: '💠',
    bgColor: 'bg-[#3A4B58]',
    description: 'Superconducting transmon qubit topology processor',
  },
  {
    id: 'bell-entanglement',
    name: 'EPR Pair',
    emoji: '🔗',
    bgColor: 'bg-[#6D7268]',
    description: 'Maximally entangled Bell state (|00⟩ + |11⟩)/√2',
  },
];
