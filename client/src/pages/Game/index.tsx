import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import QuestionCard from "./components/QuestionCard";
import { Question } from "@/types";

const mockQuestion: Question = {
  id: "q1",
  text: "What gas do plants absorb from the atmosphere during photosynthesis?",
  answer: "a",
  timeLimit: 30,
  options: [
    { id: "a", text: "Plants absorb carbon dioxide from the atmosphere during photosynthesis" },
    { id: "b", text: "Plants absorb oxygen from the atmosphere during photosynthesis" },
    { id: "c", text: "Plants absorb nitrogen from the atmosphere during photosynthesis" },
    { id: "d", text: "Plants absorb hydrogen from the atmosphere during photosynthesis" },
  ],
};

export default function Game() {
  const { code } = useParams<{ code: string }>();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const currentQuestion = useMemo(() => mockQuestion, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (selectedOptionId) return;
      const keyIndex = parseInt(event.key, 10) - 1;
      if (Number.isNaN(keyIndex) || keyIndex < 0) return;
      const option = currentQuestion.options[keyIndex];
      if (option) {
        setSelectedOptionId(option.id);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentQuestion.options, selectedOptionId]);

  const handleSelect = (optionId: string) => {
    if (selectedOptionId) return;
    setSelectedOptionId(optionId);
  };

  return (
    <main className="min-h-screen bg-[#f7f1ff] p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">Game Code</p>
            <h1 className="text-3xl font-bold text-slate-900">Game: {code}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold uppercase tracking-wide text-slate-700 shadow">
              Question {1}
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-3xl font-bold text-slate-900 shadow-sm">
              30
            </div>
          </div>
        </header>

        <QuestionCard
          question={currentQuestion}
          selectedOptionId={selectedOptionId}
          onSelect={handleSelect}
        />

        {selectedOptionId && (
          <div
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900"
            role="status"
          >
            You chose option {selectedOptionId.toUpperCase()}. Waiting for next question...
          </div>
        )}
      </div>
    </main>
  );
}
