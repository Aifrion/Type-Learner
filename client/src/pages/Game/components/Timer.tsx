import { useState, useEffect, useCallback } from 'react';

interface TimerProps {
  duration: number;
  onTimeUp: () => void;
  isRunning: boolean;
}

export default function Timer({ duration, onTimeUp, isRunning }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (!isRunning) return;

    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onTimeUp]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const isLowTime = timeLeft <= 10;

  return (
    <div className={`text-2xl font-mono font-bold ${isLowTime ? 'text-red-500' : 'text-gray-700'}`}>
      {formatTime(timeLeft)}
    </div>
  );
}
