type TelemetryLevel = "error" | "info";

type FrontendErrorPayload = {
  name: string;
  message: string;
  stack?: string;
  digest?: string;
  context?: Record<string, unknown>;
};

type ApiOutcomePayload = {
  operation: string;
  requestId: string;
  method: string;
  url: string;
  status: number | null;
  durationMs: number;
  ok: boolean;
  errorKind?: string;
  errorMessage?: string;
};

function telemetryEnabled(): boolean {
  return process.env.NEXT_PUBLIC_TELEMETRY_ENABLED === "true";
}

// ---------------------------------------------------------------------------
// Vendor bridge
// To activate Sentry: install @sentry/nextjs and set NEXT_PUBLIC_TELEMETRY_VENDOR=sentry
// To activate Datadog: install @datadog/browser-logs and set NEXT_PUBLIC_TELEMETRY_VENDOR=datadog
// Leave unset (or set to "none") to use the no-op / CustomEvent fallback.
// ---------------------------------------------------------------------------
type TelemetryVendor = "sentry" | "datadog" | "none";

function getVendor(): TelemetryVendor {
  const v = process.env.NEXT_PUBLIC_TELEMETRY_VENDOR;
  if (v === "sentry" || v === "datadog") return v;
  return "none";
}

// Typed shim — the real SDKs are imported at runtime via dynamic require so that
// their packages remain optional dev/prod dependencies.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSentryClient(): any | null {
  if (typeof window === "undefined") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@sentry/nextjs");
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDatadogClient(): any | null {
  if (typeof window === "undefined") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@datadog/browser-logs");
  } catch {
    return null;
  }
}

function emit(level: TelemetryLevel, event: string, payload: unknown): void {
  if (!telemetryEnabled()) {
    return;
  }

  const vendor = getVendor();

  if (vendor === "sentry") {
    const Sentry = getSentryClient();
    if (Sentry) {
      if (level === "error") {
        Sentry.captureEvent({
          message: event,
          level: "error",
          extra: payload as Record<string, unknown>,
        });
      } else {
        Sentry.addBreadcrumb({
          category: event,
          data: payload as Record<string, unknown>,
          level: "info",
        });
      }
    }
  } else if (vendor === "datadog") {
    const { datadogLogs } = getDatadogClient() ?? {};
    if (datadogLogs) {
      if (level === "error") {
        datadogLogs.logger.error(event, { payload });
      } else {
        datadogLogs.logger.info(event, { payload });
      }
    }
  } else {
    // Fallback: dispatch a DOM CustomEvent so the debug harness can listen.
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("app:telemetry", {
          detail: {
            level,
            event,
            payload,
            timestamp: new Date().toISOString(),
          },
        })
      );
    }
  }

  if (process.env.NODE_ENV !== "production") {
    // Useful in local dev when telemetry is enabled.
    console[level === "error" ? "error" : "info"](`[telemetry:${vendor}] ${event}`, payload);
  }
}

export function captureFrontendError(error: Error, context?: Record<string, unknown>): void {
  const payload: FrontendErrorPayload = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
  };

  emit("error", "frontend.error", payload);
}

export function captureGlobalRenderError(
  error: Error & { digest?: string },
  context?: Record<string, unknown>
): void {
  const payload: FrontendErrorPayload = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    digest: error.digest,
    context,
  };

  emit("error", "frontend.global_error", payload);
}

export function captureApiOutcome(payload: ApiOutcomePayload): void {
  emit(payload.ok ? "info" : "error", "api.request", payload);
}
