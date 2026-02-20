// client/src/pages/QuizCreate/components/QuestionEditor.tsx
import React from 'react';
import { QuizQuestion } from '@/types'; // Using your path alias!

interface QuestionEditorProps {
  currentQuestion: QuizQuestion;
  setCurrentQuestion: React.Dispatch<React.SetStateAction<QuizQuestion>>;
  onSaveQuestion: () => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  currentQuestion,
  setCurrentQuestion,
  onSaveQuestion,
}) => {
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

  return (
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
        <button className="btn btn-save" onClick={onSaveQuestion}>
          Save Question
        </button>
      </div>
    </div>
  );
};

export default QuestionEditor;