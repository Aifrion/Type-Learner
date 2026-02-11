interface AnswerCardProps {
  label: string;
  text: string;
  color: 'red' | 'blue' | 'yellow' | 'green';
  state: 'default' | 'correct' | 'wrong';
  disabled: boolean;
  onSelect: () => void;
}

const stateClasses = {
  default:
    'border-slate-200 bg-white shadow hover:-translate-y-[1px] hover:shadow-md focus:ring-purple-300 text-slate-800',
  correct: 'border-green-500 bg-green-500 shadow text-white',
  wrong: 'border-red-500 bg-red-500 shadow text-white',
};

export default function AnswerCard({
  label,
  text,
  color: _color,
  state,
  disabled,
  onSelect,
}: AnswerCardProps) {
  const classes = stateClasses[state];
  const isDisabled = disabled || state !== 'default';

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isDisabled}
      className={`
        flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-base font-medium
        transition-all focus:outline-none focus:ring-2
        ${classes}
        ${isDisabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
      `}
      aria-pressed={state !== 'default'}
      aria-label={`Option ${label}: ${text}`}
    >
      <span
        className={`
          inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold
          ${state === 'correct' ? 'bg-white/25 text-white' : state === 'wrong' ? 'bg-white/25 text-white' : 'bg-purple-100 text-purple-700'}
        `}
      >
        {label}
      </span>
      <span className="text-left">{text}</span>
    </button>
  );
}
