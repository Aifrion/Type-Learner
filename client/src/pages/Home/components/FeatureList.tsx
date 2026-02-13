import FeatureItem from "./FeatureItem";

export default function FeatureList() {
  return (
    <div className="mt-8 flex justify-around text-center">
      <FeatureItem icon="🎮" label="Join with a game code" />
      <FeatureItem icon="🎯" label="Answer questions" />
      <FeatureItem icon="🏆" label="Compete for top score" />
    </div>
  );
}
