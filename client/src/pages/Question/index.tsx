import { useParams } from 'react-router-dom';
import QuestionPhase from './components/QuestionPhase';
import type { MultipleChoiceQuestion } from './components/QuestionPhase';

const mockQuestion: MultipleChoiceQuestion = {
  id: '1',
  text: 'What gas do plants absorb from the atmosphere during photosynthesis?',
  timeLimit: 15,
  options: [
    { id: 'A', text: 'Oxygen', color: 'red' },
    { id: 'B', text: 'Carbon dioxide', color: 'blue' },
    { id: 'C', text: 'Nitrogen', color: 'yellow' },
    { id: 'D', text: 'Hydrogen', color: 'green' }
  ],
  correctIndex: 1
};

const mockGameState = {
  currentQuestion: 1,
  totalQuestions: 1
};

export default function Question() {
  const { code } = useParams<{ code: string }>();

  const handleTimeUp = () => {
    console.log('Time up. Game code:', code);
  };

  return (
    <QuestionPhase
      question={mockQuestion}
      currentQuestionNumber={mockGameState.currentQuestion}
      totalQuestions={mockGameState.totalQuestions}
      onTimeUp={handleTimeUp}
    />
  );
}
