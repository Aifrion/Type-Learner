import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import BackButton from "./components/BackButton";

export default function HostAuth() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/host/dashboard", { replace: true });
    });
    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center bg-purple-100 px-4 pt-16">
      <div className="w-full max-w-md">
        <BackButton />
        <div className="rounded-2xl bg-white px-10 py-12 text-center shadow-sm">
          <h1 className="text-3xl font-bold text-gray-800">Teacher Access</h1>
          <p className="mb-8 mt-2 text-sm text-gray-400">
            Log in or register to manage your question sets.
          </p>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate("/host-login")}
              className="w-full rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigate("/host-registration")}
              className="w-full rounded-lg border border-purple-200 px-6 py-3 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
