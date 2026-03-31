import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const baseInputClassName =
  "w-full rounded-lg border border-black/[.1] bg-white px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/[.1] dark:bg-zinc-900 dark:text-white";

export function Input({ className = "", ...props }: InputProps) {
  return <input {...props} className={`${baseInputClassName} ${className}`.trim()} />;
}