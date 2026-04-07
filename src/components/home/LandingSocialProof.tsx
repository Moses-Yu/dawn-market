export default function LandingSocialProof() {
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2">
        <span className="text-sm">👥</span>
        <p className="text-xs text-[var(--color-muted)]">
          이미{" "}
          <span className="font-semibold text-[var(--color-foreground)]">
            2,400명+
          </span>{" "}
          투자자가 읽고 있습니다
        </p>
      </div>
    </div>
  );
}
