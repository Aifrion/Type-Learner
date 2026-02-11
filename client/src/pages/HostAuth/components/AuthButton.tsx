interface AuthButtonProps {
  label: string;
  variant: "primary" | "secondary";
  onClick: () => void;
}

export default function AuthButton({
  label,
  variant,
  onClick,
}: AuthButtonProps) {
  const base =
    "w-full rounded-lg px-6 py-3 text-lg font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer";
  const variantClass =
    variant === "primary" ? "bg-purple-500" : "bg-gray-800";

  return (
    <button className={`${base} ${variantClass}`} onClick={onClick}>
      {label}
    </button>
  );
}
