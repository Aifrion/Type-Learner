import { useNavigate } from "react-router-dom";
import AuthButton from "./AuthButton";

export default function AuthCard() {
  const navigate = useNavigate();
  return (
    <div className="w-full max-w-md rounded-2xl bg-white px-10 py-12 shadow-sm">
      <h1 className="text-center text-3xl font-bold text-gray-800">
        Type Learner
      </h1>
      <p className="mb-8 text-center text-sm text-gray-400">Host Dashboard</p>

      <div className="flex flex-col gap-4">
        <AuthButton
          label="Sign In"
          variant="primary"
          onClick={() => {
            navigate("/host-login");
          }}
        />
        <AuthButton
          label="Register"
          variant="secondary"
          onClick={() => {
            navigate("/host-registration");
          }}
        />
      </div>
    </div>
  );
}
