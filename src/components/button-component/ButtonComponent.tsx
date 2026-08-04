import React, { ReactNode } from "react";

interface ButtonComponentProps {
  fontSize?: "small" | "medium" | "large";
  onClick?: () => void;
  children: ReactNode;
  variant?: "primary" | "ghost" | "outline";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  id?: string;
}

const SIZE_MAP = {
  small:  "px-4 py-1.5 text-sm",
  medium: "px-6 py-2.5 text-sm",
  large:  "px-8 py-3 text-base",
};

const VARIANT_MAP = {
  primary: `
    bg-gradient-to-r from-brand-600 to-brand-500
    hover:from-brand-500 hover:to-brand-400
    text-white/80 shadow-lg shadow-brand-900/30
    hover:shadow-brand-600/40 hover:scale-[1.02]
    active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
  `,
  ghost: `
    bg-surface-muted hover:bg-glassHover text-[var(--text-primary)]
    border border-surface-border hover:border-brand-400/40
    hover:scale-[1.02] active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  outline: `
    bg-transparent border border-brand-500/60 text-brand-400
    hover:bg-brand-500/10 hover:border-brand-400
    hover:scale-[1.02] active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
};

export const ButtonComponent = ({
  fontSize = "medium",
  onClick,
  children,
  variant = "primary",
  disabled = false,
  type = "button",
  className = "",
  id,
}: ButtonComponentProps) => {
  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-semibold
        transition-all duration-200 ease-out
        ${SIZE_MAP[fontSize]}
        ${VARIANT_MAP[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
};
