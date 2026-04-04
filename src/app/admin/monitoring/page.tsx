import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "시스템 모니터링",
};

export const dynamic = "force-dynamic";

const REPORT_TYPES = [
  "us-market",
  "semiconductor",
  "shipbuilding-defense",
  "ai-infra",
  "secondary-battery",
  "geopolitical",
  "dawn-briefing",
];

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getKSTDate(offset = 0) {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000 + offset * 24 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

async function getPipelineStatus(supabase: ReturnType<typeof getServiceClient>) {
  const today = getKSTDate();
  const yesterday = getKSTDate(-1);

  const [todayRes, yesterdayRes, articlesRes, snapshotsRes] = await Promise.all([
    supabase.from("reports").select("report_type, created_at").eq("date", today),
    supabase.from("reports").select("report_type").eq("date", yesterday),
    supabase.from("raw_articles").select("collected_at").order("collected_at", { ascending: false }).limit(1),
    supabase.from("market_snapshots").select("collected_at").order("collected_at", { ascending: false }).limit(1),
  ]);

  const todayTypes = new Set((todayRes.data ?? []).map((r) => r.report_type));
  const missingToday = REPORT_TYPES.filter((t) => !todayTypes.has(t));

  return {
    today,
    todayCount: todayRes.data?.length ?? 0,
    yesterdayCount: yesterdayRes.data?.length ?? 0,
    missingTypes: missingToday,
    lastArticle: articlesRes.data?.[0]?.collected_at ?? null,
    lastSnapshot: snapshotsRes.data?.[0]?.collected_at ?? null,
  };
}

async function getRecentErrors(supabase: ReturnType<typeof getServiceClient>) {
  const { data, error } = await supabase
    .from("client_errors")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return { errors: [], count: 0, fetchError: error.message };
  return { errors: data ?? [], count: data?.length ?? 0, fetchError: null };
}

async function getDbHealth(supabase: ReturnType<typeof getServiceClient>) {
  const start = Date.now();
  const { error } = await supabase.from("reports").select("id").limit(1);
  return {
    status: error ? ("fail" as const) : ("ok" as const),
    responseMs: Date.now() - start,
    error: error?.message ?? null,
  };
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        ok ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"
      }`}
    >
      {ok ? "정상" : "문제"}
    </span>
  );
}

function formatTime(isoString: string | null) {
  if (!isoString) return "없음";
  const d = new Date(isoString);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toLocaleString("ko-KR", { timeZone: "UTC" });
}

export default async function MonitoringPage() {
  const supabase = getServiceClient();

  const [pipeline, errors, db] = await Promise.all([
    getPipelineStatus(supabase),
    getRecentErrors(supabase),
    getDbHealth(supabase),
  ]);

  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const isAfterPipeline = kstNow.getHours() >= 6;
  const pipelineOk = !isAfterPipeline || pipeline.missingTypes.length === 0;

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">시스템 모니터링</h1>
        <span className="text-xs text-zinc-500">
          {formatTime(new Date().toISOString())}
        </span>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-zinc-900 p-4">
          <div className="mb-1 text-xs text-zinc-500">데이터베이스</div>
          <StatusBadge ok={db.status === "ok"} />
          <div className="mt-1 text-xs text-zinc-600">{db.responseMs}ms</div>
        </div>
        <div className="rounded-lg bg-zinc-900 p-4">
          <div className="mb-1 text-xs text-zinc-500">콘텐츠 파이프라인</div>
          <StatusBadge ok={pipelineOk} />
          <div className="mt-1 text-xs text-zinc-600">
            {pipeline.todayCount}/{REPORT_TYPES.length} 리포트
          </div>
        </div>
        <div className="rounded-lg bg-zinc-900 p-4">
          <div className="mb-1 text-xs text-zinc-500">클라이언트 에러</div>
          <StatusBadge ok={errors.count === 0} />
          <div className="mt-1 text-xs text-zinc-600">
            최근 {errors.count}건
          </div>
        </div>
      </div>

      {/* Pipeline Details */}
      <section className="rounded-lg bg-zinc-900 p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">
          콘텐츠 파이프라인 ({pipeline.today})
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-zinc-400">
            <span>오늘 생성</span>
            <span className="text-white">{pipeline.todayCount}건</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>어제 생성</span>
            <span className="text-white">{pipeline.yesterdayCount}건</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>마지막 기사 수집</span>
            <span className="text-white text-xs">{formatTime(pipeline.lastArticle)}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>마지막 시장 데이터</span>
            <span className="text-white text-xs">{formatTime(pipeline.lastSnapshot)}</span>
          </div>
          {pipeline.missingTypes.length > 0 && (
            <div className="mt-2 rounded bg-red-900/20 p-2">
              <div className="text-xs font-medium text-red-400">
                미생성 리포트:
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {pipeline.missingTypes.map((type) => (
                  <span
                    key={type}
                    className="rounded bg-red-900/30 px-2 py-0.5 text-xs text-red-300"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Recent Client Errors */}
      <section className="rounded-lg bg-zinc-900 p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">
          최근 클라이언트 에러
        </h2>
        {errors.fetchError ? (
          <p className="text-xs text-zinc-500">
            에러 테이블 미생성 — 첫 에러 발생 시 자동 생성됩니다.
          </p>
        ) : errors.errors.length === 0 ? (
          <p className="text-xs text-zinc-500">최근 에러가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {errors.errors.slice(0, 10).map((err: Record<string, string>, i: number) => (
              <div
                key={i}
                className="rounded bg-zinc-800 p-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-red-400">
                    {err.type}
                  </span>
                  <span className="text-zinc-600">
                    {formatTime(err.created_at)}
                  </span>
                </div>
                <div className="mt-1 text-zinc-300">{err.message}</div>
                {err.url && (
                  <div className="mt-0.5 text-zinc-600">{err.url}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Environment Check */}
      <section className="rounded-lg bg-zinc-900 p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">환경 변수</h2>
        <div className="space-y-1 text-xs">
          {[
            "NEXT_PUBLIC_SUPABASE_URL",
            "NEXT_PUBLIC_SUPABASE_ANON_KEY",
            "SUPABASE_SERVICE_ROLE_KEY",
            "ANTHROPIC_API_KEY",
            "CRON_SECRET",
          ].map((key) => (
            <div key={key} className="flex justify-between text-zinc-400">
              <span className="font-mono">{key}</span>
              <span className={process.env[key] ? "text-green-400" : "text-red-400"}>
                {process.env[key] ? "설정됨" : "미설정"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
