interface AnswerCardProps {
  label: string;
  text: string;
  color: 'red' | 'blue' | 'yellow' | 'green';
  state: 'default' | 'correct' | 'wrong';
  disabled: boolean;
  onSelect: () => void;
}

const colorClasses = {
  red: {
    default: 'bg-red-500 hover:bg-red-600 border-red-600',
    correct: 'bg-green-500 border-green-600',
    wrong: 'bg-red-700 border-red-800'
  },
  blue: {
    default: 'bg-blue-500 hover:bg-blue-600 border-blue-600',
    correct: 'bg-green-500 border-green-600',
    wrong: 'bg-red-700 border-red-800'
  },
  yellow: {
    default: 'bg-yellow-400 hover:bg-yellow-500 border-yellow-600 text-gray-900',
    correct: 'bg-green-500 border-green-600 text-white',
    wrong: 'bg-red-700 border-red-800 text-white'
  },
  green: {
    default: 'bg-green-500 hover:bg-green-600 border-green-600',
    correct: 'bg-green-500 border-green-600',
    wrong: 'bg-red-700 border-red-800'
  }
};

export default function AnswerCard({
  label,
  text,
  color,
  state,
  disabled,
  onSelect
}: AnswerCardProps) {
  const classes = colorClasses[color][state];
  const isDisabled = disabled || state !== 'default';

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isDisabled}
      className={`
        w-full rounded-2xl border-4 p-6 text-left font-semibold text-white shadow-lg
        transition-all duration-200
        ${classes}
        ${isDisabled ? 'cursor-not-allowed opacity-100' : 'cursor-pointer active:scale-[0.98]'}
      `}
    >
      <span className="mr-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-lg font-bold">
        {label}
      </span>
      {text}
    </button>
  );
}
