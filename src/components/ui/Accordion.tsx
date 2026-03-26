import type { ButtonHTMLAttributes } from "react";

interface ToggleProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  expanded: boolean;
}

export const Toggle = ({ expanded, className = "", ...props }: ToggleProps) => {
  return (
    <button
      className={`text=gray-400 hover:text-white focus:outline-none w-6 ${className}`}
      aria-label={expanded ? "Collapse" : "Expand"}
      {...props}
    >
      {expanded ? "▼" : "▶"}
    </button>
  );
};
