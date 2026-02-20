import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Question, TypingStats } from '@/types';
import { saveTypingSession, getTypingSession, clearTypingSession } from '@/services/sessionStorage';
import TypingPhase from './components/TypingPhase';

// mock questions database - can replace with API call when server is ready
const MOCK_QUESTIONS: Record<string, Question> = {
  'ROOM123': {
    id: 'q1',
    text: 'What is photosynthesis?',
    answer: 'Plants absorb carbon dioxide and release oxygen.',
    timeLimit: 30
  },
  'ROOM456': {
    id: 'q2',
    text: 'What is the capital of France?',
    answer: 'The capital of France is Paris.',
    timeLimit: 25
  },
  'ROOM789': {
    id: 'q3',
    text: 'What are the necessary conditions for any Euclidean distance?',
    answer: 'A valid Euclidean distance matrix must satisfy symmetry, zero diagnol, and triangle inequality.',
    timeLimit: 30
  }
};

const DEFAULT_GAME_STATE = {
  currentQuestion: 4,
  totalQuestions: 10
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

    // check if session already exists (page reload case)
    const existingSession = getTypingSession(code);
    if (existingSession) {
      setQuestion(existingSession.question);
      setGameState(existingSession.gameState);
      setLoading(false);
      return;
    }

    // mock data but later replace with fetchTypingTest(code)
    const mockQuestion = MOCK_QUESTIONS[code] || MOCK_QUESTIONS['ROOM123'];

    // save to sessionStorage (persists across page reloads)
    saveTypingSession(code, {
      code,
      question: mockQuestion,
      gameState: DEFAULT_GAME_STATE,
      startedAt: Date.now()
    });

    setQuestion(mockQuestion);
    setGameState(DEFAULT_GAME_STATE);
    setLoading(false);
  }, [code]);

  const handlePhaseComplete = (stats: TypingStats) => {
    console.log('Typing complete:', stats);
    console.log('Game code:', code);
    
    if (code) {
      clearTypingSession(code);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading typing test...</p>
        </div>
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
