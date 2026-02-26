import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "@/firebase";
import BackButton from "@/pages/HostAuth/components/BackButton";
import type { QuestionSetSummary } from "@/types";

const EXAMPLE_SET: QuestionSetSummary = {
  id: "example",
  title: "Sample Quiz",
  questions: [
    {
      prompt: "What does HTML stand for?",
      options: [
        "Hyper Text Markup Language",
        "Hot Mail",
        "How To Make Lasagna",
        "Hyper Tool Multi Language",
      ],
      correctOptionIndex: 0,
    },
    {
      prompt: "Which keyword declares a constant in JavaScript?",
      options: ["var", "let", "const", "fixed"],
      correctOptionIndex: 2,
    },
    {
      prompt: "What does CSS stand for?",
      options: [
        "Computer Style Sheets",
        "Cascading Style Sheets",
        "Creative Style System",
        "Colorful Style Sheets",
      ],
      correctOptionIndex: 1,
    },
  ],
  questionCount: 3,
  isExample: true,
};

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      width="20"
      height="20"
      aria-hidden
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function HostDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sets, setSets] = useState<QuestionSetSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (set: QuestionSetSummary) => {
    if (set.id === "example" || set.isExample) return;
    if (
      !window.confirm(
        `Delete "${set.title ?? "Untitled"}"? This cannot be undone.`,
      )
    )
      return;
    setError(null);
    try {
      await deleteDoc(doc(db, "questionSets", set.id));
      setSets((prev) => prev.filter((s) => s.id !== set.id));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to delete question set.",
      );
    }
  };

  const handleHost = (set: QuestionSetSummary) => {
    if (!set.questions?.length) {
      setError("This question set has no questions.");
      return;
    }

    navigate("/host/waiting-room", { state: { set } });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/host-auth", { replace: true });
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, "quizzes"),
          where("ownerId", "==", user.uid),
        );
        const snapshot = await getDocs(q);
        const list: QuestionSetSummary[] = snapshot.docs.map((d) => {
          const data = d.data();
          const questions = Array.isArray(data?.questions)
            ? data.questions
            : [];
          return {
            id: d.id,
            title:
              data?.title ??
              data?.name ??
              data?.setName ??
              data?.quizTitle ??
              "Untitled",
            ownerId: data?.ownerId ?? user.uid,
            questions,
            questionCount: questions.length,
          };
        });
        setSets([EXAMPLE_SET, ...list]);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to load question sets.",
        );
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-purple-100 px-4">
        <p className="text-gray-500">Loading your question sets…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-100 px-4 pt-16 pb-12">
      <div className="mx-auto max-w-2xl">
        <BackButton />
        <div className="rounded-2xl bg-white px-8 py-10 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-800">
              My Question Sets
            </h1>
            <button
              type="button"
              onClick={() => navigate("/create")}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              <StarIcon className="shrink-0" />
              Create new quiz
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-3">
            {sets.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800">
                    {s.title ?? "Untitled"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {s.questionCount ?? 0} question
                    {s.questionCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => {}}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  {s.id !== "example" && !s.isExample && (
                    <button
                      type="button"
                      onClick={() => handleDelete(s)}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleHost(s)}
                    className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-purple-700"
                  >
                    Host
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full rounded-lg border border-purple-200 px-6 py-3 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
            >
              Back to Home
            </button>
            <button
              type="button"
              onClick={() =>
                signOut(auth).then(() =>
                  navigate("/host-auth", { replace: true }),
                )
              }
              className="w-full rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
