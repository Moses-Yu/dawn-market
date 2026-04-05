"use client";

import { useEffect } from "react";
import { trackEvent, trackReportView } from "@/lib/analytics";

interface TrackEventProps {
  /** Event name to fire on mount */
  name: string;
  /** Event category */
  category?: string;
  /** Additional properties */
  properties?: Record<string, unknown>;
}

/**
 * Fires a single analytics event when mounted.
 * Use in server component pages that can't call trackEvent directly.
 */
export default function TrackEvent({ name, category, properties }: TrackEventProps) {
  useEffect(() => {
    trackEvent(name, category, properties);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

/** Fires a report_view event on mount. */
export function TrackReportView({ reportType, date }: { reportType: string; date?: string }) {
  useEffect(() => {
    trackReportView(reportType, date);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
