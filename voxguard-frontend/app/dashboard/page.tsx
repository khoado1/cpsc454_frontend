"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageSection } from "@/components/ui/PageSection";
import { FilesListControl } from "@/components/FilesListControl";
import { listBinaryFiles, type BinaryFileRecord } from "@/lib/api";
import { useAuthCryptoContext } from "@/lib/auth-crypto-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useDashboardController } from "@/lib/useDashboardController";
import { sendRecordingToRecipient } from "@/lib/audio-processing";
import { Input } from "@/components/ui/Input";
import { RecorderControl } from "@/components/RecorderControl";

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken, userId, setAuthCryptoContext } = useAuthCryptoContext();
  const [sentFiles, setSentFiles] = useState<BinaryFileRecord[]>([]);
  const [receivedFiles, setReceivedFiles] = useState<BinaryFileRecord[]>([]);
  const [isFilesLoading, setIsFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState<string | null>(null);

  const dashboardController = useDashboardController(
    useMemo(() => ({
      sendRecordingToRecipient: async (userId, recording) => {
          if(!accessToken) throw new Error("Must be logged in to send recording.");
          
          await sendRecordingToRecipient(accessToken, userId, recording.data);
      },
    }), [accessToken])
  );

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

      setSentFiles(files.filter((file) => file.owner_user_id === userId));
      setReceivedFiles(files.filter((file) => file.recipient_user_id === userId));
    } catch (error) {
      console.error("Failed to list files:", error);
      setFilesError("Unable to load files for this user.");
      setSentFiles([]);
      setReceivedFiles([]);
    } finally {
      setIsFilesLoading(false);
    }
  }, [accessToken, userId]);

  useEffect(
    () => {
      if (dashboardController.sendStatus === "success") {
        handleLoadFiles();
        const timer = setTimeout(() => {
          dashboardController.sendReset();
        }, 3000);
        return () => clearTimeout(timer);
      }
    }, [dashboardController.sendStatus, handleLoadFiles]
  );

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

          <Button
            type="button"
            variant="info"
            size="md"
            className="mt-4"
            isLoading={isFilesLoading}
            loadingText="Loading files..."
            onClick={handleLoadFiles}
          >
            Load Messages
          </Button>

          <div className="mt-6">
            <FilesListControl
              currentUserId={userId}
              sentFiles={sentFiles}
              receivedFiles={receivedFiles}
              isLoading={isFilesLoading}
              error={filesError}
            />
          </div>
          </Card>
        </div>

        <div className="min-w-0 xl:col-span-5 xl:sticky xl:top-6 self-start">
          <Card className="w-full">
            <div className="flex flex-col gap-3 border-t border-black/[.08] pt-4 dark:border-white/[.08]">
            <p className="text-sm text-zinc-700 dark:text-zinc-400">Send a recording</p>
            <Input
              type="text"
              value={dashboardController.recipientUserId ?? ""}
              onChange={(event) => {
                const nextValue = event.target.value.trim();
                dashboardController.setRecipient(nextValue.length > 0 ? nextValue : null);
              }}
              placeholder="Recipient User ID">
            </Input>
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
