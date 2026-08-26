/**
 * Q-Learn Nexus - Main Application Container
 * AI-Powered Interactive Quantum Computing & Algorithm Learning Platform
 * Crafted with the "Natural Tones" aesthetic, notifications system, and profile customization.
 * @license Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { CircuitBuilder } from './components/circuit/CircuitBuilder';
import { GatePalette } from './components/circuit/GatePalette';
import { BlochSphereView } from './components/visualizer/BlochSphereView';
import { StatevectorView } from './components/visualizer/StatevectorView';
import { ProbabilityHistogram } from './components/visualizer/ProbabilityHistogram';
import { StepByStepStepper } from './components/visualizer/StepByStepStepper';
import { CodeLabView } from './components/codelab/CodeLabView';
import { AlgorithmsView } from './components/algorithms/AlgorithmsView';
import { ConceptExplorer } from './components/concepts/ConceptExplorer';
import { CourseView } from './components/courses/CourseView';
import { ChallengesView } from './components/challenges/ChallengesView';
import { QNovoAITutor } from './components/tutor/QNovoAITutor';
import { ProjectsView } from './components/projects/ProjectsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { ProfileView } from './components/profile/ProfileView';
import { NotificationToast } from './components/notifications/NotificationToast';

import {
  GateType,
  QuantumAlgorithm,
  QuantumCircuitIR,
  SimulationResult,
  CodingChallenge,
} from './types/quantum';
import { simulateCircuit, sampleMeasurementCounts } from './quantum/engine';
import { QUANTUM_ALGORITHMS } from './quantum/algorithms';

const AppContent: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Active Circuit IR (Default: 2-Qubit Bell State |Φ⁺⟩)
  const [circuitIR, setCircuitIR] = useState<QuantumCircuitIR>({
    version: '1.0',
    name: 'Bell State |Φ⁺⟩ Generator',
    qubits: 2,
    classicalBits: 2,
    gates: [
      { id: 'g0', type: 'H', targets: [0], stepIndex: 0 },
      { id: 'g1', type: 'CX', controls: [0], targets: [1], stepIndex: 1 },
    ],
  });

  // Selected Gate for placement
  const [selectedGateType, setSelectedGateType] = useState<GateType | null>('H');

  // Simulation Results Cache
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  // User Learning Progress State
  const [completedLessons, setCompletedLessons] = useState<string[]>(['lesson_1_1']);
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);
  const [simulationsRunCount, setSimulationsRunCount] = useState<number>(4);

  // Active Algorithm or Lesson context for AI Tutor
  const [currentContextAlgo, setCurrentContextAlgo] = useState<string>('Bell State');
  const [currentContextLesson, setCurrentContextLesson] = useState<string>('Qubits & Superposition');

  // Run Mathematical Simulation
  const handleRunSimulation = () => {
    const result = simulateCircuit(circuitIR);
    setSimulationResult(result);
    setSimulationsRunCount((prev) => prev + 1);
  };

  // Handle URL parameters for shared circuits or projects
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const circuitParam = params.get('circuit');
      const projectParam = params.get('project');

      if (circuitParam) {
        const parsed = JSON.parse(decodeURIComponent(circuitParam));
        if (parsed && parsed.qubits && Array.isArray(parsed.gates)) {
          setCircuitIR(parsed);
          setActiveTab('lab');
        }
      } else if (projectParam) {
        setActiveTab('projects');
      }
    } catch {
      // Ignore URL parse error
    }
  }, []);

  // Auto-simulate on circuit update
  useEffect(() => {
    const res = simulateCircuit(circuitIR);
    setSimulationResult(res);
  }, [circuitIR]);

  // Resample measurement shots
  const handleResampleShots = (shots: number) => {
    if (!simulationResult) return;
    const newCounts = sampleMeasurementCounts(simulationResult.probabilities, shots);
    setSimulationResult({
      ...simulationResult,
      shots,
      counts: newCounts,
    });
  };

  // Load Algorithm into Lab
  const handleLoadAlgorithm = (algo: QuantumAlgorithm) => {
    setCircuitIR({ ...algo.circuitIR, name: algo.title });
    setCurrentContextAlgo(algo.title);
    setActiveTab('lab');
  };

  // Load Challenge into Lab
  const handleLoadChallengeToLab = (challenge: CodingChallenge) => {
    setCircuitIR({ ...challenge.starterIR, name: challenge.title });
    setActiveTab('lab');
  };

  // Ask AI shortcut
  const handleAskAI = (query: string, contextTitle?: string) => {
    if (contextTitle) setCurrentContextAlgo(contextTitle);
    setActiveTab('tutor');
  };

  // Complete a lesson
  const handleCompleteLesson = (lessonId: string) => {
    if (!completedLessons.includes(lessonId)) {
      setCompletedLessons((prev) => [...prev, lessonId]);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#2D3326] flex flex-col font-sans selection:bg-[#8DA47E]/20">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onNavigate={setActiveTab}
        onQuickSimulate={handleRunSimulation}
        qubitCount={circuitIR.qubits}
      />

      {/* Main Layout (Sidebar + Body Content) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar activeTab={activeTab} onNavigate={setActiveTab} />

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* View 1: Student Dashboard */}
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateTab={setActiveTab}
              onLoadAlgorithm={handleLoadAlgorithm}
              completedLessonsCount={completedLessons.length}
              completedChallengesCount={completedChallenges.length}
              simulationsRunCount={simulationsRunCount}
            />
          )}

          {/* View 2: Quantum Circuit Lab (Builder + Palette + Live State) */}
          {activeTab === 'lab' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Gate Palette (Left Column) */}
                <div className="lg:col-span-4">
                  <GatePalette
                    selectedGateType={selectedGateType}
                    onSelectGateType={setSelectedGateType}
                  />
                </div>

                {/* Circuit Canvas (Right Column) */}
                <div className="lg:col-span-8">
                  <CircuitBuilder
                    circuitIR={circuitIR}
                    onUpdateCircuit={setCircuitIR}
                    onRunSimulation={handleRunSimulation}
                    simulationResult={simulationResult}
                    selectedGateType={selectedGateType}
                    onSelectGateType={setSelectedGateType}
                  />
                </div>
              </div>

              {/* Real-time State & Histogram Quick Row */}
              {simulationResult && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <StatevectorView
                    statevector={simulationResult.statevector}
                    qubits={circuitIR.qubits}
                  />
                  <ProbabilityHistogram
                    probabilities={simulationResult.probabilities}
                    counts={simulationResult.counts}
                    shots={simulationResult.shots}
                    onResampleShots={handleResampleShots}
                  />
                </div>
              )}
            </div>
          )}

          {/* View 3: Bloch Sphere 3D & Phasor Visualizers */}
          {activeTab === 'visualizer' && simulationResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BlochSphereView
                  blochCoords={simulationResult.blochVectors}
                  qubits={circuitIR.qubits}
                />
                <StatevectorView
                  statevector={simulationResult.statevector}
                  qubits={circuitIR.qubits}
                />
              </div>

              {simulationResult.stepStates && simulationResult.stepStates.length > 0 && (
                <StepByStepStepper
                  stepStates={simulationResult.stepStates}
                  qubits={circuitIR.qubits}
                />
              )}

              <ProbabilityHistogram
                probabilities={simulationResult.probabilities}
                counts={simulationResult.counts}
                shots={simulationResult.shots}
                onResampleShots={handleResampleShots}
              />
            </div>
          )}

          {/* View 4: Multi-Framework Code Lab (Qiskit, PennyLane, Cirq, OpenQASM) */}
          {activeTab === 'codelab' && (
            <CodeLabView
              circuitIR={circuitIR}
              onUpdateCircuit={setCircuitIR}
              simulationResult={simulationResult}
              onRunSimulation={handleRunSimulation}
            />
          )}

          {/* View 5: Standard Algorithms Suite */}
          {activeTab === 'algorithms' && (
            <AlgorithmsView
              onLoadAlgorithm={handleLoadAlgorithm}
              onAskAI={handleAskAI}
            />
          )}

          {/* View 6: Interactive Concept Micro-Labs */}
          {activeTab === 'concepts' && <ConceptExplorer />}

          {/* View 7: Interactive Curriculum & Quizzes */}
          {activeTab === 'courses' && (
            <CourseView
              completedLessons={completedLessons}
              onCompleteLesson={handleCompleteLesson}
              onAskAI={handleAskAI}
            />
          )}

          {/* View 8: Quantum Circuit Challenges */}
          {activeTab === 'challenges' && (
            <ChallengesView
              onLoadChallengeToLab={handleLoadChallengeToLab}
              onAskAI={handleAskAI}
            />
          )}

          {/* View 9: Q-Nova AI Tutor */}
          {activeTab === 'tutor' && (
            <QNovoAITutor
              activeCircuitIR={circuitIR}
              simulationResult={simulationResult}
              currentAlgorithmName={currentContextAlgo}
              currentLessonTitle={currentContextLesson}
            />
          )}

          {/* View 10: Saved Workspaces & Projects */}
          {activeTab === 'projects' && (
            <ProjectsView
              currentCircuit={circuitIR}
              onLoadProjectCircuit={(ir) => {
                setCircuitIR(ir);
                setActiveTab('lab');
              }}
              onSaveCurrentAsProject={(title, desc) => {}}
            />
          )}

          {/* View 11: Diagnostics & Benchmark Verification */}
          {activeTab === 'analytics' && <AnalyticsView />}

          {/* View 12: Profile Customization & Quantum Identity */}
          {activeTab === 'profile' && (
            <ProfileView onNavigateTab={setActiveTab} />
          )}
        </main>
      </div>

      {/* Real-time Notification Toast Alert */}
      <NotificationToast onNavigateTab={setActiveTab} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;

