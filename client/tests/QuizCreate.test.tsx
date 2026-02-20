// client/tests/QuizCreate.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import QuizCreate from '../src/pages/QuizCreate';

// 1. Mock the custom hook to prevent real Firestore calls
const mockSaveQuiz = vi.fn();
vi.mock('../src/hooks/useQuizDatabase', () => ({
  useQuizDatabase: () => ({
    fetchQuiz: vi.fn(),
    saveQuiz: mockSaveQuiz,
    isSaving: false,
    isLoading: false,
    error: null,
  }),
}));

// 2. Mock react-router-dom to prevent navigation errors
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => vi.fn(),
    useParams: () => ({}), // Empty params means we are in "Create" mode, not "Edit"
  };
});

describe('QuizCreate Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <QuizCreate />
      </BrowserRouter>
    );
  };

  it('validates that a question has a prompt', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Click save without typing anything
    const saveQuestionBtn = screen.getByText('Save Question');
    await user.click(saveQuestionBtn);

    // Expect validation modal to appear
    expect(screen.getByText('Please enter a question prompt.')).toBeInTheDocument();
  });

  it('validates that all options are filled out', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Type a prompt but leave options blank
    const promptInput = screen.getByPlaceholderText('Start typing your question');
    await user.type(promptInput, 'What is 2 + 2?');

    const saveQuestionBtn = screen.getByText('Save Question');
    await user.click(saveQuestionBtn);

    // Expect validation modal to appear
    expect(screen.getByText('Please fill out all answer options.')).toBeInTheDocument();
  });

  it('successfully adds a question to the list', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Fill out prompt
    const promptInput = screen.getByPlaceholderText('Start typing your question');
    await user.type(promptInput, 'What color is the sky?');

    // Fill out options
    const option1 = screen.getByPlaceholderText('Add answer 1');
    const option2 = screen.getByPlaceholderText('Add answer 2');
    await user.type(option1, 'Blue');
    await user.type(option2, 'Green');

    // Save the question
    const saveQuestionBtn = screen.getByText('Save Question');
    await user.click(saveQuestionBtn);

    // Verify it was added to the list
    expect(screen.getByText('1. What color is the sky?')).toBeInTheDocument();
    
    // Verify the inputs were cleared
    expect(promptInput).toHaveValue('');
  });

  it('saves the quiz to Firestore when Done is clicked', async () => {
    const user = userEvent.setup();
    // Have the mock return true to simulate a successful save
    mockSaveQuiz.mockResolvedValue(true); 
    
    renderComponent();

    // 1. Enter quiz title
    const titleInput = screen.getByPlaceholderText('Enter Quiz Title');
    await user.type(titleInput, 'My Test Quiz');

    // 2. Add a valid question
    await user.type(screen.getByPlaceholderText('Start typing your question'), 'Test Q?');
    await user.type(screen.getByPlaceholderText('Add answer 1'), 'A');
    await user.type(screen.getByPlaceholderText('Add answer 2'), 'B');
    await user.click(screen.getByText('Save Question'));

    // 3. Click Done to submit the whole quiz
    const doneBtn = screen.getByText('Done');
    await user.click(doneBtn);

    // 4. Verify the database hook was called with the right data
    await waitFor(() => {
      expect(mockSaveQuiz).toHaveBeenCalledWith(
        undefined, // undefined because there is no quizId (we are creating, not editing)
        'My Test Quiz', 
        [{
          prompt: 'Test Q?',
          options: ['A', 'B'],
          correctOptionIndex: 0
        }]
      );
    });

    // 5. Verify success modal appears
    expect(screen.getByText('Quiz created successfully!')).toBeInTheDocument();
  });
});