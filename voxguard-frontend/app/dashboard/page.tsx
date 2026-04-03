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

  // On mount, check if user is logged in
  useEffect(() => {
    if (!accessToken) {
      router.push("/login");
    }
  }, [accessToken, router]);

  const handleLoadFiles = async () => {
    if (!accessToken || isFilesLoading) {
      return;
    }

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

      setSentFiles(files.filter((file) => file.user_id === userId));
      setReceivedFiles(files.filter((file) => file.recipient_user_id === userId));
    } catch (error) {
      console.error("Failed to list files:", error);
      setFilesError("Unable to load files for this user.");
      setSentFiles([]);
      setReceivedFiles([]);
    } finally {
      setIsFilesLoading(false);
    }
  };

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

      <PageSection as="main" grow centered background={false} padding="lg">
        <Card className="w-full max-w-md">
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
            Load Files
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
      </PageSection>
    </PageSection>
  );
}
