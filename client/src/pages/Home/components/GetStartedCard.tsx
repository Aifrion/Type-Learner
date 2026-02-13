import { useNavigate } from "react-router-dom";
import ActionButton from "./ActionButton";
import Divider from "./Divider";
import FeatureList from "./FeatureList";

export default function GetStartedCard() {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-xl rounded-2xl border border-purple-200 bg-white px-8 py-10">
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
        Get Started
      </h2>

      <ActionButton
        label="Play / Join a Game"
        variant="primary"
        onClick={() => {}}
      />

      <Divider />

      <ActionButton
        label="Join as a Host"
        variant="secondary"
        onClick={() => navigate("/host-auth")}
      />

      <FeatureList />
    </div>
  );
}
