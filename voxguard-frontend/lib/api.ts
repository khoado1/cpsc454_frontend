import { BASE_URL } from "@/lib/config";
import { captureApiOutcome } from "@/lib/telemetry";
import { UserKeyMaterialInfo } from "./types";

// API endpoint URL constants
const URL_REGISTER = `${BASE_URL}/register`;
const URL_LOGIN = `${BASE_URL}/login`;
const URL_USERS = `${BASE_URL}/users`;
const URL_USERS_KEY_MATERIAL = `${BASE_URL}/users/me/key-material`;
const URL_MESSAGES = `${BASE_URL}/messages`;
const URL_MESSAGES_FILE_ID = (file_id: string) => `${BASE_URL}/messages/${encodeURIComponent(file_id)}`;

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

export type UserInfo = {
  user_id: string;
  username: string;
  public_key_base64: string | null;
};

export type MessageInfo = {
  file_id: string;
  sender_user_id: string | null;
  receiver_user_id: string | null;
  is_read: number;
  filename: string | null;
  data_length: number | null;
  content_type: string | null;
  created_at: string | null;
  upload_date: string | null;
  request_id: string | null;
};

export type BlobWithHeaders = {
  headers: Headers;
  blob: Blob;
};

export type MessageReadInfo = {
  file_id: string;
  is_read: number;
  read_at: string | null;
  status: string;
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

export async function register(
  username: string,
  password: string,
  options?: ApiCallOptions
): Promise<void> {
  await requestRaw(
    "register",
    URL_REGISTER,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    },
    options
  );
}

export async function login(
  username: string,
  password: string,
  options?: ApiCallOptions
): Promise<string> {
  const data = await requestJson<{ access_token: string }>(
    "login",
    URL_LOGIN,
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

export async function getUsers(
  accessToken: string,
  options?: ApiCallOptions
): Promise<UserInfo[]> {
  const data = await requestJson<UserInfo[] | { users?: UserInfo[] }>(
    "getUsers",
    URL_USERS,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    options
  );

  if (Array.isArray(data)) {
    return data;
  }

  return data.users ?? [];
}

export async function saveUserKeyMaterial(
  payload: UserKeyMaterialInfo,
  accessToken?: string,
  options?: ApiCallOptions
): Promise<void> {
  await requestRaw(
    "saveUserKeyMaterial",
    URL_USERS_KEY_MATERIAL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(payload),
    },
    options
  );
}

export async function getUserKeyMaterial(
  accessToken?: string,
  options?: ApiCallOptions
): Promise<UserKeyMaterialInfo> {
  const data = await requestJson<UserKeyMaterialInfo>(
    "getMyKeyMaterial",
    URL_USERS_KEY_MATERIAL,
    {
      method: "GET",
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    },
    options
  );
  if (!data.encrypted_private_key_base64 || !data.salt_base64 || !data.iv_base64) {
    throw new Error("Server response is missing encrypted_private_key_base64, salt_base64, or iv_base64");
  }

  return data;
}

export async function uploadBinaryData(
  data: ArrayBuffer,
  receiver_user_id: string,
  request_id: string,
  iv_for_data_base64: string,
  algorithm_for_data: string,
  encrypted_symmetric_key_base64: string,
  algorithm_for_symmetric_key: string,
  decrypted_content_type: string,
  accessToken: string,
  options?: ApiCallOptions
): Promise<void> {
  const formData = new FormData();
  formData.append("data", new Blob([data]));
  formData.append("receiver_user_id", receiver_user_id);
  formData.append("request_id", request_id);
  formData.append("iv_for_data_base64", iv_for_data_base64);
  formData.append("algorithm_for_data", algorithm_for_data);
  formData.append("encrypted_symmetric_key_base64", encrypted_symmetric_key_base64);
  formData.append("algorithm_for_symmetric_key", algorithm_for_symmetric_key);
  formData.append("decrypted_content_type", decrypted_content_type);

  await requestRaw(
    "uploadBinaryData",
    URL_MESSAGES,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    },
    options
  );
}

export async function listBinaryFiles(
  accessToken: string,
  options?: ApiCallOptions
): Promise<MessageInfo[]> {
  
  return await requestJson<MessageInfo[]>(
    "listBinaryFiles",
    URL_MESSAGES,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    options
  );
}

export async function downloadBinaryFile(
  id: string,
  accessToken: string,
  options?: ApiCallOptions
): Promise<BlobWithHeaders> {
  return requestBlob(
    "downloadBinaryFile",
    URL_MESSAGES_FILE_ID(id),
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    options
  );
}

export async function markBinaryFileRead(
  id: string,
  isRead: boolean,
  accessToken: string,
  options?: ApiCallOptions
): Promise<MessageReadInfo> {
  return requestJson<MessageReadInfo>(
    "markBinaryFileRead",
    URL_MESSAGES_FILE_ID(id),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ is_read: isRead }),
    },
    options
  );
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

let lastApiRequestMeta: ApiRequestMeta | null = null;
let apiRequestHistory: ApiRequestHistoryItem[] = [];
const API_REQUEST_HISTORY_LIMIT = 25;

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
): Promise<BlobWithHeaders>{
  const { response } = await requestRaw(operation, url, init, options);
  
  return {
    headers: response.headers,
    blob: await response.blob(),
  };
}
