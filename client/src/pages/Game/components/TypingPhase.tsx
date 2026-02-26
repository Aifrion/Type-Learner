import { useState, useCallback } from 'react';
import type { Question, TypingStats } from '@/types';
import Timer from './Timer';
import TypingInput from './TypingInput';

interface TypingPhaseProps {
  question: Question;
  currentQuestionNumber: number;
  totalQuestions: number;
  onPhaseComplete: (stats: TypingStats) => void;
  readOnly?: boolean;
  phaseEndsAt?: number;
}

export default function TypingPhase({
  question,
  currentQuestionNumber,
  totalQuestions,
  onPhaseComplete,
  readOnly = false,
  phaseEndsAt
}: TypingPhaseProps) {
  const [stats, setStats] = useState<TypingStats>({
    wpm: 0,
    accuracy: 100,
    correctChars: 0,
    totalChars: 0
  });
  const [isComplete, setIsComplete] = useState(false);

  const handleStatsUpdate = useCallback((newStats: TypingStats) => {
    setStats(newStats);
  }, []);

  const handleComplete = useCallback((finalStats: TypingStats) => {
    if (readOnly) return;
    setIsComplete(true);
    onPhaseComplete(finalStats);
  }, [onPhaseComplete, readOnly]);

  const handleTimeUp = useCallback(() => {
    if (readOnly) return;
    if (!isComplete) {
      setIsComplete(true);
      onPhaseComplete(stats);
    }
  }, [isComplete, stats, onPhaseComplete, readOnly]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header: Question Progress + Timer */}
        <div className="flex justify-between items-center">
          <div className="text-lg font-medium text-gray-700">
            Question {currentQuestionNumber} of {totalQuestions}
          </div>
          <Timer
            duration={question.timeLimit}
            onTimeUp={handleTimeUp}
            isRunning={!isComplete}
            endsAtMs={phaseEndsAt}
          />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          {/* Question + Answer Display */}
          <div className="text-center space-y-6">
            <div className="text-xl text-gray-800">
              {question.text}
            </div>
            <div className="text-lg">
              <span className="text-gray-500">The answer is: </span>
              <span className="font-semibold text-green-600">{question.answer}</span>
            </div>
          </div>

          {/* Stats Display */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-center gap-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.wpm}</div>
                <div className="text-sm text-gray-500 uppercase tracking-wide">WPM</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.accuracy}%</div>
                <div className="text-sm text-gray-500 uppercase tracking-wide">Accuracy</div>
              </div>
            </div>
          </div>

          {/* Typing Input */}
          <div className="border-t border-gray-200 pt-6">
            <TypingInput
              targetText={question.answer}
              disabled={isComplete || readOnly}
              onStatsUpdate={handleStatsUpdate}
              onComplete={handleComplete}
            />
          </div>

          {isComplete && (
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-700 font-medium">
                Completed! Final WPM: {stats.wpm}, Accuracy: {stats.accuracy}%
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
