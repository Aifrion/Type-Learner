// client/src/pages/QuizCreate/index.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuizDatabase } from '@/hooks/useQuizDatabase'; 
import { QuizQuestion } from '@/types'; 
import QuestionEditor from './components/QuestionEditor';
import QuestionList from './components/QuestionList';
import AlertModal from './components/AlertModal';
import '../../styles/QuizCreate.css'; 

const QuizCreate: React.FC = () => {
  const navigate = useNavigate();
  const { quizId } = useParams<{ quizId?: string }>(); 
  const { fetchQuiz, saveQuiz, isSaving, isLoading, error } = useQuizDatabase();
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>({
    prompt: '',
    options: ['', ''], 
    correctOptionIndex: 0,
  });

  const [quizTitle, setQuizTitle] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (quizId) {
      const loadData = async () => {
        const quizData = await fetchQuiz(quizId);
        if (quizData) {
          setQuizTitle(quizData.title || '');
          setQuestions(quizData.questions || []);
        } else if (error) {
          showAlert(error);
        }
      };
      loadData();
    }
  }, [quizId]); 

  const showAlert = (message: string, success = false) => {
    setModalMessage(message);
    setIsSuccess(success);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMessage('');
    if (isSuccess) navigate(-1); 
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.prompt.trim()) {
      showAlert("Please enter a question prompt.");
      return;
    }
    if (currentQuestion.options.some(opt => !opt.trim())) {
      showAlert("Please fill out all answer options.");
      return;
    }

    setQuestions([...questions, currentQuestion]);
    setCurrentQuestion({ prompt: '', options: ['', ''], correctOptionIndex: 0 });
  };

  const handleDeleteQuestion = (indexToDelete: number) => {
    setQuestions(questions.filter((_, index) => index !== indexToDelete));
  };

  const handleEditQuestion = (indexToEdit: number) => {
    setCurrentQuestion(questions[indexToEdit]);
    handleDeleteQuestion(indexToEdit);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDone = async () => {
    if (!quizTitle.trim()) {
      showAlert("Please enter a title to your quiz.");
      return;
    }
    if (questions.length === 0) {
      showAlert("Please add at least one question to save the quiz.");
      return;
    }

    const success = await saveQuiz(quizId, quizTitle, questions);
    if (success) {
      showAlert(quizId ? "Quiz updated successfully!" : "Quiz created successfully!", true);
    } else {
      showAlert("Failed to save quiz. Please try again.");
    }
  };

  if (isLoading) return <div className="quiz-create-container"><h2>Loading...</h2></div>;

  return (
    <div className="quiz-create-container">
      <h1>{quizId ? 'Edit Quiz' : 'Create Quiz'}</h1>

      <div className="quiz-header">
        <div className="quiz-title-section">
          <input
            id="quizTitle"
            type="text"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            placeholder="Enter Quiz Title"
            className="input-title-bar"
          />
        </div>
        <div className="header-actions">
          <button className="btn btn-back" onClick={() => navigate(-1)} disabled={isSaving}>Back</button>
          <button className="btn btn-done" onClick={handleDone} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Done'}
          </button>
        </div>
      </div>
      <hr />

      <div className="create-quiz-layout">
        {/* Pass down state and callbacks to the child components */}
        <QuestionEditor 
          currentQuestion={currentQuestion} 
          setCurrentQuestion={setCurrentQuestion} 
          onSaveQuestion={handleAddQuestion} 
        />
        
        <QuestionList 
          questions={questions} 
          onEditQuestion={handleEditQuestion} 
          onDeleteQuestion={handleDeleteQuestion} 
        />
      </div> 

      <AlertModal 
        isOpen={showModal} 
        message={modalMessage} 
        onClose={closeModal} 
      />
    </div>
  );
};

export default QuizCreate;