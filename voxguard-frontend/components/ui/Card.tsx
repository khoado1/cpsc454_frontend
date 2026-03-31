import type { ElementType, HTMLAttributes } from "react";

type CardVariant = "default" | "bordered";
type CardPadding = "md" | "lg" | "xl";
type CardElement = "div" | "section" | "main";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: CardElement;
  variant?: CardVariant;
  padding?: CardPadding;
};

const baseCardClassName = "rounded-2xl bg-white dark:bg-zinc-900";

const variantClassNames: Record<CardVariant, string> = {
  default: "shadow-sm",
  bordered: "border border-black/[.08] dark:border-white/[.12]",
};

const paddingClassNames: Record<CardPadding, string> = {
  md: "p-6",
  lg: "p-8",
  xl: "p-12",
};

export function Card({
  as = "div",
  className = "",
  variant = "default",
  padding = "lg",
  ...props
}: CardProps) {
  const Component = as as ElementType;

  return (
    <Component
      {...props}
      className={`${baseCardClassName} ${variantClassNames[variant]} ${paddingClassNames[padding]} ${className}`.trim()}
    />
  );
}