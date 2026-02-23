import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Question, TypingStats } from '@/types';
import {
  saveTypingSession,
  getTypingSession,
  clearTypingSession,
} from '@/services/sessionStorage';
import TypingPhase from './components/TypingPhase';

const MOCK_QUESTIONS: Record<string, Question> = {
  ROOM: {
    id: '1',
    text: 'What gas do plants absorb from the atmosphere during photosynthesis?',
    answer: 'Plants absorb carbon dioxide from the atmosphere during photosynthesis.',
    timeLimit: 30,
  },
  practice: {
    id: '1',
    text: 'What gas do plants absorb from the atmosphere during photosynthesis?',
    answer: 'Plants absorb carbon dioxide from the atmosphere during photosynthesis.',
    timeLimit: 30,
  },
};

const DEFAULT_GAME_STATE = {
  currentQuestion: 4,
  totalQuestions: 10,
};

export default function Game() {
  const { code } = useParams<{ code: string }>();
  const [question, setQuestion] = useState<Question | null>(null);
  const [gameState, setGameState] = useState(DEFAULT_GAME_STATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) {
      setLoading(false);
      return;
    }

    const existingSession = getTypingSession(code);
    if (existingSession) {
      setQuestion(existingSession.question);
      setGameState(existingSession.gameState);
      setLoading(false);
      return;
    }

    const nextQuestion = MOCK_QUESTIONS[code] ?? MOCK_QUESTIONS.ROOM;

    saveTypingSession(code, {
      code,
      question: nextQuestion,
      gameState: DEFAULT_GAME_STATE,
      startedAt: Date.now(),
    });

    setQuestion(nextQuestion);
    setGameState(DEFAULT_GAME_STATE);
    setLoading(false);
  }, [code]);

  const handlePhaseComplete = (stats: TypingStats) => {
    console.log('Phase complete:', stats);
    console.log('Game code:', code);

    if (code) {
      clearTypingSession(code);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading typing test...</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-600">No question found</p>
      </div>
    );
  }

  return (
    <TypingPhase
      question={question}
      currentQuestionNumber={gameState.currentQuestion}
      totalQuestions={gameState.totalQuestions}
      onPhaseComplete={handlePhaseComplete}
    />
  );
}
