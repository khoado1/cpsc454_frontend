"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageSection } from "@/components/ui/PageSection";
import { FilesListControl } from "@/components/FilesListControl";
import { getUsers, listBinaryFiles, markBinaryFileRead, type MessageInfo, type UserInfo } from "@/lib/api";
import { useAuthCryptoContext } from "@/lib/auth-crypto-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useDashboardController } from "@/lib/useDashboardController";
import { downloadAndDecryptRecording, sendRecordingToRecipient } from "@/lib/audio-processing";
import { RecorderControl } from "@/components/RecorderControl";
import { PlayerControl } from "@/components/PlayerControl";

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken, userId, privateKey, setAuthCryptoContext } = useAuthCryptoContext();
  const [sentFiles, setSentFiles] = useState<MessageInfo[]>([]);
  const [receivedFiles, setReceivedFiles] = useState<MessageInfo[]>([]);
  const [isFilesLoading, setIsFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<MessageInfo | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);
  const markedReadFileIdsRef = useRef<Set<string>>(new Set());

  const dashboardController = useDashboardController(
    useMemo(() => ({
      sendRecordingToRecipient: async (userId, recording) => {
          if(!accessToken) throw new Error("Must be logged in to send recording.");
          
          await sendRecordingToRecipient(accessToken, userId, recording.data, recording.mimeType);
      },
    }), [accessToken])
  );
  const sendResetRef = useRef(dashboardController.sendReset);

  useEffect(() => {
    sendResetRef.current = dashboardController.sendReset;
  }, [dashboardController.sendReset]);

  const handleLoadFiles = useCallback(async () => {
    if (!accessToken) return;

    setFilesError(null);
    setIsFilesLoading(true);

    try {
      const files = await listBinaryFiles(accessToken, { timeoutMs: 15000 });

      if (!userId) {
        setFilesError("User id not found in auth context.");
        setSentFiles([]);
        setReceivedFiles([]);
        return;
      }

      setSentFiles(files.filter((file) => file.sender_user_id === userId));
      setReceivedFiles(files.filter((file) => file.receiver_user_id === userId));
      markedReadFileIdsRef.current = new Set(
        files.filter((file) => file.is_read).map((file) => file.file_id)
      );
    } catch (error) {
      console.error("Failed to list files:", error);
      setFilesError("Unable to load files for this user.");
      setSentFiles([]);
      setReceivedFiles([]);
    } finally {
      setIsFilesLoading(false);
    }
  }, [accessToken, userId]);

  const handleLoadUsers = useCallback(async () => {
    if (!accessToken) return;

    setUsersError(null);
    setIsUsersLoading(true);

    try {
      const loadedUsers = await getUsers(accessToken, { timeoutMs: 15000 });
      const recipientUsers = loadedUsers.filter(
        (user) => user.user_id !== userId && Boolean(user.public_key_base64)
      );

      setUsers(recipientUsers);
    } catch (error) {
      console.error("Failed to load users:", error);
      setUsersError("Unable to load users.");
      setUsers([]);
    } finally {
      setIsUsersLoading(false);
    }
  }, [accessToken, userId]);

  const clearAudioUrl = useCallback(() => {
    if (audioBlobUrlRef.current) {
      URL.revokeObjectURL(audioBlobUrlRef.current);
      audioBlobUrlRef.current = null;
    }
    setAudioUrl(null);
  }, []);

  const handleFileSelect = useCallback(async (file: MessageInfo) => {
    if (!accessToken || !privateKey) {
      setAudioError("Missing authentication or decryption key.");
      return;
    }
    clearAudioUrl();
    setSelectedFile(file);
    setAudioError(null);

    if (file.receiver_user_id !== userId) {
      setAudioError("Only received messages can be played with the current message key");
      return;
    }

    setIsAudioLoading(true);
    try {
      const recording = await downloadAndDecryptRecording(file.file_id, privateKey, accessToken);
      const blob = new Blob([recording.data], {type: recording.mimeType});
      const url = URL.createObjectURL(blob);
      audioBlobUrlRef.current = url;
      setAudioUrl(url);

    } catch (error) {
      console.error("Failed to load audio file:", error);
      setAudioError(error instanceof Error ? error.message : "Unable to play the selected message.");
      setIsAudioLoading(false);
      setSelectedFile(null);
    } finally {
      setIsAudioLoading(false);
    }

  }, [accessToken, clearAudioUrl, privateKey, userId]);

  const markSelectedFileRead = useCallback(async () => {
    if (!accessToken || !selectedFile || selectedFile.receiver_user_id !== userId) {
      return;
    }

    if (selectedFile.is_read || markedReadFileIdsRef.current.has(selectedFile.file_id)) {
      return;
    }

    markedReadFileIdsRef.current.add(selectedFile.file_id);

    const markFileReadLocally = (file: MessageInfo) =>
      file.file_id === selectedFile.file_id ? { ...file, is_read: 1 } : file;

    setSelectedFile((current) =>
      current?.file_id === selectedFile.file_id ? { ...current, is_read: 1 } : current
    );
    setReceivedFiles((files) => files.map(markFileReadLocally));

    try {
      await markBinaryFileRead(selectedFile.file_id, true, accessToken);
    } catch (error) {
      console.error("Failed to mark message as read:", error);
      markedReadFileIdsRef.current.delete(selectedFile.file_id);
      setSelectedFile((current) =>
        current?.file_id === selectedFile.file_id ? { ...current, is_read: selectedFile.is_read } : current
      );
      setReceivedFiles((files) =>
        files.map((file) =>
          file.file_id === selectedFile.file_id ? { ...file, is_read: selectedFile.is_read } : file
        )
      );
      setFilesError("Unable to mark the selected message as read.");
    }
  }, [accessToken, selectedFile, userId]);

  useEffect(() => clearAudioUrl, [clearAudioUrl]);

  useEffect(
    () => {
      if (dashboardController.sendStatus === "success") {
        handleLoadFiles();
        const timer = setTimeout(() => {
          sendResetRef.current();
        }, 3000);
        return () => clearTimeout(timer);
      }
    }, [dashboardController.sendStatus, handleLoadFiles]
  );

  useEffect(() => {
    if (accessToken) {
      handleLoadUsers();
    }
  }, [accessToken, handleLoadUsers]);

  useEffect(() => {
    if (accessToken && userId) {
      handleLoadFiles();
    }
  }, [accessToken, handleLoadFiles, userId]);

  // On mount, check if user is logged in
  useEffect(() => {
    if (!accessToken) {
      router.push("/login");
    }
  }, [accessToken, router]);

  const handleLogout = () => {
    setAuthCryptoContext({ accessToken: null, userId: null, privateKey: null, userKeyMaterial: null });
    router.push("/login");
  };

  if (!accessToken) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-500">Checking authentication...</p>
      </div>
    );
  }

  return (
    <PageSection grow>
      <header className="flex items-center justify-between px-8 py-4 bg-white dark:bg-zinc-900 border-b border-black/[.08] dark:border-white/[.08]">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Dashboard</h1>
        <Button
          onClick={handleLogout}
          variant="secondary"
          size="md"
        >
          Logout
        </Button>
      </header>

      <PageSection
        as="main"
        grow
        background={false}
        className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12"
      >
        <div className="min-w-0 xl:col-span-7">
          <Card className="w-full">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">You are logged in.</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600 break-all">
            Token: {accessToken.slice(0, 40)}...
          </p>

          <div className="mt-6">
            <FilesListControl
              currentUserId={userId}
              sentFiles={sentFiles}
              receivedFiles={receivedFiles}
              isLoading={isFilesLoading}
              error={filesError}
              selectedFileId={selectedFile?.file_id ?? null}
              onFileSelect={handleFileSelect}
            />
            <Button
              type="button"
              variant="info"
              size="md"
              className="mt-4"
              isLoading={isFilesLoading}
              loadingText="Loading messages..."
              onClick={handleLoadFiles}
            >
              Refresh Messages
            </Button>
            <div className="mt-4">
              <PlayerControl 
                audioUrl={audioUrl} 
                fileName={selectedFile?.file_id??null}
                isLoading={isAudioLoading}
                error={audioError}
                onPlay={markSelectedFileRead}
              />
            </div>
          </div>
          </Card>
        </div>

        <div className="min-w-0 xl:col-span-5 xl:sticky xl:top-6 self-start">
          <Card className="w-full">
            <div className="flex flex-col gap-3 border-t border-black/[.08] pt-4 dark:border-white/[.08]">
            <p className="text-sm text-zinc-700 dark:text-zinc-400">Send a recording</p>
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                htmlFor="recipient-user"
              >
                Recipient
              </label>
              <div className="flex gap-2">
                <select
                  id="recipient-user"
                  className="w-full rounded-lg border border-black/[.1] bg-white px-4 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/[.1] dark:bg-zinc-900 dark:text-white"
                  value={dashboardController.recipientUserId ?? ""}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    dashboardController.setRecipient(nextValue.length > 0 ? nextValue : null);
                  }}
                  disabled={isUsersLoading || users.length === 0}
                >
                  <option value="">
                    {isUsersLoading ? "Loading users..." : "Select a user"}
                  </option>
                  {users.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.username} ({user.user_id})
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  isLoading={isUsersLoading}
                  loadingText="Loading"
                  onClick={handleLoadUsers}
                >
                  Refresh
                </Button>
              </div>
              {usersError && (
                <p className="text-sm text-red-500">{usersError}</p>
              )}
              {!isUsersLoading && !usersError && users.length === 0 && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  No other users with encryption keys are available yet.
                </p>
              )}
            </div>
            <RecorderControl onRecordingReady={dashboardController.onRecordingReady} />

            {dashboardController.pendingRecording && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Recording Ready {Math.round(dashboardController.pendingRecording.data.byteLength/1024)} KB</p>
            )}
            <Button
              type="button"
              variant="success"
              size="md"
              onClick={() => dashboardController.sendRecording()}
              isLoading={dashboardController.sendStatus === "sending"}
              loadingText="Sending..."
              >
              Send Recording
            </Button>
            {dashboardController.sendStatus === "success" && (
              <p className="text-sm text-green-600 dark:text-green-400">Recording sent successfully!</p>
            )}
            {dashboardController.sendError && (
              <p className="text-sm text-red-500">Failed to send recording: {dashboardController.sendError}</p>
            )}
            </div>
          </Card>
        </div>
      </PageSection>
    </PageSection>
  );
}
