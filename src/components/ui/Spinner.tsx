import * as React from "react";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  size?: SpinnerSize;
  color?: string;
  className?: string;
  label?: string;
}

const sizeMap: Record<SpinnerSize, number> = {
  sm: 16,
  md: 20,
  lg: 32,
};

function Spinner({
  size = "md",
  color = "currentColor",
  className = "",
  label = "Loading…",
}: SpinnerProps) {
  const px = sizeMap[size];

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`animate-spin ${className}`}
      role="status"
      aria-label={label}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-20"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-80"
      />
    </svg>
  );
}

export { Spinner };
export type { SpinnerProps, SpinnerSize };
