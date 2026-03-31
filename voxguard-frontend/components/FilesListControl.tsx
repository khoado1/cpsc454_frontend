import type { BinaryFileRecord } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";

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
          <Button
            onClick={() => onSelect(file)}
            variant="info"
            size="sm"
            className="shrink-0"
          >
            {isSelected ? "▶ Playing" : "▶ Play"}
          </Button>
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
      <SectionHeader
        title="Files"
        description={currentUserId ? `Loaded for user: ${currentUserId}` : "Log in to load sender/recipient lists"}
        className="gap-1"
      />

      {isLoading && <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading files...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-1 gap-3">
        <Panel as="section" padding="sm">
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
        </Panel>

        <Panel as="section" padding="sm">
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
        </Panel>
      </div>
    </div>
  );
}
