import { useState, useCallback } from "react";
import Timer from "@/pages/Game/components/Timer";
import AnswerCard from "./AnswerCard";

export interface MultipleChoiceOption {
  text: string;
  id?: string;
  color?: "red" | "blue" | "yellow" | "green";
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
  onAnswered?: (index: number) => void;
  onContinue?: () => void;
  continueLabel?: string;
}

export default function QuestionPhase({
  question,
  currentQuestionNumber,
  totalQuestions,
  onTimeUp,
  onAnswered,
  onContinue,
  continueLabel = "Continue to typing",
}: QuestionPhaseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [timerStopped, setTimerStopped] = useState(false);
  const [timeUp, setTimeUp] = useState(false);

  const handleTimeUp = useCallback(() => {
    setTimerStopped(true);
    setTimeUp(true);
    onTimeUp?.();
  }, [onTimeUp]);

  const handleSelect = useCallback(
    (index: number) => {
      if (selectedIndex !== null) return;
      setSelectedIndex(index);
      setTimerStopped(true);
      onAnswered?.(index);
    },
    [selectedIndex, onAnswered],
  );

  const hasAnswered = selectedIndex !== null;
  const isCorrect = selectedIndex === question.correctIndex;
  const correctAnswerText = question.options[question.correctIndex]?.text ?? "";
  const showContinue = Boolean(onContinue) && (hasAnswered || timeUp);

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

        <div
          className="flex flex-col gap-3"
          role="group"
          aria-label="Answer options"
        >
          {question.options.map((opt, index) => (
            <AnswerCard
              key={index}
              label={String(index + 1)}
              text={opt.text}
              color={opt.color ?? "red"}
              state={
                selectedIndex === null
                  ? "default"
                  : index === question.correctIndex
                    ? "correct"
                    : index === selectedIndex
                      ? "wrong"
                      : "default"
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
                ? "border-green-300 bg-green-50 text-green-800"
                : "border-red-300 bg-red-50 text-red-800"
            }`}
          >
            {isCorrect
              ? "Correct!"
              : `Wrong — the correct answer is ${correctAnswerText}.`}
          </div>
        )}

        {showContinue && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onContinue}
              className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
            >
              {continueLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
