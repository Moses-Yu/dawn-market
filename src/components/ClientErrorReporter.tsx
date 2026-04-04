"use client";

import { useEffect } from "react";

/**
 * Installs global error and unhandled rejection handlers
 * to capture errors that occur outside React's tree.
 */
export default function ClientErrorReporter() {
  useEffect(() => {
    function reportError(payload: Record<string, unknown>) {
      fetch("/api/health/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }

    function onError(event: ErrorEvent) {
      reportError({
        type: "global_error",
        message: event.message,
        stack: event.error?.stack?.slice(0, 2000) ?? "",
        url: window.location.href,
        userAgent: navigator.userAgent,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        timestamp: new Date().toISOString(),
      });
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      reportError({
        type: "unhandled_rejection",
        message: reason?.message ?? String(reason),
        stack: reason?.stack?.slice(0, 2000) ?? "",
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
