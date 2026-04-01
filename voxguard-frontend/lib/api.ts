import { BASE_URL } from "@/lib/config";
import { createAndStoreUserKeyMaterial } from "@/lib/crypto";
import { captureApiOutcome } from "@/lib/telemetry";

export type ApiErrorKind = "network" | "timeout" | "aborted" | "http" | "parse" | "unknown";

export type ApiRequestMeta = {
  requestId: string;
  operation: string;
  method: string;
  url: string;
  startedAt: string;
  durationMs: number;
  status: number | null;
  ok: boolean;
};

export type ApiRequestHistoryItem = {
  meta: ApiRequestMeta;
  errorKind: ApiErrorKind | null;
  errorMessage: string | null;
};

export type ApiCallOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

export type BinaryFileRecord = {
  id: string;
  user_id: string;
  recipient_user_id: string;
};

export class ApiRequestError extends Error {
  kind: ApiErrorKind;
  meta: ApiRequestMeta;
  status: number | null;
  details: unknown;

  constructor(
    kind: ApiErrorKind,
    message: string,
    meta: ApiRequestMeta,
    status: number | null = null,
    details: unknown = null
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.kind = kind;
    this.meta = meta;
    this.status = status;
    this.details = details;
  }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}

export function getLastApiRequestMeta(): ApiRequestMeta | null {
  return lastApiRequestMeta;
}

export function getApiRequestHistory(limit = 10): ApiRequestHistoryItem[] {
  return apiRequestHistory.slice(0, Math.max(0, limit));
}

export function clearApiRequestHistory(): void {
  apiRequestHistory = [];
}

export function getSubFromJwt(token: string): string | null {
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

export async function register(
  username: string,
  password: string,
  options?: ApiCallOptions
): Promise<void> {
  await requestRaw(
    "register",
    `${BASE_URL}/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    },
    options
  );
}

/**
 * Full registration flow:
 * 1. Creates the user account
 * 2. Logs in to get an access token
 * 3. Generates keypair, encrypts private key with password, stores key material on server
 */
export async function registerAndSetupKeys(
  username: string,
  password: string,
  options?: ApiCallOptions
): Promise<string> {
  await register(username, password, options);
  const accessToken = await login(username, password, options);
  await createAndStoreUserKeyMaterial(password, accessToken);
  return accessToken;
}

export async function login(
  username: string,
  password: string,
  options?: ApiCallOptions
): Promise<string> {
  const data = await requestJson<{ access_token: string }>(
    "login",
    `${BASE_URL}/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    },
    options
  );

  // data = { access_token, token_type, expires_in }
  return data.access_token;
}

export async function uploadBinaryData(
  id: string,
  binaryData: ArrayBuffer,
  accessToken: string,
  options?: ApiCallOptions
): Promise<void> {
  const formData = new FormData();
  formData.append("id", id);
  formData.append("binary_data", new Blob([binaryData]));

  await requestRaw(
    "uploadBinaryData",
    `${BASE_URL}/binary-files`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    },
    options
  );
}

export async function downloadBinaryFile(
  id: string,
  accessToken: string,
  options?: ApiCallOptions
): Promise<Blob> {
  return requestBlob(
    "downloadBinaryFile",
    `${BASE_URL}/binary-files/${id}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    options
  );
}

export async function listBinaryFiles(
  accessToken: string,
  options?: ApiCallOptions
): Promise<BinaryFileRecord[]> {
  const data = await requestJson<ListBinaryFilesResponse>(
    "listBinaryFiles",
    `${BASE_URL}/binary-files`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    options
  );

  if (Array.isArray(data)) {
    return data as BinaryFileRecord[];
  }

  if (Array.isArray(data.files)) {
    return data.files as BinaryFileRecord[];
  }

  if (Array.isArray(data.items)) {
    return data.items as BinaryFileRecord[];
  }

  return [];
}

let lastApiRequestMeta: ApiRequestMeta | null = null;
let apiRequestHistory: ApiRequestHistoryItem[] = [];
const API_REQUEST_HISTORY_LIMIT = 25;

type ListBinaryFilesResponse =
  | BinaryFileRecord[]
  | {
      files?: BinaryFileRecord[];
      items?: BinaryFileRecord[];
    };

function generateRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildMeta(args: {
  requestId: string;
  operation: string;
  method: string;
  url: string;
  startedAt: string;
  startedAtMs: number;
  status: number | null;
  ok: boolean;
}): ApiRequestMeta {
  return {
    requestId: args.requestId,
    operation: args.operation,
    method: args.method,
    url: args.url,
    startedAt: args.startedAt,
    durationMs: Date.now() - args.startedAtMs,
    status: args.status,
    ok: args.ok,
  };
}

function pushHistory(item: ApiRequestHistoryItem): void {
  apiRequestHistory = [item, ...apiRequestHistory].slice(0, API_REQUEST_HISTORY_LIMIT);
}

function createRequestSignal(options?: ApiCallOptions) {
  const controller = new AbortController();
  let timedOut = false;

  const timeoutMs = options?.timeoutMs ?? 15000;

  const onExternalAbort = () => {
    controller.abort(options?.signal?.reason ?? "aborted");
  };

  if (options?.signal) {
    if (options.signal.aborted) {
      controller.abort(options.signal.reason ?? "aborted");
    } else {
      options.signal.addEventListener("abort", onExternalAbort, { once: true });
    }
  }

  const timeoutId =
    timeoutMs > 0
      ? setTimeout(() => {
          timedOut = true;
          controller.abort("timeout");
        }, timeoutMs)
      : null;

  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (options?.signal) {
      options.signal.removeEventListener("abort", onExternalAbort);
    }
  };

  return {
    signal: controller.signal,
    cleanup,
    didTimeout: () => timedOut,
  };
}

async function parseErrorDetails(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();
    return text || null;
  } catch {
    return null;
  }
}

async function requestRaw(
  operation: string,
  url: string,
  init: RequestInit,
  options?: ApiCallOptions
): Promise<{ response: Response; meta: ApiRequestMeta }> {
  const method = init.method ?? "GET";
  const startedAtMs = Date.now();
  const startedAt = new Date(startedAtMs).toISOString();
  const requestId = generateRequestId();

  const headers = new Headers(init.headers);
  headers.set("x-request-id", requestId);

  const requestSignal = createRequestSignal(options);

  try {
    const response = await fetch(url, {
      ...init,
      headers,
      signal: requestSignal.signal,
    });

    const resolvedRequestId = response.headers.get("x-request-id") ?? requestId;
    const meta = buildMeta({
      requestId: resolvedRequestId,
      operation,
      method,
      url,
      startedAt,
      startedAtMs,
      status: response.status,
      ok: response.ok,
    });

    lastApiRequestMeta = meta;
    pushHistory({
      meta,
      errorKind: null,
      errorMessage: null,
    });
    captureApiOutcome({
      operation: meta.operation,
      requestId: meta.requestId,
      method: meta.method,
      url: meta.url,
      status: meta.status,
      durationMs: meta.durationMs,
      ok: true,
    });

    if (!response.ok) {
      const details = await parseErrorDetails(response);
      const defaultMessage = `Request failed: ${response.status}`;
      const message =
        typeof details === "object" &&
        details !== null &&
        "message" in details &&
        typeof (details as { message?: unknown }).message === "string"
          ? ((details as { message: string }).message || defaultMessage)
          : defaultMessage;

      throw new ApiRequestError("http", message, meta, response.status, details);
    }

    return { response, meta };
  } catch (error) {
    const meta = buildMeta({
      requestId,
      operation,
      method,
      url,
      startedAt,
      startedAtMs,
      status: null,
      ok: false,
    });

    if (error instanceof ApiRequestError) {
      lastApiRequestMeta = error.meta;
      pushHistory({
        meta: error.meta,
        errorKind: error.kind,
        errorMessage: error.message,
      });
      captureApiOutcome({
        operation: error.meta.operation,
        requestId: error.meta.requestId,
        method: error.meta.method,
        url: error.meta.url,
        status: error.meta.status,
        durationMs: error.meta.durationMs,
        ok: false,
        errorKind: error.kind,
        errorMessage: error.message,
      });
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      const kind: ApiErrorKind = requestSignal.didTimeout() ? "timeout" : "aborted";
      const message = kind === "timeout" ? "Request timed out" : "Request canceled";
      const normalized = new ApiRequestError(kind, message, meta, null, null);
      lastApiRequestMeta = normalized.meta;
      pushHistory({
        meta: normalized.meta,
        errorKind: normalized.kind,
        errorMessage: normalized.message,
      });
      captureApiOutcome({
        operation: normalized.meta.operation,
        requestId: normalized.meta.requestId,
        method: normalized.meta.method,
        url: normalized.meta.url,
        status: normalized.meta.status,
        durationMs: normalized.meta.durationMs,
        ok: false,
        errorKind: normalized.kind,
        errorMessage: normalized.message,
      });
      throw normalized;
    }

    if (error instanceof TypeError) {
      const normalized = new ApiRequestError(
        "network",
        "Network error while contacting the server",
        meta,
        null,
        null
      );
      lastApiRequestMeta = normalized.meta;
      pushHistory({
        meta: normalized.meta,
        errorKind: normalized.kind,
        errorMessage: normalized.message,
      });
      captureApiOutcome({
        operation: normalized.meta.operation,
        requestId: normalized.meta.requestId,
        method: normalized.meta.method,
        url: normalized.meta.url,
        status: normalized.meta.status,
        durationMs: normalized.meta.durationMs,
        ok: false,
        errorKind: normalized.kind,
        errorMessage: normalized.message,
      });
      throw normalized;
    }

    const normalized = new ApiRequestError("unknown", "Unknown request error", meta, null, error);
    lastApiRequestMeta = normalized.meta;
    pushHistory({
      meta: normalized.meta,
      errorKind: normalized.kind,
      errorMessage: normalized.message,
    });
    captureApiOutcome({
      operation: normalized.meta.operation,
      requestId: normalized.meta.requestId,
      method: normalized.meta.method,
      url: normalized.meta.url,
      status: normalized.meta.status,
      durationMs: normalized.meta.durationMs,
      ok: false,
      errorKind: normalized.kind,
      errorMessage: normalized.message,
    });
    throw normalized;
  } finally {
    requestSignal.cleanup();
  }
}

async function requestJson<T>(
  operation: string,
  url: string,
  init: RequestInit,
  options?: ApiCallOptions
): Promise<T> {
  const { response, meta } = await requestRaw(operation, url, init, options);

  try {
    return (await response.json()) as T;
  } catch {
    const parseError = new ApiRequestError(
      "parse",
      "Failed to parse JSON response",
      meta,
      response.status,
      null
    );
    lastApiRequestMeta = parseError.meta;
    pushHistory({
      meta: parseError.meta,
      errorKind: parseError.kind,
      errorMessage: parseError.message,
    });
    captureApiOutcome({
      operation: parseError.meta.operation,
      requestId: parseError.meta.requestId,
      method: parseError.meta.method,
      url: parseError.meta.url,
      status: parseError.meta.status,
      durationMs: parseError.meta.durationMs,
      ok: false,
      errorKind: parseError.kind,
      errorMessage: parseError.message,
    });
    throw parseError;
  }
}

async function requestBlob(
  operation: string,
  url: string,
  init: RequestInit,
  options?: ApiCallOptions
): Promise<Blob> {
  const { response } = await requestRaw(operation, url, init, options);
  return response.blob();
}

