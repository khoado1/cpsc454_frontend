type RecorderControlProps = {
  recording: boolean;
  onStart: () => Promise<void> | void;
  onStop: () => void;
};

export function RecorderControl({ recording, onStart, onStop }: RecorderControlProps) {
  return (
    <div className="flex flex-col items-center gap-3 w-full pt-4 border-t border-black/[.08] dark:border-white/[.1]">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Voice Input</p>
      <button
        type="button"
        onClick={recording ? onStop : onStart}
        className={`flex h-12 w-full items-center justify-center rounded-full px-5 font-medium transition-colors ${
          recording
            ? "bg-red-500 text-white hover:bg-red-600"
            : "border border-black/[.1] dark:border-white/[.1] hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] text-black dark:text-white"
        }`}
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </button>
      {recording && <p className="text-sm text-red-500 animate-pulse">Recording...</p>}
    </div>
  );
}
