import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import QuestionPhase from "./components/QuestionPhase";
import type { MultipleChoiceQuestion } from "./components/QuestionPhase";

interface RawQuestionRecord {
  question?: string;
  answers?: string[];
  correctAnswer?: number;
  timeLimit?: number;
}

interface QuestionSetRecord {
  id: string;
  questions: RawQuestionRecord[];
}

/** Map Firebase question (answers = list of strings) to MultipleChoiceQuestion */
function toMultipleChoiceQuestion(
  raw: RawQuestionRecord,
  questionId: string,
  timeLimit = 15,
): MultipleChoiceQuestion {
  const options = (raw.answers ?? []).map((text) => ({ text }));
  const correctIndex = raw.correctAnswer ?? -1;
  const safeCorrectIndex =
    Number.isInteger(correctIndex) &&
    correctIndex >= 0 &&
    correctIndex < options.length
      ? correctIndex
      : 0;

  return {
    id: questionId,
    text: raw.question ?? "",
    timeLimit: raw.timeLimit ?? timeLimit,
    options,
    correctIndex: safeCorrectIndex,
  };
}

export default function Question() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [questionSet, setQuestionSet] = useState<QuestionSetRecord | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    async function fetchQuestionSet() {
      if (!code) {
        setError("Missing game code.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const snapshot = await getDoc(doc(db, "questionSets", code));
        if (!snapshot.exists()) {
          throw new Error(`Question set "${code}" not found`);
        }

        const data = snapshot.data() as { questions?: RawQuestionRecord[] };
        setQuestionSet({
          id: snapshot.id,
          questions: data.questions ?? [],
        });
        setCurrentIndex(0);
        hasNavigatedRef.current = false;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load questions");
      } finally {
        setLoading(false);
      }
    }

    void fetchQuestionSet();
  }, [code]);

  const questions = questionSet?.questions ?? [];

  const advanceToNextStep = useCallback(() => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }

    const isLastQuestion = currentIndex >= questions.length - 1;
    if (!isLastQuestion) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    if (hasNavigatedRef.current) {
      return;
    }

    hasNavigatedRef.current = true;
    const typingCode = code ?? "practice";
    navigate(`/typing/${typingCode}?q=${currentIndex}`);
  }, [navigate, code, currentIndex, questions.length]);

  const scheduleAdvance = useCallback(() => {
    if (autoAdvanceTimeoutRef.current) return;

    autoAdvanceTimeoutRef.current = setTimeout(() => {
      autoAdvanceTimeoutRef.current = null;
      advanceToNextStep();
    }, 1500);
  }, [advanceToNextStep]);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = null;
      }
    };
  }, []);

  const handleTimeUp = () => {
    console.log("Time up. Game code:", code);
    scheduleAdvance();
  };

  const handleAnswered = () => {
    scheduleAdvance();
  };

  const handleContinue = () => {
    advanceToNextStep();
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

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        No questions found.
      </div>
    );
  }

  const rawQuestion = questions[currentIndex];
  const question = toMultipleChoiceQuestion(
    rawQuestion,
    String(currentIndex),
  );
  const isLastQuestion = currentIndex >= questions.length - 1;

  return (
    <QuestionPhase
      key={question.id}
      question={question}
      currentQuestionNumber={currentIndex + 1}
      totalQuestions={questions.length}
      onTimeUp={handleTimeUp}
      onAnswered={handleAnswered}
      onContinue={handleContinue}
      continueLabel={isLastQuestion ? "Continue to typing" : "Next question"}
    />
  );
}
