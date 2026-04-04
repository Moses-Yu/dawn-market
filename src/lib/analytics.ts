/**
 * Lightweight client-side analytics tracking for Dawn Market.
 * Sends events to /api/analytics/track with session-based grouping.
 */

const SESSION_KEY = "dm_session_id";
const QUEUE_KEY = "dm_event_queue";
const FLUSH_INTERVAL = 5000; // 5 seconds
const MAX_QUEUE_SIZE = 20;

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

interface AnalyticsEvent {
  event_name: string;
  event_category?: string;
  page_path?: string;
  referrer?: string;
  properties?: Record<string, unknown>;
}

let eventQueue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_INTERVAL);
}

async function flush() {
  if (eventQueue.length === 0) return;
  const batch = eventQueue.splice(0, MAX_QUEUE_SIZE);
  const sessionId = getSessionId();

  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        events: batch,
      }),
      keepalive: true,
    });
  } catch {
    // Re-queue on failure (drop if too large to avoid memory leak)
    if (eventQueue.length < MAX_QUEUE_SIZE * 3) {
      eventQueue.unshift(...batch);
    }
  }
}

export function trackEvent(
  eventName: string,
  category: string = "general",
  properties?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;

  eventQueue.push({
    event_name: eventName,
    event_category: category,
    page_path: window.location.pathname,
    referrer: document.referrer || undefined,
    properties,
  });

  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    flush();
  } else {
    scheduleFlush();
  }
}

export function trackPageView(path?: string) {
  trackEvent("page_view", "navigation", {
    path: path || window.location.pathname,
    title: document.title,
  });
}

export function trackClick(element: string, properties?: Record<string, unknown>) {
  trackEvent("click", "interaction", { element, ...properties });
}

export function trackAlertOpen(alertId: string, category: string) {
  trackEvent("alert_open", "engagement", { alert_id: alertId, category });
}

export function trackReportView(reportType: string, date?: string) {
  trackEvent("report_view", "engagement", { report_type: reportType, date });
}

export function trackSubscriptionAction(action: string, tier?: string) {
  trackEvent(`subscription_${action}`, "conversion", { tier });
}

export function trackNotificationAction(action: string, properties?: Record<string, unknown>) {
  trackEvent(`notification_${action}`, "notification", properties);
}

// Flush remaining events before page unload
if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flush();
    }
  });
}
