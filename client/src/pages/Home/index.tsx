import GetStartedCard from "./components/GetStartedCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-purple-50 px-4 py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 text-center">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-500">
            Type Learner
          </p>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Build speed and confidence with every session
          </h1>
          <p className="mx-auto max-w-xl text-sm text-gray-500">
            Host question sets, practice typing, and keep the class moving with
            live pacing tools.
          </p>
        </div>
        <GetStartedCard />
      </div>
    </div>
  );
}
