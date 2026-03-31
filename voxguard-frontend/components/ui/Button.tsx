import type { ButtonHTMLAttributes } from "react";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "info" | "success";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
};

const baseButtonClassName =
  "flex items-center justify-center font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const variantClassNames: Record<ButtonVariant, string> = {
  primary: "bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc]",
  secondary:
    "border border-black/[.1] text-black hover:bg-black/[.04] dark:text-white dark:hover:bg-[#1a1a1a]",
  info: "bg-blue-600 text-white hover:bg-blue-700",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
};

const sizeClassNames: Record<ButtonSize, string> = {
  sm: "rounded-md px-2 py-1 text-xs",
  md: "rounded-lg px-4 py-2 text-sm",
  lg: "h-12 rounded-full px-5",
};

export function Button({
  className = "",
  variant = "primary",
  size = "lg",
  fullWidth = false,
  isLoading = false,
  loadingText,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const disabledState = disabled || isLoading;

  return (
    <button
      {...props}
      disabled={disabledState}
      className={`${baseButtonClassName} ${variantClassNames[variant]} ${sizeClassNames[size]} ${fullWidth ? "w-full" : ""} ${className}`.trim()}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
          {loadingText ?? children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}