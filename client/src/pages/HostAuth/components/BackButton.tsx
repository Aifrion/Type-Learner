import { useNavigate } from "react-router-dom";

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/")}
      className="mb-6 flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 cursor-pointer"
    >
      &larr; Back
    </button>
  );
}
