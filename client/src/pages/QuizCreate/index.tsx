import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizDatabase } from '@/hooks/useQuizDatabase'; 
import { QuizQuestion } from '@/types'; 
import QuestionEditor from './components/QuestionEditor';
import QuestionList from './components/QuestionList';
import AlertModal from './components/AlertModal';
import QuizCreateNavbar from './components/QuizCreateNavbar';
import '../../styles/QuizCreate.css'; 

const QuizCreate: React.FC = () => {
  const navigate = useNavigate();
  const { saveQuiz, isSaving, error } = useQuizDatabase();
  
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

    const currentUserId = import.meta.env.VITE_MOCK_USER_ID;
    const success = await saveQuiz(quizTitle, questions, currentUserId);
    
    if (success) {
      showAlert("Quiz created successfully!", true);
    } else {
      // Prioritize hook error if available, else generic message
      showAlert(error || "Failed to save quiz. Please try again.");
    }
  };

  return (
    <div className="quiz-create-container">
      {}
      <h1>Create Quiz</h1>

      {}
      <QuizCreateNavbar 
        quizTitle={quizTitle}
        setQuizTitle={setQuizTitle}
        onDone={handleDone}
        onExit={() => navigate(-1)}
        isSaving={isSaving}
      />
      <hr />

      <div className="create-quiz-layout">
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