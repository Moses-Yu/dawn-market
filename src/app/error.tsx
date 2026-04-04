"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    fetch("/api/health/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "next_error_boundary",
        message: error.message,
        stack: error.stack?.slice(0, 2000),
        url: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        metadata: { digest: error.digest },
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 text-4xl">⚠️</div>
      <h2 className="mb-2 text-lg font-semibold text-white">
        문제가 발생했습니다
      </h2>
      <p className="mb-4 text-sm text-zinc-400">
        일시적인 오류입니다. 다시 시도해주세요.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700"
      >
        다시 시도
      </button>
    </div>
  );
}
