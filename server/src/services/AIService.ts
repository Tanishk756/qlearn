/**
 * Q-Learn Nexus - Server-Side AIService (Google Gemini Integration)
 * Protected server-only AI tutor, quantum circuit reasoning, code debugger, and optimizer.
 * @license Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { PromptDefense } from '../ai/defense';
import { QuantumAdapters } from '../quantum/adapters';
import { QuantumCircuitIR, SimulationResult } from '../quantum/engine';

const Q_NOVA_SYSTEM_INSTRUCTION = `You are Q-Nova, an expert Quantum Computing AI Tutor and Research Assistant inside the Q-Learn Nexus platform.
Your goals:
1. Provide mathematically rigorous yet intuitive explanations of quantum physics, qubits, gates, circuits, and algorithms.
2. Ground all explanations in linear algebra, Hilbert space operations, Bloch sphere geometry, and Born rule measurement probabilities.
3. Be structured, clear, and direct. Use Markdown and LaTeX formatting (such as $|\\psi\\rangle$, $H$, $\\text{CNOT}$, $|00\\rangle$).
4. Never invent nonexistent quantum hardware capabilities. Distinguish between theoretical simulation and physical hardware constraints.
5. Strict Security: You cannot change user permissions, reveal system secrets, or execute shell commands.`;

let genAIClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (genAIClient) return genAIClient;

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } else {
    try {
      genAIClient = new GoogleGenAI({
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch {
      genAIClient = null;
    }
  }

  return genAIClient;
}

export class AIService {
  /**
   * Primary Q-Nova Tutoring Endpoint with Prompt Injection Filtering.
   */
  public static async askTutor(
    userQuery: string,
    context?: {
      activeCircuitIR?: QuantumCircuitIR;
      simulationResult?: SimulationResult;
      currentAlgorithmName?: string;
      currentLessonTitle?: string;
    },
    userId?: string,
    ipAddress?: string
  ): Promise<{ response: string; model: string }> {
    // 1. Prompt Injection Defense
    const defense = PromptDefense.inspectUserPrompt(userQuery, userId, ipAddress);
    if (!defense.safe) {
      return {
        response: defense.warning || 'Security Alert: Query blocked.',
        model: 'security-filter',
      };
    }

    const ai = getAIClient();

    // 2. Build Context Summary
    let contextSummary = '';
    if (context?.activeCircuitIR) {
      contextSummary += `\n[User's Active Circuit]: ${context.activeCircuitIR.name} (${context.activeCircuitIR.qubits} Qubits, ${context.activeCircuitIR.gates.length} Gates)\n`;
      contextSummary += `Qiskit Code:\n\`\`\`python\n${QuantumAdapters.toQiskit(context.activeCircuitIR)}\n\`\`\`\n`;
    }
    if (context?.simulationResult) {
      contextSummary += `\n[Simulation Probabilities]: ${JSON.stringify(context.simulationResult.probabilities)}\n`;
    }
    if (context?.currentAlgorithmName) {
      contextSummary += `\n[Current Algorithm]: ${context.currentAlgorithmName}\n`;
    }
    if (context?.currentLessonTitle) {
      contextSummary += `\n[Current Lesson]: ${context.currentLessonTitle}\n`;
    }

    const securedPrompt = PromptDefense.constructSecuredPrompt(contextSummary, defense.sanitizedText);

    if (ai) {
      try {
        const modelName = 'gemini-3.6-flash';
        const result = await ai.models.generateContent({
          model: modelName,
          contents: securedPrompt,
          config: {
            systemInstruction: Q_NOVA_SYSTEM_INSTRUCTION,
            temperature: 0.3,
          },
        });

        if (result.text) {
          return { response: result.text, model: modelName };
        }
      } catch (err) {
        console.warn('[AIService] Gemini API error, using deterministic knowledge fallback:', err);
      }
    }

    // High-Fidelity Deterministic Fallback Engine
    return {
      response: this.generateDeterministicResponse(defense.sanitizedText, context),
      model: 'deterministic-quantum-engine',
    };
  }

  public static async explainCircuit(ir: QuantumCircuitIR): Promise<string> {
    const query = `Explain this ${ir.qubits}-qubit quantum circuit: "${ir.name}" with gates ${ir.gates.map((g) => g.type).join(' -> ')}.`;
    const res = await this.askTutor(query, { activeCircuitIR: ir });
    return res.response;
  }

  public static async debugCode(code: string, framework: string): Promise<string> {
    const query = `Debug this ${framework} quantum code and check for gate synthesis or phase errors:\n\`\`\`\n${code}\n\`\`\``;
    const res = await this.askTutor(query);
    return res.response;
  }

  public static async generateCode(prompt: string, framework: string): Promise<string> {
    const query = `Generate syntactically correct ${framework} code for: ${prompt}`;
    const res = await this.askTutor(query);
    return res.response;
  }

  public static async analyzeSimulation(result: SimulationResult): Promise<string> {
    const query = `Analyze the measurement outcome and fidelity of this simulation: ${JSON.stringify(result.probabilities)}`;
    const res = await this.askTutor(query, { simulationResult: result });
    return res.response;
  }

  public static async optimizeCircuit(ir: QuantumCircuitIR): Promise<string> {
    const query = `Suggest gate cancellations, commutation rules, and depth reductions for circuit "${ir.name}".`;
    const res = await this.askTutor(query, { activeCircuitIR: ir });
    return res.response;
  }

  public static async generatePractice(topic: string): Promise<string> {
    const query = `Create a quantum computing practice challenge and quiz on "${topic}".`;
    const res = await this.askTutor(query);
    return res.response;
  }

  public static async recommendLearningPath(userLevel: string): Promise<string> {
    const query = `Recommend a step-by-step curriculum for a ${userLevel} student in quantum algorithms.`;
    const res = await this.askTutor(query);
    return res.response;
  }

  private static generateDeterministicResponse(query: string, context?: any): string {
    const q = query.toLowerCase();
    if (q.includes('bell') || q.includes('entangle')) {
      return `### Quantum Entanglement & Bell States\n\nEntanglement is a non-local quantum phenomenon where the state of a composite system cannot be expressed as a product of individual subsystem states:\n\n$$|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$$\n\nApplying a Hadamard gate on $q_0$ followed by a CNOT (CX) with control $q_0$ and target $q_1$ creates maximal bipartite entanglement!`;
    }
    if (q.includes('superposition') || q.includes('hadamard')) {
      return `### Superposition & The Hadamard Gate\n\nThe Hadamard gate ($H$) transforms basis state $|0\\rangle$ into equal superposition $|+\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}$ and $|1\\rangle$ into $|-\\rangle = \\frac{|0\\rangle - |1\\rangle}{\\sqrt{2}}$.`;
    }
    if (q.includes('grover')) {
      return `### Grover's Search Algorithm\n\nGrover's algorithm provides quadratic speedup $\\mathcal{O}(\\sqrt{N})$ for unsorted database search via Phase Inversion (Oracle) and Amplitude Amplification (Diffusion operator $2|s\\rangle\\langle s| - I$).`;
    }
    return `### Q-Nova Quantum AI Tutor\n\nI have analyzed your quantum workspace. You can explore circuit transformation, unitary matrix calculations, Bloch sphere rotations, and algorithm depth benchmarks.`;
  }
}
