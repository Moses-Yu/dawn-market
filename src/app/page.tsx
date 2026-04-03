export default function Home() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-xl font-bold">오늘의 시장 브리핑</h2>
        <p className="text-sm text-[var(--color-muted)]">
          해외 시장 뉴스와 AI 인사이트를 매일 새벽에 전달합니다.
        </p>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-center text-sm text-[var(--color-muted)]">
          브리핑 준비 중...
        </p>
      </section>
    </div>
  );
}
