interface FeatureItemProps {
  icon: string;
  label: string;
}

export default function FeatureItem({ icon, label }: FeatureItemProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-3xl">{icon}</span>
      <span className="max-w-28 text-xs text-gray-600">{label}</span>
    </div>
  );
}
