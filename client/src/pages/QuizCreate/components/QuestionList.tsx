// client/src/pages/QuizCreate/components/QuestionList.tsx
import React from 'react';
import { QuizQuestion } from '@/types';

interface QuestionListProps {
  questions: QuizQuestion[];
  onEditQuestion: (indexToEdit: number) => void;
  onDeleteQuestion: (indexToDelete: number) => void;
}

const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  onEditQuestion,
  onDeleteQuestion,
}) => {
  return (
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
                  <button 
                    className="btn-icon btn-edit" 
                    onClick={() => onEditQuestion(i)} 
                    title="Edit Question"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button 
                    className="btn-icon btn-delete" 
                    onClick={() => onDeleteQuestion(i)} 
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
  );
};

export default QuestionList;