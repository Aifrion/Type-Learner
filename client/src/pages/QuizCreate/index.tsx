import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/QuizCreate.css'; 

interface QuestionDraft {
  prompt: string;
  options: string[];
  correctOptionIndex: number;
}

const QuizCreate: React.FC = () => {
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  
  const [currentQuestion, setCurrentQuestion] = useState<QuestionDraft>({
    prompt: '',
    options: ['', ''], 
    correctOptionIndex: 0,
  });

  const [quizTitle, setQuizTitle] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const showAlert = (message: string) => {
    setModalMessage(message);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMessage('');
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const addOption = () => {
    if (currentQuestion.options.length < 4) {
      setCurrentQuestion({
        ...currentQuestion,
        options: [...currentQuestion.options, ''],
      });
    }
  };

  const removeOption = (index: number) => {
    if (currentQuestion.options.length > 2) {
      const newOptions = currentQuestion.options.filter((_, i) => i !== index);
      let newCorrectIndex = currentQuestion.correctOptionIndex;
      if (index === currentQuestion.correctOptionIndex) {
        newCorrectIndex = 0; 
      } else if (index < currentQuestion.correctOptionIndex) {
        newCorrectIndex -= 1; 
      }
      
      setCurrentQuestion({
        ...currentQuestion,
        options: newOptions,
        correctOptionIndex: newCorrectIndex,
      });
    }
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
    
    // Reset editor
    setCurrentQuestion({
      prompt: '',
      options: ['', ''],
      correctOptionIndex: 0,
    });
  };

  const handleDeleteQuestion = (indexToDelete: number) => {
    setQuestions(questions.filter((_, index) => index !== indexToDelete));
  };

  const handleEditQuestion = (indexToEdit: number) => {
    const questionToEdit = questions[indexToEdit];
    setCurrentQuestion(questionToEdit);
    handleDeleteQuestion(indexToEdit);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    navigate(-1); 
  };

  const handleDone = () => {
    if (!quizTitle.trim()) {
      showAlert("Please enter a title to your quiz.");
      return;
    }
    console.log("Saving quiz:", { title: quizTitle, questions });
    navigate(-1);
  };

  return (
    <div className="quiz-create-container">
      <h1>Create Quiz</h1>

      {/* Header Section */}
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
          <button className="btn btn-back" onClick={handleBack}>Back</button>
          <button className="btn btn-done" onClick={handleDone}>Done</button>
        </div>
      </div>

      <hr />

      {/* --- START RESPONSIVE LAYOUT WRAPPER --- */}
      <div className="create-quiz-layout">
        
        {/* Left Column: Editor */}
        <div className="question-editor">
          <div className="form-group">
            <input
              type="text"
              className="input-field"
              value={currentQuestion.prompt}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, prompt: e.target.value })}
              placeholder="Start typing your question"
            />
          </div>

          <div className="form-group">
            <p className="helper-text">Mark the correct answer using the radio button.</p>
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="option-row">
                <input
                  type="radio"
                  name="correctOption"
                  className="radio-input"
                  checked={currentQuestion.correctOptionIndex === index}
                  onChange={() => setCurrentQuestion({ ...currentQuestion, correctOptionIndex: index })}
                />
                <input
                  type="text"
                  className="option-input"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Add answer ${index + 1}`}
                />
                <button
                  className="btn btn-remove"
                  onClick={() => removeOption(index)}
                  disabled={currentQuestion.options.length <= 2}
                >
                  ✕
                </button>
              </div>
            ))}

            {currentQuestion.options.length < 4 && (
              <button className="btn btn-add" onClick={addOption}>
                + Add Option
              </button>
            )}
          </div>

          <div className="btn-save-container">
            <button className="btn btn-save" onClick={handleAddQuestion}>
              Save Question
            </button>
          </div>
        </div>

        {/* Right Column: List (Always Visible) */}
        <div className="questions-list-section">
          <h3>Questions ({questions.length})</h3>
          
          {questions.length === 0 ? (
            <div className="empty-state">
              <p>No questions added yet.</p>
            </div>
          ) : (
            <ul className="questions-list">
              {questions.map((q, i) => (
                <li key={i} className="question-item">
                  <div className="question-card-header">
                    <strong>{i + 1}. {q.prompt}</strong>
                    <div className="question-actions">
                      
                      {/* --- SVG Edit Icon --- */}
                      <button 
                        className="btn-icon btn-edit" 
                        onClick={() => handleEditQuestion(i)} 
                        title="Edit Question"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>

                      {/* --- SVG Trash Icon --- */}
                      <button 
                        className="btn-icon btn-delete" 
                        onClick={() => handleDeleteQuestion(i)} 
                        title="Delete Question"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>

                    </div>
                  </div>
                  
                  <ul className="question-options-list">
                    {q.options.map((opt, optIndex) => (
                      <li 
                        key={optIndex} 
                        className={optIndex === q.correctOptionIndex ? 'correct-answer' : ''}
                      >
                        {opt} {optIndex === q.correctOptionIndex && '✓'}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div> 
      {/* --- END RESPONSIVE LAYOUT WRAPPER --- */}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p className="modal-text">{modalMessage}</p>
            <button className="btn-modal-ok" onClick={closeModal}>
              okie
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default QuizCreate;