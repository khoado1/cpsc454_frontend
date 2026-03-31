import type { HTMLAttributes, ReactNode } from "react";

type FormFieldProps = HTMLAttributes<HTMLDivElement> & {
  label: string;
  htmlFor: string;
  children: ReactNode;
};

export function FormField({ label, htmlFor, children, className = "", ...props }: FormFieldProps) {
  return (
    <div {...props} className={`flex flex-col gap-2 ${className}`.trim()}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-black dark:text-zinc-50">
        {label}
      </label>
      {children}
    </div>
  );
}