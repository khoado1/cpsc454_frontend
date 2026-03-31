import type { ElementType, HTMLAttributes } from "react";

type PageSectionElement = "div" | "main" | "section";
type PageSectionPadding = "none" | "md" | "lg" | "xl";

type PageSectionProps = HTMLAttributes<HTMLElement> & {
  as?: PageSectionElement;
  grow?: boolean;
  centered?: boolean;
  background?: boolean;
  padding?: PageSectionPadding;
};

const paddingClassNames: Record<PageSectionPadding, string> = {
  none: "",
  md: "p-4",
  lg: "p-8",
  xl: "px-16 py-32",
};

export function PageSection({
  as = "div",
  className = "",
  grow = false,
  centered = false,
  background = true,
  padding = "none",
  ...props
}: PageSectionProps) {
  const Component = as as ElementType;

  return (
    <Component
      {...props}
      className={[
        "flex flex-col",
        grow ? "flex-1" : "",
        centered ? "items-center justify-center" : "",
        background ? "bg-zinc-50 dark:bg-black" : "",
        paddingClassNames[padding],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}