import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import type { Question, TypingStats } from '@/types';
import TypingPhase from './components/TypingPhase';

interface RawQuestionRecord {
  question?: string;
  answers?: string[];
  correctAnswer?: number;
  timeLimit?: number;
}

const mockQuestion: Question = {
  id: '1',
  text: 'What gas do plants absorb from the atmosphere during photosynthesis?',
  answer: 'Plants absorb carbon dioxide from the atmosphere during photosynthesis.',
  timeLimit: 30
};

const mockGameState = {
  currentQuestion: 4,
  totalQuestions: 10
};

export default function Game() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const questionIndexParam = searchParams.get("q");
  const [question, setQuestion] = useState<Question | null>(null);
  const [gameState, setGameState] = useState(mockGameState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTypingQuestion() {
      setLoading(true);
      setError(null);

      if (!code || code === "practice") {
        setQuestion(mockQuestion);
        setGameState(mockGameState);
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "questionSets", code));
        if (!snapshot.exists()) {
          throw new Error(`Question set "${code}" not found`);
        }

        const data = snapshot.data() as { questions?: RawQuestionRecord[] };
        const questions = data.questions ?? [];
        if (questions.length === 0) {
          throw new Error("No questions found.");
        }

        const parsedIndex = Number.parseInt(questionIndexParam ?? "0", 10);
        const safeIndex = Number.isNaN(parsedIndex)
          ? 0
          : Math.max(0, Math.min(parsedIndex, questions.length - 1));

        const rawQuestion = questions[safeIndex];
        const options = rawQuestion.answers ?? [];
        const correctIndex = rawQuestion.correctAnswer ?? -1;
        const safeCorrectIndex =
          Number.isInteger(correctIndex) &&
          correctIndex >= 0 &&
          correctIndex < options.length
            ? correctIndex
            : 0;
        const answerText = options[safeCorrectIndex] ?? options[0] ?? "";

        setQuestion({
          id: `${code}-${safeIndex}`,
          text: rawQuestion.question ?? "",
          answer: answerText,
          timeLimit: rawQuestion.timeLimit ?? 30,
        });
        setGameState({
          currentQuestion: safeIndex + 1,
          totalQuestions: questions.length,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load typing question");
      } finally {
        setLoading(false);
      }
    }

    void fetchTypingQuestion();
  }, [code, questionIndexParam]);

  const handlePhaseComplete = (stats: TypingStats) => {
    console.log('Phase complete:', stats);
    console.log('Game code:', code);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        No typing question found.
      </div>
    );
  }

  return (
    <TypingPhase
      question={question}
      currentQuestionNumber={gameState.currentQuestion}
      totalQuestions={gameState.totalQuestions}
      onPhaseComplete={handlePhaseComplete}
    />
  );
}
