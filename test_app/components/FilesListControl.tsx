import type { BinaryFileRecord } from "@/lib/api";

type FilesListControlProps = {
  currentUserId: string | null;
  sentFiles: BinaryFileRecord[];
  receivedFiles: BinaryFileRecord[];
  isLoading: boolean;
  error: string | null;
  selectedFileId?: string | null;
  onFileSelect?: (file: BinaryFileRecord) => void;
};

function FileRow({
  file,
  isSelected,
  onSelect,
}: {
  file: BinaryFileRecord;
  isSelected: boolean;
  onSelect?: (file: BinaryFileRecord) => void;
}) {
  return (
    <li
      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
          : "border-black/[.08] dark:border-white/[.12]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-black dark:text-zinc-100 truncate">{file.id ?? "(no id)"}</p>
          <p className="text-zinc-600 dark:text-zinc-400">sender: {file.user_id ?? "unknown"}</p>
          <p className="text-zinc-600 dark:text-zinc-400">recipient: {file.recipient_user_id ?? "unknown"}</p>
        </div>
        {onSelect && (
          <button
            onClick={() => onSelect(file)}
            className="shrink-0 rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            {isSelected ? "▶ Playing" : "▶ Play"}
          </button>
        )}
      </div>
    </li>
  );
}

export function FilesListControl({
  currentUserId,
  sentFiles,
  receivedFiles,
  isLoading,
  error,
  selectedFileId,
  onFileSelect,
}: FilesListControlProps) {
  return (
    <div className="flex w-full flex-col gap-3 pt-4 border-t border-black/[.08] dark:border-white/[.1]">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">Files</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          {currentUserId ? `Loaded for user: ${currentUserId}` : "Log in to load sender/recipient lists"}
        </p>
      </div>

      {isLoading && <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading files...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-1 gap-3">
        <section className="rounded-xl border border-black/[.08] dark:border-white/[.12] p-3">
          <h3 className="mb-2 text-sm font-semibold text-black dark:text-zinc-100">Sent (user_id)</h3>
          {sentFiles.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No sent files</p>
          ) : (
            <ul className="space-y-2">
              {sentFiles.map((file) => (
                <FileRow
                  key={`sent-${file.id}-${file.user_id}-${file.recipient_user_id}`}
                  file={file}
                  isSelected={selectedFileId === file.id}
                  onSelect={onFileSelect}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-black/[.08] dark:border-white/[.12] p-3">
          <h3 className="mb-2 text-sm font-semibold text-black dark:text-zinc-100">Received (recipient_user_id)</h3>
          {receivedFiles.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No received files</p>
          ) : (
            <ul className="space-y-2">
              {receivedFiles.map((file) => (
                <FileRow
                  key={`recv-${file.id}-${file.user_id}-${file.recipient_user_id}`}
                  file={file}
                  isSelected={selectedFileId === file.id}
                  onSelect={onFileSelect}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
