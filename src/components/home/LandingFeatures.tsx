const FEATURES = [
  {
    icon: "📊",
    title: "매일 새벽 브리핑",
    description: "밤사이 해외 뉴스를 AI가 쉬운 한국어로 정리",
    tag: null,
  },
  {
    icon: "⚡",
    title: "실시간 긴급 알림",
    description: "시장 급변 시 즉시 푸시 알림",
    tag: "Pro",
  },
  {
    icon: "🔬",
    title: "섹터 리스크 분석",
    description: "반도체·방산·AI 등 6개 섹터 위험도 한눈에",
    tag: null,
  },
] as const;

export default function LandingFeatures() {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold">왜 새벽시장인가요?</h2>
      {FEATURES.map((f) => (
        <div
          key={f.title}
          className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        >
          <span className="text-2xl leading-none mt-0.5">{f.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{f.title}</span>
              {f.tag && (
                <span className="rounded-full bg-[var(--color-primary)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-primary)]">
                  {f.tag}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">
              {f.description}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
