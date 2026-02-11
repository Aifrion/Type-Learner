import { AnswerOption, Question } from "@/types";

interface QuestionCardProps {
  question: Question;
  selectedOptionId?: string | null;
  onSelect: (optionId: string) => void;
}

function OptionButton({
  option,
  index,
  disabled,
  isSelected,
  onClick,
}: {
  option: AnswerOption;
  index: number;
  disabled: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const state = isSelected
    ? "border-purple-400 bg-white shadow-lg"
    : "border-slate-200 bg-white shadow";
  const disabledState = disabled && !isSelected ? "opacity-70 cursor-not-allowed" : "";

  return (
    <button
      type="button"
      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-base font-medium text-slate-800 transition-all hover:-translate-y-[1px] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-300 ${state} ${disabledState}`}
      disabled={disabled}
      onClick={onClick}
      aria-pressed={isSelected}
      aria-label={`Option ${index + 1}: ${option.text}`}
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
        {index + 1}
      </span>
      <span className="text-left">{option.text}</span>
    </button>
  );
}

export default function QuestionCard({
  question,
  selectedOptionId,
  onSelect,
}: QuestionCardProps) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 rounded-2xl bg-white/90 p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="rounded-2xl border border-slate-100 bg-white px-4 py-6 text-center shadow-sm">
            <p
              className="text-xl font-semibold text-slate-900"
              data-testid="question-text"
            >
              {question.text}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3" role="group" aria-label="Answer options">
        {question.options.map((option, index) => (
          <OptionButton
            key={option.id}
            option={option}
            index={index}
            disabled={!!selectedOptionId}
            isSelected={selectedOptionId === option.id}
            onClick={() => onSelect(option.id)}
          />
        ))}
      </div>
    </div>
  );
}
