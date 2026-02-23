export interface ScoreInput {
  isCorrect: boolean;
  typingSpeed: number;
  accuracy: number;
}

const MAX_SPEED_WPM = 120;
const BASE_SCORE = 1000;

export function calculateScore({
  isCorrect,
  typingSpeed,
  accuracy,
}: ScoreInput): number {
  if (!isCorrect) {
    return 0;
  }

  const normalizedSpeed = clamp(typingSpeed, 0, MAX_SPEED_WPM) / MAX_SPEED_WPM;
  const normalizedAccuracy = clamp(accuracy, 0, 100) / 100;

  const speedWeight = 0.5 + normalizedSpeed * 0.5;
  return Math.round(BASE_SCORE * speedWeight * normalizedAccuracy);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
