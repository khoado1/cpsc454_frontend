"use client";

import { Panel } from "@/components/ui/Panel";

type PlayerControlProps = {
  audioUrl: string | null;
  fileName: string | null;
  isLoading: boolean;
  error: string | null;
  onPlay?: () => void;
};

export function PlayerControl({ audioUrl, fileName, isLoading, error, onPlay }: PlayerControlProps) {
  if (!audioUrl && !isLoading && !error) return null;

  return (
    <Panel className="flex w-full flex-col gap-2">
      <p className="text-sm font-semibold text-black dark:text-zinc-100">
        {isLoading ? "Loading audio..." : `Now Playing: ${fileName ?? "Unknown file"}`}
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {audioUrl && (
        // key forces the element to remount when the src changes so autoplay works correctly
        <audio key={audioUrl} controls autoPlay src={audioUrl} className="w-full" onPlay={onPlay} />
      )}
    </Panel>
  );
}
