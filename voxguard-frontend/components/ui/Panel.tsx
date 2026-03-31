import type { ElementType, HTMLAttributes } from "react";

type PanelPadding = "sm" | "md";
type PanelElement = "div" | "section";

type PanelProps = HTMLAttributes<HTMLElement> & {
  as?: PanelElement;
  padding?: PanelPadding;
};

const basePanelClassName = "rounded-xl border border-black/[.08] dark:border-white/[.12]";

const paddingClassNames: Record<PanelPadding, string> = {
  sm: "p-3",
  md: "p-4",
};

export function Panel({ as = "div", className = "", padding = "md", ...props }: PanelProps) {
  const Component = as as ElementType;

  return (
    <Component
      {...props}
      className={`${basePanelClassName} ${paddingClassNames[padding]} ${className}`.trim()}
    />
  );
}