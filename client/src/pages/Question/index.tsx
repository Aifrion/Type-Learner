import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import QuestionPhase from "./components/QuestionPhase";
import type { MultipleChoiceQuestion } from "./components/QuestionPhase";

// const mockQuestion: MultipleChoiceQuestion = {
//   id: "1",
//   text: "What gas do plants absorb from the atmosphere during photosynthesis?",
//   timeLimit: 15,
//   options: [
//     { id: "A", text: "Oxygen", color: "red" },
//     { id: "B", text: "Carbon dioxide", color: "blue" },
//     { id: "C", text: "Nitrogen", color: "yellow" },
//     { id: "D", text: "Hydrogen", color: "green" },
//   ],
//   correctIndex: 1,
// };

const mockGameState = {
  currentQuestion: 1,
  totalQuestions: 1,
};

export default function Question() {
  const { code } = useParams<{ code: string }>();
  const [questionSets, setQuestionSets] = useState<any>([]);
  const [loading, setLoading] = useState(true);

  // The useEffect here is fetching the data from the firestore database
  useEffect(() => {
    async function fetchQuestionSets() {
      const questionSetsCollection = await getDocs(
        collection(db, "questionSets"),
      );
      const data = questionSetsCollection.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setQuestionSets(data);
      setLoading(false);
    }
    fetchQuestionSets();
  }, []);

  const handleTimeUp = () => {
    console.log("Time up. Game code:", code);
  };

  // Checking loading state while fetching data from firestore database
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  // Logs to look at data structure
  console.log(questionSets);
  console.log(questionSets[0].questions[0]);
  console.log(questionSets[0].questions[0].answers);
  console.log(questionSets[0].questions[0].correctAnswer);

  // Changes to mockQuestion so that it uses database data. (Needs reviewing and refining)
  const mockQuestionData = questionSets[0].questions[0];
  const mockQuestion: MultipleChoiceQuestion = {
    id: "1",
    text: mockQuestionData.question,
    timeLimit: 15,
    options: [
      { id: "A", text: mockQuestionData.answers[0], color: "red" },
      { id: "B", text: mockQuestionData.answers[1], color: "blue" },
      { id: "C", text: mockQuestionData.answers[2], color: "yellow" },
      { id: "D", text: mockQuestionData.answers[3], color: "green" },
    ],
    correctIndex: mockQuestionData.correctAnswer,
  };

  return (
    <QuestionPhase
      question={mockQuestion}
      currentQuestionNumber={mockGameState.currentQuestion}
      totalQuestions={mockGameState.totalQuestions}
      onTimeUp={handleTimeUp}
    />
  );
}
