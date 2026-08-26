/**
 * Q-Learn Nexus - Q-Nova Quantum AI Tutor Component
 * Context-aware AI tutoring interface with quick prompt chips and conversation history.
 * @license Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { TutorMessage, QuantumCircuitIR, SimulationResult } from '../../types/quantum';
import { askQNovaTutor } from '../../services/gemini';
import { Bot, Send, Sparkles, User, RefreshCw, Layers, BrainCircuit, Check } from 'lucide-react';

interface QNovoAITutorProps {
  activeCircuitIR?: QuantumCircuitIR;
  simulationResult?: SimulationResult | null;
  currentAlgorithmName?: string;
  currentLessonTitle?: string;
}

export const QNovoAITutor: React.FC<QNovoAITutorProps> = ({
  activeCircuitIR,
  simulationResult,
  currentAlgorithmName,
  currentLessonTitle,
}) => {
  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: `### Hello, I am Q-Nova.
Your AI Quantum Computing Tutor and Research Assistant.

I am aware of your active circuit **"${activeCircuitIR?.name || 'Quantum Canvas'}"** (${activeCircuitIR?.qubits || 2} Qubits) and current simulation telemetry. How can I help you understand quantum algorithms today?`,
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: TutorMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: 'Now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const reply = await askQNovaTutor(textToSend, {
        activeCircuitIR,
        simulationResult: simulationResult || undefined,
        currentAlgorithmName,
        currentLessonTitle,
      });

      const aiMsg: TutorMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: 'Now',
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      const errorMsg: TutorMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: 'Sorry, I encountered an issue connecting to the AI model. Let me answer with platform quantum knowledge.',
        timestamp: 'Now',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Explain my active circuit step-by-step',
    'How does phase kickback work in oracles?',
    'Explain why quantum entanglement violates classical realism',
    'How does Grover diffusion amplify the target state?',
    'What does the Bloch sphere represent geometrically?',
  ];

  return (
    <div id="qnova-tutor-container" className="bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs flex flex-col h-[650px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E8E4DA]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#5A634E] text-[#F3F0E9] flex items-center justify-center shadow-xs">
            <BrainCircuit className="w-5 h-5 text-[#8DA47E]" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-medium text-[#2D3326]">Q-Nova AI Tutor</h3>
            <p className="text-[11px] text-[#8C857B]">
              Grounded in Hilbert space, matrix mechanics & active circuit context
            </p>
          </div>
        </div>

        {activeCircuitIR && (
          <span className="text-[11px] font-mono bg-[#F3F0E9] text-[#5A634E] px-3 py-1 rounded-full border border-[#E8E4DA]">
            Context: {activeCircuitIR.name} ({activeCircuitIR.qubits}Q)
          </span>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 my-3 pr-1">
        {messages.map((msg) => {
          const isAI = msg.sender === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
            >
              {isAI && (
                <div className="w-8 h-8 rounded-full bg-[#8DA47E] text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                  QN
                </div>
              )}

              <div
                className={`max-w-[85%] p-4 rounded-3xl text-xs leading-relaxed ${
                  isAI
                    ? 'bg-[#FDFCF9] text-[#2D3326] border border-[#E8E4DA] shadow-xs'
                    : 'bg-[#5A634E] text-white shadow-xs rounded-br-none'
                }`}
              >
                <div className="whitespace-pre-wrap prose prose-sm">{msg.text}</div>
                <span
                  className={`text-[9px] mt-1.5 block ${
                    isAI ? 'text-[#8C857B]' : 'text-white/70 text-right'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>

              {!isAI && (
                <div className="w-8 h-8 rounded-full bg-[#D9D5CB] text-[#2D3326] flex items-center justify-center shrink-0 text-xs font-bold">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#8C857B] bg-[#FDFCF9] p-3 rounded-2xl border border-[#E8E4DA] max-w-[200px]">
            <Sparkles className="w-4 h-4 text-[#8DA47E] animate-spin" />
            <span>Q-Nova is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="py-2 flex items-center gap-2 overflow-x-auto border-t border-[#E8E4DA]/60">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="px-3 py-1.5 bg-[#F3F0E9] hover:bg-[#EAE7E0] text-[#5A634E] text-[11px] rounded-xl border border-[#E8E4DA] whitespace-nowrap transition-all flex items-center gap-1 shrink-0"
          >
            <Sparkles className="w-3 h-3 text-[#8DA47E]" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="pt-2 flex items-center gap-2"
      >
        <input
          type="text"
          id="qnova-chat-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask Q-Nova about quantum mechanics, gates, algorithms, or debug your circuit..."
          className="flex-1 bg-[#FDFCF9] text-[#2D3326] text-xs px-4 py-3 rounded-2xl border border-[#E8E4DA] outline-none focus:border-[#8DA47E] focus:ring-1 focus:ring-[#8DA47E] transition-all"
        />
        <button
          type="submit"
          id="qnova-send-btn"
          disabled={!inputText.trim() || isLoading}
          className="p-3 bg-[#8DA47E] hover:bg-[#7B926C] disabled:opacity-40 text-white rounded-2xl shadow-xs transition-all flex items-center justify-center shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
