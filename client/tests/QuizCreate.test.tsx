import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import QuizCreate from '../src/pages/QuizCreate';

const mockSaveQuiz = vi.fn();
vi.mock('../src/hooks/useQuizDatabase', () => ({
  useQuizDatabase: () => ({
    saveQuiz: mockSaveQuiz,
    isSaving: false,
    error: null,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => vi.fn(),
  };
});

describe('QuizCreate Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up mock env variable for tests
    vi.stubEnv('VITE_MOCK_USER_ID', 'test_teacher_id');
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

    const saveQuestionBtn = screen.getByText('Save Question');
    await user.click(saveQuestionBtn);

    expect(screen.getByText('Please enter a question prompt.')).toBeInTheDocument();
  });

  it('validates that all options are filled out', async () => {
    const user = userEvent.setup();
    renderComponent();

    const promptInput = screen.getByPlaceholderText('Start typing your question');
    await user.type(promptInput, 'What is 2 + 2?');

    const saveQuestionBtn = screen.getByText('Save Question');
    await user.click(saveQuestionBtn);

    expect(screen.getByText('Please fill out all answer options.')).toBeInTheDocument();
  });

  it('successfully adds a question to the list', async () => {
    const user = userEvent.setup();
    renderComponent();

    const promptInput = screen.getByPlaceholderText('Start typing your question');
    await user.type(promptInput, 'What color is the sky?');

    const option1 = screen.getByPlaceholderText('Add answer 1');
    const option2 = screen.getByPlaceholderText('Add answer 2');
    await user.type(option1, 'Blue');
    await user.type(option2, 'Green');

    const saveQuestionBtn = screen.getByText('Save Question');
    await user.click(saveQuestionBtn);

    expect(screen.getByText('1. What color is the sky?')).toBeInTheDocument();
    expect(promptInput).toHaveValue('');
  });

  it('saves the quiz to Firestore when Done is clicked', async () => {
    const user = userEvent.setup();
    mockSaveQuiz.mockResolvedValue(true); 
    
    renderComponent();

    const titleInput = screen.getByPlaceholderText('Enter Quiz Title');
    await user.type(titleInput, 'My Test Quiz');

    await user.type(screen.getByPlaceholderText('Start typing your question'), 'Test Q?');
    await user.type(screen.getByPlaceholderText('Add answer 1'), 'A');
    await user.type(screen.getByPlaceholderText('Add answer 2'), 'B');
    await user.click(screen.getByText('Save Question'));

    const doneBtn = screen.getByText('Done');
    await user.click(doneBtn);

    await waitFor(() => {
      expect(mockSaveQuiz).toHaveBeenCalledWith(
        'My Test Quiz', 
        [{
          prompt: 'Test Q?',
          options: ['A', 'B'],
          correctOptionIndex: 0
        }],
        'test_teacher_id' // Verifies ownerId is passed
      );
    });

    expect(screen.getByText('Quiz created successfully!')).toBeInTheDocument();
  });

  it('shows an error modal when saving fails', async () => {
    const user = userEvent.setup();
    mockSaveQuiz.mockResolvedValue(false); // Simulate failure path
    
    renderComponent();

    const titleInput = screen.getByPlaceholderText('Enter Quiz Title');
    await user.type(titleInput, 'Failing Quiz');

    await user.type(screen.getByPlaceholderText('Start typing your question'), 'Fail Q?');
    await user.type(screen.getByPlaceholderText('Add answer 1'), 'A');
    await user.type(screen.getByPlaceholderText('Add answer 2'), 'B');
    await user.click(screen.getByText('Save Question'));

    const doneBtn = screen.getByText('Done');
    await user.click(doneBtn);

    expect(await screen.findByText('Failed to save quiz. Please try again.')).toBeInTheDocument();
  });
});