"use client";

type PlayerControlProps = {
  audioUrl: string | null;
  fileName: string | null;
  isLoading: boolean;
  error: string | null;
};

export function PlayerControl({ audioUrl, fileName, isLoading, error }: PlayerControlProps) {
  if (!audioUrl && !isLoading && !error) return null;

  return (
    <div className="flex w-full flex-col gap-2 rounded-xl border border-black/[.08] dark:border-white/[.12] p-4">
      <p className="text-sm font-semibold text-black dark:text-zinc-100">
        {isLoading ? "Loading audio..." : `Now Playing: ${fileName ?? "Unknown file"}`}
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {audioUrl && (
        // key forces the element to remount when the src changes so autoplay works correctly
        <audio key={audioUrl} controls autoPlay src={audioUrl} className="w-full" />
      )}
    </div>
  );
}
