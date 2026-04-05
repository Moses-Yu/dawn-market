export const dynamic = "force-dynamic";

import SeverityBadge from "@/components/briefing/SeverityBadge";
import CategoryBadge from "@/components/briefing/CategoryBadge";
import SentimentBadge from "@/components/briefing/SentimentBadge";
import PaywallGate from "@/components/PaywallGate";
import PageTransition from "@/components/PageTransition";
import { StaggerContainer, StaggerItem } from "@/components/StaggerList";
import TrackEvent from "@/components/TrackEvent";
import type { Alert } from "@/lib/pipeline/alert-engine";
import type { Severity } from "@/lib/pipeline/types";
import type { Category } from "@/lib/pipeline/types";
import type { Sentiment } from "@/lib/pipeline/types";

async function getAlerts(): Promise<Alert[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/alerts?limit=30`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const month = kst.getUTCMonth() + 1;
  const day = kst.getUTCDate();
  const hours = kst.getUTCHours().toString().padStart(2, "0");
  const minutes = kst.getUTCMinutes().toString().padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
}

function AlertCard({ alert }: { alert: Alert }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-base leading-tight">{alert.title}</h3>
        {alert.createdAt && (
          <span className="text-xs text-[var(--color-muted)] whitespace-nowrap">
            {formatTime(alert.createdAt)}
          </span>
        )}
      </div>
      <p className="text-sm text-[var(--color-secondary)] leading-relaxed">
        {alert.body}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <SeverityBadge severity={alert.severity as Severity} />
        <CategoryBadge category={alert.category as Category} />
        <SentimentBadge sentiment={alert.sentiment as Sentiment} />
        {alert.pushed && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-400">
            📤 발송됨
          </span>
        )}
      </div>
    </div>
  );
}

export default async function AlertsPage() {
  const alerts = await getAlerts();

  return (
    <PageTransition>
      <TrackEvent name="alerts_page_view" category="navigation" />
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">알림</h2>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            밤사이 중요 시장 이벤트 알림 · 매일 밤 10시~새벽 6시 자동 모니터링
          </p>
        </div>

        {alerts.length === 0 ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
            <div className="mb-3 text-3xl">🔔</div>
            <p className="text-[var(--color-muted)] text-sm">
              아직 알림이 없습니다.
            </p>
            <p className="text-[var(--color-muted)] text-xs mt-1">
              매일 밤 시장 이벤트가 감지되면 여기에 알림이 표시됩니다.
            </p>
          </div>
        ) : (
          <>
            {/* Regular alerts — visible to all */}
            {alerts.some((a) => a.severity !== "긴급") && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-muted)]">
                  <span className="h-3 w-0.5 rounded-full bg-[var(--color-primary)]" />
                  일반 알림
                </h3>
                <StaggerContainer className="space-y-3">
                  {alerts
                    .filter((a) => a.severity !== "긴급")
                    .map((alert) => (
                      <StaggerItem key={alert.id}>
                        <AlertCard alert={alert} />
                      </StaggerItem>
                    ))}
                </StaggerContainer>
              </div>
            )}

            {/* Critical/urgent alerts — Pro only */}
            {alerts.some((a) => a.severity === "긴급") && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-muted)]">
                  <span className="h-3 w-0.5 rounded-full bg-red-400" />
                  긴급 알림
                </h3>
                <PaywallGate requiredTier="pro">
                  <StaggerContainer className="space-y-3">
                    {alerts
                      .filter((a) => a.severity === "긴급")
                      .map((alert) => (
                        <StaggerItem key={alert.id}>
                          <AlertCard alert={alert} />
                        </StaggerItem>
                      ))}
                  </StaggerContainer>
                </PaywallGate>
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
