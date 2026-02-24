interface ActionButtonProps {
  label: string;
  variant: "primary" | "secondary";
  onClick: () => void;
}

export default function ActionButton({
  label,
  variant,
  onClick,
}: ActionButtonProps) {
  const base =
    "flex w-full items-center justify-center gap-2 rounded-lg px-6 py-4 text-lg font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer";
  const variantClass =
    variant === "primary" ? "bg-purple-600" : "bg-purple-400";

  return (
    <button className={`${base} ${variantClass}`} onClick={onClick}>
      {label}
    </button>
  );
}
