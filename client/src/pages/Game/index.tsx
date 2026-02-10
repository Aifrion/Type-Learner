import { useParams } from 'react-router-dom';
import type { Question, TypingStats } from '@/types';
import TypingPhase from './components/TypingPhase';

const mockQuestion: Question = {
  id: '1',
  text: 'What gas do plants absorb from the atmosphere during photosynthesis?',
  answer: 'Plants absorb carbon dioxide from the atmosphere during photosynthesis.',
  timeLimit: 30
};

const mockGameState = {
  currentQuestion: 4,
  totalQuestions: 10
};

export default function Game() {
  const { code } = useParams<{ code: string }>();

  const handlePhaseComplete = (stats: TypingStats) => {
    console.log('Phase complete:', stats);
    console.log('Game code:', code);
  };

  return (
    <TypingPhase
      question={mockQuestion}
      currentQuestionNumber={mockGameState.currentQuestion}
      totalQuestions={mockGameState.totalQuestions}
      onPhaseComplete={handlePhaseComplete}
    />
  );
}
