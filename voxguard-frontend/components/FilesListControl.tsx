import type { MessageInfo } from "@/lib/api";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useState } from "react";

type FilesListControlProps = {
  currentUserId: string | null;
  sentFiles: MessageInfo[];
  receivedFiles: MessageInfo[];
  isLoading: boolean;
  error: string | null;
  selectedFileId?: string | null;
  onFileSelect?: (file: MessageInfo) => void;
};

function FileRow({
  file,
  isSelected,
  onSelect,
}: {
  file: MessageInfo;
  isSelected: boolean;
  onSelect?: (file: MessageInfo) => void;
}) {
  return (
    <tr className={`border-b border-black/[.08] dark:border-white/[.12] transition-colors ${
      isSelected 
        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      }`
    }
    onClick={() => onSelect?.(file)}
    role={onSelect ? "button" : undefined}
    tabIndex={onSelect ? 0 : undefined}
    onKeyDown={(event) => {
      if (!onSelect) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect(file);
      }
    }}
    >
      <td className="px-4 py-3 text-sm font-medium text-black dark:text-zinc-100 truncate">
        {file.file_id ?? "(no id)"}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-black dark:text-zinc-100 truncate">
        {file.sender_user_id ?? "(unknown)"}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-black dark:text-zinc-100 truncate">
        {file.receiver_user_id ?? "(unkown)"}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-black dark:text-zinc-100 text-center">
        {file.is_read ? "yes" : "no"}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-black dark:text-zinc-400">
        {file.created_at ?? "(unkown)"}
      </td>
      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 text-right">
        {file.data_length === null ? "(unknown)" : `${Math.round(file.data_length / 1024)} KB`}
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

  const [activeListType, setActiveListType] = useState<"sent" | "received">("received");
  const isDisplayingReceived = activeListType === "received";
  const visibleFiles = isDisplayingReceived ? receivedFiles : sentFiles;

  return (
    <div className="flex w-full flex-col gap-3 pt-4 border-t border-black/[.08] dark:border-white/[.1]">
      <SectionHeader
        title="Messages"
        description={currentUserId ? `Loaded for user: ${currentUserId}` : "Log in to load sender/recipient lists"}
        className="gap-1"
      />
      <div className="inline-flex w-fit rounded-lg border border-black/[.08] bg-zinc-50 p-1 dark:border-white/[.12] dark:bg-zinc-800/50">
        <button
          type="button"
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            isDisplayingReceived
              ? "bg-white text-black showdow-sm dark:bg-zinc-900 dark:text-zinc-100"
              : "text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
          onClick={() => setActiveListType("received")}
          >
            Received ({receivedFiles.length})
          </button>
          <button
          type="button"
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            !isDisplayingReceived
              ? "bg-white text-black showdow-sm dark:bg-zinc-900 dark:text-zinc-100"
              : "text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
          onClick={() => setActiveListType("sent")}
          >
            Sent ({sentFiles.length})
          </button>
      </div>
      {isLoading && <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading messages...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-1 gap-3">
        <Panel as="section" padding="sm">
          <h3 className="mb-2 text-sm font-semibold text-black dark:text-zinc-100">
            {isDisplayingReceived ? "Received (recipient_user_id)" : "Sent (owner_user_id)"}
          </h3>
          {
            visibleFiles.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {isDisplayingReceived ? "No received messages" : "No sent messages"}  
              </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/[.12] dark:border-white/[.12] bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-100">Upload ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-100">Owner User ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-100">Recipient User ID</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-black dark:text-zinc-100">Read</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-100">Created At</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-black dark:text-zinc-100">Data Length</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleFiles.map((file) => (
                    <FileRow
                      key={`${activeListType}-${file.file_id}-${file.sender_user_id}-${file.receiver_user_id}`}
                      file={file}
                      isSelected={selectedFileId === file.file_id}
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
