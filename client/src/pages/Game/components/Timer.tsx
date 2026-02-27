import { useState, useEffect, useCallback, useRef } from 'react';

interface TimerProps {
  duration: number;
  onTimeUp: () => void;
  isRunning: boolean;
  endsAtMs?: number;
}

function getTimeLeftFromEnd(endsAtMs: number) {
  return Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000));
}

export default function Timer({ duration, onTimeUp, isRunning, endsAtMs }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(
    endsAtMs ? getTimeLeftFromEnd(endsAtMs) : duration
  );
  const didCallOnTimeUpRef = useRef(false);

  useEffect(() => {
    didCallOnTimeUpRef.current = false;
    setTimeLeft(endsAtMs ? getTimeLeftFromEnd(endsAtMs) : duration);
  }, [duration, endsAtMs]);

  useEffect(() => {
    if (!isRunning) return;

    if (timeLeft <= 0) {
      if (!didCallOnTimeUpRef.current) {
        didCallOnTimeUpRef.current = true;
        onTimeUp();
      }
      return;
    }

    const interval = setInterval(() => {
      if (endsAtMs) {
        setTimeLeft(getTimeLeftFromEnd(endsAtMs));
        return;
      }
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, endsAtMs ? 250 : 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onTimeUp, endsAtMs]);

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
