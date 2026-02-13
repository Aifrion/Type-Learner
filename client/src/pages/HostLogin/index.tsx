import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";
import BackButton from "@/pages/HostAuth/components/BackButton";

export default function HostLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-purple-100 px-4 pt-16">
      <div className="w-full max-w-md">
        <BackButton />
        <div className="rounded-2xl bg-white px-10 py-12 shadow-sm">
          <h1 className="text-center text-3xl font-bold text-gray-800">
            Host Login
          </h1>
          <p className="mb-8 text-center text-sm text-gray-400">
            Sign in to access your saved question sets
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none"
                placeholder="you@school.edu"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Need an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/host-registration")}
              className="font-semibold text-purple-600 hover:text-purple-800"
            >
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
