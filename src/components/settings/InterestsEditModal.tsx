"use client";

import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import SectorPreferences from "./SectorPreferences";
import WatchlistManager from "@/components/watchlist/WatchlistManager";
import type { WatchlistItem } from "@/components/watchlist/WatchlistManager";

interface InterestsEditModalProps {
  open: boolean;
  onClose: () => void;
  initialSectors: string[];
  initialWatchlist: WatchlistItem[];
}

export default function InterestsEditModal({
  open,
  onClose,
  initialSectors,
  initialWatchlist,
}: InterestsEditModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const handleClose = useCallback(() => {
    dialogRef.current?.close();
    onClose();
    // Return focus to the element that opened the modal
    triggerRef.current?.focus();
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      // Remember the element that triggered the modal
      triggerRef.current = document.activeElement as HTMLElement;
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Handle native dialog close (Escape key)
    function onDialogClose() {
      onClose();
      triggerRef.current?.focus();
    }

    dialog.addEventListener("close", onDialogClose);
    return () => dialog.removeEventListener("close", onDialogClose);
  }, [onClose]);

  // Close on backdrop click
  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) {
      handleClose();
    }
  }

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="관심 설정 편집"
      onClick={handleBackdropClick}
      className="fixed inset-0 m-0 h-full w-full max-h-full max-w-full border-none bg-transparent p-0 backdrop:bg-black/60"
    >
      <div className="flex h-full w-full items-end justify-center sm:items-center sm:p-4">
        <div className="relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-background)] sm:max-w-lg sm:rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <h2 className="text-base font-bold">관심 설정 편집</h2>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)]"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[var(--color-muted)]">
                관심 섹터
              </h3>
              <SectorPreferences initialSectors={initialSectors} />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[var(--color-muted)]">
                관심종목 설정
              </h3>
              <p className="text-xs text-[var(--color-muted)]">
                브리핑에서 맞춤 분석을 받을 종목을 선택하세요 (최대 20개)
              </p>
              <WatchlistManager initialWatchlist={initialWatchlist} />
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
