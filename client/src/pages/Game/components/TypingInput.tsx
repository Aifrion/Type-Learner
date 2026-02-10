import { useState, useEffect, useRef, useCallback } from 'react';
import type { TypingStats } from '@/types';

interface TypingInputProps {
  targetText: string;
  disabled: boolean;
  onStatsUpdate: (stats: TypingStats) => void;
  onComplete: (stats: TypingStats) => void;
}

export default function TypingInput({
  targetText,
  disabled,
  onStatsUpdate,
  onComplete
}: TypingInputProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const calculateStats = useCallback((correctChars: number, totalKeys: number): TypingStats => {
    const accuracy = totalKeys > 0 ? Math.round((correctChars / totalKeys) * 100) : 100;

    let wpm = 0;
    if (startTime && correctChars > 0) {
      const elapsedMinutes = (Date.now() - startTime) / 60000;
      if (elapsedMinutes > 0) {
        wpm = Math.round((correctChars / 5) / elapsedMinutes);
      }
    }

    return { wpm, accuracy, correctChars, totalChars: totalKeys };
  }, [startTime]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (disabled) return;

    // Ignore modifier keys and special keys
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Shift' || e.key === 'Tab' || e.key === 'Escape') return;

    // Start timer on first keystroke
    if (!startTime) {
      setStartTime(Date.now());
    }

    const expectedChar = targetText[currentIndex];

    // Only allow correct character to progress
    if (e.key === expectedChar) {
      e.preventDefault();
      const newIndex = currentIndex + 1;
      const newTotal = totalKeystrokes + 1;

      setCurrentIndex(newIndex);
      setTotalKeystrokes(newTotal);

      const stats = calculateStats(newIndex, newTotal);
      onStatsUpdate(stats);

      // Check if complete
      if (newIndex === targetText.length) {
        onComplete(stats);
      }
    } else if (e.key.length === 1) {
      // Wrong character - count it but don't progress
      e.preventDefault();
      const newTotal = totalKeystrokes + 1;
      setTotalKeystrokes(newTotal);

      const stats = calculateStats(currentIndex, newTotal);
      onStatsUpdate(stats);
    }
  }, [disabled, startTime, targetText, currentIndex, totalKeystrokes, calculateStats, onStatsUpdate, onComplete]);

  // Add global keydown listener
  useEffect(() => {
    if (disabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, handleKeyDown]);

  // Reset when target text changes
  useEffect(() => {
    setCurrentIndex(0);
    setStartTime(null);
    setTotalKeystrokes(0);
  }, [targetText]);

  // Focus container on mount
  useEffect(() => {
    if (!disabled && containerRef.current) {
      containerRef.current.focus();
    }
  }, [disabled]);

  const renderCharacters = () => {
    return targetText.split('').map((char, index) => {
      let colorClass = 'text-gray-400'; // Not yet typed

      if (index < currentIndex) {
        colorClass = 'text-green-500'; // Correctly typed
      } else if (index === currentIndex) {
        colorClass = 'text-gray-800 bg-blue-100'; // Current character
      }

      const displayChar = char === ' ' ? '\u00A0' : char;

      return (
        <span key={index} className={`${colorClass} text-2xl font-mono`}>
          {displayChar}
        </span>
      );
    });
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-600">
        Type the answer:
      </label>

      <div
        ref={containerRef}
        tabIndex={0}
        className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200 min-h-16 focus:border-blue-400 focus:outline-none cursor-text"
      >
        <div className="tracking-wide flex flex-wrap leading-relaxed">
          {renderCharacters()}
          {!disabled && currentIndex < targetText.length && (
            <span className="animate-pulse text-2xl font-mono text-blue-500">|</span>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Click the box above and start typing. Only correct characters will register.
      </p>
    </div>
  );
}
