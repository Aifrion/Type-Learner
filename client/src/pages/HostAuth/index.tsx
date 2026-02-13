import BackButton from "./components/BackButton";
import AuthCard from "./components/AuthCard";

export default function HostAuth() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-purple-100 px-4 pt-16">
      <div className="w-full max-w-md">
        <BackButton />
      </div>
      <AuthCard />
    </div>
  );
}
