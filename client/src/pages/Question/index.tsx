import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import QuestionPhase from "./components/QuestionPhase";
import type { MultipleChoiceQuestion } from "./components/QuestionPhase";

/** Map Firebase question (answers = list of strings) to MultipleChoiceQuestion */
function toMultipleChoiceQuestion(
  raw: { question: string; answers: string[]; correctAnswer: number },
  questionId: string,
  timeLimit = 15,
): MultipleChoiceQuestion {
  const options = (raw.answers ?? []).map((text) => ({ text }));
  return {
    id: questionId,
    text: raw.question ?? "",
    timeLimit,
    options,
    correctIndex: raw.correctAnswer ?? 0,
  };
}

export default function Question() {
  const { code } = useParams<{ code: string }>();
  const [questionSets, setQuestionSets] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuestionSets() {
      setLoading(true);
      setError(null);
      try {
        const snapshot = await getDocs(collection(db, "questionSets"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setQuestionSets(data);
        setCurrentIndex(0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load questions");
      } finally {
        setLoading(false);
      }
    }
    fetchQuestionSets();
  }, []);

  const handleTimeUp = () => {
    console.log("Time up. Game code:", code);
    const set = questionSets[0];
    const questions = set?.questions ?? [];
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
    }
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

  const set = questionSets[0];
  const questions: Array<{
    question: string;
    answers: string[];
    correctAnswer: number;
  }> = set?.questions ?? [];
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

  return (
    <QuestionPhase
      question={question}
      currentQuestionNumber={currentIndex + 1}
      totalQuestions={questions.length}
      onTimeUp={handleTimeUp}
    />
  );
}
