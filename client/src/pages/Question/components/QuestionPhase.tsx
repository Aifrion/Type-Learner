import { useState, useCallback } from 'react';
import Timer from '@/pages/Game/components/Timer';
import AnswerCard from './AnswerCard';

export interface MultipleChoiceOption {
  id: string;
  text: string;
  color: 'red' | 'blue' | 'yellow' | 'green';
}

export interface MultipleChoiceQuestion {
  id: string;
  text: string;
  timeLimit: number;
  options: MultipleChoiceOption[];
  correctIndex: number;
}

interface QuestionPhaseProps {
  question: MultipleChoiceQuestion;
  currentQuestionNumber: number;
  totalQuestions: number;
  onTimeUp?: () => void;
}

export default function QuestionPhase({
  question,
  currentQuestionNumber,
  totalQuestions,
  onTimeUp
}: QuestionPhaseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [timerStopped, setTimerStopped] = useState(false);

  const handleTimeUp = useCallback(() => {
    setTimerStopped(true);
    onTimeUp?.();
  }, [onTimeUp]);

  const handleSelect = useCallback(
    (index: number) => {
      if (selectedIndex !== null) return;
      setSelectedIndex(index);
      if (index === question.correctIndex) {
        setTimerStopped(true);
      }
    },
    [selectedIndex, question.correctIndex]
  );

  const hasAnswered = selectedIndex !== null;
  const isCorrect = selectedIndex === question.correctIndex;
  const correctAnswerText = question.options[question.correctIndex]?.text ?? '';

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="text-lg font-medium text-gray-700">
            Question {currentQuestionNumber} of {totalQuestions}
          </div>
          <Timer
            duration={question.timeLimit}
            onTimeUp={handleTimeUp}
            isRunning={!timerStopped}
          />
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h2 className="text-center text-2xl font-bold text-gray-800">
            {question.text}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {question.options.map((opt, index) => (
            <AnswerCard
              key={opt.id}
              label={opt.id}
              text={opt.text}
              color={opt.color}
              state={
                selectedIndex === null
                  ? 'default'
                  : index === question.correctIndex
                    ? 'correct'
                    : index === selectedIndex
                      ? 'wrong'
                      : 'default'
              }
              disabled={hasAnswered}
              onSelect={() => handleSelect(index)}
            />
          ))}
        </div>

        {hasAnswered && (
          <div
            className={`rounded-xl border-2 p-4 text-center font-semibold ${
              isCorrect
                ? 'border-green-300 bg-green-50 text-green-800'
                : 'border-red-300 bg-red-50 text-red-800'
            }`}
          >
            {isCorrect
              ? 'Correct!'
              : `Wrong — the correct answer is ${correctAnswerText}.`}
          </div>
        )}
      </div>
    </div>
  );
}
