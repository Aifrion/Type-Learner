import { useNavigate } from "react-router-dom";

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-purple-600 transition hover:text-purple-800"
    >
      <span aria-hidden>{"<-"}</span>
      Back
    </button>
  );
}
