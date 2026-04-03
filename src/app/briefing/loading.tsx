export default function BriefingLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="mb-2 h-3 w-24 rounded bg-white/10" />
        <div className="h-6 w-48 rounded bg-white/10" />
        <div className="mt-1 h-3 w-32 rounded bg-white/10" />
      </div>

      {/* Market overview skeleton */}
      <div>
        <div className="mb-3 h-5 w-24 rounded bg-white/10" />
        <div className="mb-4 space-y-2">
          <div className="h-4 w-full rounded bg-white/10" />
          <div className="h-4 w-3/4 rounded bg-white/10" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      </div>

      {/* Stories skeleton */}
      <div>
        <div className="mb-3 h-5 w-24 rounded bg-white/10" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="mb-2 flex gap-2">
                <div className="h-5 w-12 rounded-full bg-white/10" />
                <div className="h-5 w-12 rounded-full bg-white/10" />
              </div>
              <div className="mb-2 h-5 w-3/4 rounded bg-white/10" />
              <div className="space-y-1.5">
                <div className="h-4 w-full rounded bg-white/10" />
                <div className="h-4 w-5/6 rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
