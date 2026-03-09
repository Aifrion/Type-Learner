import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuizDatabase } from '@/hooks/useQuizDatabase'; 
import { QuizQuestion } from '@/types'; 
import QuestionEditor from './components/QuestionEditor';
import QuestionList from './components/QuestionList';
import AlertModal from './components/AlertModal';
import QuizCreateNavbar from './components/QuizCreateNavbar';
import '../../styles/QuizCreate.css';
import { auth } from '@/firebase';

const QuizCreate: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Detect if Edit mode
  const isEditMode = Boolean(id);
  
  const { saveQuiz, getQuiz, updateQuiz, isSaving, isLoading, error } = useQuizDatabase();
  
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

  // Fetch existing quiz data when in edit mode
  useEffect(() => {
    const loadQuizData = async () => {
      if (isEditMode && id) {
        const existingQuiz = await getQuiz(id);
        
        if (existingQuiz) {
          const currentUser = auth.currentUser;
          if (!currentUser || existingQuiz.ownerId !== currentUser.uid) {
            showAlert("You do not have permission to edit this quiz.");
            navigate('/host/dashboard');
            return; // Stop execution so the quiz data doesn't load
          }
          setQuizTitle(existingQuiz.title);
          setQuestions(existingQuiz.questions);
        } else {
          showAlert("Could not load quiz data.", false);
          navigate('/host/dashboard');
        }
      }
    };
    loadQuizData();
  }, [id, isEditMode, navigate]);

  const showAlert = (message: string, success = false) => {
    setModalMessage(message);
    setIsSuccess(success);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMessage('');
    if (isSuccess) navigate('/host/dashboard'); 
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
    if (!quizTitle.trim() || questions.length === 0) {
      showAlert("Please enter a title and at least one question.");
      return;
    }

    // Check user authentication before saving
    const currentUser = auth.currentUser;
    if (!currentUser) {
      showAlert("You must be logged in to save or edit a quiz.");
      return;
    }

    let success = false;

    // Branch logic based on mode
    if (isEditMode && id) {
      success = await updateQuiz(id, quizTitle, questions);
    } else {
      success = await saveQuiz(quizTitle, questions, currentUser.uid);
    }
    
    if (success) {
      showAlert(`Quiz ${isEditMode ? 'updated' : 'created'} successfully!`, true);
    } else {
      showAlert(error || "Failed to save quiz.");
    }
  };

  if (isLoading) return <div className="quiz-create-container">Loading editor...</div>;

  return (
    <div className="quiz-create-container">
      <h1>{isEditMode ? 'Edit Quiz' : 'Create Quiz'}</h1>

      <QuizCreateNavbar 
        quizTitle={quizTitle}
        setQuizTitle={setQuizTitle}
        onDone={handleDone}
        onExit={() => navigate('/host/dashboard')}
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

      <AlertModal isOpen={showModal} message={modalMessage} onClose={closeModal} />
    </div>
  );
};

export default QuizCreate;