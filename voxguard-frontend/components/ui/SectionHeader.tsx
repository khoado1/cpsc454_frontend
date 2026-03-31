import type { HTMLAttributes } from "react";

type SectionHeaderLevel = "h1" | "h2" | "h3";
type SectionHeaderAlign = "left" | "center";

type SectionHeaderProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  level?: SectionHeaderLevel;
  align?: SectionHeaderAlign;
  titleClassName?: string;
  descriptionClassName?: string;
};

const titleClassNames: Record<SectionHeaderLevel, string> = {
  h1: "text-3xl font-semibold text-black dark:text-zinc-50",
  h2: "text-2xl font-semibold text-black dark:text-zinc-50",
  h3: "text-lg font-semibold text-black dark:text-zinc-100",
};

const descriptionClassNameBase = "text-zinc-600 dark:text-zinc-400";

export function SectionHeader({
  title,
  description,
  level = "h2",
  align = "left",
  className = "",
  titleClassName = "",
  descriptionClassName = "",
  ...props
}: SectionHeaderProps) {
  const TitleTag = level;

  return (
    <div
      {...props}
      className={[
        "flex flex-col gap-2",
        align === "center" ? "items-center text-center" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <TitleTag className={`${titleClassNames[level]} ${titleClassName}`.trim()}>{title}</TitleTag>
      {description && (
        <p className={`${descriptionClassNameBase} ${descriptionClassName}`.trim()}>{description}</p>
      )}
    </div>
  );
}