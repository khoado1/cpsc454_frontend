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
    <tr className={`border-b border-black[.08] dark:border-white[.12] transition-colors ${
      isSelected 
        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      }`
    }
    >
      <td className="px-4 py-3 text-sm font-medium text-black dark:text-zinc-100 truncate">
        {file.upload_id ?? "(no id)"}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-black dark:text-zinc-100 truncate">
        {file.owner_user_id ?? "(unknown)"}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-black dark:text-zinc-100 truncate">
        {file.recipient_user_id ?? "(unkown)"}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-black dark:text-zinc-100 text-center">
        {file.is_read ?"yes" : "no"}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-black dark:text-zinc-400">
        {file.created_at ?? "(unkown)"}
      </td>
      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 text-right">
        {Math.round(file.data_length/1024) ?? "(unknown)"} KB
      </td>
      <td className="px-4 py-3 text-right">
          {onSelect && (
          <Button
            onClick={() => onSelect(file)}
            variant="info"
            size="sm"
          >
            {isSelected ? "▶ Playing" : "▶ Play"}
          </Button>
        )}
      </td>
    </tr>
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
          <h3 className="mb-4 text-sm font-semibold text-black dark:text-zinc-100">Sent (user_id)</h3>
          {sentFiles.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No sent files</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black[.12] dark:border-white[.12] bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-100">Upload ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-100">Owner User ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-100">Recipient User ID</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-black dark:text-zinc-100">Read</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-100">Created At</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-black dark:text-zinc-100">Data Length</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-black dark:text-zinc-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sentFiles.map((file) => (
                    <FileRow
                      key={`sent-${file.upload_id}-${file.owner_user_id}-${file.recipient_user_id}`}
                      file={file}
                      isSelected={selectedFileId === file.upload_id}
                      onSelect={onFileSelect}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel as="section" padding="sm">
          <h3 className="mb-2 text-sm font-semibold text-black dark:text-zinc-100">Received (recipient_user_id)</h3>
          {receivedFiles.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No received files</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black[.12] dark:border-white[.12] bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-100">Upload ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-100">Owner User ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-100">Recipient User ID</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-black dark:text-zinc-100">Read</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-100">Created At</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-black dark:text-zinc-100">Data Length</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-black dark:text-zinc-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receivedFiles.map((file) => (
                    <FileRow
                      key={`received-${file.upload_id}-${file.owner_user_id}-${file.recipient_user_id}`}
                      file={file}
                      isSelected={selectedFileId === file.upload_id}
                      onSelect={onFileSelect}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
