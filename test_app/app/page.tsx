"use client";

import { FilesListControl } from "@/components/FilesListControl";
import { LoginControl } from "@/components/LoginControl";
import { PlayerControl } from "@/components/PlayerControl";
import { RegisterControl } from "@/components/RegisterControl";
import { RecorderControl } from "@/components/RecorderControl";
import { downloadBinaryFile, listBinaryFiles, login, registerAndSetupKeys, type BinaryFileRecord } from "@/lib/api";
import { useState, useRef } from "react";
import { useRecorder } from "@/lib/useRecorder";

function getSubFromJwt(token: string): string | null {
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) {
      return null;
    }

    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export default function Home() {
  const { recording, startRecording, stopRecording } = useRecorder();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sentFiles, setSentFiles] = useState<BinaryFileRecord[]>([]);
  const [receivedFiles, setReceivedFiles] = useState<BinaryFileRecord[]>([]);
  const [isFilesLoading, setIsFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<BinaryFileRecord | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);

  const loadFilesForUser = async (accessToken: string, userId: string) => {
    setIsFilesLoading(true);
    setFilesError(null);

    try {
      const files = await listBinaryFiles(accessToken);
      setSentFiles(files.filter((file) => file.user_id === userId));
      setReceivedFiles(files.filter((file) => file.recipient_user_id === userId));
    } catch (err) {
      console.error("Failed to load files:", err);
      setFilesError("Unable to load files for this user.");
      setSentFiles([]);
      setReceivedFiles([]);
    } finally {
      setIsFilesLoading(false);
    }
  };

  const handleFileSelect = async (file: BinaryFileRecord) => {
    if (!accessToken) return;

    // Revoke previous blob URL to free memory
    if (audioBlobUrlRef.current) {
      URL.revokeObjectURL(audioBlobUrlRef.current);
      audioBlobUrlRef.current = null;
    }

    setSelectedFile(file);
    setAudioUrl(null);
    setAudioError(null);
    setIsAudioLoading(true);

    try {
      const blob = await downloadBinaryFile(file.id, accessToken);
      const url = URL.createObjectURL(blob);
      audioBlobUrlRef.current = url;
      setAudioUrl(url);
    } catch (err) {
      console.error("Failed to download file:", err);
      setAudioError("Unable to download the selected file.");
      setSelectedFile(null);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      const token = await registerAndSetupKeys(username, password);
      console.log("Registration and key setup successful, token:", token);
      setAccessToken(token);

      const userId = getSubFromJwt(token);
      if (userId) {
        setCurrentUserId(userId);
        await loadFilesForUser(token, userId);
      }
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      const token = await login(username, password);
      console.log("Login successful, token:", token);
      setAccessToken(token);

      const userId = getSubFromJwt(token);
      if (!userId) {
        setFilesError("Login succeeded but user id (sub) was not found in JWT.");
        return;
      }

      setCurrentUserId(userId);
      await loadFilesForUser(token, userId);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-md flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-8 w-full">
          <RegisterControl onSubmit={handleRegister} />
          <div className="w-full border-t border-black/[.08] dark:border-white/[.1]" />
          <LoginControl onSubmit={handleLogin} />
          <RecorderControl
            recording={recording}
            onStart={startRecording}
            onStop={stopRecording}
          />
          <FilesListControl
            currentUserId={currentUserId}
            sentFiles={sentFiles}
            receivedFiles={receivedFiles}
            isLoading={isFilesLoading}
            error={filesError}
            selectedFileId={selectedFile?.id ?? null}
            onFileSelect={handleFileSelect}
          />
          <PlayerControl
            audioUrl={audioUrl}
            fileName={selectedFile?.id ?? null}
            isLoading={isAudioLoading}
            error={audioError}
          />
        </div>
      </main>
    </div>
  );
}
