import type { ClipboardEvent, FormEvent, KeyboardEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkRoomExists } from '@/services/api';

const CODE_LENGTH = 6;

const JoinPage = () => {
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>(Array(CODE_LENGTH).fill(null));

  const code = useMemo(() => digits.join(''), [digits]);
  const isComplete = code.length === CODE_LENGTH && digits.every(Boolean);
  const firstEmptyIndex = useMemo(() => digits.findIndex((d) => !d), [digits]);

  const focusInput = (index: number) => {
    requestAnimationFrame(() => inputsRef.current[index]?.focus());
  };

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!isComplete) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setError(null);

    try {
      const result = await checkRoomExists(code);
      if (!result.exists) {
        setError('exists');
        return;
      }
      // Persist nickname for lobby/socket join
      const nick =
        sessionStorage.getItem('nickname') ||
        `Player-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      sessionStorage.setItem('nickname', nick);
      navigate(`/lobby/${code}`);
    } catch (err) {
      console.error('Failed to validate room code', err);
      setError('network');
    }
  };

  const updateDigits = (
    startIndex: number,
    value: string,
    event?: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (firstEmptyIndex !== -1 && startIndex > firstEmptyIndex) {
      if (event?.target) {
        event.target.value = digits[startIndex] ?? '';
      }
      setDigits([...digits]); // ensure re-render to sync DOM value
      return;
    }

    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!cleaned) {
      const cleared = [...digits];
      cleared[startIndex] = '';
      setDigits(cleared);
      return;
    }

    const nextDigits = [...digits];
    let lastIndex = startIndex;

    cleaned
      .slice(0, CODE_LENGTH - startIndex)
      .split('')
      .forEach((char, i) => {
        nextDigits[startIndex + i] = char;
        lastIndex = startIndex + i;
      });

    setDigits(nextDigits);
    setError(null);

    if (lastIndex < CODE_LENGTH - 1) {
      focusInput(lastIndex + 1);
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    // Block typing into boxes past the first empty slot.
    if (firstEmptyIndex !== -1 && index > firstEmptyIndex && event.key.length === 1) {
      event.preventDefault();
      return;
    }

    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1);
    }
    if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      focusInput(index + 1);
    }
    if (event.key === 'Enter') {
      handleSubmit(event);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedRaw =
      event.clipboardData.getData('text') ||
      event.clipboardData.getData('text/plain');
    const pasted = pastedRaw
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, CODE_LENGTH);
    if (!pasted) return;

    const nextDigits = Array(CODE_LENGTH).fill('');
    pasted.split('').forEach((char, idx) => {
      nextDigits[idx] = char;
    });

    setDigits(nextDigits);
    setError(null);

    if (pasted.length < CODE_LENGTH) {
      focusInput(pasted.length);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4eefc] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl space-y-4">
        {error === 'network' && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 shadow-sm">
            <span className="text-lg" aria-hidden>!</span>
            <p className="text-sm font-medium">Network error. Please try again.</p>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur rounded-3xl shadow-xl border border-purple-100 px-8 py-10">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold text-slate-800">Join a Game</h1>
            <p className="text-slate-600">
              Enter the 6-digit code from your teacher to start typing!
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="flex justify-center gap-3 md:gap-4">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputsRef.current[index] = el;
                  }}
                  inputMode="text"
                  pattern="[A-Za-z0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => updateDigits(index, event.target.value, event)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  onPaste={handlePaste}
                  className={`w-12 h-14 md:w-14 md:h-16 rounded-xl border-2 text-center text-2xl font-semibold tracking-wide uppercase shadow-sm transition focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 bg-white ${
                    error && error !== 'network'
                      ? 'border-red-200 text-red-600 focus:ring-red-200 focus:border-red-400'
                      : 'border-purple-100 text-slate-800'
                  }`}
                  aria-label={`Code character ${index + 1}`}
                />
              ))}
            </div>

            {error && error !== 'network' && (
              <p className="text-center text-sm font-medium text-red-600">
                {error === 'exists' && "Oops! That code doesn't exist. Check with your teacher."}
                {error === 'started' && 'Sorry! This game has already begun.'}
                {error !== 'exists' && error !== 'started' && error !== 'network' && error}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold py-3 shadow-lg transition hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!isComplete}
            >
              Join Room
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <a className="font-semibold text-purple-700 hover:text-purple-800" href="#">
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinPage;
