import GetStartedCard from "./components/GetStartedCard";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-purple-100 px-4 pt-16">
      <h1 className="mb-2 text-5xl font-bold text-gray-800">
        Welcome to Type Learner
      </h1>
      <p className="mb-10 text-lg text-gray-500">
        Create, host, and join interactive quiz games
      </p>

      <GetStartedCard />

      <p className="mt-10 text-sm text-gray-400">
        Fun, interactive learning for everyone
      </p>
    </div>
  );
}
