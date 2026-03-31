"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageSection } from "@/components/ui/PageSection";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TextArea } from "@/components/ui/TextArea";
import {
  clearApiRequestHistory,
  getApiRequestHistory,
  getLastApiRequestMeta,
  isApiRequestError,
  listBinaryFiles,
  login,
  type ApiRequestHistoryItem,
  type ApiRequestMeta,
} from "@/lib/api";
import { useRef, useState } from "react";

type ApiStatus = "idle" | "success" | "error";

type ApiCallState = {
  operation: string | null;
  status: ApiStatus;
  isLoading: boolean;
  durationMs: number | null;
  error: string | null;
  errorKind: string | null;
  meta: ApiRequestMeta | null;
  result: unknown | null;
};

type HistoryFilter = "all" | "errors" | "slow";

export default function ApiDebugPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [requestHistory, setRequestHistory] = useState<ApiRequestHistoryItem[]>([]);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");

  const [callState, setCallState] = useState<ApiCallState>({
    operation: null,
    status: "idle",
    isLoading: false,
    durationMs: null,
    error: null,
    errorKind: null,
    meta: null,
    result: null,
  });
  const activeControllerRef = useRef<AbortController | null>(null);

  const runCall = async <T,>(operation: string, fn: (signal: AbortSignal) => Promise<T>) => {
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
    }

    const controller = new AbortController();
    activeControllerRef.current = controller;
    const startedAt = performance.now();
    setCallState({
      operation,
      status: "idle",
      isLoading: true,
      durationMs: null,
      error: null,
      errorKind: null,
      meta: null,
      result: null,
    });

    try {
      const result = await fn(controller.signal);
      const durationMs = Math.round(performance.now() - startedAt);
      const meta = getLastApiRequestMeta();
      setCallState({
        operation,
        status: "success",
        isLoading: false,
        durationMs,
        error: null,
        errorKind: null,
        meta,
        result,
      });
      setRequestHistory(getApiRequestHistory(10));
      return result;
    } catch (error) {
      const durationMs = Math.round(performance.now() - startedAt);
      const normalizedMessage =
        isApiRequestError(error) && error.message
          ? error.message
          : error instanceof Error
            ? error.message
            : "Unknown error";
      const normalizedKind = isApiRequestError(error) ? error.kind : "unknown";
      const meta = isApiRequestError(error) ? error.meta : getLastApiRequestMeta();

      setCallState({
        operation,
        status: "error",
        isLoading: false,
        durationMs,
        error: normalizedMessage,
        errorKind: normalizedKind,
        meta,
        result: null,
      });
      setRequestHistory(getApiRequestHistory(10));
      return null;
    } finally {
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null;
      }
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const token = await runCall("login", (signal) =>
      login(username, password, { signal, timeoutMs: 10000 })
    );
    if (typeof token === "string") {
      setAccessToken(token);
    }
  };

  const handleListFiles = async () => {
    if (!accessToken) {
      setCallState({
        operation: "listBinaryFiles",
        status: "error",
        isLoading: false,
        durationMs: null,
        error: "Access token is required. Run Login first or paste a token.",
        errorKind: "validation",
        meta: null,
        result: null,
      });
      return;
    }

    await runCall("listBinaryFiles", (signal) =>
      listBinaryFiles(accessToken, { signal, timeoutMs: 15000 })
    );
  };

  const handleCancelActiveCall = () => {
    activeControllerRef.current?.abort();
  };

  const handleClearHistory = () => {
    clearApiRequestHistory();
    setRequestHistory([]);
  };

  const filteredHistory = requestHistory.filter((item) => {
    if (historyFilter === "errors") {
      return item.errorKind !== null;
    }

    if (historyFilter === "slow") {
      return item.meta.durationMs > 1000;
    }

    return true;
  });

  const totalCount = requestHistory.length;
  const errorCount = requestHistory.filter((item) => item.errorKind !== null).length;
  const slowCount = requestHistory.filter((item) => item.meta.durationMs > 1000).length;

  return (
    <PageSection grow padding="lg" className="gap-6">
      <SectionHeader
        title="API Debug Harness"
        description="Run API calls in-app and inspect status, timing, and response payloads."
        level="h1"
        titleClassName="text-2xl font-bold text-black dark:text-zinc-100"
        descriptionClassName="mt-1 text-sm"
      />

      <Card as="section" variant="bordered" padding="md">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-100">Login</h2>
        <form onSubmit={handleLogin} className="mt-4 flex flex-col gap-3">
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <Button
            type="submit"
            disabled={callState.isLoading}
            variant="info"
            size="md"
          >
            {callState.isLoading && callState.operation === "login" ? "Logging in..." : "Run Login"}
          </Button>
          {callState.isLoading && (
            <Button type="button" variant="secondary" size="md" onClick={handleCancelActiveCall}>
              Cancel Active Call
            </Button>
          )}
        </form>
      </Card>

      <Card as="section" variant="bordered" padding="md">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-100">Authenticated Call</h2>
        <label className="mt-4 block text-sm text-zinc-700 dark:text-zinc-300">Access Token</label>
        <TextArea
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          placeholder="Paste token or run Login"
          className="mt-2 h-24 text-xs"
        />
        <Button
          type="button"
          onClick={handleListFiles}
          disabled={callState.isLoading}
          variant="success"
          size="md"
          className="mt-3"
        >
          {callState.isLoading && callState.operation === "listBinaryFiles"
            ? "Loading files..."
            : "Run listBinaryFiles"}
        </Button>
      </Card>

      <Card as="section" variant="bordered" padding="md">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-100">Last Call Result</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-zinc-700 dark:text-zinc-300 md:grid-cols-2">
          <p>
            <span className="font-semibold">Operation:</span> {callState.operation ?? "None"}
          </p>
          <p>
            <span className="font-semibold">Status:</span> {callState.status}
          </p>
          <p>
            <span className="font-semibold">Duration:</span>{" "}
            {callState.durationMs === null ? "-" : `${callState.durationMs} ms`}
          </p>
          <p>
            <span className="font-semibold">Error Kind:</span> {callState.errorKind ?? "-"}
          </p>
        </div>

        {callState.meta && (
          <div className="mt-3 rounded-lg bg-zinc-100 p-3 text-xs text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
            <p><span className="font-semibold">Request ID:</span> {callState.meta.requestId}</p>
            <p><span className="font-semibold">Method:</span> {callState.meta.method}</p>
            <p><span className="font-semibold">URL:</span> {callState.meta.url}</p>
            <p><span className="font-semibold">Status:</span> {callState.meta.status ?? "-"}</p>
            <p><span className="font-semibold">Started At:</span> {callState.meta.startedAt}</p>
            <p><span className="font-semibold">Duration:</span> {callState.meta.durationMs} ms</p>
          </div>
        )}

        {callState.error && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
            {callState.error}
          </p>
        )}

        <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-100 p-4 text-xs dark:bg-zinc-950">
          {callState.result === null ? "No result yet" : JSON.stringify(callState.result, null, 2)}
        </pre>
      </Card>

      <Card as="section" variant="bordered" padding="md">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-100">Recent Calls</h2>
          <Button type="button" variant="secondary" size="md" onClick={handleClearHistory}>
            Clear History
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setHistoryFilter("all")}
            className={historyFilter === "all" ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-black" : ""}
          >
            All ({totalCount})
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setHistoryFilter("errors")}
            className={historyFilter === "errors" ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-black" : ""}
          >
            Errors Only ({errorCount})
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setHistoryFilter("slow")}
            className={historyFilter === "slow" ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-black" : ""}
          >
            Slow {'>'} 1000 ms ({slowCount})
          </Button>
        </div>

        {filteredHistory.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">No recorded calls yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {filteredHistory.map((item) => (
              <li
                key={`${item.meta.requestId}-${item.meta.operation}-${item.meta.startedAt}`}
                className="rounded-lg border border-black/[.08] p-3 text-xs dark:border-white/[.12]"
              >
                <p><span className="font-semibold">{item.meta.operation}</span> ({item.meta.method})</p>
                <p className="text-zinc-600 dark:text-zinc-400 break-all">{item.meta.url}</p>
                <p>
                  <span className="font-semibold">Request ID:</span> {item.meta.requestId}
                </p>
                <p>
                  <span className="font-semibold">Status:</span> {item.meta.status ?? "-"}
                  {" | "}
                  <span className="font-semibold">Duration:</span> {item.meta.durationMs} ms
                  {" | "}
                  <span className="font-semibold">Error Kind:</span> {item.errorKind ?? "none"}
                </p>
                {item.errorMessage && (
                  <p className="text-red-600 dark:text-red-300">{item.errorMessage}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageSection>
  );
}
