"use client";

import { useState } from "react";
import Link from "next/link";
import { X, ChevronRight } from "lucide-react";
import SeverityBadge from "@/components/briefing/SeverityBadge";
import type { Alert } from "@/lib/pipeline/alert-engine";

const DISMISSED_KEY = "dismissed-urgent-alerts";

function getDismissedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function addDismissedId(id: string) {
  const ids = getDismissedIds();
  ids.add(id);
  sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
}

export default function UrgentAlertBanner({ alerts }: { alerts: Alert[] }) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(getDismissedIds);

  const visible = alerts.filter((a) => a.id && !dismissedIds.has(a.id));
  if (visible.length === 0) return null;

  const latest = visible[0];
  const extraCount = visible.length - 1;

  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!latest.id) return;
    addDismissedId(latest.id);
    setDismissedIds(new Set(getDismissedIds()));
  }

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 flex items-start gap-3">
      <SeverityBadge severity="긴급" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold line-clamp-1">
          {latest.title}
          {extraCount > 0 && (
            <span className="font-normal text-[var(--color-muted)]">
              {" "}외 {extraCount}건
            </span>
          )}
        </p>
        <p className="text-xs text-[var(--color-muted)] line-clamp-1 mt-0.5">
          {latest.body}
        </p>
      </div>
      <Link
        href="/alerts"
        className="shrink-0 flex items-center gap-0.5 text-xs text-red-400 hover:text-red-300 mt-0.5"
      >
        보기
        <ChevronRight className="h-3 w-3" />
      </Link>
      <button
        onClick={handleDismiss}
        className="shrink-0 text-[var(--color-muted)] hover:text-[var(--color-foreground)] mt-0.5"
        aria-label="알림 닫기"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
