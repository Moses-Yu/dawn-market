export default function HomeLoading() {
  return (
    <div className="space-y-6">
      {/* 1. Date header skeleton */}
      <section>
        <div className="bg-white/5 animate-pulse rounded h-7 w-48" />
        <div className="mt-2 bg-white/5 animate-pulse rounded h-4 w-64" />
      </section>

      {/* 2. Market indices grid — 4 skeleton cards in 2x2 */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="h-3.5 w-0.5 rounded-full bg-[var(--color-primary)]" />
          <div className="bg-white/5 animate-pulse rounded h-5 w-20" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white/5 animate-pulse rounded-xl h-[72px] p-3 flex flex-col justify-between"
            >
              <div className="bg-white/10 rounded w-16 h-3" />
              <div className="bg-white/10 rounded w-12 h-3" />
            </div>
          ))}
        </div>
      </section>

      {/* 3. Dawn Briefing card skeleton */}
      <div className="bg-white/5 animate-pulse rounded-xl h-[80px] p-4 flex items-start gap-2">
        <div className="bg-white/10 rounded w-4 h-4 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <div className="bg-white/10 rounded h-3 w-full" />
          <div className="bg-white/10 rounded h-3 w-3/4" />
        </div>
      </div>

      {/* 4. News highlights — 3 skeleton rows */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="h-3.5 w-0.5 rounded-full bg-[var(--color-primary)]" />
          <div className="bg-white/5 animate-pulse rounded h-5 w-20" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white/5 animate-pulse rounded-xl h-[48px] p-3 flex items-center"
            >
              <div className="bg-white/10 rounded h-3 w-3/4" />
            </div>
          ))}
        </div>
      </section>

      {/* 5. Sector risk grid — 4 skeleton cards in 2x2 */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="h-3.5 w-0.5 rounded-full bg-[var(--color-primary)]" />
          <div className="bg-white/5 animate-pulse rounded h-5 w-24" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white/5 animate-pulse rounded-xl h-[56px] p-3 flex items-center gap-2.5"
            >
              <div className="bg-white/10 rounded w-7 h-7 shrink-0" />
              <div className="space-y-1.5">
                <div className="bg-white/10 rounded w-12 h-3" />
                <div className="bg-white/10 rounded w-8 h-2.5" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
