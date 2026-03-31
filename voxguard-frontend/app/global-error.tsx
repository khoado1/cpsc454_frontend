"use client";

import { captureGlobalRenderError } from "@/lib/telemetry";
import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    captureGlobalRenderError(error, {
      source: "global-error-boundary",
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 dark:bg-black">
        <div className="w-full max-w-md rounded-2xl border border-black/[.08] bg-white p-6 text-center dark:border-white/[.12] dark:bg-zinc-900">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Something went wrong</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            The error has been captured. You can retry the action.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-900 dark:bg-zinc-200 dark:text-black dark:hover:bg-zinc-100"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
