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

  // --- Form Handlers ---

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
      alert("Please enter a question prompt.");
      return;
    }
    if (currentQuestion.options.some(opt => !opt.trim())) {
      alert("Please fill out all answer options.");
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

  // --- Question Card Actions ---

  const handleDeleteQuestion = (indexToDelete: number) => {
    setQuestions(questions.filter((_, index) => index !== indexToDelete));
  };

  const handleEditQuestion = (indexToEdit: number) => {
    // 1. Load the question back into the editor state
    const questionToEdit = questions[indexToEdit];
    setCurrentQuestion(questionToEdit);

    // 2. Remove it from the list (so it can be re-added after editing)
    handleDeleteQuestion(indexToEdit);

    // 3. Scroll to top so user sees the editor
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Main Navigation Handlers ---

  const handleBack = () => {
    navigate(-1); 
  };

  const handleDone = () => {
    if (!quizTitle.trim()) {
      alert("Please enter a quiz title.");
      return;
    }
    console.log("Saving quiz:", { title: quizTitle, questions });
    navigate(-1);
  };

  return (
    <div className="quiz-create-container">
      
      {/* Header */}
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

      {/* Editor */}
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

      {/* Preview List */}
      {questions.length > 0 && (
        <div className="questions-list-section">
          <h3>Questions ({questions.length})</h3>
          <ul className="questions-list">
            {questions.map((q, i) => (
              <li key={i} className="question-item">
                <div className="question-card-header">
                  <strong>{i + 1}. {q.prompt}</strong>
                  <div className="question-actions">
                    <button 
                      className="btn-icon btn-edit" 
                      onClick={() => handleEditQuestion(i)} 
                      title="Edit Question"
                    >
                      ✎
                    </button>
                    <button 
                      className="btn-icon btn-delete" 
                      onClick={() => handleDeleteQuestion(i)} 
                      title="Delete Question"
                    >
                      🗑️
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
        </div>
      )}
    </div>
  );
};

export default QuizCreate;