import { useState } from "react";

export default function QuizCreateNavbar() {
  const [quizName, setQuizName] = useState("");

  return (
    <nav className="flex items-center justify-between w-full px-6 py-3 bg-white border-b border-gray-200">
      <div className="flex-1" />

      <div className="flex-1 flex justify-center">
        <input
          type="text"
          value={quizName}
          onChange={(e) => setQuizName(e.target.value)}
          placeholder="Enter Quiz Title"
          className="px-6 py-2 rounded-full border border-purple-300 bg-purple-50 text-center text-purple-400 placeholder-purple-300 focus:outline-none focus:border-purple-500 w-72"
        />
      </div>

      <div className="flex-1 flex justify-end gap-3">
        <button className="px-6 py-2 rounded-lg border-2 border-purple-700 text-purple-700 font-semibold bg-white hover:bg-purple-50 transition">
          Exit
        </button>
        <button className="px-6 py-2 rounded-lg bg-pink-300 text-white font-semibold hover:bg-pink-400 transition">
          Done
        </button>
      </div>
    </nav>
  );
}
