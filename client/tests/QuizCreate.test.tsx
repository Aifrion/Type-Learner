import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, useParams } from 'react-router-dom';
import QuizCreate from '../src/pages/QuizCreate';

// Mock hook functions
const mockSaveQuiz = vi.fn();
const mockGetQuiz = vi.fn();
const mockUpdateQuiz = vi.fn();

vi.mock('../src/hooks/useQuizDatabase', () => ({
  useQuizDatabase: () => ({
    saveQuiz: mockSaveQuiz,
    getQuiz: mockGetQuiz,
    updateQuiz: mockUpdateQuiz,
    isLoading: false,
    isSaving: false,
    error: null,
  }),
}));

// Create a stable mock function outside the block
const mockNavigate = vi.fn(); 

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    // Return the stable reference instead of generating a new one
    useNavigate: () => mockNavigate, 
    useParams: vi.fn(() => ({})), // Defaults to an empty object (Create Mode)
  };
});

vi.mock('../src/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test_teacher_id'
    }
  }
}));

describe('QuizCreate Component (Unified Editor)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_MOCK_USER_ID', 'test_teacher_id');
    // Reset useParams to default (create mode) before each test
    vi.mocked(useParams).mockReturnValue({});
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

    expect(await screen.findByText('Failed to save quiz.')).toBeInTheDocument();
  });

  it('fetches and displays existing quiz data when an ID is present in the route', async () => {
    // Simulate being on the /edit/:id route
    vi.mocked(useParams).mockReturnValue({ id: 'test_quiz_123' });
    
    // Provide mock data for getQuiz to return
    mockGetQuiz.mockResolvedValue({
      id: 'test_quiz_123',
      title: 'Pre-existing Quiz',
      ownerId: 'test_teacher_id',
      questions: [{ prompt: 'Old Question?', options: ['Yes', 'No'], correctOptionIndex: 0 }]
    });

    renderComponent();

    // Verify the UI recognizes it's in edit mode
    await waitFor(() => {
      expect(screen.getByText('Edit Quiz')).toBeInTheDocument();
    });

    // Verify the data was populated into the state/UI
    expect(screen.getByDisplayValue('Pre-existing Quiz')).toBeInTheDocument();
    expect(screen.getByText('1. Old Question?')).toBeInTheDocument();
    expect(mockGetQuiz).toHaveBeenCalledWith('test_quiz_123');
  });

  it('calls updateQuiz instead of saveQuiz when in edit mode', async () => {
    const user = userEvent.setup();
    vi.mocked(useParams).mockReturnValue({ id: 'test_quiz_123' });
    
    mockGetQuiz.mockResolvedValue({
      id: 'test_quiz_123',
      title: 'Editable Quiz',
      ownerId: 'test_teacher_id',
      questions: [{ prompt: 'Q1', options: ['A', 'B'], correctOptionIndex: 0 }]
    });
    mockUpdateQuiz.mockResolvedValue(true);

    renderComponent();

    // Wait for the initial load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Editable Quiz')).toBeInTheDocument();
    });

    // User modifies the title
    const titleInput = screen.getByDisplayValue('Editable Quiz');
    await user.type(titleInput, ' - Updated');

    const doneBtn = screen.getByText('Done');
    await user.click(doneBtn);

    // Verify updateQuiz was called with the modified data
    await waitFor(() => {
      expect(mockUpdateQuiz).toHaveBeenCalledWith(
        'test_quiz_123',
        'Editable Quiz - Updated',
        [{ prompt: 'Q1', options: ['A', 'B'], correctOptionIndex: 0 }]
      );
    });

    // Verify saveQuiz was not called
    expect(mockSaveQuiz).not.toHaveBeenCalled();
    expect(screen.getByText('Quiz updated successfully!')).toBeInTheDocument();
  });
});

