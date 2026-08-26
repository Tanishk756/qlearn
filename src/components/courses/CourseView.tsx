/**
 * Q-Learn Nexus - Quantum Curriculum & Assessment View
 * Interactive lessons, checkpoint quizzes, instant feedback, and progress tracking.
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import { COURSE_MODULES } from '../../data/courses';
import { CourseModule, CourseLesson, QuizQuestion } from '../../types/quantum';
import { BookOpen, CheckCircle2, Award, ArrowRight, HelpCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CourseViewProps {
  completedLessons: string[];
  onCompleteLesson: (lessonId: string) => void;
  onAskAI: (query: string, lessonTitle: string) => void;
}

export const CourseView: React.FC<CourseViewProps> = ({
  completedLessons,
  onCompleteLesson,
  onAskAI,
}) => {
  const [selectedModule, setSelectedModule] = useState<CourseModule>(COURSE_MODULES[0]);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson>(COURSE_MODULES[0].lessons[0]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});

  const handleSelectAnswer = (qId: string, optIdx: number) => {
    if (quizSubmitted[qId]) return;
    setQuizAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const handleCheckQuiz = (question: QuizQuestion) => {
    setQuizSubmitted((prev) => ({ ...prev, [question.id]: true }));
    const isCorrect = quizAnswers[question.id] === question.correctAnswer;
    if (isCorrect) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
      onCompleteLesson(selectedLesson.id);
    }
  };

  return (
    <div id="courses-view-container" className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-medium text-[#2D3326]">Interactive Quantum Curriculum</h2>
          <p className="text-xs text-[#8C857B]">
            Comprehensive courses from foundations to advanced quantum speedups
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#F3F0E9] px-3.5 py-1.5 rounded-2xl border border-[#E8E4DA] text-xs font-medium text-[#5A634E] flex items-center gap-2">
            <Award className="w-4 h-4 text-[#8DA47E]" />
            <span>
              Completed: <strong>{completedLessons.length}</strong> Lessons
            </span>
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {COURSE_MODULES.map((mod) => {
          const isSelected = selectedModule.id === mod.id;
          const completedInMod = mod.lessons.filter((l) => completedLessons.includes(l.id)).length;
          return (
            <button
              key={mod.id}
              id={`module-btn-${mod.id}`}
              onClick={() => {
                setSelectedModule(mod);
                setSelectedLesson(mod.lessons[0]);
              }}
              className={`p-4 rounded-3xl text-left border transition-all flex flex-col justify-between gap-2 ${
                isSelected
                  ? 'bg-[#5A634E] text-[#F3F0E9] border-[#5A634E] shadow-sm'
                  : 'bg-white hover:bg-[#F3F0E9] text-[#2D3326] border-[#E8E4DA]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-[#F3F0E9] text-[#5A634E]'
                }`}>
                  Module {mod.number}
                </span>
                <span className={`text-[11px] font-mono ${isSelected ? 'text-[#8DA47E]' : 'text-[#8C857B]'}`}>
                  {completedInMod}/{mod.lessons.length}
                </span>
              </div>
              <h3 className="font-serif text-base font-medium leading-snug">{mod.title}</h3>
            </button>
          );
        })}
      </div>

      {/* Main Split: Lesson Selector on Left, Lesson Content & Quiz on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Lessons List */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B] px-1 block">
            Lessons in Module {selectedModule.number}
          </span>
          {selectedModule.lessons.map((lesson) => {
            const isSelected = selectedLesson.id === lesson.id;
            const isDone = completedLessons.includes(lesson.id);
            return (
              <div
                key={lesson.id}
                id={`lesson-item-${lesson.id}`}
                onClick={() => setSelectedLesson(lesson)}
                className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#F3F0E9] border-[#8DA47E] shadow-xs'
                    : 'bg-white hover:bg-[#FDFCF9] border-[#E8E4DA]'
                }`}
              >
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif text-sm font-medium text-[#2D3326]">{lesson.title}</h4>
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-[#8DA47E] shrink-0" />}
                  </div>
                  <p className="text-[11px] text-[#8C857B]">{lesson.readTime} read</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8C857B] shrink-0" />
              </div>
            );
          })}
        </div>

        {/* Right Side: Active Lesson Reading & Checkpoint Quiz */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E8E4DA]">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#8C857B]">
                <span>Module {selectedModule.number}</span>
                <span>•</span>
                <span>{selectedLesson.readTime} read</span>
              </div>
              <h2 className="font-serif text-2xl font-medium text-[#2D3326] mt-1">
                {selectedLesson.title}
              </h2>
            </div>

            <button
              id="lesson-ask-ai-btn"
              onClick={() =>
                onAskAI(
                  `Explain the key concepts of the lesson "${selectedLesson.title}" with mathematical examples.`,
                  selectedLesson.title
                )
              }
              className="px-3.5 py-2 bg-[#F3F0E9] hover:bg-[#EAE7E0] text-[#5A634E] text-xs font-medium rounded-2xl border border-[#E8E4DA] flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8DA47E]" />
              <span>Ask Q-Nova AI</span>
            </button>
          </div>

          {/* Lesson Content Markdown / Text */}
          <div className="prose text-xs leading-relaxed text-[#2D3326] space-y-3 whitespace-pre-wrap">
            {selectedLesson.contentMarkdown}
          </div>

          {/* Formula Callout */}
          {selectedLesson.mathFormula && (
            <div className="p-4 bg-[#F3F0E9] rounded-2xl border border-[#E8E4DA] font-mono text-xs text-[#5A634E]">
              <span className="text-[10px] uppercase font-bold text-[#8C857B] block mb-1">
                Mathematical Key Definition
              </span>
              <p className="font-semibold">{selectedLesson.mathFormula}</p>
            </div>
          )}

          {/* Checkpoint Quizzes */}
          {selectedLesson.quiz && selectedLesson.quiz.length > 0 && (
            <div className="pt-4 border-t border-[#E8E4DA] space-y-5">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#8DA47E]" />
                <h4 className="font-serif text-lg font-medium text-[#2D3326]">
                  Checkpoint Concept Quiz
                </h4>
              </div>

              {selectedLesson.quiz.map((q) => {
                const selectedOpt = quizAnswers[q.id];
                const isChecked = quizSubmitted[q.id];
                const isCorrect = selectedOpt === q.correctAnswer;

                return (
                  <div
                    key={q.id}
                    id={`quiz-question-${q.id}`}
                    className="p-5 bg-[#FDFCF9] rounded-2xl border border-[#E8E4DA] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-[#2D3326]">{q.question}</p>
                      <span className="text-[10px] font-mono bg-[#E8E4DA] text-[#5A634E] px-2 py-0.5 rounded-md shrink-0">
                        {q.conceptBadge}
                      </span>
                    </div>

                    {/* Options */}
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isChosen = selectedOpt === optIdx;
                        let optStyle = 'bg-white border-[#E8E4DA] text-[#2D3326] hover:bg-[#F3F0E9]';

                        if (isChecked) {
                          if (optIdx === q.correctAnswer) {
                            optStyle = 'bg-[#8DA47E]/20 border-[#8DA47E] text-[#2D3326] font-semibold';
                          } else if (isChosen) {
                            optStyle = 'bg-red-50 border-red-300 text-red-800';
                          }
                        } else if (isChosen) {
                          optStyle = 'bg-[#5A634E] border-[#5A634E] text-white font-medium';
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectAnswer(q.id, optIdx)}
                            className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${optStyle}`}
                          >
                            <span>{opt}</span>
                            {isChecked && optIdx === q.correctAnswer && (
                              <CheckCircle2 className="w-4 h-4 text-[#5A634E]" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Check Button / Feedback */}
                    <div className="flex items-center justify-between pt-1">
                      {!isChecked ? (
                        <button
                          onClick={() => handleCheckQuiz(q)}
                          disabled={selectedOpt === undefined}
                          className="px-4 py-2 bg-[#8DA47E] hover:bg-[#7B926C] disabled:opacity-40 text-white text-xs font-medium rounded-xl shadow-xs transition-all"
                        >
                          Verify Answer
                        </button>
                      ) : (
                        <div
                          className={`p-3 rounded-xl border text-xs leading-relaxed w-full ${
                            isCorrect
                              ? 'bg-[#8DA47E]/15 border-[#8DA47E] text-[#2D3326]'
                              : 'bg-amber-50 border-amber-200 text-amber-900'
                          }`}
                        >
                          <strong>{isCorrect ? '✓ Correct!' : 'Incorrect.'}</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
