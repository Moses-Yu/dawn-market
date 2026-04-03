"use client";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--color-background)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-[var(--color-primary)]">새벽</span>시장
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-muted)]">Dawn Market</span>
        </div>
      </div>
    </header>
  );
}
