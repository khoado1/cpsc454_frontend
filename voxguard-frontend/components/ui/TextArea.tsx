import type { TextareaHTMLAttributes } from "react";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

const baseTextAreaClassName =
  "w-full rounded-lg border border-black/[.12] bg-white px-3 py-2 text-sm text-black dark:border-white/[.2] dark:bg-zinc-950 dark:text-white";

export function TextArea({ className = "", ...props }: TextAreaProps) {
  return <textarea {...props} className={`${baseTextAreaClassName} ${className}`.trim()} />;
}