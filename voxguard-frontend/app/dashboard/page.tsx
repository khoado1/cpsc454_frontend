"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageSection } from "@/components/ui/PageSection";
import { FilesListControl } from "@/components/FilesListControl";
import { listBinaryFiles, type BinaryFileRecord } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

export default function DashboardPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sentFiles, setSentFiles] = useState<BinaryFileRecord[]>([]);
  const [receivedFiles, setReceivedFiles] = useState<BinaryFileRecord[]>([]);
  const [isFilesLoading, setIsFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState<string | null>(null);

  // On mount, check if user is logged in
  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      // Not logged in - redirect back to login
      router.push("/login");
      return;
    }

    setAccessToken(token);
    setCurrentUserId(getSubFromJwt(token));
  }, [router]);

  const handleLoadFiles = async () => {
    if (!accessToken || isFilesLoading) {
      return;
    }

    setFilesError(null);
    setIsFilesLoading(true);

    try {
      const files = await listBinaryFiles(accessToken, { timeoutMs: 15000 });

      if (!currentUserId) {
        setFilesError("User id (sub) not found in JWT.");
        setSentFiles([]);
        setReceivedFiles([]);
        return;
      }

      setSentFiles(files.filter((file) => file.user_id === currentUserId));
      setReceivedFiles(files.filter((file) => file.recipient_user_id === currentUserId));
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
    sessionStorage.removeItem("accessToken");
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
              currentUserId={currentUserId}
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
