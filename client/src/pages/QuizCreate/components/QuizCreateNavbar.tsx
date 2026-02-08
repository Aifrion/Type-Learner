import { useState } from "react";

export default function QuizCreateNavbar() {
  const [quizName, setQuizName] = useState("");

  return (
    <nav>
      <label htmlFor="quiz-name">Quiz Name:</label>
      <input
        id="quiz-name"
        type="text"
        value={quizName}
        onChange={(e) => setQuizName(e.target.value)}
        placeholder="Enter quiz name"
      />
    </nav>
  );
}
