import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import BackButton from "@/pages/HostAuth/components/BackButton";

export default function HostRegister() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
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
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      if (name) {
        await updateProfile(credential.user, { displayName: name });
      }
      await setDoc(doc(db, "teacherInformation", credential.user.uid), {
        uid: credential.user.uid,
        email: credential.user.email,
        name: name || null,
        school: school || null,
        questionSetIds: [],
        createdAt: serverTimestamp(),
      });
      navigate("/host/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register.");
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
            Teacher Registration
          </h1>
          <p className="mb-8 text-center text-sm text-gray-400">
            Create your account to save question sets
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Name (optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none"
                placeholder="Mrs. Johnson"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                School (optional)
              </label>
              <input
                type="text"
                value={school}
                onChange={(event) => setSchool(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none"
                placeholder="Lincoln Middle School"
                autoComplete="organization"
              />
            </div>

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
                placeholder="Create a password"
                autoComplete="new-password"
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
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/host-login")}
              className="font-semibold text-purple-600 hover:text-purple-800"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
