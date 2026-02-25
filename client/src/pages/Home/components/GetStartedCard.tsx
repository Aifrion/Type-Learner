import { useNavigate } from "react-router-dom";

export default function GetStartedCard() {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-md rounded-2xl border border-purple-200 bg-white px-8 py-10 shadow-sm">
      <h2 className="mb-3 text-center text-2xl font-bold text-gray-800">
        Get Started
      </h2>
      <p className="mb-6 text-center text-sm text-gray-500">
        Pick a mode to jump into your next activity.
      </p>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => navigate("/join")}
          className="w-full rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
        >
          Practice a Question Set
        </button>
        <button
          type="button"
          onClick={() => navigate("/host-auth")}
          className="w-full rounded-lg border border-purple-200 px-6 py-3 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
        >
          Create a Question Set
        </button>
      </div>
    </div>
  );
}
